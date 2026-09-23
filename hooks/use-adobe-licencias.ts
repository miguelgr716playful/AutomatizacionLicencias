"use client";

import { useCallback, useState } from "react";
import type {
  AdobeLicenciaAccion,
  AdobeLicenciaResult,
  AdobeUserDto,
} from "@/application/dto/adobe-licencias.dto";
import {
  API_BASE_URL,
  getAdobeLicenciasUrl,
  getAdobeUsuarioUrl,
} from "@/lib/api-config";
import { isPerfilLicenciaPermitido } from "@/lib/perfiles-licencia";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: string;
      errors?: Array<{ message?: string }>;
      required?: string[];
    };
    if (data.error) {
      if (Array.isArray(data.required) && data.required.length) {
        return `${data.error} (${data.required.join(", ")})`;
      }
      return data.error;
    }
    if (data.errors?.[0]?.message) return data.errors[0].message;
  } catch {
    /* ignore */
  }
  return `Error ${res.status}`;
}

export function useAdobeLicencias() {
  const [user, setUser] = useState<AdobeUserDto | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const apiDisponible = Boolean(API_BASE_URL);

  const buscarUsuario = useCallback(
    async (email: string) => {
      if (!apiDisponible) {
        setError("API no configurada (NEXT_PUBLIC_API_BASE_URL)");
        return null;
      }
      const normalized = email.trim().toLowerCase();
      if (!normalized.includes("@")) {
        setError("Ingresa un correo válido");
        return null;
      }
      setBuscando(true);
      setError(null);
      setMensaje(null);
      setUser(null);
      try {
        const res = await fetch(getAdobeUsuarioUrl(normalized), {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(await parseError(res));
        const data = (await res.json()) as { user: AdobeUserDto };
        setUser(data.user);
        return data.user;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se encontró el usuario"
        );
        return null;
      } finally {
        setBuscando(false);
      }
    },
    [apiDisponible]
  );

  const cambiarLicencia = useCallback(
    async (
      email: string,
      groupName: string,
      accion: AdobeLicenciaAccion
    ): Promise<AdobeLicenciaResult | null> => {
      if (!isPerfilLicenciaPermitido(groupName)) {
        setError("Solo se permiten los perfiles de licencia configurados");
        return null;
      }
      setProcesando(true);
      setError(null);
      setMensaje(null);
      try {
        const res = await fetch(getAdobeLicenciasUrl(), {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, groupName, accion }),
        });
        const data = (await res.json()) as AdobeLicenciaResult;
        if (!res.ok || !data.ok) {
          const detail =
            data.errors?.[0]?.message ||
            data.error ||
            data.message ||
            `No se pudo ${accion}`;
          setError(detail);
          if (data.user) setUser(data.user);
          return data;
        }
        if (data.user) setUser(data.user);
        setMensaje(
          accion === "asignar"
            ? `Licencia asignada: ${groupName}`
            : `Licencia revocada: ${groupName}`
        );
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : `Error al ${accion}`);
        return null;
      } finally {
        setProcesando(false);
      }
    },
    []
  );

  const cambiarLicenciaLista = useCallback(
    async (
      emails: string[],
      groupName: string,
      accion: "asignar" | "revocar"
    ): Promise<AdobeLicenciaResult | null> => {
      if (!isPerfilLicenciaPermitido(groupName)) {
        setError("Solo se permiten los perfiles de licencia configurados");
        return null;
      }
      if (!emails.length) {
        setError("La lista de correos está vacía");
        return null;
      }
      setProcesando(true);
      setError(null);
      setMensaje(null);
      try {
        const res = await fetch(getAdobeLicenciasUrl(), {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emails, groupName, accion }),
        });
        const data = (await res.json()) as AdobeLicenciaResult;
        if (!res.ok && res.status !== 207) {
          throw new Error(
            data.error || data.message || `Error HTTP ${res.status}`
          );
        }
        const okCount = data.completed ?? 0;
        const failCount = data.notCompleted ?? 0;
        const total = data.total ?? emails.length;
        if (data.ok) {
          setMensaje(
            `${accion === "asignar" ? "Asignadas" : "Revocadas"} ${okCount}/${total} · ${groupName}`
          );
        } else {
          setError(
            `Parcial: ${okCount} ok, ${failCount} con error de ${total}. Revisa el detalle.`
          );
          setMensaje(null);
        }
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Error al ${accion} lista`
        );
        return null;
      } finally {
        setProcesando(false);
      }
    },
    []
  );

  return {
    apiDisponible,
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
  };
}
