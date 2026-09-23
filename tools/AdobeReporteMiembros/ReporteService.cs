namespace AdobeReporteMiembros;



public sealed class ReporteService(AdobeUmapiClient umapi, ReporteOptions reporteOptions)

{

    public async Task<ReporteGrupoResult> GenerarAsync(

        GrupoReporteDef grupo,

        CancellationToken ct = default)

    {

        AppLog.Blank();

        AppLog.Info($"=== {grupo.Label} ===");

        AppLog.Info($"Grupo Adobe: {grupo.GroupName}");



        var profile = await umapi.GetProductProfileAsync(grupo.GroupName, ct);

        string? quotaInfo = null;

        if (profile is null)

        {

            AppLog.Info("ADVERTENCIA: no se encontró el product profile en Adobe.");

        }

        else

        {

            quotaInfo = $"members={profile.MemberCount} quota={profile.LicenseQuota ?? "—"} product={profile.ProductName}";

            AppLog.Info($"Cuota Adobe: {quotaInfo}");

        }



        if (!string.IsNullOrWhiteSpace(grupo.DomainFilter))

            AppLog.Info($"Filtro dominio: @{grupo.DomainFilter.TrimStart('@')}");



        AppLog.Info(

            $"Modo miembros: {(reporteOptions.DirectOnly ? "directOnly=true (rápido, incompleto)" : "directOnly=false (completo)")}");

        AppLog.Info(

            $"Reintentos: hasta {reporteOptions.ReintentosMax} | timeout {reporteOptions.TimeoutSegundos}s | espera 504 desde {reporteOptions.EsperaInicialSegundos}s");



        var paginas = 0;

        var progress = new Progress<(int Page, int RawCount, int FilteredCount)>(p =>

        {

            paginas = p.Page + 1;

            AppLog.Info(

                $"Página {p.Page}: {p.RawCount} usuarios leídos, {p.FilteredCount} incluidos tras filtro");

        });



        AppLog.Info("Descargando miembros (puede tardar varios minutos)...");

        var miembros = await umapi.ListAllGroupMembersAsync(

            grupo.GroupName,

            reporteOptions.DirectOnly,

            grupo.DomainFilter,

            progress,

            ct);



        var archivo = await CsvExporter.ExportAsync(

            reporteOptions.DirectorioSalida,

            grupo,

            miembros,

            ct);



        AppLog.Info($"Total exportado: {miembros.Count}");

        AppLog.Info($"CSV: {Path.GetFullPath(archivo)}");



        return new ReporteGrupoResult(grupo, miembros, paginas, quotaInfo, archivo);

    }

}


