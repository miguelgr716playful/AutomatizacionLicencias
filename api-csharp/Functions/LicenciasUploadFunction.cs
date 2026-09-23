using AprovLicencias.Api.Configuration;
using AprovLicencias.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace AprovLicencias.Api.Functions;

public sealed class LicenciasUploadFunction
{
    private static readonly HashSet<string> Software = new(StringComparer.OrdinalIgnoreCase) { "adobe", "minitab" };
    private static readonly HashSet<string> Tipos = new(StringComparer.OrdinalIgnoreCase) { "aprov", "desaprov" };

    private readonly IAppSettingsProvider _settings;
    private readonly ISessionService _sessions;
    private readonly IBlobStorageService _blobStorage;
    private readonly ILogger<LicenciasUploadFunction> _logger;

    public LicenciasUploadFunction(
        IAppSettingsProvider settings,
        ISessionService sessions,
        IBlobStorageService blobStorage,
        ILogger<LicenciasUploadFunction> logger
    )
    {
        _settings = settings;
        _sessions = sessions;
        _blobStorage = blobStorage;
        _logger = logger;
    }

    [Function("LicenciasUpload")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "v1/licencias/upload")]
            HttpRequest req
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

        if (!_blobStorage.IsConfigured())
        {
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                503,
                new
                {
                    error = "Storage no configurado",
                    required = new[] { "StorageConnectionString" },
                    container = _settings.Current.CsvUploadContainer,
                }
            );
        }

        try
        {
            var form = await req.ReadFormAsync(req.HttpContext.RequestAborted);
            var file = form.Files.GetFile("file");
            var software = (form["software"].ToString() ?? "").Trim().ToLowerInvariant();
            var tipo = (form["tipo"].ToString() ?? "").Trim().ToLowerInvariant();

            if (file == null)
            {
                return HttpHelpers.JsonWithHeaders(
                    req,
                    _settings.Current,
                    400,
                    new { error = "Falta archivo CSV (campo file)" }
                );
            }

            if (!Software.Contains(software))
            {
                return HttpHelpers.JsonWithHeaders(
                    req,
                    _settings.Current,
                    400,
                    new { error = "software inválido (adobe | minitab)" }
                );
            }

            if (!Tipos.Contains(tipo))
            {
                return HttpHelpers.JsonWithHeaders(
                    req,
                    _settings.Current,
                    400,
                    new { error = "tipo inválido (aprov | desaprov)" }
                );
            }

            var fileName = string.IsNullOrWhiteSpace(file.FileName) ? "archivo.csv" : file.FileName;
            if (!fileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                return HttpHelpers.JsonWithHeaders(
                    req,
                    _settings.Current,
                    400,
                    new { error = "Solo se permiten archivos .csv" }
                );
            }

            byte[] buffer;
            await using (var stream = new MemoryStream())
            {
                await file.CopyToAsync(stream, req.HttpContext.RequestAborted);
                buffer = stream.ToArray();
            }

            if (buffer.Length == 0)
            {
                return HttpHelpers.JsonWithHeaders(
                    req,
                    _settings.Current,
                    400,
                    new { error = "El archivo está vacío" }
                );
            }

            var uploadedBy = !string.IsNullOrEmpty(session!.Email) ? session.Email : session.Id;
            var uploaded = await _blobStorage.UploadCsvAsync(
                buffer,
                software,
                tipo,
                fileName,
                uploadedBy,
                req.HttpContext.RequestAborted
            );

            _logger.LogInformation(
                "CSV upload OK current={BlobName} historico={HistoricoBlobName} by={Email} size={Size}",
                uploaded.BlobName,
                uploaded.HistoricoBlobName,
                session.Email,
                uploaded.Size
            );

            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                201,
                new
                {
                    ok = true,
                    container = uploaded.Container,
                    blobName = uploaded.BlobName,
                    blobUrl = uploaded.BlobUrl,
                    size = uploaded.Size,
                    uploadedAt = uploaded.UploadedAt,
                    historicoBlobName = uploaded.HistoricoBlobName,
                    historicoBlobUrl = uploaded.HistoricoBlobUrl,
                    software,
                    tipo,
                    fileName,
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
            _logger.LogError(ex, "Error subiendo CSV");
            return HttpHelpers.JsonWithHeaders(
                req,
                _settings.Current,
                500,
                new { error = ex.Message.Length > 0 ? ex.Message : "No se pudo guardar el CSV en storage" }
            );
        }
    }
}
