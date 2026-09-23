using System.Text.Json;
using AprovLicencias.Api.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AprovLicencias.Api.Services;

public static class HttpHelpers
{
    public static Dictionary<string, string> ParseCookies(HttpRequest request)
    {
        var result = new Dictionary<string, string>(StringComparer.Ordinal);
        if (!request.Headers.TryGetValue("Cookie", out var header)) return result;

        foreach (var part in header.ToString().Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            var trimmed = part.Trim();
            var i = trimmed.IndexOf('=');
            if (i < 0) continue;
            var key = trimmed[..i];
            var value = Uri.UnescapeDataString(trimmed[(i + 1)..]);
            result[key] = value;
        }
        return result;
    }

    public static Dictionary<string, string> CorsHeaders(HttpRequest request, AppSettings settings)
    {
        var origin = request.Headers.Origin.ToString();
        var allow = settings.CorsOrigins.Contains(origin)
            ? origin
            : settings.CorsOrigins.FirstOrDefault() ?? "*";

        return new Dictionary<string, string>
        {
            ["Access-Control-Allow-Origin"] = allow,
            ["Access-Control-Allow-Credentials"] = "true",
            ["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            ["Access-Control-Allow-Headers"] = "Content-Type, Authorization",
            ["Access-Control-Max-Age"] = "86400",
            ["Vary"] = "Origin",
        };
    }

    public static IActionResult Json(
        HttpRequest request,
        AppSettings settings,
        int status,
        object body,
        IDictionary<string, string>? extraHeaders = null
    )
    {
        var headers = CorsHeaders(request, settings);
        headers["Cache-Control"] = "no-store";
        if (extraHeaders != null)
        {
            foreach (var (k, v) in extraHeaders) headers[k] = v;
        }

        return new JsonResult(body) { StatusCode = status, };
    }

    public static IActionResult Options(HttpRequest request, AppSettings settings) =>
        new StatusCodeResult(StatusCodes.Status204NoContent)
        {
            // JsonResult doesn't support headers easily; use ObjectResult
        };

    public static IActionResult OptionsResult(HttpRequest request, AppSettings settings)
    {
        var result = new StatusCodeResult(StatusCodes.Status204NoContent);
        return new CorsResult(StatusCodes.Status204NoContent, CorsHeaders(request, settings));
    }

    public static IActionResult JsonWithHeaders(
        HttpRequest request,
        AppSettings settings,
        int status,
        object body,
        IDictionary<string, string>? extraHeaders = null
    ) => new CorsJsonResult(status, body, MergeHeaders(request, settings, extraHeaders));

    public static IActionResult Redirect(
        HttpRequest request,
        AppSettings settings,
        string location,
        IDictionary<string, string>? extraHeaders = null
    ) => new CorsRedirectResult(location, MergeHeaders(request, settings, extraHeaders));

    private static Dictionary<string, string> MergeHeaders(
        HttpRequest request,
        AppSettings settings,
        IDictionary<string, string>? extra
    )
    {
        var headers = CorsHeaders(request, settings);
        headers["Cache-Control"] = "no-store";
        if (extra != null)
            foreach (var (k, v) in extra) headers[k] = v;
        return headers;
    }
}

internal sealed class CorsJsonResult : IActionResult
{
    private readonly int _status;
    private readonly object _body;
    private readonly Dictionary<string, string> _headers;

    public CorsJsonResult(int status, object body, Dictionary<string, string> headers)
    {
        _status = status;
        _body = body;
        _headers = headers;
    }

    public async Task ExecuteResultAsync(ActionContext context)
    {
        var response = context.HttpContext.Response;
        response.StatusCode = _status;
        response.ContentType = "application/json; charset=utf-8";
        foreach (var (k, v) in _headers) response.Headers[k] = v;
        await response.WriteAsync(JsonSerializer.Serialize(_body));
    }
}

internal sealed class CorsRedirectResult : IActionResult
{
    private readonly string _location;
    private readonly Dictionary<string, string> _headers;

    public CorsRedirectResult(string location, Dictionary<string, string> headers)
    {
        _location = location;
        _headers = headers;
    }

    public Task ExecuteResultAsync(ActionContext context)
    {
        var response = context.HttpContext.Response;
        response.StatusCode = StatusCodes.Status302Found;
        response.Headers.Location = _location;
        foreach (var (k, v) in _headers) response.Headers[k] = v;
        return Task.CompletedTask;
    }
}

internal sealed class CorsResult : IActionResult
{
    private readonly int _status;
    private readonly Dictionary<string, string> _headers;

    public CorsResult(int status, Dictionary<string, string> headers)
    {
        _status = status;
        _headers = headers;
    }

    public Task ExecuteResultAsync(ActionContext context)
    {
        context.HttpContext.Response.StatusCode = _status;
        foreach (var (k, v) in _headers) context.HttpContext.Response.Headers[k] = v;
        return Task.CompletedTask;
    }
}
