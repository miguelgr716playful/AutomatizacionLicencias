namespace AdobeReporteMiembros;

public sealed class AdobeRetryPolicy(ReporteOptions options)
{
    public int MaxAttempts => Math.Max(1, options.ReintentosMax);

    public TimeSpan RequestTimeout => TimeSpan.FromSeconds(Math.Max(30, options.TimeoutSegundos));

    public TimeSpan PageDelay => TimeSpan.FromSeconds(Math.Max(0, options.PausaEntrePaginasSegundos));

    public bool ShouldRetry(int statusCode, bool looksHtml)
    {
        if (statusCode is 429 or 502 or 503 or 504)
            return true;

        return looksHtml && statusCode is >= 500 or 0;
    }

    public TimeSpan ComputeDelay(int attempt, int statusCode, TimeSpan? retryAfter)
    {
        if (retryAfter is { } headerDelay && headerDelay > TimeSpan.Zero)
            return headerDelay + TimeSpan.FromSeconds(1);

        var baseSeconds = statusCode switch
        {
            429 => Math.Min(options.EsperaMaxSegundos, 90 * attempt),
            504 => Math.Min(
                options.EsperaMaxSegundos,
                options.EsperaInicialSegundos + (60 * Math.Max(0, attempt - 1))),
            _ => Math.Min(
                options.EsperaMaxSegundos,
                options.EsperaInicialSegundos + (45 * Math.Max(0, attempt - 1))),
        };

        var jitter = Random.Shared.Next(0, 6);
        return TimeSpan.FromSeconds(baseSeconds + jitter);
    }

    public void LogRetry(int attempt, int statusCode, TimeSpan wait, string url)
    {
        AppLog.Write(
            $"HTTP {statusCode}. Reintento {attempt}/{MaxAttempts} en {wait.TotalSeconds:0}s...");
        AppLog.Write($"  URL: {url}");
    }
}
