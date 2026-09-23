using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using AprovLicencias.Api.Configuration;

namespace AprovLicencias.Api.Services;

public sealed class CsvUploadResult
{
    public string Container { get; init; } = "";
    public string BlobName { get; init; } = "";
    public string BlobUrl { get; init; } = "";
    public long Size { get; init; }
    public string UploadedAt { get; init; } = "";
    public string HistoricoBlobName { get; init; } = "";
    public string HistoricoBlobUrl { get; init; } = "";
}

public interface IBlobStorageService
{
    bool IsConfigured();
    Task<CsvUploadResult> UploadCsvAsync(
        byte[] buffer,
        string software,
        string tipo,
        string fileName,
        string uploadedBy,
        CancellationToken ct = default
    );
}

public sealed class BlobStorageService : IBlobStorageService
{
    private const string CurrentPrefix = "actual";
    private const string HistoryPrefix = "historico";

    private static readonly Dictionary<string, string> CurrentFileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["adobe"] = "Claves_Banner_Adobe.csv",
        ["minitab"] = "Claves_Banner_Minitab.csv",
    };

    private readonly IAppSettingsProvider _settings;

    public BlobStorageService(IAppSettingsProvider settings) => _settings = settings;

    public bool IsConfigured() => _settings.Current.IsBlobConfigured();

    public async Task<CsvUploadResult> UploadCsvAsync(
        byte[] buffer,
        string software,
        string tipo,
        string fileName,
        string uploadedBy,
        CancellationToken ct = default
    )
    {
        var env = _settings.Current;
        if (string.IsNullOrEmpty(env.StorageConnectionString))
            throw new InvalidOperationException("Falta StorageConnectionString");

        var container = new BlobServiceClient(env.StorageConnectionString)
            .GetBlobContainerClient(env.CsvUploadContainer);
        await container.CreateIfNotExistsAsync(cancellationToken: ct);

        var meta = new Dictionary<string, string>
        {
            ["software"] = software,
            ["tipo"] = tipo,
            ["originalname"] = SanitizeFileName(fileName),
            ["uploadedby"] = uploadedBy ?? "",
        };

        var historyPath = BuildHistoryPath(software, tipo);
        var history = await UploadBlobAsync(container, historyPath, buffer, "text/csv", meta, ct);

        var currentPath = BuildCurrentPath(software);
        var current = await UploadBlobAsync(container, currentPath, buffer, "text/csv", meta, ct);

        return new CsvUploadResult
        {
            Container = env.CsvUploadContainer,
            BlobName = current.BlobName,
            BlobUrl = current.BlobUrl,
            Size = current.Size,
            UploadedAt = DateTime.UtcNow.ToString("o"),
            HistoricoBlobName = history.BlobName,
            HistoricoBlobUrl = history.BlobUrl,
        };
    }

    private static async Task<(string BlobName, string BlobUrl, long Size)> UploadBlobAsync(
        BlobContainerClient container,
        string blobName,
        byte[] buffer,
        string contentType,
        IDictionary<string, string> metadata,
        CancellationToken ct
    )
    {
        var client = container.GetBlobClient(blobName);
        using var stream = new MemoryStream(buffer);
        await client.UploadAsync(
            stream,
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = contentType },
                Metadata = metadata.ToDictionary(k => k.Key, k => k.Value),
            },
            ct
        );
        return (blobName, client.Uri.ToString(), buffer.Length);
    }

    private static string BuildCurrentPath(string software)
    {
        if (!CurrentFileNames.TryGetValue(software, out var name))
            throw new ApiException($"software inválido: {software}", 400);
        return $"{CurrentPrefix}/{name}";
    }

    private static string BuildHistoryPath(string software, string tipo)
    {
        if (!CurrentFileNames.TryGetValue(software, out var current))
            throw new ApiException($"software inválido: {software}", 400);
        var stamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH-mm-ss-fffZ");
        var baseName = current.Replace(".csv", "", StringComparison.OrdinalIgnoreCase);
        return $"{HistoryPrefix}/{software}/{tipo}/{stamp}_{baseName}.csv";
    }

    private static string SanitizeFileName(string? name)
    {
        var s = (name ?? "archivo.csv").Trim();
        foreach (var c in Path.GetInvalidFileNameChars())
            s = s.Replace(c, '_');
        s = s.Replace('/', '_').Replace('\\', '_');
        return s.Length > 180 ? s[..180] : s;
    }
}
