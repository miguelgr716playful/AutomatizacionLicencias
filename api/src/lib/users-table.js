const { TableClient } = require("@azure/data-tables");
const { getEnv } = require("./env");

const PARTITION = "users";

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

function isTableConfigured() {
  return Boolean(getEnv().storageConnectionString);
}

function getTableClient() {
  const env = getEnv();
  if (!env.storageConnectionString) {
    throw new Error("Falta StorageConnectionString");
  }
  return TableClient.fromConnectionString(
    env.storageConnectionString,
    env.authorizedUsersTable || "AuthorizedUsers"
  );
}

function parseRol(value) {
  const rol = String(value || "")
    .trim()
    .toLowerCase();
  if (rol === "ejecutor") return "ejecutor";
  if (rol === "auditor") return "auditor";
  if (rol === "admin" || rol === "administrador") return "admin";
  return "";
}

function entityToUser(entity) {
  if (!entity) return null;
  const email = normalizeEmail(entity.email || entity.rowKey);
  const rol = parseRol(entity.rol) || "ejecutor";
  return {
    nombre: String(entity.nombre || "").trim(),
    email,
    nomina: normalizeNomina(entity.nomina) || undefined,
    rol,
  };
}

function userToEntity(user) {
  const email = normalizeEmail(user.email);
  return {
    partitionKey: PARTITION,
    rowKey: email,
    email,
    nombre: String(user.nombre || "").trim(),
    nomina: normalizeNomina(user.nomina),
    rol: parseRol(user.rol) || "ejecutor",
  };
}

async function getUserByEmail(email) {
  if (!isTableConfigured()) return null;
  const key = normalizeEmail(email);
  if (!key) return null;
  try {
    const entity = await getTableClient().getEntity(PARTITION, key);
    return entityToUser(entity);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

async function listUsers() {
  const client = getTableClient();
  const users = [];
  const iter = client.listEntities({
    queryOptions: { filter: `PartitionKey eq '${PARTITION}'` },
  });
  for await (const entity of iter) {
    const user = entityToUser(entity);
    if (user) users.push(user);
  }
  users.sort((a, b) => a.email.localeCompare(b.email));
  return users;
}

async function upsertUser(user) {
  const entity = userToEntity(user);
  if (!entity.email || !entity.email.includes("@")) {
    const err = new Error("email inválido");
    err.statusCode = 400;
    throw err;
  }
  if (!parseRol(entity.rol)) {
    const err = new Error("rol inválido (admin | ejecutor)");
    err.statusCode = 400;
    throw err;
  }
  await getTableClient().upsertEntity(entity, "Merge");
  return entityToUser(entity);
}

async function deleteUser(email) {
  const key = normalizeEmail(email);
  if (!key) {
    const err = new Error("email inválido");
    err.statusCode = 400;
    throw err;
  }
  try {
    await getTableClient().deleteEntity(PARTITION, key);
    return true;
  } catch (error) {
    if (error.statusCode === 404) return false;
    throw error;
  }
}

module.exports = {
  PARTITION,
  isTableConfigured,
  parseRol,
  getUserByEmail,
  listUsers,
  upsertUser,
  deleteUser,
  entityToUser,
};
