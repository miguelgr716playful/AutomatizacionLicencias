using System.Text.Json;
using AprovLicencias.Api.Configuration;
using AprovLicencias.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace AprovLicencias.Api.Functions;

public sealed class UsuariosFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IAppSettingsProvider _settings;
    private readonly ISessionService _sessions;
    private readonly IUsersTableService _users;
    private readonly IAuthorizedUsersSeedService _seed;
    private readonly ILogger<UsuariosFunction> _logger;

    public UsuariosFunction(
        IAppSettingsProvider settings,
        ISessionService sessions,
        IUsersTableService users,
        IAuthorizedUsersSeedService seed,
        ILogger<UsuariosFunction> logger
    )
    {
        _settings = settings;
        _sessions = sessions;
        _users = users;
        _seed = seed;
        _logger = logger;
    }

    [Function("Usuarios")]
    public async Task<IActionResult> Run(
        [HttpTrigger(
            AuthorizationLevel.Anonymous,
            "get",
            "post",
            "patch",
            "delete",
            "options",
            Route = "v1/usuarios/{action?}")]
            HttpRequest req,
        string? action
    )
    {
        if (HttpMethods.IsOptions(req.Method))
            return HttpHelpers.OptionsResult(req, _settings.Current);

        var (session, authError) = AuthorizationService.RequireAdmin(req, _sessions, _settings);
        if (authError != null) return authError;

        if (!_users.IsConfigured())
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                503,
                new
                {
                    error = "Tabla no configurada",
                    required = new[] { "StorageConnectionString" },
                    table = _settings.Current.AuthorizedUsersTable,
                }
            );
        }

        action = (action ?? "").Trim().ToLowerInvariant();

        try
        {
            if (HttpMethods.IsGet(req.Method))
            {
                var email = EmailFrom(req, null);
                if (!string.IsNullOrEmpty(email))
                {
                    var user = await _users.GetByEmailAsync(email, req.HttpContext.RequestAborted);
                    if (user == null)
                        return HttpHelpers.JsonWithHeaders(req, _settings.Current, 404, new { error = "Usuario no encontrado" });
                    return HttpHelpers.JsonWithHeaders(req, _settings.Current, 200, new { user });
                }

                var users = await _users.ListAsync(req.HttpContext.RequestAborted);
                return HttpHelpers.JsonWithHeaders(
                    req,
                    _settings.Current,
                    200,
                    new { users, total = users.Count }
                );
            }

            if (HttpMethods.IsPost(req.Method) && action == "seed")
            {
                var upserted = new List<AuthorizedUser>();
                foreach (var user in _seed.GetSeedUsers())
                    upserted.Add(await _users.UpsertAsync(user, req.HttpContext.RequestAborted));

                _logger.LogInformation("Seed AuthorizedUsers: {Count} filas", upserted.Count);
                return HttpHelpers.JsonWithHeaders(
                    req,
                    _settings.Current,
                    200,
                    new { ok = true, seeded = upserted.Count, users = upserted }
                );
            }

            if (HttpMethods.IsPost(req.Method))
            {
                var body = await ReadJsonBodyAsync(req);
                var email = NormalizeEmail(body.Email);
                var rol = _users.ParseRol(body.Rol);
                if (string.IsNullOrEmpty(email) || !email.Contains('@'))
                    return HttpHelpers.JsonWithHeaders(req, _settings.Current, 400, new { error = "email inválido" });
                if (string.IsNullOrEmpty(rol) || rol == "auditor")
                    return HttpHelpers.JsonWithHeaders(req, _settings.Current, 400, new { error = "rol inválido (admin | ejecutor)" });

                var existing = await _users.GetByEmailAsync(email, req.HttpContext.RequestAborted);
                var user = await _users.UpsertAsync(
                    new AuthorizedUser
                    {
                        Email = email,
                        Nombre = body.Nombre ?? existing?.Nombre ?? email,
                        Nomina = body.Nomina ?? existing?.Nomina ?? "",
                        Rol = rol,
                    },
                    req.HttpContext.RequestAborted
                );
                return HttpHelpers.JsonWithHeaders(req, _settings.Current, existing == null ? 201 : 200, new { user });
            }

            if (HttpMethods.IsPatch(req.Method))
            {
                var body = await ReadJsonBodyAsync(req);
                var email = EmailFrom(req, body);
                if (string.IsNullOrEmpty(email))
                    return HttpHelpers.JsonWithHeaders(req, _settings.Current, 400, new { error = "Falta email" });

                var existing = await _users.GetByEmailAsync(email, req.HttpContext.RequestAborted);
                if (existing == null)
                    return HttpHelpers.JsonWithHeaders(req, _settings.Current, 404, new { error = "Usuario no encontrado" });

                var rol = body.Rol != null ? _users.ParseRol(body.Rol) : existing.Rol;
                if (string.IsNullOrEmpty(rol) || rol == "auditor")
                    return HttpHelpers.JsonWithHeaders(req, _settings.Current, 400, new { error = "rol inválido (admin | ejecutor)" });

                var user = await _users.UpsertAsync(
                    new AuthorizedUser
                    {
                        Email = email,
                        Nombre = body.Nombre ?? existing.Nombre,
                        Nomina = body.Nomina ?? existing.Nomina ?? "",
                        Rol = rol,
                    },
                    req.HttpContext.RequestAborted
                );
                return HttpHelpers.JsonWithHeaders(req, _settings.Current, 200, new { user });
            }

            if (HttpMethods.IsDelete(req.Method))
            {
                var body = await ReadJsonBodyAsync(req);
                var email = EmailFrom(req, body);
                if (string.IsNullOrEmpty(email))
                    return HttpHelpers.JsonWithHeaders(req, _settings.Current, 400, new { error = "Falta email" });

                if (NormalizeEmail(session!.Email) == email)
                {
                    return HttpHelpers.JsonWithHeaders(
                        req,
                        _settings.Current,
                        400,
                        new { error = "No puedes eliminar tu propio acceso" }
                    );
                }

                var existing = await _users.GetByEmailAsync(email, req.HttpContext.RequestAborted);
                if (existing == null)
                    return HttpHelpers.JsonWithHeaders(req, _settings.Current, 404, new { error = "Usuario no encontrado" });

                if (existing.Rol == "admin")
                {
                    var allUsers = await _users.ListAsync(req.HttpContext.RequestAborted);
                    var adminCount = allUsers.Count(u => u.Rol == "admin");
                    if (adminCount <= 1)
                    {
                        return HttpHelpers.JsonWithHeaders(
                            req,
                            _settings.Current,
                            400,
                            new { error = "No se puede eliminar al último administrador" }
                        );
                    }
                }

                await _users.DeleteAsync(email, req.HttpContext.RequestAborted);
                return HttpHelpers.JsonWithHeaders(req, _settings.Current, 200, new { ok = true, email });
            }

            return HttpHelpers.JsonWithHeaders(req, _settings.Current, 405, new { error = "Método no permitido" });
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
            _logger.LogError(ex, "Error en usuarios");
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                500,
                new { error = ex.Message.Length > 0 ? ex.Message : "Error al acceder a AuthorizedUsers" }
            );
        }
    }

    private static string NormalizeEmail(string? value) => (value ?? "").Trim().ToLowerInvariant();

    private static string EmailFrom(HttpRequest req, UsuarioBody? body)
    {
        var fromQuery = req.Query["email"].ToString();
        var fromBody = body?.Email ?? "";
        return NormalizeEmail(string.IsNullOrEmpty(fromQuery) ? fromBody : fromQuery);
    }

    private static async Task<UsuarioBody> ReadJsonBodyAsync(HttpRequest req)
    {
        try
        {
            return await JsonSerializer.DeserializeAsync<UsuarioBody>(
                req.Body,
                JsonOptions,
                req.HttpContext.RequestAborted
            ) ?? new UsuarioBody();
        }
        catch
        {
            return new UsuarioBody();
        }
    }

    private sealed class UsuarioBody
    {
        public string? Email { get; set; }
        public string? Nombre { get; set; }
        public string? Nomina { get; set; }
        public string? Rol { get; set; }
    }
}
