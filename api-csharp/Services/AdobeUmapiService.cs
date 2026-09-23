using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using AprovLicencias.Api.Configuration;

namespace AprovLicencias.Api.Services;

public sealed record PortalLicenseProfile(
    string Id,
    string Label,
    string GroupName,
    string? QuotaGroupName = null,
    string? MembersGroupName = null
);

public sealed record PortalQuotaConfig(
    string GroupName,
    string? QuotaGroupName = null,
    string? Label = null
);

public sealed class AdobeUserDto
{
    public string Email { get; set; } = "";
    public string Firstname { get; set; } = "";
    public string Lastname { get; set; } = "";
    public string Status { get; set; } = "";
    public string Type { get; set; } = "";
    public string Domain { get; set; } = "";
    public IReadOnlyList<string> Groups { get; set; } = [];
}

public sealed class ProductProfileDto
{
    public string GroupName { get; set; } = "";
    public string ProductName { get; set; } = "";
    public int? MemberCount { get; set; }
    public string? LicenseQuota { get; set; }
}

public sealed class GroupMemberDto
{
    public string Email { get; set; } = "";
    public string Firstname { get; set; } = "";
    public string Lastname { get; set; } = "";
    public string Status { get; set; } = "";
    public string Type { get; set; } = "";
    public string Domain { get; set; } = "";
    public string Username { get; set; } = "";
}

public sealed class GroupMembersResult
{
    public string GroupName { get; set; } = "";
    public int Page { get; set; }
    public bool LastPage { get; set; }
    public string? Domain { get; set; }
    public int RawCount { get; set; }
    public int Count { get; set; }
    public IReadOnlyList<GroupMemberDto> Users { get; set; } = [];
}

public sealed class EnrichedProfileDto
{
    public string GroupName { get; set; } = "";
    public string ProductName { get; set; } = "";
    public int MemberCount { get; set; }
    public string? LicenseQuota { get; set; }
    public int? Quota { get; set; }
    public bool Unlimited { get; set; }
    public int? Available { get; set; }
    public double? UsedPct { get; set; }
    public string Status { get; set; } = "";
    public string? AdobeGroupName { get; set; }
    public string? Label { get; set; }
    public bool Portal { get; set; }
}

public sealed class QuotaStatsSummary
{
    public int TotalProductProfiles { get; set; }
    public int PortalProfiles { get; set; }
    public int MembersPortal { get; set; }
    public int MembersAll { get; set; }
    public int NearCapacity { get; set; }
    public int AtCapacity { get; set; }
    public int UnlimitedProfiles { get; set; }
}

public sealed class QuotaStatsResult
{
    public QuotaStatsSummary Summary { get; set; } = new();
    public IReadOnlyList<EnrichedProfileDto> PortalProfiles { get; set; } = [];
    public IReadOnlyList<EnrichedProfileDto> OtherProfiles { get; set; } = [];
    public string FetchedAt { get; set; } = "";
}

public sealed class AdobeActionErrorDto
{
    public string Message { get; set; } = "";
    public string ErrorCode { get; set; } = "";
    public string User { get; set; } = "";
}

public sealed class ChangeLicenseResult
{
    public bool Success { get; set; }
    public string Result { get; set; } = "";
    public int Completed { get; set; }
    public int NotCompleted { get; set; }
    public int CompletedInTestMode { get; set; }
    public IReadOnlyList<string> Groups { get; set; } = [];
    public IReadOnlyList<AdobeActionErrorDto> Errors { get; set; } = [];
}

public sealed class ChangeLicenseBatchInfo
{
    public int Size { get; set; }
    public string Result { get; set; } = "";
    public int Completed { get; set; }
    public int NotCompleted { get; set; }
}

public sealed class ChangeLicensesBatchResult
{
    public bool Success { get; set; }
    public string Result { get; set; } = "";
    public int Completed { get; set; }
    public int NotCompleted { get; set; }
    public int CompletedInTestMode { get; set; }
    public int Total { get; set; }
    public string GroupName { get; set; } = "";
    public IReadOnlyList<string> Emails { get; set; } = [];
    public IReadOnlyList<ChangeLicenseBatchInfo> Batches { get; set; } = [];
    public IReadOnlyList<AdobeActionErrorDto> Errors { get; set; } = [];
}

