using Microsoft.Extensions.Configuration;
using AdobeUmapiConsole;

var config = new ConfigurationBuilder()
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.example.json", optional: true)
    .AddJsonFile("appsettings.json", optional: true)
    .Build();

var options = config.GetSection("Adobe").Get<AdobeOptions>() ?? new AdobeOptions();
if (string.IsNullOrWhiteSpace(options.OrganizationId) || options.OrganizationId.Contains("TU_ORG", StringComparison.Ordinal))
{
    Console.WriteLine("Copia appsettings.example.json a appsettings.json y llena OrganizationId / ClientId.");
    return 1;
}

using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(2) };
var auth = new AdobeAuthClient(http, options);

try
{
    options.AccessToken = await auth.GetAccessTokenAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"No se pudo obtener token: {ex.Message}");
    return 1;
}

var umapi = new AdobeUmapiClient(http, options);

while (true)
{
    Console.WriteLine();
    Console.WriteLine("=== Adobe UMAPI — licencias ===");
    Console.WriteLine("1. Consultar usuario");
    Console.WriteLine("2. Listar grupos (product profiles / user groups)");
    Console.WriteLine("3. Asignar licencia (add a product profile)");
    Console.WriteLine("4. Desasignar licencia (remove de product profile)");
    Console.WriteLine("5. Crear usuario federado (+ opcional add)");
    Console.WriteLine("0. Salir");
    Console.Write("Opción: ");
    var choice = Console.ReadLine()?.Trim();

    try
    {
        switch (choice)
        {
            case "1":
                await ConsultarUsuarioAsync(umapi);
                break;
            case "2":
                await ListarGruposAsync(umapi);
                break;
            case "3":
                await CambiarLicenciaAsync(umapi, asignar: true);
                break;
            case "4":
                await CambiarLicenciaAsync(umapi, asignar: false);
                break;
            case "5":
                await CrearUsuarioAsync(umapi);
                break;
            case "0":
            case "q":
            case "salir":
                return 0;
            default:
                Console.WriteLine("Opción no válida.");
                break;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
    }
}

static string ReadRequired(string label)
{
    while (true)
    {
        Console.Write($"{label}: ");
        var value = Console.ReadLine()?.Trim();
        if (!string.IsNullOrWhiteSpace(value))
            return value;
        Console.WriteLine("Valor requerido.");
    }
}

static string ReadOptional(string label, string fallback = "")
{
    Console.Write(string.IsNullOrEmpty(fallback) ? $"{label}: " : $"{label} [{fallback}]: ");
    var value = Console.ReadLine()?.Trim();
    return string.IsNullOrWhiteSpace(value) ? fallback : value;
}

static bool ReadYesNo(string label, bool defaultYes = false)
{
    var hint = defaultYes ? "S/n" : "s/N";
    Console.Write($"{label} ({hint}): ");
    var value = Console.ReadLine()?.Trim().ToLowerInvariant();
    if (string.IsNullOrEmpty(value))
        return defaultYes;
    return value is "s" or "si" or "sí" or "y" or "yes";
}

static void PrintUser(AdobeUser user)
{
    Console.WriteLine($"  {user.FirstName} {user.LastName} <{user.Email}>");
    Console.WriteLine($"  status={user.Status}  type={user.Type}  domain={user.Domain}");
    Console.WriteLine($"  groups ({user.Groups.Count}):");
    if (user.Groups.Count == 0)
        Console.WriteLine("    (ninguno)");
    else
        foreach (var g in user.Groups)
            Console.WriteLine($"    - {g}");
}

static void PrintAction(ActionResponse? action)
{
    if (action is null)
    {
        Console.WriteLine("Sin body JSON.");
        return;
    }

    Console.WriteLine($"  result={action.Result}  completed={action.Completed}  notCompleted={action.NotCompleted}");
    foreach (var err in action.Errors)
        Console.WriteLine($"  ERROR [{err.ErrorCode}] {err.Message}  user={err.User}");
}

static async Task ConsultarUsuarioAsync(AdobeUmapiClient umapi)
{
    var email = ReadRequired("Email");
    var result = await umapi.GetUserAsync(email);
    Console.WriteLine($"HTTP {result.StatusCode}");
    if (!result.Ok || result.Data?.User is null)
    {
        Console.WriteLine(result.Error ?? result.Raw);
        return;
    }

    PrintUser(result.Data.User);
}

static async Task ListarGruposAsync(AdobeUmapiClient umapi)
{
    Console.WriteLine("Descargando grupos (paginado)...");
    var result = await umapi.GetAllGroupsAsync();
    if (!result.Ok || result.Data is null)
    {
        Console.WriteLine(result.Error ?? result.Raw);
        return;
    }

    var onlyProfiles = ReadYesNo("¿Solo PRODUCT_PROFILE (licencias)?", defaultYes: true);
    var groups = onlyProfiles
        ? result.Data.Where(g => string.Equals(g.Type, "PRODUCT_PROFILE", StringComparison.OrdinalIgnoreCase)).ToList()
        : result.Data;

    Console.WriteLine($"Total: {groups.Count}");
    foreach (var g in groups.OrderBy(g => g.Type).ThenBy(g => g.GroupName))
    {
        var product = string.IsNullOrWhiteSpace(g.ProductName) ? "" : $" | {g.ProductName}";
        Console.WriteLine($"  [{g.Type}] {g.GroupName}  members={g.MemberCount}{product}");
    }

    Console.WriteLine();
    Console.WriteLine("Copia groupName exacto para asignar/desasignar.");
}

static async Task CambiarLicenciaAsync(AdobeUmapiClient umapi, bool asignar)
{
    var email = ReadRequired("Email");
    var lookup = await umapi.GetUserAsync(email);
    if (!lookup.Ok || lookup.Data?.User is null)
    {
        Console.WriteLine("El usuario no existe o falló la consulta.");
        Console.WriteLine(lookup.Error ?? lookup.Raw);
        Console.WriteLine("Usa la opción 5 para crearlo primero.");
        return;
    }

    Console.WriteLine("Usuario actual:");
    PrintUser(lookup.Data.User);

    var group = ReadRequired("groupName del PRODUCT_PROFILE (exacto)");
    var testOnly = ReadYesNo("¿testOnly (no aplica cambios)?");

    var action = asignar
        ? await umapi.AddToGroupsAsync(email, [group], testOnly)
        : await umapi.RemoveFromGroupsAsync(email, [group], testOnly);

    Console.WriteLine($"HTTP {action.StatusCode}");
    PrintAction(action.Data);
    if (!action.Ok)
        Console.WriteLine(action.Error ?? action.Raw);

    if (action.Data?.Result == "success" && !testOnly)
    {
        var verify = await umapi.GetUserAsync(email);
        if (verify.Data?.User is not null)
        {
            Console.WriteLine("Verificación:");
            PrintUser(verify.Data.User);
        }
    }
}

static async Task CrearUsuarioAsync(AdobeUmapiClient umapi)
{
    var email = ReadRequired("Email");
    var first = ReadRequired("Nombre");
    var last = ReadRequired("Apellidos");
    var country = ReadOptional("País ISO-2", "MX");
    var group = ReadOptional("PRODUCT_PROFILE opcional (vacío = solo crear)");
    var testOnly = ReadYesNo("¿testOnly (no aplica cambios)?");

    var groups = string.IsNullOrWhiteSpace(group) ? Array.Empty<string>() : [group];
    var action = await umapi.CreateFederatedUserAsync(email, first, last, country, groups, testOnly);

    Console.WriteLine($"HTTP {action.StatusCode}");
    PrintAction(action.Data);
    if (!action.Ok)
        Console.WriteLine(action.Error ?? action.Raw);

    if (action.Data?.Result == "success" && !testOnly)
    {
        var verify = await umapi.GetUserAsync(email);
        if (verify.Data?.User is not null)
        {
            Console.WriteLine("Verificación:");
            PrintUser(verify.Data.User);
        }
    }
}
