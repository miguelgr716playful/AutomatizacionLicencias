"use client";

import { useMemo, useState } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboard } from "@/hooks/use-dashboard";
import { ReportesSection } from "@/components/sections/reportes-section";
import type { StatCard } from "@/domain/entities/dashboard";

type FiltroTipoUsuario = "todos" | "alumnos" | "colaboradores";

const FILTRO_TIPO_USUARIO: { value: FiltroTipoUsuario; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "alumnos", label: "Alumnos" },
  { value: "colaboradores", label: "Colaboradores" },
];

const STAT_ICONS = [TrendingUp, TrendingUp, TrendingDown, TrendingDown];
const ADOBE_COLOR = "#00B364";
const MINITAB_COLOR = "#0B4D3C";

type TendenciaTooltipProps = {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    payload?: Record<string, number | string>;
  }>;
  label?: string;
  filtro: FiltroTipoUsuario;
};

function TendenciaTooltip({ active, payload, label, filtro }: TendenciaTooltipProps) {
  if (!active || !payload?.length) return null;

  const hovered = payload[0];
  const dataKey = String(hovered.dataKey ?? "");
  const data = hovered.payload ?? {};
  const mes = String(data.mes ?? label ?? "");
  const isAdobe = dataKey.startsWith("adobe");

  const alumnos = isAdobe ? Number(data.adobeAlumnos) : Number(data.minitabAlumnos);
  const colaboradores = isAdobe
    ? Number(data.adobeColaboradores)
    : Number(data.minitabColaboradores);
  const total = isAdobe ? Number(data.adobe) : Number(data.minitab);
  const color = isAdobe ? ADOBE_COLOR : MINITAB_COLOR;
  const software = isAdobe ? "Adobe" : "Minitab";

  const filas =
    filtro === "alumnos"
      ? [{ label: "Alumnos", value: alumnos, color }]
      : filtro === "colaboradores"
        ? [{ label: "Colaboradores", value: colaboradores, color }]
        : [{ label: "Total", value: total, color }];

  return (
    <div className="rounded-[10px] border border-border bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-foreground">
        {mes} · {software}
      </p>
      <div className="space-y-1.5">
        {filas.map((fila) => (
          <div key={fila.label} className="flex items-center gap-2 text-muted-foreground">
            <span>{fila.label}</span>
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0 border border-black/10"
              style={{ backgroundColor: fila.color }}
            />
            <span className="font-bold text-foreground">{fila.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function statDisplayValue(card: StatCard, filtro: FiltroTipoUsuario): string {
  if (filtro === "alumnos" && card.alumnos != null) {
    return String(card.alumnos);
  }
  if (filtro === "colaboradores" && card.colaboradores != null) {
    return String(card.colaboradores);
  }
  return card.value;
}

function FiltroTipoUsuarioControl({
  value,
  onChange,
}: {
  value: FiltroTipoUsuario;
  onChange: (value: FiltroTipoUsuario) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Tipo de usuario:
      </span>
      <div className="inline-flex rounded-lg border border-border bg-white p-0.5">
        {FILTRO_TIPO_USUARIO.map((opcion) => (
          <button
            key={opcion.value}
            type="button"
            onClick={() => onChange(opcion.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              value === opcion.value
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
            }`}
          >
            {opcion.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DashboardSection() {
  const { data, cargando } = useDashboard();
  const [filtroTipoUsuario, setFiltroTipoUsuario] =
    useState<FiltroTipoUsuario>("todos");

  const leyendaChart = useMemo(() => {
    if (filtroTipoUsuario === "alumnos") {
      return [
        { label: "Adobe · Alumnos", color: ADOBE_COLOR },
        { label: "Minitab · Alumnos", color: MINITAB_COLOR },
      ];
    }
    if (filtroTipoUsuario === "colaboradores") {
      return [
        { label: "Adobe · Colaboradores", color: ADOBE_COLOR },
        { label: "Minitab · Colaboradores", color: MINITAB_COLOR },
      ];
    }
    return [
      { label: "Adobe", color: ADOBE_COLOR },
      { label: "Minitab", color: MINITAB_COLOR },
    ];
  }, [filtroTipoUsuario]);

  if (cargando || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando panel...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page-title">Panel General</h1>
        <p className="text-page-subtitle">
          Resumen de licencias y reporte de asignaciones
        </p>
      </div>

      <FiltroTipoUsuarioControl
        value={filtroTipoUsuario}
        onChange={setFiltroTipoUsuario}
      />

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
                <p className="text-stat-value text-foreground">
                  {statDisplayValue(c, filtroTipoUsuario)}
                </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch min-w-0">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h2 className="text-section-title">Tendencia de Licencias</h2>
              <p className="text-section-subtitle">Últimos 8 meses</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 shrink-0 pt-0.5 max-w-[220px] sm:max-w-none">
              {leyendaChart.map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0 h-[220px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={filtroTipoUsuario}
                data={data.tendencia}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                barGap={4}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
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
                  shared={false}
                  cursor={false}
                  content={<TendenciaTooltip filtro={filtroTipoUsuario} />}
                />
                {filtroTipoUsuario === "todos" && (
                  <Bar
                    dataKey="adobe"
                    name="Adobe"
                    fill={ADOBE_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}
                {filtroTipoUsuario === "todos" && (
                  <Bar
                    dataKey="minitab"
                    name="Minitab"
                    fill={MINITAB_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}
                {filtroTipoUsuario === "alumnos" && (
                  <Bar
                    dataKey="adobeAlumnos"
                    name="Adobe · Alumnos"
                    fill={ADOBE_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}
                {filtroTipoUsuario === "alumnos" && (
                  <Bar
                    dataKey="minitabAlumnos"
                    name="Minitab · Alumnos"
                    fill={MINITAB_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}
                {filtroTipoUsuario === "colaboradores" && (
                  <Bar
                    dataKey="adobeColaboradores"
                    name="Adobe · Colaboradores"
                    fill={ADOBE_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}
                {filtroTipoUsuario === "colaboradores" && (
                  <Bar
                    dataKey="minitabColaboradores"
                    name="Minitab · Colaboradores"
                    fill={MINITAB_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden min-w-0">
          <div className="px-3 py-3 border-b border-border">
            <h2 className="text-section-title">Actividad Reciente</h2>
            <p className="text-section-subtitle">
              Últimas operaciones procesadas
            </p>
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="md:hidden divide-y divide-border">
              {data.actividadReciente.map((r) => (
                <div
                  key={`${r.fecha}-${r.software}-${r.tipo}-card`}
                  className="px-4 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {r.software}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.fecha}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold tracking-wide border ${
                        r.tipo === "APROV"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-orange-50 text-orange-500 border-orange-200"
                      }`}
                    >
                      {r.tipo === "APROV" ? "Aprovisionar" : "Desaprovisionar"}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        r.estado === "Completado"
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {r.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
            <table className="w-full table-fixed text-[11px]">
              <colgroup>
                <col className="w-[27%]" />
                <col className="w-[17%]" />
                <col className="w-[36%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  {["Fecha", "Software", "Tipo", "Estado"].map((h) => (
                    <th
                      key={h}
                      className="px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground text-left"
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
                    <td className="px-2 py-2 text-[11px] text-foreground truncate">
                      {r.fecha}
                    </td>
                    <td className="px-2 py-2 text-[11px] font-medium text-foreground truncate">
                      {r.software}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-tight border whitespace-nowrap ${
                          r.tipo === "APROV"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-orange-50 text-orange-500 border-orange-200"
                        }`}
                      >
                        {r.tipo === "APROV" ? "Aprovisionar" : "Desaprovisionar"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-[11px] font-medium truncate">
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

      <ReportesSection embedded />
    </div>
  );
}
