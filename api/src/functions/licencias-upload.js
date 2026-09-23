const { app } = require("@azure/functions");
const { options } = require("../lib/http");
const { requireRole } = require("../lib/require-role");
const { proxyToFa } = require("../lib/fa-proxy");

/**
 * Proxy → FA C# POST /api/v1/licencias/upload (multipart)
 */
app.http("licenciasUpload", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/licencias/upload",
  handler: async (request) => {
    if (request.method === "OPTIONS") return options(request);

    const { error } = requireRole(request, ["admin", "ejecutor"]);
    if (error) return error;

    return proxyToFa(request, "/v1/licencias/upload");
  },
});
