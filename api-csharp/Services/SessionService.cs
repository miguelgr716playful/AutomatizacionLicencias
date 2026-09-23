using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AprovLicencias.Api.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AprovLicencias.Api.Services;

public static class SessionConstants
{
    public const string ClaimsMapperVersion = "amfs-v4";
}

public sealed class SessionPayload
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("email")]
    public string Email { get; set; } = "";

    [JsonPropertyName("nombre")]
    public string Nombre { get; set; } = "";

    [JsonPropertyName("rol")]
    public string Rol { get; set; } = "";

    [JsonPropertyName("nameID")]
    public string? NameID { get; set; }

    [JsonPropertyName("nameIDFormat")]
    public string? NameIDFormat { get; set; }

    [JsonPropertyName("sessionIndex")]
    public string? SessionIndex { get; set; }

    [JsonPropertyName("givenName")]
    public string? GivenName { get; set; }

    [JsonPropertyName("sn")]
    public string? Sn { get; set; }

    [JsonPropertyName("employeeType")]
    public string? EmployeeType { get; set; }

    [JsonPropertyName("nomina")]
    public string? Nomina { get; set; }

    [JsonPropertyName("iat")]
    public long Iat { get; set; }

    [JsonPropertyName("exp")]
    public long Exp { get; set; }
}

public interface ISessionService
{
    SessionPayload? GetSession(HttpRequest request);
    string SessionCookieHeader(string token, bool clear = false);
}

public sealed class SessionService : ISessionService
{
    private readonly IAppSettingsProvider _settings;

    public SessionService(IAppSettingsProvider settings) => _settings = settings;

    public SessionPayload? GetSession(HttpRequest request)
    {
        var cookies = HttpHelpers.ParseCookies(request);
        var name = _settings.Current.SessionCookie;
        if (!cookies.TryGetValue(name, out var token) || string.IsNullOrEmpty(token))
            return null;
        return VerifySessionToken(token);
    }

    public string SessionCookieHeader(string token, bool clear = false)
    {
        var env = _settings.Current;
        var maxAge = clear ? 0 : env.SessionTtlSeconds;
        var value = clear ? "" : token;
        return string.Join(
            "; ",
            $"{env.SessionCookie}={Uri.EscapeDataString(value)}",
            "Path=/",
            "HttpOnly",
            "Secure",
            "SameSite=None",
            $"Max-Age={maxAge}"
        );
    }

    private SessionPayload? VerifySessionToken(string token)
    {
        if (string.IsNullOrEmpty(token) || !token.Contains('.')) return null;
        var parts = token.Split('.', 2);
        if (parts.Length != 2) return null;

        var payloadB64 = parts[0];
        var sig = parts[1];
        var expected = Sign(payloadB64, _settings.Current.SessionSecret);

        try
        {
            var a = Encoding.UTF8.GetBytes(sig);
            var b = Encoding.UTF8.GetBytes(expected);
            if (a.Length != b.Length || !CryptographicOperations.FixedTimeEquals(a, b))
                return null;
        }
        catch
        {
            return null;
        }

        try
        {
            var json = Encoding.UTF8.GetString(FromBase64Url(payloadB64));
            var payload = JsonSerializer.Deserialize<SessionPayload>(json);
            if (payload == null || payload.Exp < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
                return null;
            return payload;
        }
        catch
        {
            return null;
        }
    }

    private static string Sign(string payloadB64, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadB64));
        return ToBase64Url(hash);
    }

    private static string ToBase64Url(byte[] input) =>
        Convert.ToBase64String(input).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] FromBase64Url(string input)
    {
        var pad = new string('=', (4 - input.Length % 4) % 4);
        var b64 = input.Replace('-', '+').Replace('_', '/') + pad;
        return Convert.FromBase64String(b64);
    }
}

public static class AuthorizationService
{
    public static (SessionPayload? Session, IActionResult? Error) RequireAdmin(
        HttpRequest request,
        ISessionService sessions,
        IAppSettingsProvider settings
    )
    {
        var session = sessions.GetSession(request);
        if (session == null)
            return (null, HttpHelpers.JsonWithHeaders(request, settings.Current, 401, new { error = "No autenticado" }));
        if (session.Rol != "admin")
            return (session, HttpHelpers.JsonWithHeaders(request, settings.Current, 403, new { error = "Solo administradores" }));
        return (session, null);
    }

    public static (SessionPayload? Session, IActionResult? Error) RequireRole(
        HttpRequest request,
        ISessionService sessions,
        IAppSettingsProvider settings,
        params string[] allowedRoles
    )
    {
        var session = sessions.GetSession(request);
        if (session == null)
            return (null, HttpHelpers.JsonWithHeaders(request, settings.Current, 401, new { error = "No autenticado" }));
        if (!allowedRoles.Contains(session.Rol))
            return (session, HttpHelpers.JsonWithHeaders(request, settings.Current, 403, new { error = "Sin permiso para esta operación" }));
        return (session, null);
    }
}
