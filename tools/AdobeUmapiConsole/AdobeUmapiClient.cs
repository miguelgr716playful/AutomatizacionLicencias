using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AdobeUmapiConsole;

public sealed class AdobeUmapiClient(HttpClient http, AdobeOptions options)
{
    private const string BaseUrl = "https://usermanagement.adobe.io/v2/usermanagement";
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<ApiResult<UserResponse>> GetUserAsync(string email, CancellationToken ct = default)
    {
        var encoded = Uri.EscapeDataString(email.Trim());
        var url = $"{BaseUrl}/organizations/{options.OrganizationId}/users/{encoded}";
        return await GetJsonAsync<UserResponse>(url, ct);
    }

    public async Task<ApiResult<List<AdobeGroup>>> GetAllGroupsAsync(CancellationToken ct = default)
    {
        var all = new List<AdobeGroup>();
        var page = 0;
        while (true)
        {
            var url = $"{BaseUrl}/groups/{options.OrganizationId}/{page}";
            var result = await GetJsonAsync<GroupsResponse>(url, ct);
            if (!result.Ok || result.Data is null)
            {
                return new ApiResult<List<AdobeGroup>>
                {
                    Ok = false,
                    StatusCode = result.StatusCode,
                    Raw = result.Raw,
                    Error = result.Error,
                };
            }

            all.AddRange(result.Data.Groups);
            if (result.Data.LastPage)
                break;
            page++;
        }

        return new ApiResult<List<AdobeGroup>>
        {
            Ok = true,
            StatusCode = 200,
            Data = all,
            Raw = $"total={all.Count}",
        };
    }

    public Task<ApiResult<ActionResponse>> AddToGroupsAsync(
        string email,
        IEnumerable<string> groups,
        bool testOnly = false,
        CancellationToken ct = default)
        => PostActionAsync(email, "add", groups, create: null, testOnly, ct);

    public Task<ApiResult<ActionResponse>> RemoveFromGroupsAsync(
        string email,
        IEnumerable<string> groups,
        bool testOnly = false,
        CancellationToken ct = default)
        => PostActionAsync(email, "remove", groups, create: null, testOnly, ct);

    public Task<ApiResult<ActionResponse>> CreateFederatedUserAsync(
        string email,
        string firstName,
        string lastName,
        string country,
        IEnumerable<string>? groups = null,
        bool testOnly = false,
        CancellationToken ct = default)
        => PostActionAsync(email, "add", groups ?? [], new CreateFederatedId
        {
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Country = country,
        }, testOnly, ct);

    private async Task<ApiResult<ActionResponse>> PostActionAsync(
        string email,
        string addOrRemove,
        IEnumerable<string> groups,
        CreateFederatedId? create,
        bool testOnly,
        CancellationToken ct)
    {
        var steps = new List<object>();
        if (create is not null)
        {
            steps.Add(new
            {
                createFederatedID = new
                {
                    email = create.Email,
                    country = create.Country,
                    firstname = create.FirstName,
                    lastname = create.LastName,
                },
            });
        }

        var groupList = groups.Where(g => !string.IsNullOrWhiteSpace(g)).Select(g => g.Trim()).ToList();
        if (groupList.Count > 0)
        {
            var payload = new Dictionary<string, object> { ["group"] = groupList };
            steps.Add(addOrRemove == "remove"
                ? (object)new { remove = payload }
                : new { add = payload });
        }

        var body = new[]
        {
            new { user = email.Trim(), @do = steps },
        };

        var qs = testOnly ? "?testOnly=true" : "";
        var url = $"{BaseUrl}/action/{options.OrganizationId}{qs}";
        return await PostJsonAsync<ActionResponse>(url, body, ct);
    }

    private async Task<ApiResult<T>> GetJsonAsync<T>(string url, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        AddHeaders(request);
        return await SendAsync<T>(request, ct);
    }

    private async Task<ApiResult<T>> PostJsonAsync<T>(string url, object body, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        AddHeaders(request);
        request.Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json");
        return await SendAsync<T>(request, ct);
    }

    private void AddHeaders(HttpRequestMessage request)
    {
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {options.AccessToken}");
        request.Headers.TryAddWithoutValidation("x-api-key", options.ClientId);
        request.Headers.TryAddWithoutValidation("Accept", "application/json");
    }

    private async Task<ApiResult<T>> SendAsync<T>(HttpRequestMessage template, CancellationToken ct)
    {
        byte[]? body = null;
        if (template.Content is not null)
            body = await template.Content.ReadAsByteArrayAsync(ct);

        try
        {
            for (var attempt = 1; attempt <= 4; attempt++)
            {
                using var request = CloneRequest(template, body);
                using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
                var raw = await response.Content.ReadAsStringAsync(ct);
                var looksHtml = raw.TrimStart().StartsWith("<", StringComparison.Ordinal)
                                || raw.Contains("<html", StringComparison.OrdinalIgnoreCase);

                if ((int)response.StatusCode == 429)
                {
                    var wait = response.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(30 * attempt);
                    Console.WriteLine($"Rate limit 429. Reintento en {wait.TotalSeconds:0}s...");
                    await Task.Delay(wait, ct);
                    continue;
                }

                if (looksHtml)
                {
                    return new ApiResult<T>
                    {
                        Ok = false,
                        StatusCode = (int)response.StatusCode,
                        Raw = raw,
                        Error = "Adobe devolvió HTML (token, headers o email sin encodear).",
                    };
                }

                T? data = default;
                try
                {
                    data = JsonSerializer.Deserialize<T>(raw, JsonOptions);
                }
                catch (JsonException ex)
                {
                    return new ApiResult<T>
                    {
                        Ok = false,
                        StatusCode = (int)response.StatusCode,
                        Raw = raw,
                        Error = $"JSON inválido: {ex.Message}",
                    };
                }

                return new ApiResult<T>
                {
                    Ok = response.IsSuccessStatusCode,
                    StatusCode = (int)response.StatusCode,
                    Data = data,
                    Raw = raw,
                    Error = response.IsSuccessStatusCode ? null : raw,
                };
            }
        }
        finally
        {
            template.Dispose();
        }

        return new ApiResult<T> { Ok = false, StatusCode = 429, Error = "Rate limit persistente." };
    }

    private static HttpRequestMessage CloneRequest(HttpRequestMessage original, byte[]? body)
    {
        var clone = new HttpRequestMessage(original.Method, original.RequestUri);
        foreach (var header in original.Headers)
            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);

        if (body is not null)
        {
            clone.Content = new ByteArrayContent(body);
            if (original.Content is not null)
            {
                foreach (var header in original.Content.Headers)
                    clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        return clone;
    }

    private sealed class CreateFederatedId
    {
        public string Email { get; init; } = "";
        public string FirstName { get; init; } = "";
        public string LastName { get; init; } = "";
        public string Country { get; init; } = "MX";
    }
}
