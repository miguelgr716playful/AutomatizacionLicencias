/**
 * Configuración del Service Provider (SP) para metadata SAML 2.0.
 * Valores vía env — no hardcodear certificados ni URLs de producción.
 */
export interface SamlSpConfig {
  entityId: string;
  assertionConsumerServiceUrl: string;
  singleLogoutServiceUrl?: string;
  /** Certificado público X.509 en Base64 (sin encabezados PEM) */
  publicCert?: string;
  wantAssertionsSigned: boolean;
  authnRequestsSigned: boolean;
  nameIdFormat: string;
}

function stripPemHeaders(pemOrBase64: string): string {
  return pemOrBase64
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
}

export function getSamlSpConfig(
  env: NodeJS.ProcessEnv = process.env
): SamlSpConfig {
  const entityId = env.SAML_SP_ENTITY_ID?.trim();
  const acsUrl = env.SAML_SP_ACS_URL?.trim();

  if (!entityId) {
    throw new Error("Falta SAML_SP_ENTITY_ID (Entity ID del Service Provider)");
  }
  if (!acsUrl) {
    throw new Error(
      "Falta SAML_SP_ACS_URL (Assertion Consumer Service URL del SP)"
    );
  }

  const certRaw = env.SAML_SP_PUBLIC_CERT?.trim();

  return {
    entityId,
    assertionConsumerServiceUrl: acsUrl,
    singleLogoutServiceUrl: env.SAML_SP_SLO_URL?.trim() || undefined,
    publicCert: certRaw ? stripPemHeaders(certRaw) : undefined,
    wantAssertionsSigned: env.SAML_SP_WANT_ASSERTIONS_SIGNED !== "false",
    authnRequestsSigned: env.SAML_SP_AUTHN_REQUESTS_SIGNED === "true",
    nameIdFormat:
      env.SAML_SP_NAME_ID_FORMAT?.trim() ||
      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  };
}
