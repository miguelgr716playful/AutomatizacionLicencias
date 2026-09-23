/**
 * Genera un certificado SP auto-firmado (RSA 2048, 10 años).
 *
 * Uso: npm run saml:cert
 * Salida:
 *   certs/saml/sp-public.crt
 *   certs/saml/sp-private.key
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "selfsigned";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "certs", "saml");

const cn =
  process.env.SAML_SP_CERT_CN?.trim() ||
  "ambitious-island-01ab11110.7.azurestaticapps.net";

const pems = await generate([{ name: "commonName", value: cn }], {
  keySize: 2048,
  notAfterDate: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
  algorithm: "sha256",
  extensions: [
    { name: "basicConstraints", cA: false },
    {
      name: "keyUsage",
      digitalSignature: true,
      keyEncipherment: true,
      critical: true,
    },
  ],
});

mkdirSync(outDir, { recursive: true });

const certPath = join(outDir, "sp-public.crt");
const keyPath = join(outDir, "sp-private.key");

writeFileSync(certPath, pems.cert, "utf8");
writeFileSync(keyPath, pems.private, "utf8");

console.log(`CN: ${cn}`);
console.log(`Certificado: ${certPath}`);
console.log(`Llave privada: ${keyPath}`);
console.log(
  "\nNo subas sp-private.key a git. Usa el .crt en la metadata y ambos en Azure settings."
);
