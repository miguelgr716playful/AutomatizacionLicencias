using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using AprovLicencias.Api.Configuration;
using AprovLicencias.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace AprovLicencias.Api.Functions;

public sealed class AdobeLicenciasFunction
{
    private const string DefaultMembersDomain = "tecmilenio.mx";
    private const string GrupoAlumno = "Alumnos Tecmilenio";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static readonly Regex AlumnoEmailRegex = new(
        @"^al[a-z0-9]+@tecmilenio\.mx$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private readonly IAppSettingsProvider _settings;
    private readonly ISessionService _sessions;
    private readonly IAdobeUmapiService _adobe;
    private readonly ILogger<AdobeLicenciasFunction> _logger;

    public AdobeLicenciasFunction(
        IAppSettingsProvider settings,
        ISessionService sessions,
        IAdobeUmapiService adobe,
        ILogger<AdobeLicenciasFunction> logger
    )
    {
        _settings = settings;
        _sessions = sessions;
        _adobe = adobe;
        _logger = logger;
    }

    [Function("AdobeLicencias")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "options", Route = "v1/adobe/{action?}")]
            HttpRequest req,
        string? action
    )
    {
        if (HttpMethods.IsOptions(req.Method))
            return HttpHelpers.OptionsResult(req, _settings.Current);

        var (session, authError) = AuthorizationService.RequireRole(
            req,
            _sessions,
            _settings,
            "admin",
            "ejecutor"
        );
        if (authError != null) return authError;

        if (!_adobe.IsConfigured())
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                503,
                new
                {
                    error = "Adobe UMAPI no configurado",
                    required = new[] { "AdobeOrgId", "AdobeClientId", "AdobeClientSecret" },
                }
            );
        }

        action = (action ?? "").Trim().ToLowerInvariant();
        var ct = req.HttpContext.RequestAborted;

        try
        {
            if (HttpMethods.IsGet(req.Method) && action == "usuario")
                return await HandleGetUsuarioAsync(req, ct);

            if (HttpMethods.IsGet(req.Method) && action == "profiles")
                return HandleGetProfiles(req);

            if (HttpMethods.IsGet(req.Method) && action == "cuotas")
                return await HandleGetCuotasAsync(req, ct);

            if (HttpMethods.IsGet(req.Method) && action == "miembros")
                return await HandleGetMiembrosAsync(req, session!, ct);

            if (HttpMethods.IsPost(req.Method) && (action == "licencias" || string.IsNullOrEmpty(action)))
                return await HandlePostLicenciasAsync(req, session!, ct);

            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                404,
                new
                {
                    error = "Ruta no encontrada",
                    endpoints = new[]
                    {
                        "GET /api/v1/adobe/usuario?email=",
                        "GET /api/v1/adobe/profiles",
                        "GET /api/v1/adobe/cuotas",
                        "GET /api/v1/adobe/miembros?perfil=alumno|profesor",
                        "POST /api/v1/adobe/licencias",
                    },
                }
            );
        }
        catch (ApiException ex)
        {
            var status = ex.StatusCode is >= 400 and < 500 ? ex.StatusCode : 500;
            return HttpHelpers.JsonWithHeaders(req, _settings.Current, status, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error Adobe licencias");
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                500,
                new { error = ex.Message.Length > 0 ? ex.Message : "Error en Adobe UMAPI" }
            );
        }
    }

    private async Task<IActionResult> HandleGetUsuarioAsync(HttpRequest req, CancellationToken ct)
    {
        var email = (req.Query["email"].ToString() ?? "").Trim().ToLowerInvariant();
        if (!email.Contains('@'))
            return HttpHelpers.JsonWithHeaders(req, _settings.Current, 400, new { error = "Falta email válido" });

        var user = await _adobe.GetAdobeUserAsync(email, ct);
        if (user == null)
            return HttpHelpers.JsonWithHeaders(req, _settings.Current, 404, new { error = "Usuario no encontrado en Adobe" });

        return HttpHelpers.JsonWithHeaders(req, _settings.Current, 200, new { user = ToUserResponse(user) });
    }

    private IActionResult HandleGetProfiles(HttpRequest req)
    {
        var profiles = AdobeUmapiService.PerfilesLicencia.Select(p =>
        {
            var item = new Dictionary<string, object?>
            {
                ["id"] = p.Id,
                ["label"] = p.Label,
                ["groupName"] = p.GroupName,
            };
            if (p.MembersGroupName != null)
                item["membersGroupName"] = p.MembersGroupName;
            if (p.QuotaGroupName != null)
                item["quotaGroupName"] = p.QuotaGroupName;
            return item;
        }).ToList();

        return HttpHelpers.JsonWithHeaders(
            req,
            _settings.Current,
            200,
            new
            {
                profiles,
                total = AdobeUmapiService.PerfilesLicencia.Count,
            }
        );
    }

    private async Task<IActionResult> HandleGetCuotasAsync(HttpRequest req, CancellationToken ct)
    {
        var portalConfig = AdobeUmapiService.PerfilesLicencia
            .Select(p => new PortalQuotaConfig(
                p.GroupName,
                p.QuotaGroupName ?? p.GroupName,
                p.Label
            ))
            .ToList();

        var stats = await _adobe.GetQuotaStatsAsync(portalConfig, ct);
        return HttpHelpers.JsonWithHeaders(req, _settings.Current, 200, ToCamelCaseObject(stats));
    }

    private async Task<IActionResult> HandleGetMiembrosAsync(
        HttpRequest req,
        SessionPayload session,
        CancellationToken ct
    )
    {
        var perfilId = (req.Query["perfil"].ToString() ?? "").Trim().ToLowerInvariant();
        _ = int.TryParse(req.Query["page"].ToString(), out var page);

        string domain;
        if (!req.Query.ContainsKey("domain"))
            domain = DefaultMembersDomain;
        else
            domain = (req.Query["domain"].ToString() ?? "").Trim().ToLowerInvariant();

        var perfil = AdobeUmapiService.PerfilesLicencia.FirstOrDefault(p => p.Id == perfilId);
        if (perfil == null)
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new
                {
                    error = "perfil debe ser \"alumno\" o \"profesor\"",
                    permitidos = AdobeUmapiService.PerfilesLicencia.Select(p => p.Id).ToArray(),
                }
            );
        }

        var membersGroup = perfil.MembersGroupName ?? perfil.QuotaGroupName ?? perfil.GroupName;
        var result = await _adobe.ListGroupMembersAsync(
            membersGroup,
            page,
            new ListGroupMembersOptions(
                Domain: string.IsNullOrEmpty(domain) ? null : domain,
                DirectOnly: false
            ),
            ct
        );

        _logger.LogInformation(
            "Adobe miembros perfil={PerfilId} group={MembersGroup} page={Page} domain={Domain} count={Count} by={Email}",
            perfilId,
            membersGroup,
            page,
            string.IsNullOrEmpty(domain) ? "*" : domain,
            result.Count,
            session.Email
        );

        return HttpHelpers.JsonWithHeaders(
            req,
            _settings.Current,
            200,
            new
            {
                perfil = perfil.Id,
                label = perfil.Label,
                displayGroupName = perfil.GroupName,
                groupName = result.GroupName,
                page = result.Page,
                lastPage = result.LastPage,
                domain = result.Domain,
                rawCount = result.RawCount,
                count = result.Count,
                users = result.Users.Select(ToMemberResponse).ToList(),
            }
        );
    }

    private async Task<IActionResult> HandlePostLicenciasAsync(
        HttpRequest req,
        SessionPayload session,
        CancellationToken ct
    )
    {
        var body = await ReadJsonBodyAsync(req, ct);
        var groupName = (body.GroupName ?? body.Group ?? "").Trim();
        var accion = (body.Accion ?? body.Action ?? "").Trim().ToLowerInvariant();
        var testOnly = body.TestOnly;

        if (body.Emails is { Length: > 0 } emailsRaw)
            return await HandleBatchLicenciasAsync(req, session, emailsRaw, groupName, accion, testOnly, ct);

        var email = (body.Email ?? "").Trim().ToLowerInvariant();

        if (!email.Contains('@'))
            return HttpHelpers.JsonWithHeaders(req, _settings.Current, 400, new { error = "email inválido" });

        if (accion is not ("asignar" or "revocar"))
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new { error = "accion debe ser \"asignar\" o \"revocar\"" }
            );
        }

        return await HandleIndividualLicenciaAsync(req, session, email, groupName, accion, testOnly, ct);
    }

    private async Task<IActionResult> HandleBatchLicenciasAsync(
        HttpRequest req,
        SessionPayload session,
        string[] emailsRaw,
        string groupName,
        string accion,
        bool testOnly,
        CancellationToken ct
    )
    {
        if (accion is not ("asignar" or "revocar"))
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new { error = "Para lista, accion debe ser \"asignar\" o \"revocar\"" }
            );
        }

        if (string.IsNullOrEmpty(groupName) || !AdobeUmapiService.PerfilesPermitidos.Contains(groupName))
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new
                {
                    error = "Solo se permiten: Colaboradores y Profesores Tecmilenio | Alumnos Tecmilenio",
                    permitidos = AdobeUmapiService.PerfilesPermitidos.ToArray(),
                }
            );
        }

        var emailsNorm = emailsRaw
            .Select(e => (e ?? "").Trim().ToLowerInvariant())
            .Where(e => e.Contains('@'))
            .ToList();

        if (groupName != GrupoAlumno)
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new
                {
                    error =
                        "Asignación por lista CSV solo está habilitada para Alumnos Tecmilenio (formato AL*@tecmilenio.mx). Formato profesores: por definir.",
                    groupName,
                }
            );
        }

        if (!emailsNorm.All(e => AlumnoEmailRegex.IsMatch(e)))
        {
            var sample = emailsNorm.FirstOrDefault(e => !AlumnoEmailRegex.IsMatch(e));
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new
                {
                    error = "Para Alumnos Tecmilenio la lista debe usar correos AL{matricula}@tecmilenio.mx",
                    ejemplo = sample,
                }
            );
        }

        if (emailsRaw.Length > 500)
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new { error = "Máximo 500 correos por solicitud" }
            );
        }

        var umapiAction = accion == "asignar" ? "add" : "remove";
        var result = await _adobe.ChangeLicensesBatchAsync(emailsRaw, groupName, umapiAction, testOnly, ct);

        _logger.LogInformation(
            "Adobe {Accion} batch n={Total} group={GroupName} by={Email} success={Success}",
            accion,
            result.Total,
            groupName,
            session.Email,
            result.Success
        );

        return HttpHelpers.JsonWithHeaders(
            req,
            _settings.Current,
            result.Success ? 200 : 207,
            new
            {
                ok = result.Success,
                accion,
                groupName,
                mode = "lista",
                formato = "alumno-al",
                success = result.Success,
                result = result.Result,
                completed = result.Completed,
                notCompleted = result.NotCompleted,
                completedInTestMode = result.CompletedInTestMode,
                total = result.Total,
                emails = result.Emails,
                batches = result.Batches,
                errors = result.Errors,
            }
        );
    }

    private async Task<IActionResult> HandleIndividualLicenciaAsync(
        HttpRequest req,
        SessionPayload session,
        string email,
        string groupName,
        string accion,
        bool testOnly,
        CancellationToken ct
    )
    {
        if (string.IsNullOrEmpty(groupName))
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new { error = "groupName requerido (perfil de licencia)" }
            );
        }

        if (!AdobeUmapiService.PerfilesPermitidos.Contains(groupName))
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new
                {
                    error = "Solo se permiten: Colaboradores y Profesores Tecmilenio | Alumnos Tecmilenio",
                    permitidos = AdobeUmapiService.PerfilesPermitidos.ToArray(),
                }
            );
        }

        var umapiAction = accion == "asignar" ? "add" : "remove";
        var result = await _adobe.ChangeLicenseAsync(email, [groupName], umapiAction, testOnly, ct);

        _logger.LogInformation(
            "Adobe {Accion} email={Email} group={GroupName} by={SessionEmail} success={Success}",
            accion,
            email,
            groupName,
            session.Email,
            result.Success
        );

        if (!result.Success)
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                400,
                new
                {
                    ok = false,
                    accion,
                    email,
                    groupName,
                    success = result.Success,
                    result = result.Result,
                    completed = result.Completed,
                    notCompleted = result.NotCompleted,
                    completedInTestMode = result.CompletedInTestMode,
                    groups = result.Groups,
                    errors = result.Errors,
                }
            );
        }

        var user = await _adobe.GetAdobeUserAsync(email, ct);
        return HttpHelpers.JsonWithHeaders(
            req,
            _settings.Current,
            200,
            new
            {
                ok = true,
                accion,
                email,
                groupName,
                success = result.Success,
                result = result.Result,
                completed = result.Completed,
                notCompleted = result.NotCompleted,
                completedInTestMode = result.CompletedInTestMode,
                groups = result.Groups,
                errors = result.Errors,
                user = ToUserResponse(user),
            }
        );
    }

    private static readonly JsonSerializerOptions CamelCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static object ToCamelCaseObject<T>(T value) =>
        JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(value, CamelCaseOptions))!;

    private static object ToUserResponse(AdobeUserDto user) => new
    {
        email = user.Email,
        firstname = user.Firstname,
        lastname = user.Lastname,
        status = user.Status,
        type = user.Type,
        domain = user.Domain,
        groups = user.Groups,
    };

    private static object ToMemberResponse(GroupMemberDto user) => new
    {
        email = user.Email,
        firstname = user.Firstname,
        lastname = user.Lastname,
        status = user.Status,
        type = user.Type,
        domain = user.Domain,
        username = user.Username,
    };

    private static async Task<LicenciasRequestBody> ReadJsonBodyAsync(HttpRequest req, CancellationToken ct)
    {
        try
        {
            return await JsonSerializer.DeserializeAsync<LicenciasRequestBody>(req.Body, JsonOptions, ct)
                ?? new LicenciasRequestBody();
        }
        catch
        {
            return new LicenciasRequestBody();
        }
    }

    private sealed class LicenciasRequestBody
    {
        public string? Email { get; set; }

        public string[]? Emails { get; set; }

        public string? GroupName { get; set; }

        public string? Group { get; set; }

        public string? Accion { get; set; }

        [JsonPropertyName("action")]
        public string? Action { get; set; }

        public bool TestOnly { get; set; }
    }
}
