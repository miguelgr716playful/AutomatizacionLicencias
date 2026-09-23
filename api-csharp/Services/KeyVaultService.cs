using Azure;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using AprovLicencias.Api.Configuration;

namespace AprovLicencias.Api.Services;

public sealed class AdobeCredentialsPublicView
{
    public string AdobeOrgId { get; set; } = "";
    public string AdobeClientId { get; set; } = "";
    public bool AdobeClientSecretConfigured { get; set; }
    public string AdobeClientSecretHint { get; set; } = "";
    public string Storage { get; set; } = "keyvault";
    public string Purpose { get; set; } = "datafactory";
    public bool KeyVaultConfigured { get; set; }
    public bool ReadError { get; set; }
    public AdobeSecretNames Secrets { get; set; } = new();
}

public sealed class AdobeSecretNames
{
    public string OrgId { get; set; } = "AdobeOrgId";
    public string ClientId { get; set; } = "AdobeClientId";
    public string ClientSecret { get; set; } = "AdobeClientSecret";
}

public sealed class AdobeCredentialsRequest
{
    public string? AdobeOrgId { get; set; }
    public string? OrgId { get; set; }
    public string? AdobeClientId { get; set; }
    public string? ClientId { get; set; }
    public string? AdobeClientSecret { get; set; }
    public string? ClientSecret { get; set; }
}

public interface IKeyVaultService
{
    Task<AdobeCredentialsPublicView> GetAdobeCredentialsPublicAsync(CancellationToken ct = default);
    Task<AdobeCredentialsPublicView> SaveAdobeCredentialsAsync(AdobeCredentialsRequest input, CancellationToken ct = default);
}

public sealed class KeyVaultService : IKeyVaultService
{
    private const string SecretOrg = "AdobeOrgId";
    private const string SecretClientId = "AdobeClientId";
    private const string SecretClientSecret = "AdobeClientSecret";

    private readonly IAppSettingsProvider _settings;
    private SecretClient? _client;

    public KeyVaultService(IAppSettingsProvider settings) => _settings = settings;

    public async Task<AdobeCredentialsPublicView> GetAdobeCredentialsPublicAsync(CancellationToken ct = default)
    {
        var baseView = CreateBaseView();
        if (!_settings.Current.IsKeyVaultConfigured()) return baseView;

        try
        {
            var client = GetClient();
            var org = await GetSecretAsync(client, SecretOrg, ct);
            var clientId = await GetSecretAsync(client, SecretClientId, ct);
            var secret = await GetSecretAsync(client, SecretClientSecret, ct);
            baseView.AdobeOrgId = org;
            baseView.AdobeClientId = clientId;
            baseView.AdobeClientSecretConfigured = !string.IsNullOrEmpty(secret);
            baseView.AdobeClientSecretHint = MaskSecret(secret);
        }
        catch
        {
            baseView.ReadError = true;
        }

        return baseView;
    }

    public async Task<AdobeCredentialsPublicView> SaveAdobeCredentialsAsync(
        AdobeCredentialsRequest input,
        CancellationToken ct = default
    )
    {
        if (!_settings.Current.IsKeyVaultConfigured())
            throw new ApiException("Key Vault no configurado (KeyVaultUrl)", 503, ["KeyVaultUrl"]);

        var orgId = (input.AdobeOrgId ?? input.OrgId ?? "").Trim();
        var clientId = (input.AdobeClientId ?? input.ClientId ?? "").Trim();
        var clientSecret = (input.AdobeClientSecret ?? input.ClientSecret ?? "").Trim();

        if (string.IsNullOrEmpty(orgId) || string.IsNullOrEmpty(clientId))
            throw new ApiException("adobeOrgId y adobeClientId son requeridos", 400);

        var client = GetClient();
        if (string.IsNullOrEmpty(clientSecret))
        {
            clientSecret = await GetSecretAsync(client, SecretClientSecret, ct);
            if (string.IsNullOrEmpty(clientSecret))
                throw new ApiException("adobeClientSecret es requerido la primera vez", 400);
        }

        await Task.WhenAll(
            client.SetSecretAsync(SecretOrg, orgId, ct),
            client.SetSecretAsync(SecretClientId, clientId, ct),
            client.SetSecretAsync(SecretClientSecret, clientSecret, ct)
        );

        return await GetAdobeCredentialsPublicAsync(ct);
    }

    private AdobeCredentialsPublicView CreateBaseView() =>
        new()
        {
            KeyVaultConfigured = _settings.Current.IsKeyVaultConfigured(),
            Secrets = new AdobeSecretNames(),
        };

    private SecretClient GetClient()
    {
        if (_client != null) return _client;
        var url = _settings.Current.KeyVaultUrl!;
        _client = new SecretClient(new Uri(url), new DefaultAzureCredential());
        return _client;
    }

    private static async Task<string> GetSecretAsync(SecretClient client, string name, CancellationToken ct)
    {
        try
        {
            var secret = await client.GetSecretAsync(name, cancellationToken: ct);
            return secret.Value.Value?.Trim() ?? "";
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return "";
        }
    }

    private static string MaskSecret(string? secret)
    {
        if (string.IsNullOrEmpty(secret)) return "";
        return secret.Length <= 8 ? "••••" : $"{secret[..4]}…{secret[^4..]}";
    }

    public static IReadOnlyList<object> GetAdobeFieldMappingDefault() =>
    [
        new { local = "banner_id", api = "federatedID" },
        new { local = "email_inst", api = "email" },
        new { local = "nombres", api = "firstname" },
        new { local = "apellidos", api = "lastname" },
    ];

    public static IReadOnlyList<object> GetMinitabFieldMapping() =>
    [
        new { local = "email_inst", api = "Email" },
        new { local = "nombres", api = "FirstName" },
        new { local = "apellidos", api = "LastName" },
    ];
}
