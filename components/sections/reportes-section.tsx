"use client";

import { useState } from "react";
import {
  Download,
  ChevronDown,
  Filter,
  Search,
  Eye,
  CalendarDays,
} from "lucide-react";
import { PAGE_SIZE, reporteData } from "@/lib/mock-data";

export function ReportesSection() {
  const [filterSoftware, setFilterSoftware] = useState("Todo software");
  const [filterAccion, setFilterAccion] = useState("Alta y Baja");
  const [filterOrigen, setFilterOrigen] = useState("ETL + Manual");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = reporteData.filter(
    (r) =>
      (filterSoftware === "Todo software" || r.software === filterSoftware) &&
      (filterAccion === "Alta y Baja" || r.accion === filterAccion) &&
      (filterOrigen === "ETL + Manual" || r.origen === filterOrigen) &&
      (search === "" ||
        r.nombre.toLowerCase().includes(search.toLowerCase()) ||
        r.id.includes(search) ||
        r.clave.includes(search))
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Reportes e Historial
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Historial de asignaciones almacenado en Azure · Acceso de Auditor
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground bg-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Azure
            Blob Storage — Conectado
          </span>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0B4D3C" }}
          >
            <Download className="w-4 h-4" /> Exportar Reporte a Excel/CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            value: "2,847",
            label: "Total movimientos",
            sub: "Periodo 2026-Agosto",
            color: "#00B364",
            border: "#00B364",
          },
          {
            value: "1,983",
            label: "Altas totales",
            sub: "69.7% del total",
            color: "#00B364",
            border: "#00B364",
          },
          {
            value: "864",
            label: "Bajas totales",
            sub: "30.3% del total",
            color: "#ef4444",
            border: "#ef4444",
          },
          {
            value: "47",
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
            <p
              className="text-xl font-bold leading-tight"
              style={{ color: c.color }}
            >
              {c.value}
            </p>
            <p className="text-xs font-semibold text-foreground">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Historial de Asignaciones
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-muted-foreground">
              {filtered.length}
            </span>
          </h2>
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {[
              {
                val: filterSoftware,
                set: handleFilterChange(setFilterSoftware),
                opts: ["Todo software", "Adobe CC", "Minitab"],
              },
              {
                val: filterAccion,
                set: handleFilterChange(setFilterAccion),
                opts: ["Alta y Baja", "Alta", "Baja"],
              },
              {
                val: filterOrigen,
                set: handleFilterChange(setFilterOrigen),
                opts: ["ETL + Manual", "ETL", "Manual"],
              },
            ].map(({ val, set, opts }) => (
              <div key={opts[0]} className="relative">
                <select
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="text-[11px] pl-2 pr-6 py-1.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none"
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="ID, nombre, clave..."
                className="pl-6 pr-2 py-1.5 text-[11px] rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-emerald-400 w-40"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
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
                    className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground text-left uppercase tracking-wide whitespace-nowrap"
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
                      className="font-mono text-[11px]"
                      style={{ color: "#00B364" }}
                    >
                      {r.fecha}
                    </span>
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {r.hora}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-medium text-foreground text-[12px]">
                      {r.nombre}
                    </span>
                    <span
                      className="block text-[10px] font-mono"
                      style={{ color: "#00B364" }}
                    >
                      {r.id}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">
                    {r.clave}
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-1.5 py-0.5 rounded border border-border text-[10px] font-medium text-muted-foreground">
                      {r.nivel}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
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
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
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
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        r.origen === "ETL"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {r.origen}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-muted-foreground">
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
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            de <strong className="text-foreground">{filtered.length}</strong>{" "}
            registros
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 rounded text-sm font-semibold text-muted-foreground hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className="w-7 h-7 rounded text-xs font-semibold transition-colors"
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
              className="w-7 h-7 rounded text-sm font-semibold text-muted-foreground hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              ›
            </button>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> Registros sincronizados
            desde Azure · 17/6/2026
          </span>
        </div>
      </div>
    </div>
  );
}