public sealed record ListGroupMembersOptions(
  string? Domain = null,
  bool DirectOnly = false,
  bool ExcludeGroups = true
);

public interface IAdobeUmapiService
{
    bool IsConfigured();
    Task<AdobeUserDto?> GetAdobeUserAsync(string email, CancellationToken ct = default);
    Task<IReadOnlyList<ProductProfileDto>> ListProductProfilesAsync(CancellationToken ct = default);
    Task<GroupMembersResult> ListGroupMembersAsync(
        string groupName,
        int page = 0,
        ListGroupMembersOptions? opts = null,
        CancellationToken ct = default
    );
    Task<QuotaStatsResult> GetQuotaStatsAsync(
        IReadOnlyList<PortalQuotaConfig>? portalConfig = null,
        CancellationToken ct = default
    );
    Task<ChangeLicenseResult> ChangeLicenseAsync(
        string email,
        IEnumerable<string> groupNames,
        string action,
        bool testOnly = false,
        CancellationToken ct = default
    );
    Task<ChangeLicensesBatchResult> ChangeLicensesBatchAsync(
        IEnumerable<string> emails,
        string groupName,
        string action,
        bool testOnly = false,
        CancellationToken ct = default
    );
}

public sealed class AdobeUmapiService : IAdobeUmapiService
{
    private const string UMAPI_BASE = "https://usermanagement.adobe.io/v2/usermanagement";
    private const string IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private static readonly Regex UnlimitedQuotaRegex = new(
        @"^(unlimited|null|n\/a|-)$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    public static readonly IReadOnlyList<PortalLicenseProfile> PerfilesLicencia =
    [
        new PortalLicenseProfile(
            Id: "profesor",
            Label: "Perfil profesor",
            GroupName: "Colaboradores y Profesores Tecmilenio",
            MembersGroupName: "Colaboradores y Profesores Tecmilenio"
        ),
        new PortalLicenseProfile(
            Id: "alumno",
            Label: "Perfil alumno",
            GroupName: "Alumnos Tecmilenio",
            QuotaGroupName: "Estudiantes Tecmilenio",
            MembersGroupName: "Estudiantes Tecmilenio"
        ),
    ];

    public static readonly IReadOnlySet<string> PerfilesPermitidos = new HashSet<string>(
        PerfilesLicencia.Select(p => p.GroupName),
        StringComparer.Ordinal
    );

    private readonly IAppSettingsProvider _settings;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly object _tokenLock = new();
    private string _cachedToken = "";
    private long _tokenExpiresAtMs;

    public AdobeUmapiService(IAppSettingsProvider settings, IHttpClientFactory httpClientFactory)
    {
        _settings = settings;
        _httpClientFactory = httpClientFactory;
    }

  public bool IsConfigured() => _settings.Current.IsAdobeConfigured();

  public async Task<AdobeUserDto?> GetAdobeUserAsync(string email, CancellationToken ct = default)
  {
    var settings = _settings.Current;
    var encoded = Uri.EscapeDataString((email ?? "").Trim().ToLowerInvariant());
    var result = await UmapiFetchAsync(
      $"/organizations/{settings.AdobeOrgId}/users/{encoded}",
      ct: ct
    );

    if (result.LooksHtml)
      throw new ApiException("Adobe devolvió HTML (revisa token / org / email encodeado)", 502);

    if (result.Status == 404 || result.Data?.Result == "error")
      return null;

    if (!result.Ok || result.Data?.User == null)
    {
      var message =
        result.Data?.Message
        ?? Truncate(result.Raw, 300)
        ?? $"Error consultando usuario Adobe ({result.Status})";
      var status = result.Status is >= 400 and < 500 ? result.Status : 502;
      throw new ApiException(message, status);
    }

    var user = result.Data.User;
    return new AdobeUserDto
    {
      Email = user.Email ?? "",
      Firstname = user.Firstname ?? "",
      Lastname = user.Lastname ?? "",
      Status = user.Status ?? "",
      Type = user.Type ?? "",
      Domain = user.Domain ?? "",
      Groups = user.Groups ?? [],
    };
  }

  public async Task<IReadOnlyList<ProductProfileDto>> ListProductProfilesAsync(CancellationToken ct = default)
  {
    var settings = _settings.Current;
    var profiles = new List<ProductProfileDto>();
    var page = 0;

    while (true)
    {
      var result = await UmapiFetchAsync($"/groups/{settings.AdobeOrgId}/{page}", ct: ct);
      if (!result.Ok || result.Data == null)
      {
        var message = Truncate(result.Raw, 300) ?? $"Error listando grupos ({result.Status})";
        throw new ApiException(message, 502);
      }

      foreach (var g in result.Data.Groups ?? [])
      {
        if (string.Equals(g.Type, "PRODUCT_PROFILE", StringComparison.OrdinalIgnoreCase))
        {
          profiles.Add(new ProductProfileDto
          {
            GroupName = g.GroupName ?? "",
            ProductName = g.ProductName ?? "",
            MemberCount = g.MemberCount,
            LicenseQuota = g.LicenseQuota != null ? g.LicenseQuota.ToString() : null,
          });
        }
      }

      if (result.Data.LastPage) break;
      page += 1;
      if (page > 50) break;
    }

    profiles.Sort((a, b) => string.Compare(a.GroupName, b.GroupName, StringComparison.Ordinal));
    return profiles;
  }

  public async Task<GroupMembersResult> ListGroupMembersAsync(
    string groupName,
    int page = 0,
    ListGroupMembersOptions? opts = null,
    CancellationToken ct = default
  )
  {
    var settings = _settings.Current;
    var name = (groupName ?? "").Trim();
    var pageNum = Math.Max(0, page);
    opts ??= new ListGroupMembersOptions();

    if (string.IsNullOrEmpty(name))
      throw new ApiException("groupName requerido", 400);

    var encoded = Uri.EscapeDataString(name);
    var directOnly = opts.DirectOnly;
    var excludeGroups = opts.ExcludeGroups;
    var qs =
      $"?directOnly={(directOnly ? "true" : "false")}&excludeGroups={(excludeGroups ? "true" : "false")}";
    var result = await UmapiFetchAsync(
      $"/users/{settings.AdobeOrgId}/{pageNum}/{encoded}{qs}",
      ct: ct
    );

    if (result.LooksHtml)
      throw new ApiException("Adobe devolvió HTML (revisa token / org / groupName encodeado)", 502);

    if (!result.Ok || result.Data == null)
    {
      var message =
        result.Data?.Message
        ?? Truncate(result.Raw, 300)
        ?? $"Error listando miembros ({result.Status})";
      var status = result.Status is >= 400 and < 500 ? result.Status : 502;
      throw new ApiException(message, status);
    }

    var mapped = (result.Data.Users ?? []).Select(u => new GroupMemberDto
    {
      Email = u.Email ?? "",
      Firstname = u.Firstname ?? "",
      Lastname = u.Lastname ?? "",
      Status = u.Status ?? "",
      Type = u.Type ?? "",
      Domain = u.Domain ?? "",
      Username = u.Username ?? "",
    }).ToList();

    var domain = string.IsNullOrWhiteSpace(opts.Domain)
      ? ""
      : opts.Domain.Trim().ToLowerInvariant().TrimStart('@');

    var users = string.IsNullOrEmpty(domain)
      ? mapped
      : mapped.Where(u => MatchesDomain(u, domain)).ToList();

    return new GroupMembersResult
    {
      GroupName = name,
      Page = pageNum,
      LastPage = result.Data.LastPage,
      Domain = string.IsNullOrEmpty(domain) ? null : domain,
      RawCount = mapped.Count,
      Count = users.Count,
      Users = users,
    };
  }

  public async Task<QuotaStatsResult> GetQuotaStatsAsync(
    IReadOnlyList<PortalQuotaConfig>? portalConfig = null,
    CancellationToken ct = default
  )
  {
    portalConfig ??= PerfilesLicencia
      .Select(p => new PortalQuotaConfig(
        p.GroupName,
        p.QuotaGroupName ?? p.GroupName,
        p.Label
      ))
      .ToList();

    var all = await ListProductProfilesAsync(ct);
    var enriched = all.Select(EnrichProfileQuota).ToList();
    var byName = enriched.ToDictionary(p => p.GroupName, StringComparer.Ordinal);

    var portalProfiles = new List<EnrichedProfileDto>();
    var hideFromOthers = new HashSet<string>(StringComparer.Ordinal);

    foreach (var cfg in portalConfig)
    {
      var displayName = cfg.GroupName;
      var sourceName = cfg.QuotaGroupName ?? cfg.GroupName;
      hideFromOthers.Add(sourceName);
      hideFromOthers.Add(displayName);

      if (byName.TryGetValue(sourceName, out var found) || byName.TryGetValue(displayName, out found))
      {
        portalProfiles.Add(new EnrichedProfileDto
        {
          GroupName = displayName,
          AdobeGroupName = found.GroupName,
          Label = cfg.Label ?? displayName,
          ProductName = found.ProductName,
          MemberCount = found.MemberCount,
          LicenseQuota = found.LicenseQuota,
          Quota = found.Quota,
          Unlimited = found.Unlimited,
          Available = found.Available,
          UsedPct = found.UsedPct,
          Status = found.Status,
          Portal = true,
        });
      }
      else
      {
        portalProfiles.Add(new EnrichedProfileDto
        {
          GroupName = displayName,
          AdobeGroupName = sourceName,
          Label = cfg.Label ?? displayName,
          ProductName = "",
          MemberCount = 0,
          LicenseQuota = null,
          Quota = null,
          Unlimited = false,
          Available = null,
          UsedPct = null,
          Status = "no_encontrado",
          Portal = true,
        });
      }
    }

    var otherProfiles = enriched
      .Where(p => !hideFromOthers.Contains(p.GroupName))
      .Select(p =>
      {
        if (p.GroupName == "Estudiantes Tecmilenio")
        {
          return new EnrichedProfileDto
          {
            GroupName = "Alumnos Tecmilenio",
            AdobeGroupName = "Estudiantes Tecmilenio",
            ProductName = p.ProductName,
            MemberCount = p.MemberCount,
            LicenseQuota = p.LicenseQuota,
            Quota = p.Quota,
            Unlimited = p.Unlimited,
            Available = p.Available,
            UsedPct = p.UsedPct,
            Status = p.Status,
            Portal = false,
          };
        }

        return new EnrichedProfileDto
        {
          GroupName = p.GroupName,
          AdobeGroupName = p.GroupName,
          ProductName = p.ProductName,
          MemberCount = p.MemberCount,
          LicenseQuota = p.LicenseQuota,
          Quota = p.Quota,
          Unlimited = p.Unlimited,
          Available = p.Available,
          UsedPct = p.UsedPct,
          Status = p.Status,
          Portal = false,
        };
      })
      .ToList();

    var withQuota = enriched.Where(p => p.Quota != null).ToList();
    var summary = new QuotaStatsSummary
    {
      TotalProductProfiles = enriched.Count,
      PortalProfiles = portalProfiles.Count,
      MembersPortal = portalProfiles.Sum(p => p.MemberCount),
      MembersAll = enriched.Sum(p => p.MemberCount),
      NearCapacity = withQuota.Count(p => (p.UsedPct ?? 0) >= 90),
      AtCapacity = withQuota.Count(p => (p.UsedPct ?? 0) >= 100),
      UnlimitedProfiles = enriched.Count(p => p.Unlimited),
    };

    return new QuotaStatsResult
    {
      Summary = summary,
      PortalProfiles = portalProfiles,
      OtherProfiles = otherProfiles,
      FetchedAt = DateTime.UtcNow.ToString("o"),
    };
  }

  public async Task<ChangeLicenseResult> ChangeLicenseAsync(
    string email,
    IEnumerable<string> groupNames,
    string action,
    bool testOnly = false,
    CancellationToken ct = default
  )
  {
    var settings = _settings.Current;
    var user = (email ?? "").Trim().ToLowerInvariant();
    var groups = groupNames
      .Select(g => (g ?? "").Trim())
      .Where(g => !string.IsNullOrEmpty(g))
      .ToList();

    if (!user.Contains('@') || groups.Count == 0)
      throw new ApiException("email y al menos un grupo son requeridos", 400);

    if (action is not ("add" or "remove"))
      throw new ApiException("acción inválida", 400);

    var completed = 0;
    var notCompleted = 0;
    var completedInTestMode = 0;
    var errors = new List<AdobeActionErrorDto>();
    var lastResult = "success";

    for (var i = 0; i < groups.Count; i += 10)
    {
      var chunk = groups.Skip(i).Take(10).ToList();
      var payload = new[]
      {
        new UmapiActionCommand
        {
          User = user,
          Do =
          [
            new UmapiActionDo
            {
              Add = action == "add" ? new UmapiActionGroup { Group = chunk } : null,
              Remove = action == "remove" ? new UmapiActionGroup { Group = chunk } : null,
            },
          ],
        },
      };

      var qs = testOnly ? "?testOnly=true" : "";
      var result = await UmapiFetchAsync(
        $"/action/{settings.AdobeOrgId}{qs}",
        HttpMethod.Post,
        payload,
        ct
      );

      if (!result.Ok || result.Data == null)
      {
        var message = Truncate(result.Raw, 400) ?? $"Error UMAPI action ({result.Status})";
        throw new ApiException(message, 502);
      }

      var actionResult = result.Data;
      completed += actionResult.Completed ?? 0;
      notCompleted += actionResult.NotCompleted ?? 0;
      completedInTestMode += actionResult.CompletedInTestMode ?? 0;
      if (!string.Equals(actionResult.Result, "success", StringComparison.Ordinal))
        lastResult = actionResult.Result ?? lastResult;

      if (actionResult.Errors != null)
      {
        foreach (var e in actionResult.Errors)
        {
          errors.Add(new AdobeActionErrorDto
          {
            Message = e.Message ?? "",
            ErrorCode = e.ErrorCode ?? "",
            User = e.User ?? user,
          });
        }
      }
    }

    return new ChangeLicenseResult
    {
      Success = lastResult == "success" && notCompleted == 0,
      Result = lastResult,
      Completed = completed,
      NotCompleted = notCompleted,
      CompletedInTestMode = completedInTestMode,
      Groups = groups,
      Errors = errors,
    };
  }

  public async Task<ChangeLicensesBatchResult> ChangeLicensesBatchAsync(
    IEnumerable<string> emails,
    string groupName,
    string action,
    bool testOnly = false,
    CancellationToken ct = default
  )
  {
    var settings = _settings.Current;
    var group = (groupName ?? "").Trim();
    var unique = emails
      .Select(e => (e ?? "").Trim().ToLowerInvariant())
      .Where(e => e.Contains('@'))
      .Distinct()
      .ToList();

    if (string.IsNullOrEmpty(group) || unique.Count == 0)
      throw new ApiException("emails[] y groupName son requeridos", 400);

    if (action is not ("add" or "remove"))
      throw new ApiException("acción inválida", 400);

    const int batchSize = 10;
    var completed = 0;
    var notCompleted = 0;
    var completedInTestMode = 0;
    var errors = new List<AdobeActionErrorDto>();
    var batches = new List<ChangeLicenseBatchInfo>();
    var lastResult = "success";

    for (var i = 0; i < unique.Count; i += batchSize)
    {
      var chunk = unique.Skip(i).Take(batchSize).ToList();
      var payload = chunk.Select(u => new UmapiActionCommand
      {
        User = u,
        Do =
        [
          new UmapiActionDo
          {
            Add = action == "add" ? new UmapiActionGroup { Group = [group] } : null,
            Remove = action == "remove" ? new UmapiActionGroup { Group = [group] } : null,
          },
        ],
      }).ToList();

      var qs = testOnly ? "?testOnly=true" : "";
      var result = await UmapiFetchAsync(
        $"/action/{settings.AdobeOrgId}{qs}",
        HttpMethod.Post,
        payload,
        ct
      );

      if (!result.Ok || result.Data == null)
      {
        var message = Truncate(result.Raw, 400) ?? $"Error UMAPI action ({result.Status})";
        throw new ApiException(message, 502);
      }

      var actionResult = result.Data;
      completed += actionResult.Completed ?? 0;
      notCompleted += actionResult.NotCompleted ?? 0;
      completedInTestMode += actionResult.CompletedInTestMode ?? 0;
      if (!string.Equals(actionResult.Result, "success", StringComparison.Ordinal))
        lastResult = actionResult.Result ?? lastResult;

      if (actionResult.Errors != null)
      {
        foreach (var e in actionResult.Errors)
        {
          errors.Add(new AdobeActionErrorDto
          {
            Message = e.Message ?? "",
            ErrorCode = e.ErrorCode ?? "",
            User = e.User ?? "",
          });
        }
      }

      batches.Add(new ChangeLicenseBatchInfo
      {
        Size = chunk.Count,
        Result = actionResult.Result ?? "",
        Completed = actionResult.Completed ?? 0,
        NotCompleted = actionResult.NotCompleted ?? 0,
      });
    }

    return new ChangeLicensesBatchResult
    {
      Success = lastResult == "success" && notCompleted == 0,
      Result = lastResult,
      Completed = completed,
      NotCompleted = notCompleted,
      CompletedInTestMode = completedInTestMode,
      Total = unique.Count,
      GroupName = group,
      Emails = unique,
      Batches = batches,
      Errors = errors,
    };
  }

  private async Task<string> GetAccessTokenAsync(CancellationToken ct)
  {
    if (!_settings.Current.IsAdobeConfigured())
      throw new ApiException(
        "Adobe UMAPI no configurado (AdobeOrgId, AdobeClientId, AdobeClientSecret)",
        503
      );

    var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    lock (_tokenLock)
    {
      if (!string.IsNullOrEmpty(_cachedToken) && _tokenExpiresAtMs > now + 60_000)
        return _cachedToken;
    }

    var settings = _settings.Current;
    var client = _httpClientFactory.CreateClient();
    var body = new FormUrlEncodedContent(new Dictionary<string, string>
    {
      ["grant_type"] = "client_credentials",
      ["client_id"] = settings.AdobeClientId!,
      ["client_secret"] = settings.AdobeClientSecret!,
      ["scope"] = settings.AdobeScopes,
    });

    using var request = new HttpRequestMessage(HttpMethod.Post, IMS_TOKEN_URL) { Content = body };
    using var response = await client.SendAsync(request, ct);
    var raw = await response.Content.ReadAsStringAsync(ct);

    if (!response.IsSuccessStatusCode)
      throw new ApiException($"IMS token error {(int)response.StatusCode}: {Truncate(raw, 300)}", 502);

    var data = JsonSerializer.Deserialize<ImsTokenResponse>(raw, JsonOptions);
    if (string.IsNullOrEmpty(data?.AccessToken))
      throw new ApiException("IMS no devolvió access_token", 502);

    var expiresIn = data.ExpiresIn ?? 3600;
    lock (_tokenLock)
    {
      _cachedToken = data.AccessToken;
      _tokenExpiresAtMs = now + expiresIn * 1000L;
    }

    return data.AccessToken;
  }

  private async Task<UmapiFetchResponse> UmapiFetchAsync(
    string path,
    HttpMethod? method = null,
    object? body = null,
    CancellationToken ct = default
  )
  {
    var settings = _settings.Current;
    var token = await GetAccessTokenAsync(ct);
    var url = path.StartsWith("http", StringComparison.OrdinalIgnoreCase)
      ? path
      : $"{UMAPI_BASE}{path}";
    method ??= HttpMethod.Get;

    for (var attempt = 1; attempt <= 4; attempt++)
    {
      var client = _httpClientFactory.CreateClient();
      using var request = new HttpRequestMessage(method, url);
      request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
      request.Headers.Add("x-api-key", settings.AdobeClientId);
      request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

      if (body != null)
      {
        var json = JsonSerializer.Serialize(body, JsonOptions);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");
      }

      using var response = await client.SendAsync(request, ct);
      var raw = await response.Content.ReadAsStringAsync(ct);

      if ((int)response.StatusCode == 429)
      {
        var retryAfter = response.Headers.RetryAfter?.Delta?.TotalSeconds
          ?? (response.Headers.TryGetValues("retry-after", out var values)
            && int.TryParse(values.FirstOrDefault(), out var seconds)
              ? seconds
              : 20 * attempt);
        await Task.Delay(TimeSpan.FromSeconds(retryAfter), ct);
        continue;
      }

      var trimmed = raw.TrimStart();
      var looksHtml = trimmed.StartsWith('<') || raw.Contains("<html", StringComparison.OrdinalIgnoreCase);

      UmapiResponseData? data = null;
      if (!looksHtml && !string.IsNullOrEmpty(raw))
      {
        try
        {
          data = JsonSerializer.Deserialize<UmapiResponseData>(raw, JsonOptions);
        }
        catch (JsonException)
        {
          // ignore parse errors, same as Node
        }
      }

      return new UmapiFetchResponse(
        response.IsSuccessStatusCode,
        (int)response.StatusCode,
        data,
        raw,
        looksHtml
      );
    }

    return new UmapiFetchResponse(false, 429, null, "Rate limit persistente", false);
  }

  private static EnrichedProfileDto EnrichProfileQuota(ProductProfileDto p)
  {
    var quotaRaw = p.LicenseQuota != null && !string.IsNullOrWhiteSpace(p.LicenseQuota)
      ? p.LicenseQuota.Trim()
      : null;
    var unlimited = quotaRaw == null || UnlimitedQuotaRegex.IsMatch(quotaRaw);
    int? quota = null;
    if (!unlimited && double.TryParse(quotaRaw, out var quotaNum) && !double.IsNaN(quotaNum) && !double.IsInfinity(quotaNum))
      quota = (int)quotaNum;

    var members = p.MemberCount is { } mc && mc >= 0 ? mc : 0;
    int? available = quota == null ? null : Math.Max(0, quota.Value - members);
    double? usedPct = quota is > 0 ? Math.Round(members / (double)quota.Value * 1000) / 10 : null;

    var status = "sin_cuota";
    if (quota != null)
    {
      if (usedPct >= 100) status = "lleno";
      else if (usedPct >= 90) status = "critico";
      else if (usedPct >= 75) status = "alto";
      else status = "ok";
    }
    else if (unlimited)
    {
      status = "ilimitado";
    }

    return new EnrichedProfileDto
    {
      GroupName = p.GroupName,
      ProductName = p.ProductName,
      MemberCount = members,
      LicenseQuota = quotaRaw,
      Quota = quota,
      Unlimited = unlimited && quota == null,
      Available = available,
      UsedPct = usedPct,
      Status = status,
    };
  }

  private static bool MatchesDomain(GroupMemberDto user, string domain)
  {
    if (string.IsNullOrWhiteSpace(domain)) return true;
    var d = domain.Trim().ToLowerInvariant().TrimStart('@');
    if (string.IsNullOrEmpty(d)) return true;

    var userDomain = (user.Domain ?? "").Trim().ToLowerInvariant();
    if (userDomain == d) return true;

    var email = (user.Email ?? "").Trim().ToLowerInvariant();
    return email.EndsWith($"@{d}", StringComparison.Ordinal);
  }

  private static string? Truncate(string? value, int max) =>
    string.IsNullOrEmpty(value) ? value : value.Length <= max ? value : value[..max];

  private sealed record UmapiFetchResponse(
    bool Ok,
    int Status,
    UmapiResponseData? Data,
    string Raw,
    bool LooksHtml
  );

    private sealed class ImsTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int? ExpiresIn { get; set; }
    }

