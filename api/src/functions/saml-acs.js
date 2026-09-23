const { app } = require("@azure/functions");
const { validateAcsPost, isSamlConfigured } = require("../lib/saml");
const { getEnv } = require("../lib/env");
const {
  createSessionToken,
  sessionCookieHeader,
  userFromProfile,
  extractAttrsFromSamlResponse,
  CLAIMS_MAPPER_VERSION,
} = require("../lib/session");
const {
  findAuthorizedUser,
  extractNomina,
} = require("../lib/authorized-users");
const { json, options, redirect } = require("../lib/http");

/**
 * Assertion Consumer Service.
 * POST /api/v1/auth/saml/acs
 */
app.http("samlAcs", {
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/auth/saml/acs",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") return options(request);

    const env = getEnv();
    const clearCookie = {
      "Set-Cookie": sessionCookieHeader("", { clear: true }),
    };

    if (request.method === "GET") {
      return json(request, 200, {
        endpoint: "SAML Assertion Consumer Service (ACS)",
        url: env.callbackUrl,
        method: "POST",
        binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
        configured: isSamlConfigured(env),
      });
    }

    if (!isSamlConfigured(env)) {
      return json(request, 503, {
        error: "SAML no configurado en Function App",
        required: ["SAML_IDP_ENTRY_POINT", "SAML_IDP_CERT"],
      });
    }

    try {
      const form = await request.formData();
      const samlResponse = form.get("SAMLResponse");
      const relayState = form.get("RelayState");

      if (!samlResponse) {
        return json(request, 400, {
          error: "Falta SAMLResponse",
        });
      }

      const { profile, loggedOut } = await validateAcsPost({
        SAMLResponse: String(samlResponse),
        ...(relayState ? { RelayState: String(relayState) } : {}),
      });

      if (loggedOut) {
        return redirect(request, `${env.frontendUrl}/login`, clearCookie);
      }

      if (!profile) {
        return json(request, 401, { error: "Assertion SAML sin perfil" });
      }

      const rawAttrs = extractAttrsFromSamlResponse(String(samlResponse));
      const user = userFromProfile(profile, rawAttrs);

      const authorized = await findAuthorizedUser({
        email: user.email,
      });

      if (!authorized) {
        context.warn(
          `ACS DENEGADO: email=${user.email} no está en allowlist`
        );
        return redirect(
          request,
          `${env.frontendUrl}/login?error=unauthorized`,
          clearCookie
        );
      }

      const nomina =
        authorized.nomina ||
        extractNomina(
          user.email,
          user.claims?.nomina,
          user.claims?.employeeNumber
        ) ||
        null;

      const sessionUser = {
        id: user.id,
        email: authorized.email || user.email,
        nombre:
          user.nombre && user.nombre !== "Usuario"
            ? user.nombre
            : authorized.nombre,
        rol: authorized.rol,
        nameID: user.nameID,
        nameIDFormat: user.nameIDFormat,
        sessionIndex: user.sessionIndex,
        givenName: user.givenName,
        sn: user.sn,
        employeeType: user.employeeType,
        nomina: nomina,
      };

      const token = createSessionToken(sessionUser);
      const path =
        typeof relayState === "string" && relayState.startsWith("/")
          ? relayState
          : "/dashboard";

      context.log(
        `ACS OK mapper=${CLAIMS_MAPPER_VERSION} email=${sessionUser.email} nombre=${sessionUser.nombre} rol=${sessionUser.rol} nomina=${sessionUser.nomina || "-"}`
      );

      return redirect(request, `${env.frontendUrl}${path}`, {
        "Set-Cookie": sessionCookieHeader(token),
      });
    } catch (error) {
      context.error("Error validando ACS", error);
      return json(request, 401, {
        error: "SAMLResponse inválido",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  },
});
