/**
 * Usuarios autorizados post-SAML (AMFS).
 * Solo estos correos/nóminas pueden entrar; el rol de la lista prevalece.
 */

/** @typedef {"admin" | "ejecutor" | "auditor"} AppRole */

/**
 * @typedef {object} AuthorizedUser
 * @property {string} nombre
 * @property {string} email
 * @property {string} [nomina]
 * @property {AppRole} rol
 */

/** @type {AuthorizedUser[]} */
const AUTHORIZED_USERS = [
  {
    nombre: "Claudia Cecilia Arron Garcia",
    email: "cecilia.arron@tecmilenio.mx",
    nomina: "L03085867",
    rol: "ejecutor",
  },
  {
    nombre: "Maria Catalina Castillo Rocha",
    email: "catalina.castillor@tecmilenio.mx",
    nomina: "L03568805",
    rol: "ejecutor",
  },
  {
    nombre: "Juan Manuel Garza Franco",
    email: "jgarzaf@tecmilenio.mx",
    nomina: "L03539953",
    rol: "admin",
  },
  {
    nombre: "Juan Antonio López De la Rosa",
    email: "jlopezr@tec.mx",
    nomina: "L03086758",
    rol: "admin",
  },
  {
    nombre: "Jesus Oliver Bernal Garcia",
    email: "oliver.bernal@tecmilenio.mx",
    nomina: "L03515177",
    rol: "admin",
  },
  {
    nombre: "Miguel Osvaldo Gonzalez Romo - Playful",
    email: "t-mgonzalezr@tecmilenio.mx",
    rol: "admin",
  },
  {
    nombre: "Cristian Jesus Villegas Torres - Ectotec",
    email: "t-cvillegas@tecmilenio.mx",
    rol: "admin",
  },
  {
    nombre: "Jazzmin Novelo Villegas",
    email: "jazz@tecmilenio.mx",
    nomina: "L01448464",
    rol: "admin",
  },
  {
    nombre: "Angela Lucia Ruiz Oyervidez",
    email: "angela.ruiz@tecmilenio.mx",
    nomina: "L01153783",
    rol: "admin",
  },
  {
    nombre: "Jorge Jara Juarez",
    email: "jorge.jara@tecmilenio.mx",
    rol: "admin",
  },
  {
    nombre: "Cesar Osmar Urdiales",
    email: "caso1@tecmilenio.mx",
    rol: "admin",
  },
];

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeNomina(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

/** Extrae nómina tipo L0xxxxx del correo o de un claim. */
function extractNomina(...candidates) {
  for (const c of candidates) {
    const raw = String(c || "").trim();
    if (!raw) continue;
    const fromLocal = raw.includes("@") ? raw.split("@")[0] : raw;
    const match = fromLocal.match(/^(L\d{5,})$/i);
    if (match) return normalizeNomina(match[1]);
  }
  return "";
}

/**
 * Busca usuario autorizado solo por email (la nómina no se usa para filtrar).
 * Prioridad: tabla Azure `AuthorizedUsers` → lista local (fallback).
 * @param {{ email?: string, nomina?: string }} input
 * @returns {Promise<AuthorizedUser | null>}
 */
async function findAuthorizedUser(input) {
  const email = normalizeEmail(input.email);
  if (!email) return null;

  try {
    const { isTableConfigured, getUserByEmail } = require("./users-table");
    if (isTableConfigured()) {
      const fromTable = await getUserByEmail(email);
      if (fromTable) return fromTable;
      const { getEnv } = require("./env");
      if (!getEnv().authorizedUsersFallback) return null;
    }
  } catch (error) {
    console.warn("No se pudo leer AuthorizedUsers:", error.message);
  }

  return (
    AUTHORIZED_USERS.find((u) => normalizeEmail(u.email) === email) || null
  );
}

async function isAuthorized(input) {
  return Boolean(await findAuthorizedUser(input));
}

module.exports = {
  AUTHORIZED_USERS,
  findAuthorizedUser,
  isAuthorized,
  extractNomina,
  normalizeEmail,
  normalizeNomina,
};
