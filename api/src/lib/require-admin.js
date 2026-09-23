const { getSessionFromRequest } = require("./session");
const { json } = require("./http");

function requireAdmin(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return {
      session: null,
      error: json(request, 401, { error: "No autenticado" }),
    };
  }
  if (session.rol !== "admin") {
    return {
      session,
      error: json(request, 403, {
        error: "Solo administradores",
      }),
    };
  }
  return { session, error: null };
}

module.exports = { requireAdmin };
