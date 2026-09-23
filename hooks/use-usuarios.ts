"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AuthorizedUserDto,
  UsuarioPayload,
} from "@/application/dto/usuarios.dto";
import { API_BASE_URL, getUsuariosUrl } from "@/lib/api-config";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string; required?: string[] };
    if (data.error) {
      if (Array.isArray(data.required) && data.required.length) {
        return `${data.error} (${data.required.join(", ")})`;
      }
      return data.error;
    }
  } catch {
    /* ignore */
  }
  return `Error ${res.status}`;
}

export function useUsuarios() {
  const [users, setUsers] = useState<AuthorizedUserDto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiDisponible = Boolean(API_BASE_URL);

  const cargar = useCallback(async () => {
    if (!apiDisponible) {
      setError("API no configurada (NEXT_PUBLIC_API_BASE_URL)");
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const res = await fetch(getUsuariosUrl(), {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(await parseError(res));
      const data = (await res.json()) as { users?: AuthorizedUserDto[] };
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar usuarios");
      setUsers([]);
    } finally {
      setCargando(false);
    }
  }, [apiDisponible]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = useCallback(
    async (payload: UsuarioPayload) => {
      setGuardando(true);
      setError(null);
      try {
        const res = await fetch(getUsuariosUrl(), {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseError(res));
        await cargar();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo crear usuario");
        return false;
      } finally {
        setGuardando(false);
      }
    },
    [cargar]
  );

  const actualizar = useCallback(
    async (payload: UsuarioPayload) => {
      setGuardando(true);
      setError(null);
      try {
        const res = await fetch(getUsuariosUrl(), {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseError(res));
        await cargar();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo actualizar usuario"
        );
        return false;
      } finally {
        setGuardando(false);
      }
    },
    [cargar]
  );

  const eliminar = useCallback(
    async (email: string) => {
      setGuardando(true);
      setError(null);
      try {
        const res = await fetch(getUsuariosUrl(email), {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(await parseError(res));
        await cargar();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo eliminar usuario"
        );
        return false;
      } finally {
        setGuardando(false);
      }
    },
    [cargar]
  );

  return {
    users,
    cargando,
    guardando,
    error,
    apiDisponible,
    cargar,
    crear,
    actualizar,
    eliminar,
    setError,
  };
}
