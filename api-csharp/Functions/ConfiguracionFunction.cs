using System.Text.Json;
using AprovLicencias.Api.Configuration;
using AprovLicencias.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace AprovLicencias.Api.Functions;

public sealed class ConfiguracionFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IAppSettingsProvider _settings;
    private readonly ISessionService _sessions;
    private readonly IKeyVaultService _keyVault;
    private readonly ILogger<ConfiguracionFunction> _logger;

    public ConfiguracionFunction(
        IAppSettingsProvider settings,
        ISessionService sessions,
        IKeyVaultService keyVault,
        ILogger<ConfiguracionFunction> logger
    )
    {
        _settings = settings;
        _sessions = sessions;
        _keyVault = keyVault;
        _logger = logger;
    }

    [Function("Configuracion")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "put", "options", Route = "v1/configuracion/{action?}")]
            HttpRequest req,
        string? action
    )
    {
        if (HttpMethods.IsOptions(req.Method))
            return HttpHelpers.OptionsResult(req, _settings.Current);

        var (session, authError) = AuthorizationService.RequireAdmin(req, _sessions, _settings);
        if (authError != null) return authError;

        action = (action ?? "").Trim().ToLowerInvariant();

        try
        {
            if (HttpMethods.IsGet(req.Method) && (string.IsNullOrEmpty(action) || action == "proveedores"))
            {
                var adobeCreds = await _keyVault.GetAdobeCredentialsPublicAsync(req.HttpContext.RequestAborted);
                return HttpHelpers.JsonWithHeaders(
                    req,
                    _settings.Current,
                    200,
                    new
                    {
                        keyVaultConfigured = _settings.Current.IsKeyVaultConfigured(),
                        portalAdobeConfigured = _settings.Current.IsAdobeConfigured(),
                        adobeCredentials = adobeCreds,
                        proveedores = new object[]
                        {
                            new
                            {
                                id = "adobe",
                                nombre = "Adobe",
                                icon = "AC",
                                mapping = KeyVaultService.GetAdobeFieldMappingDefault(),
                                storage = "keyvault",
                                purpose = "datafactory",
                                secretName = adobeCreds.Secrets.ClientId,
                            },
                            new
                            {
                                id = "minitab",
                                nombre = "Minitab",
                                icon = "Mt",
                                mapping = KeyVaultService.GetMinitabFieldMapping(),
                                storage = "default",
                                secretName = (string?)null,
                            },
                        },
                        programador = new
                        {
                            periodicidad = "Diario (Nocturno)",
                            proximaEjecucion = "Hoy, 04:00 hrs",
                        },
                    }
                );
            }

            if (HttpMethods.IsPut(req.Method) && action == "adobe")
            {
                var body = await JsonSerializer.DeserializeAsync<AdobeCredentialsRequest>(
                    req.Body,
                    JsonOptions,
                    req.HttpContext.RequestAborted
                );
                if (body == null)
                    return HttpHelpers.JsonWithHeaders(req, _settings.Current, 400, new { error = "JSON inválido" });

                var saved = await _keyVault.SaveAdobeCredentialsAsync(body, req.HttpContext.RequestAborted);
                _logger.LogInformation(
                    "Adobe credentials → Key Vault by={Email} org={Org}",
                    session!.Email,
                    saved.AdobeOrgId
                );

                return HttpHelpers.JsonWithHeaders(
                    req,
                    _settings.Current,
                    200,
                    new
                    {
                        ok = true,
                        purpose = "datafactory",
                        adobeCredentials = saved,
                        note = "Guardado en Key Vault para Data Factory. El portal sigue usando App Settings.",
                    }
                );
            }

            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                404,
                new
                {
                    error = "Ruta no encontrada",
                    endpoints = new[]
                    {
                        "GET /api/v1/configuracion",
                        "PUT /api/v1/configuracion/adobe",
                    },
                }
            );
        }
        catch (ApiException ex)
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                ex.StatusCode,
                new { error = ex.Message, required = ex.Required }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error configuración");
            return HttpHelpers.JsonWithHeaders(req, _settings.Current, 500, new { error = ex.Message });
        }
    }
}
