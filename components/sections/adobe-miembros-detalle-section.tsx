"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  Download,
  GraduationCap,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import {
  useAdobeMiembrosDetalle,
  type AdobeMiembrosPerfil,
  type AdobeMiembrosSortKey,
} from "@/hooks/use-adobe-miembros-detalle";
import { useAdobeLicencias } from "@/hooks/use-adobe-licencias";
import { useRole } from "@/components/layout/role-provider";
import { PERFILES_LICENCIA } from "@/lib/perfiles-licencia";
import type {
  AdobeMiembroDto,
  AdobeUserDto,
} from "@/application/dto/adobe-licencias.dto";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatNumber(n: number): string {
  return n.toLocaleString("es-MX");
}

function userToMiembro(user: AdobeUserDto): AdobeMiembroDto {
  return {
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    status: user.status,
    type: user.type,
    domain: user.domain,
    username: user.email,
  };
}

const COPY: Record<
  AdobeMiembrosPerfil,
  {
    title: string;
    defaultGroup: string;
    entityPlural: string;
    Icon: typeof GraduationCap;
  }
> = {
  alumno: {
    title: "Detalle Alumnos Tecmilenio",
    defaultGroup: "Alumnos Tecmilenio",
    entityPlural: "alumnos",
    Icon: GraduationCap,
  },
  profesor: {
    title: "Detalle Colaboradores y Profesores",
    defaultGroup: "Colaboradores y Profesores Tecmilenio",
    entityPlural: "colaboradores",
    Icon: Briefcase,
  },
};

