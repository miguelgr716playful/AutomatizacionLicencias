using System.Text.Json;

namespace AdobeReporteMiembros;

public sealed class AdobeAuthClient(HttpClient http, AdobeOptions options)
{
    public async Task<string> GetAccessTokenAsync(CancellationToken ct = default)
    {
        if (!string.IsNullOrWhiteSpace(options.AccessToken))
            return options.AccessToken.Trim();

        if (string.IsNullOrWhiteSpace(options.ClientId) || string.IsNullOrWhiteSpace(options.ClientSecret))
            throw new InvalidOperationException(
                "Falta AccessToken o ClientId/ClientSecret en appsettings.json.");

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = options.ClientId,
            ["client_secret"] = options.ClientSecret,
            ["scope"] = options.Scopes,
        });

        using var response = await http.PostAsync("https://ims-na1.adobelogin.com/ims/token/v3", content, ct);
        var raw = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"IMS {((int)response.StatusCode)}: {raw}");

        var token = JsonSerializer.Deserialize<TokenResponse>(raw)
            ?? throw new InvalidOperationException("IMS no devolvió access_token.");

        if (string.IsNullOrWhiteSpace(token.AccessToken))
            throw new InvalidOperationException("IMS no devolvió access_token.");

        AppLog.Info($"Token IMS obtenido (expira en ~{token.ExpiresIn / 3600} h).");
        return token.AccessToken;
    }
}
