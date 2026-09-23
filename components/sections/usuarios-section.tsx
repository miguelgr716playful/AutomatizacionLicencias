"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { useUsuarios } from "@/hooks/use-usuarios";
import { useRole } from "@/components/layout/role-provider";
import type {
  AuthorizedUserDto,
  UsuarioPayload,
} from "@/application/dto/usuarios.dto";
import { ROLE_LABELS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const INPUT =
  "w-full text-sm px-3 py-2 rounded-lg border border-border bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

const EMPTY_FORM: UsuarioPayload = {
  email: "",
  nombre: "",
  nomina: "",
  rol: "ejecutor",
};

function RolBadge({ rol }: { rol: AuthorizedUserDto["rol"] }) {
  const styles =
    rol === "admin"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${styles}`}
    >
      {ROLE_LABELS[rol]}
    </span>
  );
}

export function UsuariosSection() {
  const { role, user: sessionUser } = useRole();
  const {
    users,
    cargando,
    guardando,
    error,
    cargar,
    crear,
    actualizar,
    eliminar,
    setError,
  } = useUsuarios();

  const [busqueda, setBusqueda] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState<UsuarioPayload>(EMPTY_FORM);
  const [eliminarEmail, setEliminarEmail] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.nombre.toLowerCase().includes(q) ||
        (u.nomina || "").toLowerCase().includes(q)
    );
  }, [users, busqueda]);

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Solo administradores pueden gestionar usuarios autorizados.
      </div>
    );
  }

  const abrirAlta = () => {
    setError(null);
    setModoEdicion(false);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const abrirEdicion = (u: AuthorizedUserDto) => {
    setError(null);
    setModoEdicion(true);
    setForm({
      email: u.email,
      nombre: u.nombre,
      nomina: u.nomina || "",
      rol: u.rol,
    });
    setDialogOpen(true);
  };

  const guardar = async () => {
    const payload: UsuarioPayload = {
      email: form.email.trim().toLowerCase(),
      nombre: form.nombre.trim(),
      nomina: form.nomina?.trim() || undefined,
      rol: form.rol,
    };

    if (!payload.email.includes("@")) {
      setError("Correo inválido");
      return;
    }
    if (!payload.nombre) {
      setError("Nombre requerido");
      return;
    }

    const ok = modoEdicion ? await actualizar(payload) : await crear(payload);
    if (ok) setDialogOpen(false);
  };

  const confirmarEliminar = async () => {
    if (!eliminarEmail) return;
    const ok = await eliminar(eliminarEmail);
    if (ok) setEliminarEmail(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-page-title flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-700" />
            Usuarios autorizados
          </h1>
          <p className="text-page-subtitle">
            Alta, baja y edición de acceso post-login AMFS (Azure Table Storage)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void cargar()}
            disabled={cargando || guardando}
            className="px-4 py-2 rounded-lg border border-border bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 inline mr-1.5 ${cargando ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <button type="button" onClick={abrirAlta} className="btn-primary px-4 py-2">
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o nómina..."
            className={`${INPUT} pl-9`}
          />
        </div>

        {cargando ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Cargando usuarios...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {users.length === 0
              ? "No hay usuarios en la tabla AuthorizedUsers."
              : "Sin resultados para la búsqueda."}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Correo</th>
                  <th className="px-3 py-2 font-medium">Nómina</th>
                  <th className="px-3 py-2 font-medium">Rol</th>
                  <th className="px-3 py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((u) => {
                  const esYo =
                    sessionUser?.email &&
                    u.email.toLowerCase() === sessionUser.email.toLowerCase();
                  return (
                    <tr
                      key={u.email}
                      className="border-b border-border/60 last:border-0 hover:bg-gray-50/80"
                    >
                      <td className="px-3 py-3 font-medium text-foreground">
                        {u.nombre}
                        {esYo && (
                          <span className="ml-2 text-xs text-emerald-600">(tú)</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-3 py-3 text-muted-foreground font-mono text-xs">
                        {u.nomina || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <RolBadge rol={u.rol} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => abrirEdicion(u)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEliminarEmail(u.email)}
                            disabled={Boolean(esYo)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none"
                            title={esYo ? "No puedes eliminarte" : "Eliminar"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-1">
          {filtrados.length} de {users.length} usuario(s)
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modoEdicion ? "Editar usuario" : "Nuevo usuario"}
            </DialogTitle>
            <DialogDescription>
              El correo debe coincidir con el de AMFS. Solo estos usuarios pueden
              entrar al portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Correo
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={modoEdicion}
                className={`${INPUT} disabled:opacity-60`}
                placeholder="usuario@tecmilenio.mx"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Nombre
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className={INPUT}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Nómina (opcional)
              </label>
              <input
                type="text"
                value={form.nomina || ""}
                onChange={(e) => setForm((f) => ({ ...f, nomina: e.target.value }))}
                className={INPUT}
                placeholder="L03085867"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Rol
              </label>
              <select
                value={form.rol}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    rol: e.target.value as UsuarioPayload["rol"],
                  }))
                }
                className={INPUT}
              >
                <option value="ejecutor">Ejecutor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={guardando}
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : modoEdicion ? "Guardar cambios" : "Crear"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(eliminarEmail)}
        onOpenChange={(open) => !open && setEliminarEmail(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar acceso?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará <strong>{eliminarEmail}</strong> de la allowlist. Ya no
              podrá entrar al portal tras cerrar sesión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmarEliminar()}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
