const { app } = require("@azure/functions");
const { getSessionFromRequest } = require("../lib/session");
const { json, options } = require("../lib/http");

/**
 * Usuario de sesión actual.
 * GET /api/v1/auth/me
 */
app.http("authMe", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/auth/me",
  handler: async (request) => {
    if (request.method === "OPTIONS") return options(request);

    const session = getSessionFromRequest(request);
    if (!session) {
      return json(request, 401, { error: "No autenticado" });
    }

    const givenName = session.givenName || null;
    const sn = session.sn || null;
    const mail =
      typeof session.email === "string" && session.email.includes("@")
        ? session.email
        : null;

    return json(request, 200, {
      id: session.id,
      email: session.email,
      nombre: session.nombre,
      rol: session.rol,
      nameID: session.nameID || null,
      givenName,
      sn,
      employeeType: session.employeeType || null,
      nomina: session.nomina || null,
      claims: {
        ...(givenName
          ? {
              givenName,
              givenname: givenName,
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname":
                givenName,
            }
          : {}),
        ...(sn
          ? {
              sn,
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sn": sn,
            }
          : {}),
        ...(mail
          ? {
              mail,
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mail": mail,
            }
          : {}),
        ...(session.employeeType
          ? { employeeType: session.employeeType }
          : {}),
        ...(session.nomina ? { nomina: session.nomina } : {}),
      },
    });
  },
});