  private sealed class UmapiResponseData
  {
    public string? Result { get; set; }
    public string? Message { get; set; }
    public UmapiUser? User { get; set; }
    public List<UmapiGroup>? Groups { get; set; }
    public List<UmapiUser>? Users { get; set; }
    public bool LastPage { get; set; }
    public int? Completed { get; set; }
    public int? NotCompleted { get; set; }
    public int? CompletedInTestMode { get; set; }
    public List<UmapiActionError>? Errors { get; set; }
  }

  private sealed class UmapiUser
  {
    public string? Email { get; set; }
    public string? Firstname { get; set; }
    public string? Lastname { get; set; }
    public string? Status { get; set; }
    public string? Type { get; set; }
    public string? Domain { get; set; }
    public string? Username { get; set; }
    public List<string>? Groups { get; set; }
  }

  private sealed class UmapiGroup
  {
    public string? GroupName { get; set; }
    public string? ProductName { get; set; }
    public string? Type { get; set; }
    public int? MemberCount { get; set; }
    public object? LicenseQuota { get; set; }
  }

  private sealed class UmapiActionCommand
  {
    public string User { get; set; } = "";
    public List<UmapiActionDo> Do { get; set; } = [];
  }

  private sealed class UmapiActionDo
  {
    public UmapiActionGroup? Add { get; set; }
    public UmapiActionGroup? Remove { get; set; }
  }

  private sealed class UmapiActionGroup
  {
    public List<string> Group { get; set; } = [];
  }

  private sealed class UmapiActionError
  {
    public string? Message { get; set; }
    public string? ErrorCode { get; set; }
    public string? User { get; set; }
  }
}