const COLUMNS: {
  key: AdobeMiembrosSortKey;
  label: string;
  className?: string;
}[] = [
  { key: "email", label: "Correo", className: "pr-3" },
  { key: "nombre", label: "Nombre", className: "pr-3" },
  { key: "username", label: "Usuario", className: "pr-3" },
  { key: "status", label: "Estado", className: "pr-3" },
  { key: "domain", label: "Dominio", className: "pr-3" },
  { key: "type", label: "Tipo" },
];

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`py-2 font-medium ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 text-xs transition-colors ${
          active
            ? "text-emerald-800 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-sort={
          active ? (dir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        {label}
        <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
      </button>
    </th>
  );
}

export function AdobeMiembrosDetalleSection({
  perfil,
}: {
  perfil: AdobeMiembrosPerfil;
}) {
  const { role } = useRole();
  const copy = COPY[perfil];
  const groupName =
    PERFILES_LICENCIA.find((p) => p.id === perfil)?.groupName ??
    copy.defaultGroup;
  const {
    meta,
    paginados,
    total,
    totalPages,
    page,
    setPage,
    pageSize,
    activos,
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    cargando,
    progreso,
    error,
    fetchedAt,
    cargar,
    exportando,
    exportarCsv,
    miembros,
    quitarMiembro,
    upsertMiembro,
  } = useAdobeMiembrosDetalle(perfil);
  const {
    procesando,
    error: licenciaError,
    mensaje: licenciaMensaje,
    cambiarLicencia,
    setError: setLicenciaError,
    setMensaje: setLicenciaMensaje,
  } = useAdobeLicencias();

  const [emailAsignar, setEmailAsignar] = useState("");
  const [pendienteRevocar, setPendienteRevocar] = useState<AdobeMiembroDto | null>(
    null
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const onAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailAsignar.trim().toLowerCase();
    if (!email.includes("@")) {
      setLicenciaError("Ingresa un correo válido");
      setLicenciaMensaje(null);
      return;
    }
    if (miembros.some((m) => m.email.toLowerCase() === email)) {
      setLicenciaError(`Este correo ya está en ${groupName}`);
      setLicenciaMensaje(null);
      return;
    }
    const result = await cambiarLicencia(email, groupName, "asignar");
    if (result?.ok) {
      upsertMiembro(
        result.user
          ? userToMiembro(result.user)
          : {
              email,
              firstname: "",
              lastname: "",
              status: "active",
              type: "",
              domain: email.split("@")[1] ?? "",
              username: email,
            }
      );
      setEmailAsignar("");
    }
  };

  const onConfirmarRevocar = async () => {
    const row = pendienteRevocar;
    if (!row) return;
    setPendienteRevocar(null);
    const result = await cambiarLicencia(row.email, groupName, "revocar");
    if (result?.ok) {
      quitarMiembro(row.email);
    }
  };

  if (role !== "admin" && role !== "ejecutor") {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Solo administradores y ejecutores pueden ver el detalle de{" "}
        {copy.entityPlural}.
      </div>
    );
  }

  const Icon = copy.Icon;
  const desde = total === 0 ? 0 : page * pageSize + 1;
  const hasta = Math.min(total, (page + 1) * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <Link
          href="/cuotas-adobe"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-800 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Cuotas Adobe
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-page-title flex items-center gap-2">
              <Icon className="w-7 h-7 text-emerald-700" />
              {copy.title}
            </h1>
            <p className="text-page-subtitle">
              Asigna o revoca la licencia de{" "}
              <span className="font-medium text-foreground">
                {meta?.groupName || copy.defaultGroup}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => void cargar()}
              disabled={cargando}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`}
              />
              {cargando ? "Actualizando..." : "Actualizar"}
            </button>
            <button
              type="button"
              onClick={() => void exportarCsv(true)}
              disabled={exportando || total === 0}
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exportando ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {licenciaError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {licenciaError}
        </div>
      )}
      {licenciaMensaje && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {licenciaMensaje}
        </div>
      )}

      {progreso && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {progreso}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Users className="w-3.5 h-3.5" />
            Total cargados
          </div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {formatNumber(miembros.length)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <div className="text-xs text-muted-foreground mb-1">Activos</div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {formatNumber(activos)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 col-span-2 lg:col-span-1">
          <div className="text-xs text-muted-foreground mb-1">
            Resultados filtro
          </div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {formatNumber(total)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-start gap-4 sm:gap-[4.2rem]">
            <div className="relative w-full sm:w-[33.6rem] max-w-full shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Buscar por correo, nombre o usuario…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <form
              onSubmit={(e) => void onAsignar(e)}
              className="flex items-center justify-start gap-2 w-auto max-w-full"
            >
              <input
                type="email"
                value={emailAsignar}
                onChange={(e) => setEmailAsignar(e.target.value)}
                placeholder="correo@tecmilenio.mx"
                className="w-[29.4rem] max-w-full text-sm px-3 py-2 rounded-lg border border-border bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={procesando || cargando}
                required
              />
              <button
                type="submit"
                disabled={procesando || cargando || !emailAsignar.trim()}
                className="btn-primary px-4 py-2 disabled:opacity-50 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                {procesando ? "Procesando..." : "Asignar licencia"}
              </button>
            </form>
          </div>
          {fetchedAt && (
            <p className="text-xs text-muted-foreground sm:text-right">
              Actualizado:{" "}
              {new Date(fetchedAt).toLocaleString("es-MX", {
                dateStyle: "short",
                timeStyle: "medium",
              })}
            </p>
          )}
        </div>

        {cargando && miembros.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            Cargando {copy.entityPlural} desde Adobe…
          </p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            No hay {copy.entityPlural} para mostrar.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left border-b border-border">
                    {COLUMNS.map((col) => (
                      <SortHeader
                        key={col.key}
                        label={col.label}
                        className={col.className}
                        active={sortKey === col.key}
                        dir={sortDir}
                        onClick={() => toggleSort(col.key)}
                      />
                    ))}
                    <th className="py-2 font-medium text-xs text-muted-foreground text-right">
                      Licencia
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((m) => (
                    <tr
                      key={m.email}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {m.email}
                      </td>
                      <td className="py-2.5 pr-3">
                        {[m.firstname, m.lastname].filter(Boolean).join(" ") ||
                          "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-xs">
                        {m.username || "—"}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="inline-flex text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                          {m.status || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs">{m.domain || "—"}</td>
                      <td className="py-2.5 pr-3 text-xs">{m.type || "—"}</td>
                      <td className="py-2 pl-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPendienteRevocar(m)}
                          disabled={procesando || cargando}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-red-200 bg-red-50 text-[11px] leading-4 font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <MinusCircle className="w-3 h-3" />
                          Revocar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                Mostrando {desde}–{hasta} de {formatNumber(total)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Página {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AlertDialog
        open={Boolean(pendienteRevocar)}
        onOpenChange={(open) => {
          if (!open) setPendienteRevocar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar esta licencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará a <strong>{pendienteRevocar?.email}</strong> del grupo{" "}
              <strong>{groupName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void onConfirmarRevocar()}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AdobeAlumnosDetalleSection() {
  return <AdobeMiembrosDetalleSection perfil="alumno" />;
}

export function AdobeProfesoresDetalleSection() {
  return <AdobeMiembrosDetalleSection perfil="profesor" />;
}
