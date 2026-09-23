"use client";

import { useState } from "react";
import {
  KeyRound,
  ListOrdered,
  MinusCircle,
  PlusCircle,
  Search,
  Upload,
  UserRound,
} from "lucide-react";
import { useAdobeLicencias } from "@/hooks/use-adobe-licencias";
import { useRole } from "@/components/layout/role-provider";
import {
  PERFILES_LICENCIA,
  type PerfilLicenciaId,
} from "@/lib/perfiles-licencia";
import {
  parseMatriculasCsv,
  assertEmailsFormatoAlumno,
  type AlumnoListaFila,
} from "@/lib/parse-matriculas-csv";

const INPUT =
  "w-full text-sm px-3 py-2 rounded-lg border border-border bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

type Modo = "individual" | "lista";

export function AsignacionLicenciasSection() {
  const { role } = useRole();
  const {
    user,
    buscando,
    procesando,
    error,
    mensaje,
    setError,
    setMensaje,
    buscarUsuario,
    cambiarLicencia,
    cambiarLicenciaLista,
  } = useAdobeLicencias();

  const [modo, setModo] = useState<Modo>("individual");
  const [email, setEmail] = useState("");
  const [perfilId, setPerfilId] = useState<PerfilLicenciaId | "">("");

  const [csvName, setCsvName] = useState("");
  const [filas, setFilas] = useState<AlumnoListaFila[]>([]);
  const [totalFilasCsv, setTotalFilasCsv] = useState(0);
  const [listaResultado, setListaResultado] = useState<{
    ok: boolean;
    completed?: number;
    notCompleted?: number;
    total?: number;
    errors?: Array<{ message: string; user?: string }>;
  } | null>(null);

  const perfil = PERFILES_LICENCIA.find((p) => p.id === perfilId);
  const groupName = perfil?.groupName ?? "";
  const yaTienePerfil = Boolean(
    user && groupName && user.groups.includes(groupName)
  );

  if (role !== "admin" && role !== "ejecutor") {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Solo administradores y ejecutores pueden asignar o revocar licencias.
      </div>
    );
  }

  const onBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    await buscarUsuario(email);
  };

  const onAsignar = async () => {
    if (!email.trim() || !groupName) return;
    await cambiarLicencia(email.trim(), groupName, "asignar");
  };

  const onRevocar = async () => {
    if (!email.trim() || !groupName) return;
    await cambiarLicencia(email.trim(), groupName, "revocar");
  };

  const onCsv = async (file: File | null) => {
    setListaResultado(null);
    setFilas([]);
    setCsvName("");
    setTotalFilasCsv(0);
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseMatriculasCsv(text);
      setFilas(parsed.filas);
      setTotalFilasCsv(parsed.totalFilasCsv);
      setCsvName(file.name);
      setError(null);
      setMensaje(
        `${parsed.filas.length} alumnos únicos (${parsed.totalFilasCsv} filas CSV). Email: AL+Matrícula@tecmilenio.mx`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV inválido");
    }
  };

  const onAsignarLista = async () => {
    if (!filas.length) return;
    if (perfilId !== "alumno") {
      setError(
        "El CSV con matrícula (AL*@tecmilenio.mx) solo aplica a Perfil alumno. El formato de profesores está por definir."
      );
      return;
    }
    if (!groupName) return;
    try {
      assertEmailsFormatoAlumno(filas.map((f) => f.email));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Formato de correo inválido");
      return;
    }
    const result = await cambiarLicenciaLista(
      filas.map((f) => f.email),
      groupName,
      "asignar"
    );
    if (result) {
      setListaResultado({
        ok: Boolean(result.ok),
        completed: result.completed,
        notCompleted: result.notCompleted,
        total: result.total,
        errors: result.errors,
      });
    }
  };

  const onRevocarLista = async () => {
    if (!filas.length) return;
    if (perfilId !== "alumno") {
      setError(
        "El CSV con matrícula (AL*@tecmilenio.mx) solo aplica a Perfil alumno. El formato de profesores está por definir."
      );
      return;
    }
    if (!groupName) return;
    try {
      assertEmailsFormatoAlumno(filas.map((f) => f.email));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Formato de correo inválido");
      return;
    }
    const result = await cambiarLicenciaLista(
      filas.map((f) => f.email),
      groupName,
      "revocar"
    );
    if (result) {
      setListaResultado({
        ok: Boolean(result.ok),
        completed: result.completed,
        notCompleted: result.notCompleted,
        total: result.total,
        errors: result.errors,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page-title flex items-center gap-2">
          <KeyRound className="w-7 h-7 text-emerald-700" />
          Asignación licencias
        </h1>
        <p className="text-page-subtitle">
          Asigna o revoca el perfil Adobe (uno a uno o lista CSV de matrículas)
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setModo("individual")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
            modo === "individual"
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-border bg-white text-muted-foreground"
          }`}
        >
          <UserRound className="w-3.5 h-3.5 inline mr-1.5" />
          Individual
        </button>
        <button
          type="button"
          onClick={() => {
            setModo("lista");
            setPerfilId("alumno");
            setError(null);
            setMensaje(null);
            setListaResultado(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
            modo === "lista"
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-border bg-white text-muted-foreground"
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5 inline mr-1.5" />
          Lista CSV (alumnos)
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {mensaje}
        </div>
      )}

      {modo === "individual" ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-6 space-y-5 max-w-3xl">
          <form onSubmit={(e) => void onBuscar(e)} className="space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Correo del usuario (Adobe)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@tecmilenio.mx"
                className={INPUT}
                required
              />
              <button
                type="submit"
                disabled={buscando || procesando}
                className="btn-primary px-4 py-2 disabled:opacity-50 shrink-0"
              >
                <Search className="w-4 h-4" />
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </form>

          {user && (
            <div className="rounded-xl border border-border bg-gray-50/80 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <UserRound className="w-4 h-4 text-emerald-700" />
                {user.firstname} {user.lastname}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                status={user.status} · type={user.type} · domain={user.domain}
              </p>
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Grupos actuales ({user.groups.length})
                </p>
                {user.groups.length === 0 ? (
                  <p className="text-xs text-muted-foreground">(ninguno)</p>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {user.groups.map((g) => (
                      <li
                        key={g}
                        className={`text-xs px-2 py-1 rounded-full border ${
                          g === groupName
                            ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                            : "bg-white border-border text-muted-foreground"
                        }`}
                      >
                        {g}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <PerfilSelect
            perfilId={perfilId}
            setPerfilId={setPerfilId}
            groupName={groupName}
            hint={
              user && groupName
                ? yaTienePerfil
                  ? "Este usuario ya tiene ese perfil."
                  : "Este usuario aún no tiene ese perfil."
                : null
            }
          />

          <div className="flex flex-col sm:flex-row gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => void onAsignar()}
              disabled={!user || !groupName || procesando || yaTienePerfil}
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              {procesando ? "Procesando..." : "Asignar"}
            </button>
            <button
              type="button"
              onClick={() => void onRevocar()}
              disabled={!user || !groupName || procesando || !yaTienePerfil}
              className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <MinusCircle className="w-4 h-4 inline mr-1.5" />
              Revocar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-6 space-y-5 max-w-3xl">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">
              CSV detalle alumno y grupos
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Solo <span className="font-medium text-foreground">Perfil alumno</span>.
              Columna <span className="font-mono">Matrícula</span>, quita la{" "}
              <span className="font-mono">T</span> inicial →{" "}
              <span className="font-mono">AL{"{matricula}"}@tecmilenio.mx</span>{" "}
              (ej. T07208601 → al07208601@tecmilenio.mx). Deduplica alumnos.
              Formato CSV profesores: por definir.
            </p>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-gray-50/80 px-4 py-8 cursor-pointer hover:border-emerald-400 transition-colors">
              <Upload className="w-6 h-6 text-emerald-700" />
              <span className="text-sm text-muted-foreground">
                {csvName || "Seleccionar detalle_alumno_y_grupos.csv"}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => void onCsv(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <PerfilSelect
            perfilId={perfilId}
            setPerfilId={setPerfilId}
            groupName={groupName}
            soloAlumno
            hint={
              filas.length
                ? `${filas.length} alumnos únicos · ${totalFilasCsv} filas del CSV`
                : "Bloqueado a Perfil alumno (formato AL). Profesores: CSV pendiente."
            }
          />

          {filas.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Matrícula</th>
                      <th className="text-left px-3 py-2 font-medium">Email Adobe</th>
                      <th className="text-left px-3 py-2 font-medium">Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.slice(0, 50).map((f) => (
                      <tr key={f.email} className="border-t border-border">
                        <td className="px-3 py-1.5 font-mono">{f.matricula}</td>
                        <td className="px-3 py-1.5 font-mono text-muted-foreground">
                          {f.email}
                        </td>
                        <td className="px-3 py-1.5">{f.nombre || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filas.length > 50 && (
                <p className="text-[11px] text-muted-foreground px-3 py-2 border-t border-border">
                  Mostrando 50 de {filas.length}. Se enviarán todos a Adobe.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => void onAsignarLista()}
              disabled={
                !filas.length ||
                perfilId !== "alumno" ||
                !groupName ||
                procesando
              }
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              {procesando
                ? "Asignando en lotes..."
                : `Asignar lista (${filas.length || 0})`}
            </button>
            <button
              type="button"
              onClick={() => void onRevocarLista()}
              disabled={
                !filas.length ||
                perfilId !== "alumno" ||
                !groupName ||
                procesando
              }
              className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <MinusCircle className="w-4 h-4 inline mr-1.5" />
              Revocar lista
            </button>
          </div>

          {listaResultado && (
            <div className="rounded-lg border border-border bg-gray-50/80 px-4 py-3 text-xs space-y-1">
              <p>
                Resultado: {listaResultado.completed ?? 0} ok ·{" "}
                {listaResultado.notCompleted ?? 0} error · total{" "}
                {listaResultado.total ?? 0}
              </p>
              {(listaResultado.errors?.length ?? 0) > 0 && (
                <ul className="text-red-700 list-disc pl-4 max-h-32 overflow-auto">
                  {listaResultado.errors!.slice(0, 20).map((e, i) => (
                    <li key={`${e.user}-${i}`}>
                      {e.user}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PerfilSelect({
  perfilId,
  setPerfilId,
  groupName,
  hint,
  soloAlumno = false,
}: {
  perfilId: PerfilLicenciaId | "";
  setPerfilId: (v: PerfilLicenciaId | "") => void;
  groupName: string;
  hint: string | null;
  soloAlumno?: boolean;
}) {
  const opciones = soloAlumno
    ? PERFILES_LICENCIA.filter((p) => p.id === "alumno")
    : PERFILES_LICENCIA;
  const perfil = PERFILES_LICENCIA.find((p) => p.id === perfilId);
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground block">
        Perfil de licencia
      </label>
      <select
        value={perfilId}
        onChange={(e) => setPerfilId(e.target.value as PerfilLicenciaId | "")}
        className={INPUT}
        disabled={soloAlumno}
      >
        {!soloAlumno && <option value="">Seleccionar perfil</option>}
        {opciones.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      {perfil && (
        <p className="text-xs text-muted-foreground font-mono">
          Adobe: {groupName}
        </p>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
