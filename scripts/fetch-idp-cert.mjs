/**
 * Descarga metadata del IdP AMFS y guarda certificados públicos (preferencia: signing).
 * Uso: npm run saml:idp-cert
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const metadataUrl =
  process.env.SAML_IDP_METADATA_URL?.trim() ||
  "https://amfsdevl.tec.mx/nidp/saml2/metadata";

function toPem(body) {
  const compact = body.replace(/\s+/g, "");
  return (
    "-----BEGIN CERTIFICATE-----\n" +
    (compact.match(/.{1,64}/g)?.join("\n") ?? compact) +
    "\n-----END CERTIFICATE-----\n"
  );
}

const xml = await (await fetch(metadataUrl)).text();
const entityId = xml.match(/entityID="([^"]+)"/)?.[1];

const descriptors = [
  ...xml.matchAll(/<[^:]*:?KeyDescriptor\b([^>]*)>([\s\S]*?)<\/[^:]*:?KeyDescriptor>/g),
];

/** @type {{ use: string, body: string }[]} */
const fromDescriptors = descriptors.map((m) => {
  const use = m[1].match(/\buse="([^"]+)"/)?.[1] || "any";
  const body = m[2].match(/X509Certificate[^>]*>([^<]+)/)?.[1]?.replace(/\s+/g, "") || "";
  return { use, body };
}).filter((d) => d.body);

const signing = fromDescriptors.filter((d) => d.use === "signing");
const chosen = signing.length ? signing : fromDescriptors;
const uniqueBodies = [...new Set(chosen.map((d) => d.body))];

if (!uniqueBodies.length) {
  const fallback = [...xml.matchAll(/X509Certificate[^>]*>([^<]+)/g)].map((m) =>
    m[1].replace(/\s+/g, "")
  );
  uniqueBodies.push(...new Set(fallback));
}

if (!uniqueBodies.length) {
  console.error("No se encontró X509Certificate en", metadataUrl);
  process.exit(1);
}

const outDir = join(root, "certs", "saml");
mkdirSync(outDir, { recursive: true });

const primaryPem = toPem(uniqueBodies[0]);
writeFileSync(join(outDir, "idp-public.crt"), primaryPem, "utf8");
writeFileSync(join(outDir, "idp-public.b64"), uniqueBodies[0], "utf8");

if (uniqueBodies.length > 1) {
  const allPem = uniqueBodies.map(toPem).join("\n");
  writeFileSync(join(outDir, "idp-public-all.crt"), allPem, "utf8");
}

console.log("Metadata:", metadataUrl);
console.log("Entity ID:", entityId);
console.log(
  "KeyDescriptors:",
  fromDescriptors.map((d) => d.use).join(", ") || "(sin use)"
);
console.log("Certificados guardados:", uniqueBodies.length);
console.log("Primario:", join(outDir, "idp-public.crt"));
