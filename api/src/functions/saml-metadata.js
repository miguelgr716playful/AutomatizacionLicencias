const { app } = require("@azure/functions");
const { generateSpMetadataXml } = require("../lib/saml");
const { options, xml, json } = require("../lib/http");

/**
 * Metadata SP desde Functions.
 * GET /api/v1/auth/saml/metadata
 */
app.http("samlMetadata", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "v1/auth/saml/metadata",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") return options(request);

    try {
      const body = generateSpMetadataXml();
      return xml(request, 200, body);
    } catch (error) {
      context.error("Error generando metadata", error);
      return json(request, 500, {
        error: "No se pudo generar metadata SP",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  },
});
