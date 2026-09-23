const { app } = require("@azure/functions");
const {
  validateSloPost,
  validateSloRedirect,
  isSamlConfigured,
} = require("../lib/saml");
const { getEnv } = require("../lib/env");
const { sessionCookieHeader } = require("../lib/session");
const { json, options, redirect } = require("../lib/http");

/**
 * Single Logout Service.
 * GET|POST /api/v1/auth/saml/slo
 */
app.http("samlSlo", {
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/auth/saml/slo",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") return options(request);

    const env = getEnv();
    const clearCookie = { "Set-Cookie": sessionCookieHeader("", { clear: true }) };

    if (request.method === "GET" && !request.query.get("SAMLRequest") && !request.query.get("SAMLResponse")) {
      return json(request, 200, {
        endpoint: "SAML Single Logout Service (SLO)",
        url: env.sloUrl,
        configured: isSamlConfigured(env),
      });
    }

    try {
      if (isSamlConfigured(env)) {
        if (request.method === "GET") {
          const query = Object.fromEntries(request.query.entries());
          await validateSloRedirect(query);
        } else {
          const form = await request.formData();
          const values = {};
          for (const [k, v] of form.entries()) values[k] = String(v);
          await validateSloPost(values);
        }
      }

      context.log("SLO: sesión cerrada");
      return redirect(request, `${env.frontendUrl}/login`, clearCookie);
    } catch (error) {
      context.error("Error en SLO", error);
      // Aun con error de validación, limpiar cookie local
      return redirect(request, `${env.frontendUrl}/login`, clearCookie);
    }
  },
});
