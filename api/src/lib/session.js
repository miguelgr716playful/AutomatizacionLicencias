const crypto = require("crypto");
const zlib = require("zlib");
const { getEnv } = require("./env");
const { parseCookies } = require("./http");

const CLAIMS_MAPPER_VERSION = "amfs-v4";

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(
    input.replace(/-/g, "+").replace(/_/g, "/") + pad,
    "base64"
  ).toString("utf8");
}

function sign(payloadB64, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");
}

function createSessionToken(user) {
  const env = getEnv();
  // Cookie compacta: sin claims largos (evita truncado / sesión vieja)
  const payload = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    nameID: user.nameID,
    nameIDFormat: user.nameIDFormat,
    sessionIndex: user.sessionIndex,
    givenName: user.givenName,
    sn: user.sn,
    employeeType: user.employeeType,
    nomina: user.nomina || null,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + env.sessionTtlSeconds,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = sign(payloadB64, env.sessionSecret);
  return `${payloadB64}.${sig}`;
}

function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const env = getEnv();
  const [payloadB64, sig] = token.split(".");
  const expected = sign(payloadB64, env.sessionSecret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }
  try {
    const payload = JSON.parse(fromB64url(payloadB64));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function sessionCookieHeader(token, { clear = false } = {}) {
  const env = getEnv();
  const maxAge = clear ? 0 : env.sessionTtlSeconds;
  const value = clear ? "" : token;
  return [
    `${env.sessionCookie}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

function getSessionFromRequest(request) {
  const env = getEnv();
  const cookies = parseCookies(request);
  return verifySessionToken(cookies[env.sessionCookie]);
}

function unwrapValue(raw) {
  if (raw === undefined || raw === null || raw === "") return "";
  if (Array.isArray(raw)) return unwrapValue(raw[0]);
  if (typeof raw === "object") {
    if (typeof raw._ === "string" && raw._.trim()) return raw._.trim();
    if (typeof raw.value === "string" && raw.value.trim()) {
      return raw.value.trim();
    }
    for (const v of Object.values(raw)) {
      if (typeof v === "string" && v.trim()) return v.trim();
      if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) {
        return v[0].trim();
      }
    }
    return "";
  }
  return String(raw).trim();
}

function looksLikeEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function decodeXmlEntities(text) {
  return String(text)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function setAttr(attrs, key, value) {
  if (!key || value === undefined || value === null || value === "") return;
  attrs[key] = value;
  const short = key.includes("/")
    ? key.split("/").pop()
    : key.includes(":")
      ? key.split(":").pop()
      : key;
  if (short && attrs[short] === undefined) attrs[short] = value;
}

/** Extrae Attribute Name/FriendlyName → valores desde XML SAML. */
function parseAttributesFromXml(xml) {
  /** @type {Record<string, string | string[]>} */
  const attrs = {};
  if (!xml || typeof xml !== "string") return attrs;

  const re =
    /<(?:[\w.-]+:)?Attribute\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?Attribute>/gi;
  let match;
  while ((match = re.exec(xml))) {
    const meta = match[1] || "";
    const body = match[2] || "";
    const name = meta.match(/\bName\s*=\s*["']([^"']+)["']/i)?.[1];
    const friendly = meta.match(/\bFriendlyName\s*=\s*["']([^"']+)["']/i)?.[1];
    const values = [
      ...body.matchAll(
        /<(?:[\w.-]+:)?AttributeValue\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?AttributeValue>/gi
      ),
    ]
      .map((m) => decodeXmlEntities(m[1]))
      .filter(Boolean);
    if (!values.length) continue;
    const value = values.length === 1 ? values[0] : values;
    if (name) setAttr(attrs, name, value);
    if (friendly) setAttr(attrs, friendly, value);
  }
  return attrs;
}

function decodeSamlXml(samlResponseB64) {
  if (!samlResponseB64) return "";
  const buf = Buffer.from(String(samlResponseB64).replace(/\s+/g, ""), "base64");
  const asUtf8 = buf.toString("utf8");
  if (
    asUtf8.includes("Attribute") ||
    asUtf8.includes("Encrypted") ||
    asUtf8.includes("Response")
  ) {
    return asUtf8;
  }
  try {
    return zlib.inflateRawSync(buf).toString("utf8");
  } catch {
    try {
      return zlib.inflateSync(buf).toString("utf8");
    } catch {
      return asUtf8;
    }
  }
}

/** Decodifica SAMLResponse (Base64) y extrae claims del AttributeStatement. */
function extractAttrsFromSamlResponse(samlResponseB64) {
  return parseAttributesFromXml(decodeSamlXml(samlResponseB64));
}

/** Camina el objeto parseado de node-saml (assertion ya descifrada). */
function extractAttrsFromAssertionObject(node, attrs = {}, depth = 0) {
  if (!node || typeof node !== "object" || depth > 12) return attrs;

  if (Array.isArray(node)) {
    for (const item of node) extractAttrsFromAssertionObject(item, attrs, depth + 1);
    return attrs;
  }

  const name = node.$?.Name || node.Name || node.name;
  const values = node.AttributeValue || node.attributeValue;
  if (name && values !== undefined) {
    const list = Array.isArray(values) ? values : [values];
    const unwrapped = list.map((v) => unwrapValue(v)).filter(Boolean);
    if (unwrapped.length) {
      setAttr(attrs, String(name), unwrapped.length === 1 ? unwrapped[0] : unwrapped);
    }
  }

  for (const [k, v] of Object.entries(node)) {
    if (k === "$" || k === "_") continue;
    extractAttrsFromAssertionObject(v, attrs, depth + 1);
  }
  return attrs;
}

/** Une profile + profile.attributes + XML + assertion object. */
function collectAttrs(profile, extraAttrs = {}) {
  /** @type {Record<string, string | string[]>} */
  let attrs = { ...extraAttrs };

  try {
    if (typeof profile?.getSamlResponseXml === "function") {
      attrs = { ...parseAttributesFromXml(profile.getSamlResponseXml()), ...attrs };
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof profile?.getAssertionXml === "function") {
      attrs = { ...parseAttributesFromXml(profile.getAssertionXml()), ...attrs };
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof profile?.getAssertion === "function") {
      attrs = {
        ...extractAttrsFromAssertionObject(profile.getAssertion()),
        ...attrs,
      };
    }
  } catch {
    /* ignore */
  }

  if (profile?.attributes && typeof profile.attributes === "object") {
    for (const [k, v] of Object.entries(profile.attributes)) {
      const unwrapped = unwrapValue(v);
      if (unwrapped) setAttr(attrs, k, unwrapped);
    }
  }

  const skip = new Set([
    "attributes",
    "nameID",
    "nameIDFormat",
    "nameQualifier",
    "spNameQualifier",
    "sessionIndex",
    "issuer",
    "inResponseTo",
    "ID",
    "getAssertion",
    "getAssertionXml",
    "getSamlResponseXml",
  ]);

  for (const [key, value] of Object.entries(profile || {})) {
    if (skip.has(key) || typeof value === "function") continue;
    const unwrapped = unwrapValue(value);
    if (unwrapped) setAttr(attrs, key, unwrapped);
  }

  return attrs;
}

function firstAttr(attrs, keys) {
  const entries = Object.entries(attrs || {});
  for (const key of keys) {
    const direct = unwrapValue(attrs?.[key]);
    if (direct) return direct;

    const found = entries.find(([k]) => {
      const lower = k.toLowerCase();
      const target = key.toLowerCase();
      return (
        lower === target ||
        lower.endsWith(`/${target}`) ||
        lower.endsWith(`:${target}`) ||
        lower.endsWith(`#${target}`)
      );
    });
    if (found) {
      const value = unwrapValue(found[1]);
      if (value) return value;
    }
  }
  return "";
}

