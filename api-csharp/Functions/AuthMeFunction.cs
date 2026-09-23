using AprovLicencias.Api.Configuration;
using AprovLicencias.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;

namespace AprovLicencias.Api.Functions;

public sealed class AuthMeFunction
{
    private readonly ISessionService _sessions;
    private readonly IAppSettingsProvider _settings;

    public AuthMeFunction(ISessionService sessions, IAppSettingsProvider settings)
    {
        _sessions = sessions;
        _settings = settings;
    }

    [Function("AuthMe")]
    public IActionResult Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options", Route = "v1/auth/me")]
            HttpRequest req
    )
    {
        if (HttpMethods.IsOptions(req.Method))
            return HttpHelpers.OptionsResult(req, _settings.Current);

        var session = _sessions.GetSession(req);
        if (session == null)
            return HttpHelpers.JsonWithHeaders(req, _settings.Current, 401, new { error = "No autenticado" });

        var givenName = session.GivenName;
        var sn = session.Sn;
        var mail = session.Email.Contains('@') ? session.Email : null;

        var claims = new Dictionary<string, object>();
        if (!string.IsNullOrEmpty(givenName))
        {
            claims["givenName"] = givenName;
            claims["givenname"] = givenName;
            claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] = givenName;
        }
        if (!string.IsNullOrEmpty(sn))
        {
            claims["sn"] = sn;
            claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sn"] = sn;
        }
        if (!string.IsNullOrEmpty(mail))
        {
            claims["mail"] = mail;
            claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mail"] = mail;
        }
        if (!string.IsNullOrEmpty(session.EmployeeType))
            claims["employeeType"] = session.EmployeeType;
        if (!string.IsNullOrEmpty(session.Nomina))
            claims["nomina"] = session.Nomina;

        return HttpHelpers.JsonWithHeaders(
            req,
            _settings.Current,
            200,
            new
            {
                id = session.Id,
                email = session.Email,
                nombre = session.Nombre,
                rol = session.Rol,
                nameID = session.NameID,
                givenName,
                sn,
                employeeType = session.EmployeeType,
                nomina = session.Nomina,
                claims,
            }
        );
    }
}
