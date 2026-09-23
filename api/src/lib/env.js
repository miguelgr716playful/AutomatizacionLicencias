function required(name, fallback) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  return "";
}

/** Nombres sin guion bajo (SWA/GitHub) con fallback a los legacy. */
function setting(primary, legacy, fallback) {
  const value = required(primary) || required(legacy);
  if (value) return value;
  if (fallback !== undefined) return fallback;
  return "";
}

function settingBool(primary, legacy, defaultTrue = true) {
  const raw = process.env[primary] ?? process.env[legacy];
  if (raw === undefined || raw === "") return defaultTrue;
  return String(raw).trim().toLowerCase() !== "false";
}

function stripPem(value) {
  if (!value) return "";
  return value
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
}

function toPemCert(base64OrPem) {
  if (!base64OrPem) return "";
  const normalized = base64OrPem.replace(/\\n/g, "\n");
  if (normalized.includes("BEGIN CERTIFICATE")) {
    return normalized;
  }
  const body = stripPem(normalized).match(/.{1,64}/g)?.join("\n") ?? "";
  return `-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----`;
}

/** Uno o varios PEM (AMFS puede publicar varios KeyDescriptor). */
function toPemCertList(base64OrPem) {
  if (!base64OrPem) return [];
  const normalized = base64OrPem.replace(/\\n/g, "\n");
  if (normalized.includes("BEGIN CERTIFICATE")) {
    const parts = [
      ...normalized.matchAll(
        /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g
      ),
    ].map((m) => m[0].trim());
    return parts.length ? parts : [normalized.trim()];
  }
  return [toPemCert(normalized)];
}

function getEnv() {
  // API managed en el mismo Static Web App (/api/*)
  const functionsBase = required(
    "SAML_FUNCTIONS_BASE_URL",
    "https://ambitious-island-01ab11110.7.azurestaticapps.net"
  ).replace(/\/$/, "");

  const frontendUrl = required(
    "SAML_FRONTEND_URL",
    "https://ambitious-island-01ab11110.7.azurestaticapps.net"
  ).replace(/\/$/, "");

  const entityId = required(
    "SAML_SP_ENTITY_ID",
    `${frontendUrl}/`
  );

  return {
    functionsBase,
    frontendUrl,
    entityId,
    callbackUrl: `${functionsBase}/api/v1/auth/saml/acs`,
    sloUrl: `${functionsBase}/api/v1/auth/saml/slo`,
    idpEntryPoint: required("SAML_IDP_ENTRY_POINT"),
    idpCert: (() => {
      const list = toPemCertList(required("SAML_IDP_CERT"));
      if (!list.length) return "";
      return list.length === 1 ? list[0] : list;
    })(),
    spPublicCert: toPemCert(required("SAML_SP_PUBLIC_CERT")),
    spPrivateKey: required("SAML_SP_PRIVATE_KEY").replace(/\\n/g, "\n"),
    sessionSecret: (() => {
      const secret = required("SESSION_SECRET");
      if (secret) return secret;
      if (process.env.NODE_ENV === "production" || process.env.AZURE_FUNCTIONS_ENVIRONMENT) {
        throw new Error("SESSION_SECRET es obligatorio en Azure Functions");
      }
      return "change-me-licencias-dev-secret";
    })(),
    idpSloUrl: required("SAML_IDP_SLO_URL"),
    sessionCookie: required("SESSION_COOKIE_NAME", "licencias_session"),
    sessionTtlSeconds: Number(required("SESSION_TTL_SECONDS", "28800")),
    wantAssertionsSigned: process.env.SAML_SP_WANT_ASSERTIONS_SIGNED !== "false",
    authnRequestsSigned: process.env.SAML_SP_AUTHN_REQUESTS_SIGNED === "true",
    corsOrigins: (
      process.env.CORS_ORIGINS ||
      "https://ambitious-island-01ab11110.7.azurestaticapps.net,http://localhost:3000,http://localhost:3001"
    )
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    storageConnectionString: setting(
      "StorageConnectionString",
      "AZURE_STORAGE_CONNECTION_STRING"
    ),
    authorizedUsersTable: setting(
      "AuthorizedUsersTable",
      "AUTHORIZED_USERS_TABLE",
      "AuthorizedUsers"
    ),
    authorizedUsersFallback: settingBool(
      "AuthorizedUsersFallback",
      "AUTHORIZED_USERS_FALLBACK",
      true
    ),
    csvUploadContainer: setting(
      "CsvUploadContainer",
      "CSV_UPLOAD_CONTAINER",
      "csv-uploads"
    ),
    /**
     * Backend C# (FA-DEVL-AprovLicencias). Adobe/config/usuarios/upload
     * se proxifican aquí; el SWA solo hace SAML + sesión.
     */
    faBaseUrl: setting(
      "FaBaseUrl",
      "FaKeyVaultBaseUrl",
      "https://fa-devl-aprovlicencias.azurewebsites.net"
    ).replace(/\/$/, ""),
    faApiKey: setting("FaApiKey", "FA_API_KEY"),
  };
}

function isSamlConfigured(env = getEnv()) {
  return Boolean(env.idpEntryPoint && env.idpCert);
}

module.exports = {
  getEnv,
  isSamlConfigured,
  stripPem,
  toPemCert,
  toPemCertList,
};
