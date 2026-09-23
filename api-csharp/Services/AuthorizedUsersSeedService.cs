using System.Text.Json;
using AprovLicencias.Api.Configuration;

namespace AprovLicencias.Api.Services;

public interface IAuthorizedUsersSeedService
{
    IReadOnlyList<AuthorizedUser> GetSeedUsers();
}

public sealed class AuthorizedUsersSeedService : IAuthorizedUsersSeedService
{
    private readonly Lazy<IReadOnlyList<AuthorizedUser>> _users;

    public AuthorizedUsersSeedService()
    {
        _users = new Lazy<IReadOnlyList<AuthorizedUser>>(Load);
    }

    public IReadOnlyList<AuthorizedUser> GetSeedUsers() => _users.Value;

    private static IReadOnlyList<AuthorizedUser> Load()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "authorized-users.import.json");
        if (!File.Exists(path))
            return FallbackUsers();

        var json = File.ReadAllText(path);
        var rows = JsonSerializer.Deserialize<List<SeedRow>>(json) ?? [];
        return rows
            .Select(r => new AuthorizedUser
            {
                Email = (r.Email ?? r.RowKey ?? "").Trim().ToLowerInvariant(),
                Nombre = (r.Nombre ?? "").Trim(),
                Nomina = string.IsNullOrWhiteSpace(r.Nomina) ? null : r.Nomina.Trim().ToUpperInvariant(),
                Rol = (r.Rol ?? "ejecutor").Trim().ToLowerInvariant(),
            })
            .Where(u => u.Email.Contains('@'))
            .ToList();
    }

    private static IReadOnlyList<AuthorizedUser> FallbackUsers() =>
    [
        new() { Nombre = "Cesar Osmar Urdiales", Email = "caso1@tecmilenio.mx", Rol = "admin" },
    ];

    private sealed class SeedRow
    {
        public string? RowKey { get; set; }
        public string? Email { get; set; }
        public string? Nombre { get; set; }
        public string? Nomina { get; set; }
        public string? Rol { get; set; }
    }
}
