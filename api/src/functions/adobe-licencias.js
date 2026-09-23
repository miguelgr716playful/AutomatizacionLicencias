const { app } = require("@azure/functions");
const { options } = require("../lib/http");
const { requireRole } = require("../lib/require-role");
const { proxyToFa } = require("../lib/fa-proxy");

function adobeFaPath(request) {
  const action = String(request.params.action || "").trim();
  const qs = new URL(request.url).search || "";
  const base = action ? `/v1/adobe/${action}` : "/v1/adobe";
  return `${base}${qs}`;
}

/**
 * Proxy → FA C# /api/v1/adobe/*
 * GET  usuario | profiles | cuotas | miembros
 * POST licencias
 */
app.http("adobeLicencias", {
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/adobe/{action?}",
  handler: async (request) => {
    if (request.method === "OPTIONS") return options(request);

    const { error } = requireRole(request, ["admin", "ejecutor"]);
    if (error) return error;

    return proxyToFa(request, adobeFaPath(request));
  },
});
