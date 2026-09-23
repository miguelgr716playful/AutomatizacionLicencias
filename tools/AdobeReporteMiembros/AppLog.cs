using System.Globalization;

namespace AdobeReporteMiembros;

public static class AppLog
{
    private static readonly CultureInfo Culture = CultureInfo.GetCultureInfo("es-MX");

    public static void Info(string message) => Write(message);

    public static void Blank() => Console.WriteLine();

    public static void Write(string message)
    {
        var stamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", Culture);
        Console.WriteLine($"[{stamp}] {message}");
    }
}
