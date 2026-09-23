const { app } = require("@azure/functions");
const { getLoginRedirectUrl, isSamlConfigured } = require("../lib/saml");
const { getEnv } = require("../lib/env");
const { json, options, redirect } = require("../lib/http");

/**
 * Inicia SSO: redirige al IdP (NAM).
 * GET /api/v1/auth/saml/login?returnTo=/aprovisionar
 */
app.http("samlLogin", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/auth/saml/login",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") return options(request);

    if (!isSamlConfigured()) {
      return json(request, 503, {
        error: "SAML no configurado",
        required: ["SAML_IDP_ENTRY_POINT", "SAML_IDP_CERT"],
        functionsBase: getEnv().functionsBase,
      });
    }

    const returnTo = request.query.get("returnTo") || "/aprovisionar";
    const relayState = returnTo.startsWith("/") ? returnTo : "/aprovisionar";

    try {
      const url = await getLoginRedirectUrl(relayState);
      context.log(`SAML login → IdP (RelayState=${relayState})`);
      return redirect(request, url);
    } catch (error) {
      context.error("Error iniciando SAML login", error);
      return json(request, 500, {
        error: "No se pudo iniciar el login SAML",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  },
});
