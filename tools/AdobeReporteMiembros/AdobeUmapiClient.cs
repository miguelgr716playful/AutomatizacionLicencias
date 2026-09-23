using System.Text.Json;
using System.Text.Json.Serialization;

namespace AdobeReporteMiembros;

public sealed class AdobeUmapiClient(HttpClient http, AdobeOptions options, AdobeRetryPolicy retry)
{
    private const string BaseUrl = "https://usermanagement.adobe.io/v2/usermanagement";
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<AdobeGroup?> GetProductProfileAsync(string groupName, CancellationToken ct = default)
    {
        var page = 0;
        while (true)
        {
            var url = $"{BaseUrl}/groups/{options.OrganizationId}/{page}";
            var result = await GetJsonAsync<GroupsResponse>(url, ct);
            if (!result.Ok || result.Data is null)
                throw new InvalidOperationException(result.Error ?? result.Raw);

            var found = result.Data.Groups.FirstOrDefault(g =>
                string.Equals(g.GroupName, groupName, StringComparison.OrdinalIgnoreCase)
                && string.Equals(g.Type, "PRODUCT_PROFILE", StringComparison.OrdinalIgnoreCase));

            if (found is not null)
                return found;

            if (result.Data.LastPage)
                return null;

            page++;
            if (retry.PageDelay > TimeSpan.Zero)
                await Task.Delay(retry.PageDelay, ct);
        }
    }

    public async Task<IReadOnlyList<AdobeMember>> ListAllGroupMembersAsync(
        string groupName,
        bool directOnly,
        string? domainFilter = null,
        IProgress<(int Page, int RawCount, int FilteredCount)>? progress = null,
        CancellationToken ct = default)
    {
        var all = new List<AdobeMember>();
        var page = 0;
        var directOnlyValue = directOnly ? "true" : "false";

        while (true)
        {
            var encoded = Uri.EscapeDataString(groupName.Trim());
            var url =
                $"{BaseUrl}/users/{options.OrganizationId}/{page}/{encoded}?directOnly={directOnlyValue}&excludeGroups=true";

            AppLog.Info($"Consultando página {page} ({(directOnly ? "solo directos" : "directos + indirectos")})...");
            var result = await GetJsonAsync<GroupMembersResponse>(url, ct);
            if (!result.Ok || result.Data is null)
                throw new InvalidOperationException(result.Error ?? result.Raw);

            var mapped = result.Data.Users;
            var filtered = string.IsNullOrWhiteSpace(domainFilter)
                ? mapped
                : mapped.Where(u => MatchesDomain(u, domainFilter)).ToList();

            all.AddRange(filtered);
            progress?.Report((page, mapped.Count, filtered.Count));

            if (result.Data.LastPage)
                break;

            page++;
            if (retry.PageDelay > TimeSpan.Zero)
                await Task.Delay(retry.PageDelay, ct);
        }

        return all;
    }

    private static bool MatchesDomain(AdobeMember user, string domain)
    {
        var d = domain.Trim().ToLowerInvariant().TrimStart('@');
        if (string.IsNullOrEmpty(d))
            return true;

        var userDomain = (user.Domain ?? "").Trim().ToLowerInvariant();
        if (userDomain == d)
            return true;

        var email = (user.Email ?? "").Trim().ToLowerInvariant();
        return email.EndsWith($"@{d}", StringComparison.Ordinal);
    }

    private async Task<ApiResult<T>> GetJsonAsync<T>(string url, CancellationToken ct)
    {
        for (var attempt = 1; attempt <= retry.MaxAttempts; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {options.AccessToken}");
            request.Headers.TryAddWithoutValidation("x-api-key", options.ClientId);
            request.Headers.TryAddWithoutValidation("Accept", "application/json");

            using var attemptCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            attemptCts.CancelAfter(retry.RequestTimeout);

            HttpResponseMessage? response = null;
            string raw;
            int status;

            try
            {
                response = await http.SendAsync(
                    request,
                    HttpCompletionOption.ResponseHeadersRead,
                    attemptCts.Token);
                raw = await response.Content.ReadAsStringAsync(ct);
                status = (int)response.StatusCode;
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                status = 504;
                raw = "Timeout esperando respuesta de Adobe.";
            }

            var looksHtml = raw.TrimStart().StartsWith('<')
                || raw.Contains("<html", StringComparison.OrdinalIgnoreCase);

            if (retry.ShouldRetry(status, looksHtml) && attempt < retry.MaxAttempts)
            {
                TimeSpan? retryAfter = null;
                if (response?.Headers.RetryAfter?.Delta is { } delta)
                    retryAfter = delta;

                var wait = retry.ComputeDelay(attempt, status, retryAfter);
                retry.LogRetry(attempt, status, wait, url);
                response?.Dispose();
                await Task.Delay(wait, ct);
                continue;
            }

            if (looksHtml)
            {
                response?.Dispose();
                var snippet = raw.Length > 200 ? raw[..200] : raw;
                return new ApiResult<T>
                {
                    Ok = false,
                    StatusCode = status,
                    Raw = raw,
                    Error = $"Adobe devolvió HTML (HTTP {status}): {snippet}",
                };
            }

            T? data = default;
            try
            {
                data = JsonSerializer.Deserialize<T>(raw, JsonOptions);
            }
            catch (JsonException ex)
            {
                response?.Dispose();
                return new ApiResult<T>
                {
                    Ok = false,
                    StatusCode = status,
                    Raw = raw,
                    Error = $"JSON inválido (HTTP {status}): {ex.Message}",
                };
            }

            var ok = response?.IsSuccessStatusCode == true;
            response?.Dispose();
            return new ApiResult<T>
            {
                Ok = ok,
                StatusCode = status,
                Data = data,
                Raw = raw,
                Error = ok ? null : raw,
            };
        }

        return new ApiResult<T>
        {
            Ok = false,
            StatusCode = 504,
            Error = $"Adobe no respondió tras {retry.MaxAttempts} reintentos (504/429/timeout).",
        };
    }
}
