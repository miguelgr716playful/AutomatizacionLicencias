/**
 * Genera public/saml/sp-metadata.xml para entregar al IdP / equipo de identidad.
 *
 * Uso:
 *   1. Copia .env.example → .env.local y llena SAML_SP_*
 *   2. npm run saml:metadata
 *   3. Comparte public/saml/sp-metadata.xml
 *      o la URL: https://tu-app.com/saml/sp-metadata.xml
 *
 * Nota: este front usa output: "export" (Azure SWA). No hay /api/saml/metadata
 * en runtime; la metadata se sirve como archivo estático.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(root, ".env.local"));
loadEnvFile(join(root, ".env"));

function stripPemHeaders(pemOrBase64) {
  return pemOrBase64
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getConfig() {
  const entityId = process.env.SAML_SP_ENTITY_ID?.trim();
  const acsUrl = process.env.SAML_SP_ACS_URL?.trim();

  if (!entityId || !acsUrl) {
    console.error(`
Faltan variables SAML. Define al menos:

  SAML_SP_ENTITY_ID=https://tu-app.ejemplo.com
  SAML_SP_ACS_URL=https://tu-bff.ejemplo.com/api/v1/auth/saml/acs

Opcionales:
  SAML_SP_SLO_URL=https://tu-bff.ejemplo.com/api/v1/auth/saml/slo
  SAML_SP_PUBLIC_CERT=<certificado público PEM o Base64>
  SAML_SP_AUTHN_REQUESTS_SIGNED=false
  SAML_SP_WANT_ASSERTIONS_SIGNED=true
`);
    process.exit(1);
  }

  const certRaw = process.env.SAML_SP_PUBLIC_CERT?.trim();

  return {
    entityId,
    assertionConsumerServiceUrl: acsUrl,
    singleLogoutServiceUrl: process.env.SAML_SP_SLO_URL?.trim() || undefined,
    publicCert: certRaw ? stripPemHeaders(certRaw) : undefined,
    wantAssertionsSigned:
      process.env.SAML_SP_WANT_ASSERTIONS_SIGNED !== "false",
    authnRequestsSigned:
      process.env.SAML_SP_AUTHN_REQUESTS_SIGNED === "true",
    nameIdFormat:
      process.env.SAML_SP_NAME_ID_FORMAT?.trim() ||
      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  };
}

function generateMetadata(config) {
  const keyDescriptors = config.publicCert
    ? `
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${config.publicCert}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>
    <KeyDescriptor use="encryption">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${config.publicCert}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>`
    : "";

  const slo = config.singleLogoutServiceUrl
    ? `
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${escapeXml(config.singleLogoutServiceUrl)}"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(config.singleLogoutServiceUrl)}"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(config.entityId)}">
  <SPSSODescriptor AuthnRequestsSigned="${config.authnRequestsSigned}" WantAssertionsSigned="${config.wantAssertionsSigned}" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">${keyDescriptors}${slo}
    <NameIDFormat>${escapeXml(config.nameIdFormat)}</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(config.assertionConsumerServiceUrl)}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>
`;
}

const config = getConfig();
const xml = generateMetadata(config);
const outDir = join(root, "public", "saml");
const outFile = join(outDir, "sp-metadata.xml");

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, xml, "utf8");

console.log(`Metadata SP generada: ${outFile}`);
console.log(`Entity ID: ${config.entityId}`);
console.log(`ACS URL:   ${config.assertionConsumerServiceUrl}`);
console.log(
  config.publicCert
    ? "Certificado: incluido (signing + encryption)"
    : "Certificado: no incluido (opcional — define SAML_SP_PUBLIC_CERT)"
);
console.log(`
URL pública (tras deploy SWA):
  https://<tu-dominio>/saml/sp-metadata.xml
`);
