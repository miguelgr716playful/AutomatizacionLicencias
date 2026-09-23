using AprovLicencias.Api.Configuration;
using AprovLicencias.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;

namespace AprovLicencias.Api.Functions;

/// <summary>
/// Cierra sesión local. SLO SAML no incluido (permanece en api/ Node.js del SWA).
/// </summary>
public sealed class AuthLogoutFunction
{
    private readonly ISessionService _sessions;
    private readonly IAppSettingsProvider _settings;

    public AuthLogoutFunction(ISessionService sessions, IAppSettingsProvider settings)
    {
        _sessions = sessions;
        _settings = settings;
    }

    [Function("AuthLogout")]
    public IActionResult Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "options", Route = "v1/auth/logout")]
            HttpRequest req
    )
    {
        if (HttpMethods.IsOptions(req.Method))
            return HttpHelpers.OptionsResult(req, _settings.Current);

        var env = _settings.Current;
        var clearCookie = new Dictionary<string, string>
        {
            ["Set-Cookie"] = _sessions.SessionCookieHeader("", clear: true),
        };

        if (HttpMethods.IsGet(req.Method) || req.Query["redirect"] == "1")
        {
            return HttpHelpers.Redirect(req, env, $"{env.FrontendUrl}/login", clearCookie);
        }

        return HttpHelpers.JsonWithHeaders(
            req,
            env,
            200,
            new { ok = true, message = "Sesión cerrada" },
            clearCookie
        );
    }
}
