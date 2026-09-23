const { getEnv } = require("./env");
const { json, corsHeaders } = require("./http");

function canUseFaProxy(env = getEnv()) {
  return Boolean(env.faBaseUrl && env.faApiKey);
}

/**
 * Reenvía la request del SWA a FA-DEVL-AprovLicencias (C#) con x-fa-api-key.
 * @param {import("@azure/functions").HttpRequest} request
 * @param {string} faPath  ej. "/v1/adobe/cuotas"
 * @param {{ method?: string }} [opts]
 */
async function proxyToFa(request, faPath, opts = {}) {
  const env = getEnv();
  if (!canUseFaProxy(env)) {
    return json(request, 503, {
      error: "Function App C# no configurada",
      required: ["FaApiKey", "FaBaseUrl"],
      hint: "FaBaseUrl default: https://fa-devl-aprovlicencias.azurewebsites.net",
    });
  }

  const method = (opts.method || request.method || "GET").toUpperCase();
  const path = faPath.startsWith("/") ? faPath : `/${faPath}`;
  const url = `${env.faBaseUrl}/api${path}`;

  /** @type {Record<string, string>} */
  const headers = {
    Accept: "application/json",
    "x-fa-api-key": env.faApiKey,
  };

  /** @type {BodyInit|undefined} */
  let body;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.toLowerCase().includes("multipart/form-data")) {
      body = Buffer.from(await request.arrayBuffer());
      headers["Content-Type"] = contentType;
    } else {
      const text = await request.text();
      if (text) {
        body = text;
        headers["Content-Type"] = contentType || "application/json";
      }
    }
  }

  let response;
  try {
    response = await fetch(url, { method, headers, body });
  } catch (err) {
    return json(request, 502, {
      error: "No se pudo contactar la Function App C#",
      detail: err instanceof Error ? err.message : String(err),
      faBaseUrl: env.faBaseUrl,
    });
  }

  const raw = await response.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      return {
        status: response.status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          ...corsHeaders(request),
        },
        body: raw.slice(0, 4000),
      };
    }
  }

  return json(request, response.status, data ?? {});
}

module.exports = {
  canUseFaProxy,
  proxyToFa,
};
