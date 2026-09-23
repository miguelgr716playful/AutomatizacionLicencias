const { app } = require("@azure/functions");
const { options } = require("../lib/http");
const { requireAdmin } = require("../lib/require-admin");
const { proxyToFa } = require("../lib/fa-proxy");

function configFaPath(request) {
  const action = String(request.params.action || "").trim();
  const qs = new URL(request.url).search || "";
  const base = action ? `/v1/configuracion/${action}` : "/v1/configuracion";
  return `${base}${qs}`;
}

/**
 * Proxy → FA C# /api/v1/configuracion/*
 */
app.http("configuracion", {
  methods: ["GET", "PUT", "PATCH", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/configuracion/{action?}",
  handler: async (request) => {
    if (request.method === "OPTIONS") return options(request);

    const { error } = requireAdmin(request);
    if (error) return error;

    return proxyToFa(request, configFaPath(request));
  },
});
