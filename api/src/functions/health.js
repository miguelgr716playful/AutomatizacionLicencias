const { app } = require("@azure/functions");
const { getEnv, isSamlConfigured } = require("../lib/env");
const { CLAIMS_MAPPER_VERSION } = require("../lib/session");
const { json, options } = require("../lib/http");
const { isTableConfigured, listUsers } = require("../lib/users-table");
const { canUseFaProxy } = require("../lib/fa-proxy");

app.http("health", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/health",
  handler: async (request) => {
    if (request.method === "OPTIONS") return options(request);

    const env = getEnv();
    let authorizedUsersCount = null;
    let authorizedUsersError = null;

    if (isTableConfigured()) {
      try {
        const users = await listUsers();
        authorizedUsersCount = users.length;
      } catch (error) {
        authorizedUsersError =
          error instanceof Error ? error.message : String(error);
      }
    }

    const faProxy = canUseFaProxy(env);

    return json(request, 200, {
      ok: true,
      service: "swa-aprov-licencias-api",
      mode: "bff-proxy-to-fa-csharp",
      branchHint: "version4",
      samlConfigured: isSamlConfigured(env),
      claimsMapper: CLAIMS_MAPPER_VERSION,
      authorizedUsersTable: Boolean(env.storageConnectionString),
      authorizedUsersTableName: env.authorizedUsersTable,
      authorizedUsersCount,
      authorizedUsersError,
      authorizedUsersFallback: env.authorizedUsersFallback,
      faProxy,
      faBaseUrl: env.faBaseUrl,
      adobeVia: faProxy ? "fa-csharp" : "unconfigured",
      endpoints: {
        configuracion: `${env.functionsBase}/api/v1/configuracion`,
        configuracionAdobe: `${env.functionsBase}/api/v1/configuracion/adobe`,
        login: `${env.functionsBase}/api/v1/auth/saml/login`,
        acs: env.callbackUrl,
        slo: env.sloUrl,
        metadata: `${env.functionsBase}/api/v1/auth/saml/metadata`,
        me: `${env.functionsBase}/api/v1/auth/me`,
        logout: `${env.functionsBase}/api/v1/auth/logout`,
        usuarios: `${env.functionsBase}/api/v1/usuarios`,
        usuariosSeed: `${env.functionsBase}/api/v1/usuarios/seed`,
        licenciasUpload: `${env.functionsBase}/api/v1/licencias/upload`,
        adobeUsuario: `${env.functionsBase}/api/v1/adobe/usuario`,
        adobeProfiles: `${env.functionsBase}/api/v1/adobe/profiles`,
        adobeCuotas: `${env.functionsBase}/api/v1/adobe/cuotas`,
        adobeMiembros: `${env.functionsBase}/api/v1/adobe/miembros`,
        adobeLicencias: `${env.functionsBase}/api/v1/adobe/licencias`,
        faHealth: `${env.faBaseUrl}/api/v1/health`,
      },
    });
  },
});
