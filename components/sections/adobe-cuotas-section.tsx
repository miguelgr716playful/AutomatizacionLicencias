"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  AlertTriangle,
  ChevronRight,
  Gauge,
  RefreshCw,
  Users,
} from "lucide-react";
import { useAdobeCuotas } from "@/hooks/use-adobe-cuotas";
import { useRole } from "@/components/layout/role-provider";
import type {
  AdobeCuotaProfileDto,
  AdobeCuotaStatus,
} from "@/application/dto/adobe-licencias.dto";

function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("es-MX");
}

function statusLabel(status: AdobeCuotaStatus): string {
  switch (status) {
    case "ok":
      return "OK";
    case "alto":
      return "Alto";
    case "critico":
      return "Crítico";
    case "lleno":
      return "Lleno";
    case "ilimitado":
      return "Ilimitado";
    case "sin_cuota":
      return "Sin cuota";
    case "no_encontrado":
      return "No encontrado";
    default:
      return status;
  }
}

function statusClass(status: AdobeCuotaStatus): string {
  switch (status) {
    case "ok":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "alto":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "critico":
    case "lleno":
      return "bg-red-100 text-red-800 border-red-200";
    case "ilimitado":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "no_encontrado":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function barClass(status: AdobeCuotaStatus): string {
  switch (status) {
    case "lleno":
    case "critico":
      return "bg-red-500";
    case "alto":
      return "bg-amber-500";
    default:
      return "bg-emerald-500";
  }
}

function QuotaBar({ profile }: { profile: AdobeCuotaProfileDto }) {
  if (profile.unlimited || profile.usedPct == null) {
    return (
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full w-0" />
      </div>
    );
  }
  const width = Math.min(100, Math.max(0, profile.usedPct));
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-full ${barClass(profile.status)} transition-all`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

const ALUMNOS_DETALLE_HREF = "/cuotas-adobe/alumnos";
const PROFESORES_DETALLE_HREF = "/cuotas-adobe/profesores";

function isAlumnosProfile(profile: AdobeCuotaProfileDto): boolean {
  const names = [profile.groupName, profile.adobeGroupName].map((n) =>
    String(n || "").toLowerCase()
  );
  return names.some(
    (n) =>
      n === "alumnos tecmilenio" ||
      n === "estudiantes tecmilenio"
  );
}

function isProfesoresProfile(profile: AdobeCuotaProfileDto): boolean {
  return (
    profile.groupName === "Colaboradores y Profesores Tecmilenio" ||
    profile.adobeGroupName === "Colaboradores y Profesores Tecmilenio"
  );
}

function detalleHrefFor(profile: AdobeCuotaProfileDto): string | null {
  if (isAlumnosProfile(profile)) return ALUMNOS_DETALLE_HREF;
  if (isProfesoresProfile(profile)) return PROFESORES_DETALLE_HREF;
  return null;
}

function ProfilesTable({
  rows,
  emptyLabel,
}: {
  rows: AdobeCuotaProfileDto[];
  emptyLabel: string;
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-border">
            <th className="py-2 pr-3 font-medium">Perfil / grupo</th>
            <th className="py-2 pr-3 font-medium">Miembros</th>
            <th className="py-2 pr-3 font-medium">Cuota</th>
            <th className="py-2 pr-3 font-medium">Disponibles</th>
            <th className="py-2 pr-3 font-medium min-w-[120px]">Uso</th>
            <th className="py-2 pr-3 font-medium">Estado</th>
            <th className="py-2 font-medium w-8" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const detalleHref = detalleHrefFor(p);
            const tieneDetalle = Boolean(detalleHref);
            return (
              <tr
                key={p.adobeGroupName || p.groupName}
                className={`border-b border-border/70 last:border-0 ${
                  tieneDetalle
                    ? "cursor-pointer hover:bg-emerald-50/60 transition-colors"
                    : ""
                }`}
                onClick={
                  detalleHref
                    ? () => router.push(detalleHref)
                    : undefined
                }
                onKeyDown={
                  detalleHref
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(detalleHref);
                        }
                      }
                    : undefined
                }
                tabIndex={tieneDetalle ? 0 : undefined}
                role={tieneDetalle ? "link" : undefined}
                aria-label={
                  tieneDetalle
                    ? `Ver detalle de ${p.groupName}`
                    : undefined
                }
              >
                <td className="py-3 pr-3 align-top">
                  <p className="font-medium text-foreground">{p.groupName}</p>
                  {p.productName ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.productName}
                    </p>
                  ) : null}
                  {tieneDetalle ? (
                    <p className="text-xs text-emerald-700 mt-1">
                      Ver detalle y exportar CSV
                    </p>
                  ) : null}
                </td>
                <td className="py-3 pr-3 align-top tabular-nums">
                  {formatNumber(p.memberCount)}
                </td>
                <td className="py-3 pr-3 align-top tabular-nums">
                  {p.unlimited
                    ? "Ilimitada"
                    : p.quota != null
                      ? formatNumber(p.quota)
                      : p.licenseQuota || "—"}
                </td>
                <td className="py-3 pr-3 align-top tabular-nums">
                  {p.unlimited ? "—" : formatNumber(p.available)}
                </td>
                <td className="py-3 pr-3 align-top">
                  <div className="space-y-1.5">
                    <QuotaBar profile={p} />
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {p.usedPct != null ? `${p.usedPct}%` : "—"}
                    </p>
                  </div>
                </td>
                <td className="py-3 pr-3 align-top">
                  <span
                    className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${statusClass(
                      p.status
                    )}`}
                  >
                    {statusLabel(p.status)}
                  </span>
                </td>
                <td className="py-3 align-top text-muted-foreground">
                  {tieneDetalle ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdobeCuotasSection() {
  const { role } = useRole();
  const { data, cargando, error, cargar } = useAdobeCuotas();

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (role !== "admin" && role !== "ejecutor") {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Solo administradores y ejecutores pueden ver cuotas Adobe.
      </div>
    );
  }

  const summary = data?.summary;
  const portal = data?.portalProfiles ?? [];
  const nearPortal = portal.filter((p) => (p.usedPct ?? 0) >= 90).length;
  const fullPortal = portal.filter((p) => (p.usedPct ?? 0) >= 100).length;
  const unlimitedPortal = portal.filter((p) => p.unlimited).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-page-title flex items-center gap-2">
            <Gauge className="w-7 h-7 text-emerald-700" />
            Cuotas Adobe
          </h1>
          <p className="text-page-subtitle">
            Cupo y uso de product profiles (licencias) desde Adobe UMAPI
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cargar()}
          disabled={cargando}
          className="btn-primary px-4 py-2 disabled:opacity-50 shrink-0 self-start"
        >
          <RefreshCw
            className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`}
          />
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="w-3.5 h-3.5" />
              Miembros
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatNumber(summary.membersPortal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.portalProfiles} perfiles de licencia
            </p>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Cerca del límite (≥90%)
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatNumber(nearPortal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(fullPortal)} al 100%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Gauge className="w-3.5 h-3.5" />
              Cuota ilimitada
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatNumber(unlimitedPortal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              perfiles sin tope numérico
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-6 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Perfiles del portal
          </h2>
          <p className="text-xs text-muted-foreground">
            Profesor y alumno usados en Licencia individual
          </p>
        </div>
        {cargando && !data ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Cargando cuotas desde Adobe…
          </p>
        ) : (
          <ProfilesTable
            rows={portal}
            emptyLabel="Sin perfiles del portal"
          />
        )}
        {data?.fetchedAt && (
          <p className="text-xs text-muted-foreground pt-1">
            Actualizado:{" "}
            {new Date(data.fetchedAt).toLocaleString("es-MX", {
              dateStyle: "short",
              timeStyle: "medium",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
