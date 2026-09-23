const { getSessionFromRequest } = require("./session");
const { json } = require("./http");

/**
 * @param {import("@azure/functions").HttpRequest} request
 * @param {string[]} allowedRoles
 */
function requireRole(request, allowedRoles) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return {
      session: null,
      error: json(request, 401, { error: "No autenticado" }),
    };
  }
  if (!allowedRoles.includes(session.rol)) {
    return {
      session,
      error: json(request, 403, {
        error: "Sin permiso para esta operación",
      }),
    };
  }
  return { session, error: null };
}

module.exports = { requireRole };
