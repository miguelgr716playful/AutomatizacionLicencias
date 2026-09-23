const { app } = require("@azure/functions");
const { getEnv, isSamlConfigured } = require("../lib/env");
const {
  getSessionFromRequest,
  sessionCookieHeader,
} = require("../lib/session");
const { getLogoutRedirectUrl } = require("../lib/saml");
const { json, options, redirect } = require("../lib/http");

/**
 * Cierra sesión local y, si hay SAML+nameID, inicia SLO en el IdP.
 * GET|POST /api/v1/auth/logout
 */
app.http("authLogout", {
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/auth/logout",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") return options(request);

    const env = getEnv();
    const session = getSessionFromRequest(request);
    const clearCookie = {
      "Set-Cookie": sessionCookieHeader("", { clear: true }),
    };

    if (isSamlConfigured(env) && session?.nameID) {
      try {
        const sloUrl = await getLogoutRedirectUrl(session, "/login");
        context.log(`Logout SP → IdP SLO para ${session.email || session.nameID}`);
        return redirect(request, sloUrl, clearCookie);
      } catch (error) {
        context.warn("No se pudo iniciar SLO; cerrando solo sesión local", error);
      }
    }

    if (request.method === "GET" || request.query.get("redirect") === "1") {
      return redirect(request, `${env.frontendUrl}/login`, clearCookie);
    }

    return json(
      request,
      200,
      { ok: true, message: "Sesión cerrada" },
      clearCookie
    );
  },
});
