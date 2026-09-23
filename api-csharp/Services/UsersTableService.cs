using Azure;
using Azure.Data.Tables;
using AprovLicencias.Api.Configuration;

namespace AprovLicencias.Api.Services;

public sealed class AuthorizedUser
{
    public string Nombre { get; init; } = "";
    public string Email { get; init; } = "";
    public string? Nomina { get; init; }
    public string Rol { get; init; } = "ejecutor";
}

public sealed class AuthorizedUserEntity : ITableEntity
{
    public string PartitionKey { get; set; } = "users";
    public string RowKey { get; set; } = "";
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }
    public string Email { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string Nomina { get; set; } = "";
    public string Rol { get; set; } = "ejecutor";
}

public interface IUsersTableService
{
    bool IsConfigured();
    string ParseRol(string? value);
    Task<AuthorizedUser?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<IReadOnlyList<AuthorizedUser>> ListAsync(CancellationToken ct = default);
    Task<AuthorizedUser> UpsertAsync(AuthorizedUser user, CancellationToken ct = default);
    Task<bool> DeleteAsync(string email, CancellationToken ct = default);
}

public sealed class UsersTableService : IUsersTableService
{
    public const string Partition = "users";
    private readonly IAppSettingsProvider _settings;

    public UsersTableService(IAppSettingsProvider settings) => _settings = settings;

    public bool IsConfigured() => _settings.Current.IsTableConfigured();

    public string ParseRol(string? value)
    {
        var rol = (value ?? "").Trim().ToLowerInvariant();
        return rol switch
        {
            "ejecutor" => "ejecutor",
            "auditor" => "auditor",
            "admin" or "administrador" => "admin",
            _ => "",
        };
    }

    public async Task<AuthorizedUser?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var key = NormalizeEmail(email);
        if (string.IsNullOrEmpty(key)) return null;
        try
        {
            var entity = await GetClient().GetEntityAsync<AuthorizedUserEntity>(Partition, key, cancellationToken: ct);
            return ToUser(entity.Value);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<AuthorizedUser>> ListAsync(CancellationToken ct = default)
    {
        var users = new List<AuthorizedUser>();
        await foreach (var entity in GetClient().QueryAsync<AuthorizedUserEntity>(
            e => e.PartitionKey == Partition,
            cancellationToken: ct))
        {
            var user = ToUser(entity);
            if (user != null) users.Add(user);
        }
        return users.OrderBy(u => u.Email, StringComparer.Ordinal).ToList();
    }

    public async Task<AuthorizedUser> UpsertAsync(AuthorizedUser user, CancellationToken ct = default)
    {
        var entity = ToEntity(user);
        if (!entity.Email.Contains('@'))
            throw new ApiException("email inválido", 400);
        if (string.IsNullOrEmpty(ParseRol(entity.Rol)))
            throw new ApiException("rol inválido (admin | ejecutor)", 400);

        await GetClient().UpsertEntityAsync(entity, TableUpdateMode.Merge, ct);
        return ToUser(entity)!;
    }

    public async Task<bool> DeleteAsync(string email, CancellationToken ct = default)
    {
        var key = NormalizeEmail(email);
        if (string.IsNullOrEmpty(key)) throw new ApiException("email inválido", 400);
        try
        {
            await GetClient().DeleteEntityAsync(Partition, key, cancellationToken: ct);
            return true;
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return false;
        }
    }

    private TableClient GetClient()
    {
        var env = _settings.Current;
        if (string.IsNullOrEmpty(env.StorageConnectionString))
            throw new InvalidOperationException("Falta StorageConnectionString");
        return new TableClient(env.StorageConnectionString, env.AuthorizedUsersTable);
    }

    private static string NormalizeEmail(string? value) =>
        (value ?? "").Trim().ToLowerInvariant();

    private static string NormalizeNomina(string? value) =>
        (value ?? "").Trim().ToUpperInvariant();

    private AuthorizedUser? ToUser(AuthorizedUserEntity? entity)
    {
        if (entity == null) return null;
        var email = NormalizeEmail(entity.Email ?? entity.RowKey);
        var rol = ParseRol(entity.Rol);
        if (string.IsNullOrEmpty(rol)) rol = "ejecutor";
        return new AuthorizedUser
        {
            Email = email,
            Nombre = (entity.Nombre ?? "").Trim(),
            Nomina = string.IsNullOrEmpty(entity.Nomina) ? null : NormalizeNomina(entity.Nomina),
            Rol = rol,
        };
    }

    private AuthorizedUserEntity ToEntity(AuthorizedUser user)
    {
        var email = NormalizeEmail(user.Email);
        return new AuthorizedUserEntity
        {
            PartitionKey = Partition,
            RowKey = email,
            Email = email,
            Nombre = (user.Nombre ?? "").Trim(),
            Nomina = NormalizeNomina(user.Nomina),
            Rol = ParseRol(user.Rol) is { Length: > 0 } r ? r : "ejecutor",
        };
    }
}

public sealed class ApiException : Exception
{
    public int StatusCode { get; }
    public string[]? Required { get; }

    public ApiException(string message, int statusCode, string[]? required = null) : base(message)
    {
        StatusCode = statusCode;
        Required = required;
    }
}