function mapRoleFromProfile(profile, attrs = {}) {
  const candidates = [
    profile?.role,
    attrs.role,
    attrs.Rol,
    attrs.rol,
    attrs.employeeType,
    attrs["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
  ]
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  if (candidates.some((r) => r.includes("admin"))) return "admin";
  if (candidates.some((r) => r.includes("auditor"))) return "auditor";
  if (candidates.some((r) => r.includes("ejecutor"))) return "ejecutor";
  return "ejecutor";
}

function buildClaims(attrs) {
  /** @type {Record<string, string | string[]>} */
  const claims = {};
  for (const [key, raw] of Object.entries(attrs || {})) {
    const value = Array.isArray(raw)
      ? raw.map((v) => unwrapValue(v)).filter(Boolean)
      : unwrapValue(raw);
    if (!value || (Array.isArray(value) && !value.length)) continue;
    claims[key] = Array.isArray(value) && value.length === 1 ? value[0] : value;
    const short = key.includes("/") ? key.split("/").pop() : key;
    if (short && claims[short] === undefined) claims[short] = claims[key];
  }
  return claims;
}

function userFromProfile(profile, extraAttrs = {}) {
  const attrs = collectAttrs(profile, extraAttrs);
  const claims = buildClaims(attrs);
  const nameID = profile?.nameID ? String(profile.nameID).trim() : "";

  const email =
    firstAttr(attrs, [
      "mail",
      "email",
      "correo",
      "EmailAddress",
      "emailaddress",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mail",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      "http://schemas.xmlsoap.org/claims/EmailAddress",
      "urn:oid:0.9.2342.19200300.100.1.3",
    ]) || (looksLikeEmail(nameID) ? nameID : "");

  const given = firstAttr(attrs, [
    "givenName",
    "givenname",
    "firstName",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenName",
  ]);
  const family = firstAttr(attrs, [
    "sn",
    "surname",
    "lastName",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sn",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
  ]);
  const fullFromParts = [given, family].filter(Boolean).join(" ");

  const nombre =
    fullFromParts ||
    firstAttr(attrs, [
      "displayName",
      "cn",
      "fullName",
      "nombre",
      "name",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    ]) ||
    email ||
    "Usuario";

  const employeeType = firstAttr(attrs, [
    "employeeType",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/employeeType",
  ]);

  return {
    id: nameID || email || crypto.randomUUID(),
    email: email || nameID,
    nombre,
    rol: mapRoleFromProfile(profile, attrs),
    nameID: nameID || email || null,
    nameIDFormat: profile?.nameIDFormat || null,
    sessionIndex: profile?.sessionIndex || null,
    givenName: given || null,
    sn: family || null,
    employeeType: employeeType || null,
    claims,
    attributeKeys: Object.keys(attrs),
  };
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  sessionCookieHeader,
  getSessionFromRequest,
  userFromProfile,
  mapRoleFromProfile,
  collectAttrs,
  extractAttrsFromSamlResponse,
  parseAttributesFromXml,
  CLAIMS_MAPPER_VERSION,
};
