"use client";

import {
  Download,
  ChevronDown,
  Filter,
  Search,
  Eye,
} from "lucide-react";
import { useReportes } from "@/hooks/use-reportes";
import { SOFTWARE_IDS, SOFTWARE_LABELS } from "@/domain/value-objects/software";

function etiquetaAccion(accion: "Alta" | "Baja") {
  return accion === "Alta" ? "Aprovisionar" : "Desaprovisionar";
}

interface ReportesSectionProps {
  embedded?: boolean;
}

export function ReportesSection({ embedded = false }: ReportesSectionProps) {
  const {
    filterSoftware,
    setFilterSoftware,
    filterAccion,
    setFilterAccion,
    search,
    setSearch,
    page,
    setPage,
    data,
    cargando,
    exportando,
    exportarCsv,
    pageSize,
  } = useReportes();

  if (cargando || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando reportes...
      </div>
    );
  }

  const { items: paginated, total: filteredTotal, totalPages } = data;

  return (
    <div className="space-y-5">
      {!embedded && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-page-title">Reporte de Asignaciones</h1>
            <p className="text-page-subtitle">
              Historial de asignaciones sincronizado desde banner
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground bg-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Historial
              sincronizado desde ETL
            </span>
            <button
              type="button"
              onClick={() => exportarCsv()}
              disabled={exportando || filteredTotal === 0}
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">
                {exportando ? "Exportando..." : "Exportar Reporte a Excel/CSV"}
              </span>
              <span className="sm:hidden">
                {exportando ? "..." : "Exportar"}
              </span>
            </button>
          </div>
        </div>
      )}

      {embedded && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-section-title">Reporte de Asignaciones</h2>
            <p className="text-section-subtitle">
              Historial de asignaciones sincronizado desde banner
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportarCsv()}
            disabled={exportando || filteredTotal === 0}
            className="btn-primary px-4 py-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">
              {exportando ? "Exportando..." : "Exportar Reporte a Excel/CSV"}
            </span>
            <span className="sm:hidden">
              {exportando ? "..." : "Exportar"}
            </span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-border flex flex-col gap-3">
          <h2 className="text-section-title flex items-center gap-2">
            Historial de Asignaciones
            <span className="px-1.5 py-0.5 rounded-md text-badge font-bold bg-gray-100 text-muted-foreground">
              {filteredTotal}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
            <div className="flex items-center gap-1.5 sm:col-span-2 lg:col-span-3 lg:hidden text-xs text-muted-foreground">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              Filtros
            </div>
            {[
              {
                val: filterSoftware,
                set: setFilterSoftware,
                opts: [
                  "Todo software",
                  ...SOFTWARE_IDS.map((id) => SOFTWARE_LABELS[id]),
                ],
              },
              {
                val: filterAccion,
                set: setFilterAccion,
                opts: [
                  "Aprovisionar/Desaprovisionar",
                  "Aprovisionar",
                  "Desaprovisionar",
                ],
              },
            ].map(({ val, set, opts }) => (
              <div key={opts[0]} className="relative w-full">
                <select
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="w-full text-sm sm:text-xs pl-3 pr-8 py-2.5 sm:py-1.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none"
                >
                  {opts.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            ))}
            <div className="relative w-full sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="alumno o colaborador, clave banner"
                className="w-full pl-9 pr-3 py-2.5 sm:py-1.5 text-sm sm:text-xs rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>

        <div className="md:hidden divide-y divide-border">
          {paginated.map((r) => (
            <div
              key={`${r.id}-${r.fecha}-${r.hora}-card`}
              className={`px-4 py-4 space-y-2 ${r.accion === "Baja" ? "bg-orange-50/30" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {r.nombre}
                  </p>
                  <p className="text-xs font-mono text-emerald-600">{r.id}</p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                    r.accion === "Alta"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-orange-50 text-orange-500 border-orange-200"
                  }`}
                >
                  {etiquetaAccion(r.accion)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md border border-border text-muted-foreground">
                  {r.software}
                </span>
                <span className="text-muted-foreground">{r.fecha} {r.hora}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {r.clave}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50/80">
                {[
                  "FECHA / HORA",
                  "ALUMNO/COLABORADOR",
                  "CLAVE BANNER",
                  "NIVEL",
                  "SOFTWARE",
                  "ACCIÓN",
                  "",
                ].map((h) => (
                  <th
                    key={h || "actions"}
                    className="px-3 py-2.5 text-table-header text-left whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr
                  key={`${r.id}-${r.fecha}-${r.hora}`}
                  className={`border-b border-border last:border-0 transition-colors hover:bg-gray-50/60 ${
                    r.accion === "Baja" ? "bg-orange-50/20" : ""
                  }`}
                >
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className="font-mono text-xs"
                      style={{ color: "#00B364" }}
                    >
                      {r.fecha}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {r.hora}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-medium text-foreground text-xs">
                      {r.nombre}
                    </span>
                    <span
                      className="block text-xs font-mono"
                      style={{ color: "#00B364" }}
                    >
                      {r.id}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    {r.clave}
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-1.5 py-0.5 rounded border border-border text-badge font-medium text-muted-foreground">
                      {r.nivel}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-badge border ${
                        r.software === "Minitab"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-teal-50 text-teal-700 border-teal-200"
                      }`}
                    >
                      {r.software}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-badge border ${
                        r.accion === "Alta"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-orange-50 text-orange-500 border-orange-200"
                      }`}
                    >
                      {etiquetaAccion(r.accion)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Eye className="w-3.5 h-3.5 text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-5 py-3.5 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50">
          <span className="text-xs text-muted-foreground order-2 sm:order-1">
            Mostrando{" "}
            <strong className="text-foreground">
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filteredTotal)}
            </strong>{" "}
            de <strong className="text-foreground">{filteredTotal}</strong>{" "}
            registros
          </span>
          <div className="flex items-center justify-center gap-1.5 order-1 sm:order-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="min-w-10 min-h-10 flex items-center justify-center rounded text-sm font-semibold text-muted-foreground hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`min-w-10 min-h-10 flex items-center justify-center rounded text-xs font-semibold transition-colors ${
                  p === page
                    ? "btn-primary min-w-10 min-h-10"
                    : "text-muted-foreground hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="min-w-10 min-h-10 flex items-center justify-center rounded text-sm font-semibold text-muted-foreground hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
