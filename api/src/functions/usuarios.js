const { app } = require("@azure/functions");
const { options } = require("../lib/http");
const { requireAdmin } = require("../lib/require-admin");
const { proxyToFa } = require("../lib/fa-proxy");

function usuariosFaPath(request) {
  const action = String(request.params.action || "").trim();
  const qs = new URL(request.url).search || "";
  const base = action ? `/v1/usuarios/${action}` : "/v1/usuarios";
  return `${base}${qs}`;
}

/**
 * Proxy → FA C# /api/v1/usuarios/*
 * (SAML ACS sigue leyendo Table Storage localmente con la misma connection string.)
 */
app.http("usuarios", {
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/usuarios/{action?}",
  handler: async (request) => {
    if (request.method === "OPTIONS") return options(request);

    const { error } = requireAdmin(request);
    if (error) return error;

    return proxyToFa(request, usuariosFaPath(request));
  },
});
