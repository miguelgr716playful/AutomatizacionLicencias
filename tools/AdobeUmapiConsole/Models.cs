using System.Text.Json.Serialization;

namespace AdobeUmapiConsole;

public sealed class AdobeOptions
{
    public string OrganizationId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
    public string AccessToken { get; set; } = "";
    public string Scopes { get; set; } = "openid,AdobeID,user_management_sdk";
}

public sealed class TokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = "";

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

public sealed class UserResponse
{
    [JsonPropertyName("result")]
    public string? Result { get; set; }

    [JsonPropertyName("user")]
    public AdobeUser? User { get; set; }
}

public sealed class AdobeUser
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("groups")]
    public List<string> Groups { get; set; } = [];

    [JsonPropertyName("username")]
    public string? Username { get; set; }

    [JsonPropertyName("domain")]
    public string? Domain { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("firstname")]
    public string? FirstName { get; set; }

    [JsonPropertyName("lastname")]
    public string? LastName { get; set; }

    [JsonPropertyName("country")]
    public string? Country { get; set; }
}

public sealed class GroupsResponse
{
    [JsonPropertyName("result")]
    public string? Result { get; set; }

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
}

public sealed class ActionResponse
{
    [JsonPropertyName("result")]
    public string? Result { get; set; }

    [JsonPropertyName("completed")]
    public int Completed { get; set; }

    [JsonPropertyName("notCompleted")]
    public int NotCompleted { get; set; }

    [JsonPropertyName("completedInTestMode")]
    public int CompletedInTestMode { get; set; }

    [JsonPropertyName("errors")]
    public List<ActionError> Errors { get; set; } = [];
}

public sealed class ActionError
{
    [JsonPropertyName("index")]
    public int Index { get; set; }

    [JsonPropertyName("step")]
    public int Step { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("errorCode")]
    public string? ErrorCode { get; set; }

    [JsonPropertyName("user")]
    public string? User { get; set; }
}

public sealed class ApiResult<T>
{
    public bool Ok { get; init; }
    public int StatusCode { get; init; }
    public T? Data { get; init; }
    public string Raw { get; init; } = "";
    public string? Error { get; init; }
}
