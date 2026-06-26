"use client";

import {
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboard } from "@/hooks/use-dashboard";

const STAT_ICONS = [Package, TrendingUp, TrendingDown, Users];

export function DashboardSection() {
  const { data, cargando, recargar } = useDashboard();

  if (cargando || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando panel...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-page-title">Panel General</h1>
          <p className="text-page-subtitle">
            Resumen en tiempo real — Periodo {data.periodo}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["API Adobe: Conectado", "API Minitab: Conectado"].map((label) => (
            <span
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{
                borderColor: "#a7f3d0",
                backgroundColor: "#f0fdf4",
                color: "#00B364",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#00B364" }}
              />
              {label}
            </span>
          ))}
          <button
            type="button"
            onClick={() => recargar()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {data.stats.map((c, i) => {
          const Icon = STAT_ICONS[i] ?? Package;
          return (
            <div
              key={c.label}
              className="bg-white rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4"
            >
              <div
                className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "#e8f8f1" }}
              >
                <Icon className="w-6 h-6" style={{ color: "#00B364" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground leading-snug">
                  {c.label}
                </p>
                <p className="text-stat-value text-foreground">{c.value}</p>
                {c.sub && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.sub}
                  </p>
                )}
                {c.trend && (
                  <p
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: c.positive ? "#00B364" : "#f97316" }}
                  >
                    {c.trend}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h2 className="text-section-title">Tendencia de Licencias</h2>
              <p className="text-section-subtitle">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-0.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#00B364" }}
                />
                Adobe
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#0B4D3C" }}
                />
                Minitab
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0 h-[220px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.tendencia}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gAdobe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B364" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00B364" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMinitab" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B4D3C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0B4D3C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                  }}
                  cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="adobe"
                  name="adobe"
                  stroke="#00B364"
                  strokeWidth={2.5}
                  fill="url(#gAdobe)"
                  dot={{ r: 3, fill: "#00B364", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#00B364" }}
                />
                <Area
                  type="monotone"
                  dataKey="minitab"
                  name="minitab"
                  stroke="#0B4D3C"
                  strokeWidth={2.5}
                  fill="url(#gMinitab)"
                  dot={{ r: 3, fill: "#0B4D3C", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#0B4D3C" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-section-title">Actividad Reciente</h2>
            <p className="text-section-subtitle">
              Últimas operaciones procesadas
            </p>
          </div>
          <div className="flex-1 overflow-auto min-w-0">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-border">
                  {["Fecha", "Software", "Tipo", "Estado"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-table-header text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.actividadReciente.map((r) => (
                  <tr
                    key={`${r.fecha}-${r.software}-${r.tipo}`}
                    className="border-b border-border last:border-0 hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-5 py-3 text-xs text-foreground whitespace-nowrap">
                      {r.fecha}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-foreground">
                      {r.software}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-badge font-bold tracking-wide border ${
                          r.tipo === "APROV"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-orange-50 text-orange-500 border-orange-200"
                        }`}
                      >
                        {r.tipo === "APROV" ? "APROV..." : "DESAP..."}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium">
                      <span
                        className={
                          r.estado === "Completado"
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                        }
                      >
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
