/**
 * Genera cert SP auto-firmado (si falta), escribe .env.local + api/local.settings.json
 * y regenera public/saml/sp-metadata.xml con AuthnRequestsSigned=true.
 *
 * Uso: npm run saml:signing
 */
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const certDir = join(root, "certs", "saml");
const certPath = join(certDir, "sp-public.crt");
const keyPath = join(certDir, "sp-private.key");

const entityId =
  process.env.SAML_SP_ENTITY_ID?.trim() ||
  "https://ambitious-island-01ab11110.7.azurestaticapps.net/";
const frontendUrl =
  process.env.SAML_FRONTEND_URL?.trim() ||
  "https://ambitious-island-01ab11110.7.azurestaticapps.net";
const acsUrl =
  process.env.SAML_SP_ACS_URL?.trim() ||
  `${frontendUrl}/api/v1/auth/saml/acs`;
const sloUrl =
  process.env.SAML_SP_SLO_URL?.trim() ||
  `${frontendUrl}/api/v1/auth/saml/slo`;

function toEnvPem(pem) {
  return pem.trim().replace(/\r\n/g, "\n");
}

function toJsonPem(pem) {
  return toEnvPem(pem).replace(/\n/g, "\\n");
}

if (!existsSync(certPath) || !existsSync(keyPath)) {
  console.log("Generando certificado SP auto-firmado...");
  execSync("node scripts/generate-sp-cert.mjs", { cwd: root, stdio: "inherit" });
}

const publicCert = readFileSync(certPath, "utf8");
const privateKey = readFileSync(keyPath, "utf8");

const idpEntryPoint =
  process.env.SAML_IDP_ENTRY_POINT?.trim() ||
  "https://amfsdevl.tec.mx/nidp/saml2/sso";
const idpSloUrl =
  process.env.SAML_IDP_SLO_URL?.trim() ||
  "https://amfsdevl.tec.mx/nidp/saml2/slo";

const idpCertPath = join(certDir, "idp-public.crt");
if (!existsSync(idpCertPath)) {
  console.log("Descargando certificado IdP AMFS...");
  execSync("node scripts/fetch-idp-cert.mjs", { cwd: root, stdio: "inherit" });
}
const idpCert = existsSync(idpCertPath)
  ? readFileSync(idpCertPath, "utf8")
  : "";

const envLocal = `# Generado por npm run saml:signing — no subir a git
NEXT_PUBLIC_API_BASE_URL=${frontendUrl}/api
NEXT_PUBLIC_SAML_LOGIN=true

SAML_SP_ENTITY_ID=${entityId}
SAML_SP_ACS_URL=${acsUrl}
SAML_SP_SLO_URL=${sloUrl}
SAML_SP_AUTHN_REQUESTS_SIGNED=true
SAML_SP_WANT_ASSERTIONS_SIGNED=true
SAML_SP_PUBLIC_CERT="
${toEnvPem(publicCert)}
"
SAML_SP_PRIVATE_KEY="
${toEnvPem(privateKey)}
"

SAML_IDP_ENTRY_POINT=${idpEntryPoint}
SAML_IDP_SLO_URL=${idpSloUrl}
SAML_IDP_CERT="
${toEnvPem(idpCert)}
"
`;

writeFileSync(join(root, ".env.local"), envLocal, "utf8");
console.log("Escrito: .env.local");

const settingsPath = join(root, "api", "local.settings.json");
const settings = existsSync(settingsPath)
  ? JSON.parse(readFileSync(settingsPath, "utf8"))
  : { IsEncrypted: false, Values: {} };

settings.IsEncrypted = false;
settings.Values = {
  ...settings.Values,
  FUNCTIONS_WORKER_RUNTIME:
    settings.Values?.FUNCTIONS_WORKER_RUNTIME || "node",
  SAML_SP_ENTITY_ID: entityId,
  SAML_FRONTEND_URL: frontendUrl,
  SAML_FUNCTIONS_BASE_URL:
    settings.Values?.SAML_FUNCTIONS_BASE_URL || frontendUrl,
  SAML_IDP_ENTRY_POINT: idpEntryPoint,
  SAML_IDP_SLO_URL: idpSloUrl,
  ...(idpCert ? { SAML_IDP_CERT: toJsonPem(idpCert) } : {}),
  SAML_SP_PUBLIC_CERT: toJsonPem(publicCert),
  SAML_SP_PRIVATE_KEY: toJsonPem(privateKey),
  SAML_SP_AUTHN_REQUESTS_SIGNED: "true",
  SAML_SP_WANT_ASSERTIONS_SIGNED: "true",
};

mkdirSync(dirname(settingsPath), { recursive: true });
writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
console.log("Actualizado: api/local.settings.json");

execSync("node scripts/generate-sp-metadata.mjs", {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    SAML_SP_ENTITY_ID: entityId,
    SAML_SP_ACS_URL: acsUrl,
    SAML_SP_SLO_URL: sloUrl,
    SAML_SP_PUBLIC_CERT: toEnvPem(publicCert),
    SAML_SP_AUTHN_REQUESTS_SIGNED: "true",
    SAML_SP_WANT_ASSERTIONS_SIGNED: "true",
  },
});

console.log(`
Listo.
- Metadata: public/saml/sp-metadata.xml
- Cert/key locales: certs/saml/ (gitignored)
- Runtime local: api/local.settings.json (gitignored)

Recuerda cargar en Azure SWA Configuration:
  SAML_IDP_ENTRY_POINT, SAML_IDP_SLO_URL, SAML_IDP_CERT,
  SAML_SP_PUBLIC_CERT, SAML_SP_PRIVATE_KEY,
  SAML_SP_AUTHN_REQUESTS_SIGNED=true, SESSION_SECRET
`);
