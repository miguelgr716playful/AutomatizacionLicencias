const { SAML, ValidateInResponseTo } = require("@node-saml/node-saml");
const { getEnv, isSamlConfigured } = require("./env");

function createSaml() {
  const env = getEnv();

  if (!isSamlConfigured(env)) {
    throw new Error(
      "SAML no configurado. Define SAML_IDP_ENTRY_POINT y SAML_IDP_CERT en la Function App."
    );
  }

  /** @type {import('@node-saml/node-saml').SamlConfig} */
  const options = {
    callbackUrl: env.callbackUrl,
    entryPoint: env.idpEntryPoint,
    issuer: env.entityId,
    idpCert: env.idpCert,
    wantAssertionsSigned: env.wantAssertionsSigned,
    wantAuthnResponseSigned: false,
    acceptedClockSkewMs: 5 * 60 * 1000,
    // AMFS/NAM: no forzar PasswordProtectedTransport (evita Responder/NoAuthnContext)
    disableRequestedAuthnContext: true,
    identifierFormat:
      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    validateInResponseTo: ValidateInResponseTo.never,
    audience: env.entityId,
  };

  if (env.authnRequestsSigned && env.spPrivateKey && env.spPublicCert) {
    options.privateKey = env.spPrivateKey;
    options.publicCert = env.spPublicCert;
    options.signatureAlgorithm = "sha256";
  }

  if (env.spPrivateKey) {
    options.decryptionPvk = env.spPrivateKey;
  }

  return new SAML(options);
}

async function getLoginRedirectUrl(relayState = "/aprovisionar") {
  const saml = createSaml();
  return saml.getAuthorizeUrlAsync(relayState, undefined, {});
}

async function getLogoutRedirectUrl(session, relayState = "/login") {
  const saml = createSaml();
  const env = getEnv();

  if (!session?.nameID) {
    throw new Error("Sesión sin nameID; no se puede iniciar SLO");
  }

  // Si el IdP expone SLO explícito, node-saml usa logoutUrl/additional
  if (env.idpSloUrl) {
    saml.options.logoutUrl = env.idpSloUrl;
  }

  return saml.getLogoutUrlAsync(
    {
      nameID: session.nameID,
      nameIDFormat: session.nameIDFormat || undefined,
      sessionIndex: session.sessionIndex || undefined,
    },
    relayState,
    {}
  );
}

async function validateAcsPost(formValues) {
  const saml = createSaml();
  return saml.validatePostResponseAsync(formValues);
}

async function validateSloPost(formValues) {
  const saml = createSaml();
  if (formValues.SAMLRequest) {
    return saml.validatePostRequestAsync(formValues);
  }
  return saml.validatePostResponseAsync(formValues);
}

async function validateSloRedirect(query) {
  const saml = createSaml();
  const originalQuery = new URLSearchParams(
    Object.entries(query).flatMap(([k, v]) =>
      v === undefined || v === null ? [] : [[k, String(v)]]
    )
  ).toString();
  return saml.validateRedirectAsync(query, originalQuery);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateSpMetadataXml() {
  const env = getEnv();

  if (isSamlConfigured(env) && env.spPublicCert) {
    const saml = createSaml();
    return saml.generateServiceProviderMetadata(
      env.spPublicCert,
      env.spPublicCert
    );
  }

  const certBlock = env.spPublicCert
    ? `
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${env.spPublicCert
            .replace(/-----BEGIN CERTIFICATE-----/g, "")
            .replace(/-----END CERTIFICATE-----/g, "")
            .replace(/\s+/g, "")}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(env.entityId)}">
  <SPSSODescriptor AuthnRequestsSigned="${env.authnRequestsSigned}" WantAssertionsSigned="${env.wantAssertionsSigned}" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">${certBlock}
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${escapeXml(env.sloUrl)}"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(env.sloUrl)}"/>
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(env.callbackUrl)}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>
`;
}

module.exports = {
  createSaml,
  getLoginRedirectUrl,
  getLogoutRedirectUrl,
  validateAcsPost,
  validateSloPost,
  validateSloRedirect,
  generateSpMetadataXml,
  isSamlConfigured,
};
