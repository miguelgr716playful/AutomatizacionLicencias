"use client";

import {
  Download,
  ChevronDown,
  Filter,
  Search,
  Eye,
  CalendarDays,
} from "lucide-react";
import { useReportes } from "@/hooks/use-reportes";

export function ReportesSection() {
  const {
    filterSoftware,
    setFilterSoftware,
    filterAccion,
    setFilterAccion,
    filterOrigen,
    setFilterOrigen,
    search,
    setSearch,
    page,
    setPage,
    data,
    cargando,
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
  const stats = data.estadisticas;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-page-title">Reportes e Historial</h1>
          <p className="text-page-subtitle">
            Historial de asignaciones almacenado en Azure · Acceso de Auditor
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground bg-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Historial
            sincronizado desde ETL
          </span>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0B4D3C" }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Reporte a Excel/CSV</span>
            <span className="sm:hidden">Exportar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            value: stats.totalMovimientos,
            label: "Total movimientos",
            sub: "Periodo 2026-Agosto",
            color: "#00B364",
            border: "#00B364",
          },
          {
            value: stats.altasTotales,
            label: "Altas totales",
            sub: "69.7% del total",
            color: "#00B364",
            border: "#00B364",
          },
          {
            value: stats.bajasTotales,
            label: "Bajas totales",
            sub: "30.3% del total",
            color: "#ef4444",
            border: "#ef4444",
          },
          {
            value: stats.movimientosManuales,
            label: "Movimientos manuales",
            sub: "1.6% con justificación",
            color: "#0B4D3C",
            border: "#0B4D3C",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-xl border border-border shadow-sm p-3.5 flex flex-col gap-0.5 border-l-4"
            style={{ borderLeftColor: c.border }}
          >
            <p className="text-stat-value" style={{ color: c.color }}>
              {c.value}
            </p>
            <p className="text-xs font-semibold text-foreground">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <h2 className="text-section-title flex items-center gap-2">
            Historial de Asignaciones
            <span className="px-1.5 py-0.5 rounded-md text-badge font-bold bg-gray-100 text-muted-foreground">
              {filteredTotal}
            </span>
          </h2>
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {[
              {
                val: filterSoftware,
                set: setFilterSoftware,
                opts: ["Todo software", "Adobe CC", "Minitab"],
              },
              {
                val: filterAccion,
                set: setFilterAccion,
                opts: ["Alta y Baja", "Alta", "Baja"],
              },
              {
                val: filterOrigen,
                set: setFilterOrigen,
                opts: ["ETL + Manual", "ETL", "Manual"],
              },
            ].map(({ val, set, opts }) => (
              <div key={opts[0]} className="relative">
                <select
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="text-xs pl-2 pr-6 py-1.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none"
                >
                  {opts.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            ))}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ID, nombre, clave..."
                className="pl-6 pr-2 py-2 sm:py-1.5 text-sm sm:text-xs rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-emerald-400 w-full sm:w-40"
              />
            </div>
          </div>
        </div>

        <div className="md:hidden divide-y divide-border">
          {paginated.map((r) => (
            <div
              key={`${r.id}-${r.fecha}-${r.hora}-card`}
              className={`px-4 py-4 space-y-2 ${r.accion === "Baja" ? "bg-red-50/30" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {r.nombre}
                  </p>
                  <p className="text-xs font-mono text-emerald-600">{r.id}</p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold ${
                    r.accion === "Alta"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {r.accion}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md border border-border text-muted-foreground">
                  {r.software}
                </span>
                <span className="px-2 py-0.5 rounded-md border border-border text-muted-foreground">
                  {r.origen}
                </span>
                <span className="text-muted-foreground">{r.fecha} {r.hora}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {r.clave} · {r.operador}
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
                  "ESTUDIANTE",
                  "CLAVE BANNER",
                  "NIVEL",
                  "SOFTWARE",
                  "ACCIÓN",
                  "ORIGEN",
                  "OPERADOR",
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
                    r.accion === "Baja" ? "bg-red-50/20" : ""
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
                      className={`px-2 py-0.5 rounded-md text-badge ${
                        r.accion === "Alta"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {r.accion}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-badge border ${
                        r.origen === "ETL"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {r.origen}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {r.operador}
                  </td>
                  <td className="px-3 py-3">
                    <Eye
                      className={`w-3.5 h-3.5 ${
                        r.operador === "admin"
                          ? "text-emerald-500"
                          : "text-gray-300"
                      }`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-4 bg-gray-50/50 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Mostrando{" "}
            <strong className="text-foreground">
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filteredTotal)}
            </strong>{" "}
            de <strong className="text-foreground">{filteredTotal}</strong>{" "}
            registros
          </span>
          <div className="flex items-center gap-1.5">
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
                className="min-w-10 min-h-10 flex items-center justify-center rounded text-xs font-semibold transition-colors"
                style={
                  p === page
                    ? { backgroundColor: "#0B4D3C", color: "#fff" }
                    : { color: "#64748b" }
                }
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
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 w-full sm:w-auto">
            <CalendarDays className="w-3.5 h-3.5" /> Registros sincronizados
            desde Azure · 17/6/2026
          </span>
        </div>
      </div>
    </div>
  );
}
