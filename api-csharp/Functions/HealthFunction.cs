using AprovLicencias.Api.Configuration;
using AprovLicencias.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;

namespace AprovLicencias.Api.Functions;

public sealed class HealthFunction
{
    private readonly IAppSettingsProvider _settings;
    private readonly IUsersTableService _users;
    private readonly IBlobStorageService _blob;

    public HealthFunction(
        IAppSettingsProvider settings,
        IUsersTableService users,
        IBlobStorageService blob
    )
    {
        _settings = settings;
        _users = users;
        _blob = blob;
    }

    [Function("Health")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "v1/health")]
            HttpRequest req
    )
    {
        if (HttpMethods.IsOptions(req.Method))
            return HttpHelpers.OptionsResult(req, _settings.Current);

        var env = _settings.Current;
        int? count = null;
        string? tableError = null;

        if (_users.IsConfigured())
        {
            try
            {
                var users = await _users.ListAsync(req.HttpContext.RequestAborted);
                count = users.Count;
            }
            catch (Exception ex)
            {
                tableError = ex.Message;
            }
        }

        return HttpHelpers.JsonWithHeaders(
            req,
            env,
            200,
            new
            {
                ok = true,
                service = "aprov-licencias-api-csharp",
                samlConfigured = env.SamlConfigured,
                claimsMapper = SessionConstants.ClaimsMapperVersion,
                authorizedUsersTable = env.IsTableConfigured(),
                authorizedUsersTableName = env.AuthorizedUsersTable,
                authorizedUsersCount = count,
                authorizedUsersError = tableError,
                authorizedUsersFallback = env.AuthorizedUsersFallback,
                csvUploadContainer = env.CsvUploadContainer,
                csvUploadConfigured = _blob.IsConfigured(),
                adobeConfigured = env.IsAdobeConfigured(),
                keyVaultConfigured = env.IsKeyVaultConfigured(),
                endpoints = new
                {
                    configuracion = $"{env.FunctionsBase}/api/v1/configuracion",
                    configuracionAdobe = $"{env.FunctionsBase}/api/v1/configuracion/adobe",
                    login = $"{env.FunctionsBase}/api/v1/auth/saml/login",
                    acs = env.CallbackUrl,
                    slo = env.SloUrl,
                    metadata = $"{env.FunctionsBase}/api/v1/auth/saml/metadata",
                    me = $"{env.FunctionsBase}/api/v1/auth/me",
                    logout = $"{env.FunctionsBase}/api/v1/auth/logout",
                    usuarios = $"{env.FunctionsBase}/api/v1/usuarios",
                    usuariosSeed = $"{env.FunctionsBase}/api/v1/usuarios/seed",
                    licenciasUpload = $"{env.FunctionsBase}/api/v1/licencias/upload",
                    adobeUsuario = $"{env.FunctionsBase}/api/v1/adobe/usuario",
                    adobeProfiles = $"{env.FunctionsBase}/api/v1/adobe/profiles",
                    adobeCuotas = $"{env.FunctionsBase}/api/v1/adobe/cuotas",
                    adobeMiembros = $"{env.FunctionsBase}/api/v1/adobe/miembros",
                    adobeLicencias = $"{env.FunctionsBase}/api/v1/adobe/licencias",
                },
            }
        );
    }
}
