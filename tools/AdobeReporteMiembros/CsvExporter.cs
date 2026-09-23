using System.Globalization;
using System.Text;

namespace AdobeReporteMiembros;

public static class CsvExporter
{
    private static readonly string[] Headers =
    [
        "perfil",
        "groupName",
        "email",
        "firstname",
        "lastname",
        "status",
        "type",
        "domain",
        "username",
        "fechaConsulta",
    ];

    public static async Task<string> ExportAsync(
        string outputDirectory,
        GrupoReporteDef grupo,
        IReadOnlyList<AdobeMember> miembros,
        CancellationToken ct = default)
    {
        Directory.CreateDirectory(outputDirectory);

        var slug = Slugify(grupo.Id);
        var stamp = DateTime.Now.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture);
        var path = Path.Combine(outputDirectory, $"{slug}-{stamp}.csv");

        var fechaConsulta = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", Headers));

        foreach (var m in miembros.OrderBy(x => x.Email, StringComparer.OrdinalIgnoreCase))
        {
            sb.AppendLine(string.Join(",",
                Escape(grupo.Label),
                Escape(grupo.GroupName),
                Escape(m.Email),
                Escape(m.FirstName),
                Escape(m.LastName),
                Escape(m.Status),
                Escape(m.Type),
                Escape(m.Domain),
                Escape(m.Username),
                Escape(fechaConsulta)));
        }

        await File.WriteAllTextAsync(path, sb.ToString(), new UTF8Encoding(encoderShouldEmitUTF8Identifier: true), ct);
        return path;
    }

    private static string Slugify(string value)
    {
        var chars = value
            .Trim()
            .ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray();

        var slug = new string(chars).Trim('-');
        while (slug.Contains("--", StringComparison.Ordinal))
            slug = slug.Replace("--", "-", StringComparison.Ordinal);

        return string.IsNullOrWhiteSpace(slug) ? "reporte" : slug;
    }

    private static string Escape(string? value)
    {
        var text = value ?? "";
        if (text.Contains('"') || text.Contains(',') || text.Contains('\n') || text.Contains('\r'))
            return $"\"{text.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
        return text;
    }
}
