/**
 * Carga usuarios iniciales en Azure Table Storage (AuthorizedUsers).
 *
 * Uso:
 *   cd api
 *   # Opción 1: local.settings.json con StorageConnectionString
 *   npm run seed:users
 *   # Opción 2: variable de entorno
 *   set StorageConnectionString=DefaultEndpointsProtocol=https;AccountName=...
 *
 * Opcional: AuthorizedUsersTable=AuthorizedUsers
 */

const fs = require("fs");
const path = require("path");
const { TableClient } = require("@azure/data-tables");

const PARTITION = "users";

function loadLocalSettings() {
  const settingsPath = path.join(__dirname, "..", "local.settings.json");
  if (!fs.existsSync(settingsPath)) return {};
  try {
    const json = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    return json.Values || {};
  } catch {
    return {};
  }
}

const local = loadLocalSettings();
const TABLE =
  process.env.AuthorizedUsersTable?.trim() ||
  process.env.AUTHORIZED_USERS_TABLE?.trim() ||
  local.AuthorizedUsersTable?.trim() ||
  local.AUTHORIZED_USERS_TABLE?.trim() ||
  "AuthorizedUsers";
const CONN =
  process.env.StorageConnectionString?.trim() ||
  process.env.AZURE_STORAGE_CONNECTION_STRING?.trim() ||
  local.StorageConnectionString?.trim() ||
  local.AZURE_STORAGE_CONNECTION_STRING?.trim();

const importPath = path.join(
  __dirname,
  "..",
  "data",
  "authorized-users.import.json"
);

function parseRol(value) {
  const rol = String(value || "")
    .trim()
    .toLowerCase();
  if (rol === "ejecutor") return "ejecutor";
  if (rol === "admin" || rol === "administrador") return "admin";
  return "";
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeNomina(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

async function main() {
  if (!CONN) {
    console.error("Falta StorageConnectionString");
    process.exit(1);
  }

  if (!fs.existsSync(importPath)) {
    console.error("No existe:", importPath);
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(importPath, "utf8"));
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error("Import vacío:", importPath);
    process.exit(1);
  }

  const client = TableClient.fromConnectionString(CONN, TABLE);
  let ok = 0;

  for (const row of rows) {
    const email = normalizeEmail(row.email || row.RowKey);
    const rol = parseRol(row.rol);
    if (!email || !email.includes("@") || !rol) {
      console.warn("Omitido (email/rol inválido):", row);
      continue;
    }

    const entity = {
      partitionKey: PARTITION,
      rowKey: email,
      email,
      nombre: String(row.nombre || "").trim(),
      nomina: normalizeNomina(row.nomina),
      rol,
    };

    await client.upsertEntity(entity, "Merge");
    console.log(`OK  ${email}  (${rol})`);
    ok++;
  }

  console.log(`\nListo: ${ok} filas en tabla "${TABLE}" (PartitionKey=${PARTITION}).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
