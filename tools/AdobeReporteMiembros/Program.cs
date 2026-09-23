using Microsoft.Extensions.Configuration;
using AdobeReporteMiembros;

var config = new ConfigurationBuilder()
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.example.json", optional: true)
    .AddJsonFile("appsettings.json", optional: true)
    .Build();

var argsMap = ParseArgs(args);
if (argsMap.ContainsKey("help") || argsMap.ContainsKey("h") || argsMap.ContainsKey("?"))
{
    PrintHelp();
    return 0;
}

var adobe = config.GetSection("Adobe").Get<AdobeOptions>() ?? new AdobeOptions();
var reporte = config.GetSection("Reporte").Get<ReporteOptions>() ?? new ReporteOptions();
var grupos = config.GetSection("Grupos").Get<GruposOptions>() ?? new GruposOptions();

if (string.IsNullOrWhiteSpace(adobe.OrganizationId) || adobe.OrganizationId.Contains("TU_ORG", StringComparison.Ordinal))
{
    Console.WriteLine("Copia appsettings.example.json a appsettings.json y llena OrganizationId / ClientId / ClientSecret.");
    return 1;
}

if (argsMap.TryGetValue("salida", out var salida) && !string.IsNullOrWhiteSpace(salida))
    reporte.DirectorioSalida = salida.Trim();

var seleccion = argsMap.TryGetValue("grupo", out var grupoArg) ? grupoArg.Trim().ToLowerInvariant() : "";
var ejecutarInteractivo = string.IsNullOrWhiteSpace(seleccion);

var definiciones = BuildGrupos(grupos, reporte);
var aEjecutar = ejecutarInteractivo
    ? ElegirGruposInteractivo(definiciones)
    : ResolverGrupos(seleccion, definiciones);

if (aEjecutar.Count == 0)
{
    PrintHelp();
    return 1;
}

AppLog.Info("Inicio de ejecución AdobeReporteMiembros");

using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(20) };
var auth = new AdobeAuthClient(http, adobe);

try
{
    adobe.AccessToken = await auth.GetAccessTokenAsync();
}
catch (Exception ex)
{
    AppLog.Info($"No se pudo obtener token: {ex.Message}");
    return 1;
}

var umapi = new AdobeUmapiClient(http, adobe, new AdobeRetryPolicy(reporte));
var service = new ReporteService(umapi, reporte);
var resultados = new List<ReporteGrupoResult>();

foreach (var grupo in aEjecutar)
{
    try
    {
        resultados.Add(await service.GenerarAsync(grupo));
    }
    catch (Exception ex)
    {
        AppLog.Info($"ERROR en {grupo.Label}: {ex.Message}");
        return 1;
    }
}

AppLog.Blank();
AppLog.Info("=== Resumen ===");
foreach (var r in resultados)
    AppLog.Info($"{r.Grupo.Label}: {r.Miembros.Count} filas → {r.ArchivoCsv}");

AppLog.Info("Fin de ejecución");
return 0;

static Dictionary<string, string> ParseArgs(string[] argv)
{
    var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var i = 0; i < argv.Length; i++)
    {
        var token = argv[i].Trim();
        if (!token.StartsWith('-'))
            continue;

        var key = token.TrimStart('-');
        if (i + 1 < argv.Length && !argv[i + 1].StartsWith('-'))
        {
            map[key] = argv[++i];
            continue;
        }

        map[key] = "true";
    }

    return map;
}

static List<GrupoReporteDef> BuildGrupos(GruposOptions grupos, ReporteOptions reporte)
{
    var dominio = reporte.FiltrarDominioEstudiantes
        ? reporte.DominioFiltroEstudiantes
        : null;

    return
    [
        new("estudiantes", "Alumnos Tecmilenio", grupos.Estudiantes, dominio),
        new("profesores", "Colaboradores y Profesores Tecmilenio", grupos.Profesores, null),
    ];
}

static List<GrupoReporteDef> ResolverGrupos(string seleccion, IReadOnlyList<GrupoReporteDef> definiciones)
{
    if (seleccion is "todos" or "all" or "*")
        return definiciones.ToList();

    var match = definiciones.FirstOrDefault(g =>
        string.Equals(g.Id, seleccion, StringComparison.OrdinalIgnoreCase)
        || string.Equals(g.GroupName, seleccion, StringComparison.OrdinalIgnoreCase));

    return match is null ? [] : [match];
}

static List<GrupoReporteDef> ElegirGruposInteractivo(IReadOnlyList<GrupoReporteDef> definiciones)
{
    Console.WriteLine();
    Console.WriteLine("=== Adobe UMAPI — reporte de miembros ===");
    for (var i = 0; i < definiciones.Count; i++)
        Console.WriteLine($"{i + 1}. {definiciones[i].Label} ({definiciones[i].GroupName})");
    Console.WriteLine("3. Ambos grupos");
    Console.WriteLine("0. Salir");
    Console.Write("Opción: ");

    var choice = Console.ReadLine()?.Trim();
    return choice switch
    {
        "1" => [definiciones[0]],
        "2" => [definiciones[1]],
        "3" => definiciones.ToList(),
        "0" or "q" or "salir" => [],
        _ => [],
    };
}

static void PrintHelp()
{
    Console.WriteLine();
    Console.WriteLine("AdobeReporteMiembros — exporta miembros de product profiles a CSV.");
    Console.WriteLine();
    Console.WriteLine("Uso:");
    Console.WriteLine("  dotnet run");
    Console.WriteLine("  dotnet run -- --grupo estudiantes");
    Console.WriteLine("  dotnet run -- --grupo profesores");
    Console.WriteLine("  dotnet run -- --grupo todos");
    Console.WriteLine("  dotnet run -- --grupo todos --salida C:\\reportes");
    Console.WriteLine();
    Console.WriteLine("Grupos:");
    Console.WriteLine("  estudiantes  → Alumnos Tecmilenio (filtro dominio en appsettings)");
    Console.WriteLine("  profesores   → Colaboradores y Profesores Tecmilenio");
    Console.WriteLine("  todos        → ambos");
}
