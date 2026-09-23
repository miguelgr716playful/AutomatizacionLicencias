using System.Text.Json.Serialization;

namespace AdobeReporteMiembros;

public sealed class AdobeOptions
{
    public string OrganizationId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
    public string AccessToken { get; set; } = "";
    public string Scopes { get; set; } = "openid,AdobeID,user_management_sdk";
}

public sealed class ReporteOptions
{
    public string DirectorioSalida { get; set; } = "output";
    public string DominioFiltroEstudiantes { get; set; } = "tecmilenio.mx";
    public bool FiltrarDominioEstudiantes { get; set; } = true;
    public bool DirectOnly { get; set; }
    public int ReintentosMax { get; set; } = 12;
    public int TimeoutSegundos { get; set; } = 600;
    public int EsperaInicialSegundos { get; set; } = 180;
    public int EsperaMaxSegundos { get; set; } = 300;
    public int PausaEntrePaginasSegundos { get; set; } = 3;
}

public sealed class GruposOptions
{
    public string Estudiantes { get; set; } = "Alumnos Tecmilenio";
    public string Profesores { get; set; } = "Colaboradores y Profesores Tecmilenio";
}

public sealed class TokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = "";

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

public sealed class GroupMembersResponse
{
    [JsonPropertyName("result")]
    public string? Result { get; set; }

    [JsonPropertyName("lastPage")]
    public bool LastPage { get; set; }

    [JsonPropertyName("users")]
    public List<AdobeMember> Users { get; set; } = [];
}

public sealed class AdobeMember
{
    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("firstname")]
    public string? FirstName { get; set; }

    [JsonPropertyName("lastname")]
    public string? LastName { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("domain")]
    public string? Domain { get; set; }

    [JsonPropertyName("username")]
    public string? Username { get; set; }
}

public sealed class GroupsResponse
{
    [JsonPropertyName("lastPage")]
    public bool LastPage { get; set; }

    [JsonPropertyName("groups")]
    public List<AdobeGroup> Groups { get; set; } = [];
}

public sealed class AdobeGroup
{
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("groupName")]
    public string? GroupName { get; set; }

    [JsonPropertyName("productName")]
    public string? ProductName { get; set; }

    [JsonPropertyName("memberCount")]
    public int? MemberCount { get; set; }

    [JsonPropertyName("licenseQuota")]
    public string? LicenseQuota { get; set; }
}

public sealed class ApiResult<T>
{
    public bool Ok { get; init; }
    public int StatusCode { get; init; }
    public T? Data { get; init; }
    public string Raw { get; init; } = "";
    public string? Error { get; init; }
}

public sealed record GrupoReporteDef(
    string Id,
    string Label,
    string GroupName,
    string? DomainFilter);

public sealed record ReporteGrupoResult(
    GrupoReporteDef Grupo,
    IReadOnlyList<AdobeMember> Miembros,
    int PaginasLeidas,
    string? QuotaInfo,
    string ArchivoCsv);
