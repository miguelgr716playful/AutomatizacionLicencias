namespace AprovLicencias.Api.Configuration;

public sealed class AppSettings
{
    public string FunctionsBase { get; init; } = "";
    public string FrontendUrl { get; init; } = "";
    public string CallbackUrl { get; init; } = "";
    public string SloUrl { get; init; } = "";
    public string SessionSecret { get; init; } = "";
    public string SessionCookie { get; init; } = "licencias_session";
    public int SessionTtlSeconds { get; init; } = 28800;
    public IReadOnlyList<string> CorsOrigins { get; init; } = [];
    public string? StorageConnectionString { get; init; }
    public string AuthorizedUsersTable { get; init; } = "AuthorizedUsers";
    public bool AuthorizedUsersFallback { get; init; } = true;
    public string CsvUploadContainer { get; init; } = "csv-uploads";
    public string? AdobeOrgId { get; init; }
    public string? AdobeClientId { get; init; }
    public string? AdobeClientSecret { get; init; }
    public string AdobeScopes { get; init; } = "openid,AdobeID,user_management_sdk";
    public string? KeyVaultUrl { get; init; }
    public bool SamlConfigured { get; init; }

    public static AppSettings Load()
    {
        var functionsBase = Setting(
            "SAML_FUNCTIONS_BASE_URL",
            "https://ambitious-island-01ab11110.7.azurestaticapps.net"
        ).TrimEnd('/');

        var frontendUrl = Setting(
            "SAML_FRONTEND_URL",
            functionsBase
        ).TrimEnd('/');

        var sessionSecret = Setting("SESSION_SECRET");
        if (string.IsNullOrEmpty(sessionSecret))
        {
            var isAzure = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("AZURE_FUNCTIONS_ENVIRONMENT"));
            if (isAzure)
                throw new InvalidOperationException("SESSION_SECRET es obligatorio en Azure Functions");
            sessionSecret = "change-me-licencias-dev-secret";
        }

        var cors = (Environment.GetEnvironmentVariable("CORS_ORIGINS")
            ?? $"{frontendUrl},http://localhost:3000,http://localhost:3001")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        var idpEntry = Setting("SAML_IDP_ENTRY_POINT");
        var idpCert = Setting("SAML_IDP_CERT");

        return new AppSettings
        {
            FunctionsBase = functionsBase,
            FrontendUrl = frontendUrl,
            CallbackUrl = $"{functionsBase}/api/v1/auth/saml/acs",
            SloUrl = $"{functionsBase}/api/v1/auth/saml/slo",
            SessionSecret = sessionSecret,
            SessionCookie = Setting("SESSION_COOKIE_NAME", "licencias_session"),
            SessionTtlSeconds = int.TryParse(Setting("SESSION_TTL_SECONDS", "28800"), out var ttl) ? ttl : 28800,
            CorsOrigins = cors,
            StorageConnectionString = Setting("StorageConnectionString", env: "AZURE_STORAGE_CONNECTION_STRING"),
            AuthorizedUsersTable = Setting("AuthorizedUsersTable", "AuthorizedUsers", "AUTHORIZED_USERS_TABLE"),
            AuthorizedUsersFallback = SettingBool("AuthorizedUsersFallback", "AUTHORIZED_USERS_FALLBACK", true),
            CsvUploadContainer = Setting("CsvUploadContainer", "csv-uploads", "CSV_UPLOAD_CONTAINER"),
            AdobeOrgId = Setting("AdobeOrgId", env: "ADOBE_ORG_ID"),
            AdobeClientId = Setting("AdobeClientId", env: "ADOBE_CLIENT_ID"),
            AdobeClientSecret = Setting("AdobeClientSecret", env: "ADOBE_CLIENT_SECRET"),
            AdobeScopes = Setting("AdobeScopes", "openid,AdobeID,user_management_sdk", "ADOBE_SCOPES"),
            KeyVaultUrl = Setting("KeyVaultUrl", env: "KEY_VAULT_URL").TrimEnd('/'),
            SamlConfigured = !string.IsNullOrEmpty(idpEntry) && !string.IsNullOrEmpty(idpCert),
        };
    }

    public bool IsAdobeConfigured() =>
        !string.IsNullOrWhiteSpace(AdobeOrgId)
        && !string.IsNullOrWhiteSpace(AdobeClientId)
        && !string.IsNullOrWhiteSpace(AdobeClientSecret);

    public bool IsKeyVaultConfigured() => !string.IsNullOrWhiteSpace(KeyVaultUrl);

    public bool IsTableConfigured() => !string.IsNullOrWhiteSpace(StorageConnectionString);

    public bool IsBlobConfigured() => !string.IsNullOrWhiteSpace(StorageConnectionString);

    private static string Setting(string primary, string? fallback = null, string? env = null)
    {
        var value = Environment.GetEnvironmentVariable(primary)?.Trim();
        if (!string.IsNullOrEmpty(value)) return value;
        if (env != null)
        {
            value = Environment.GetEnvironmentVariable(env)?.Trim();
            if (!string.IsNullOrEmpty(value)) return value;
        }
        return fallback ?? "";
    }

    private static bool SettingBool(string primary, string? legacy, bool defaultValue)
    {
        var raw = Environment.GetEnvironmentVariable(primary) ?? Environment.GetEnvironmentVariable(legacy ?? "");
        if (string.IsNullOrWhiteSpace(raw)) return defaultValue;
        return !string.Equals(raw.Trim(), "false", StringComparison.OrdinalIgnoreCase);
    }
}

public interface IAppSettingsProvider
{
    AppSettings Current { get; }
}

public sealed class AppSettingsProvider : IAppSettingsProvider
{
    private readonly Lazy<AppSettings> _settings = new(AppSettings.Load);
    public AppSettings Current => _settings.Value;
}
