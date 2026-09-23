"use client";

import { useCallback, useState } from "react";
import type { AdobeCuotasDto } from "@/application/dto/adobe-licencias.dto";
import { API_BASE_URL, getAdobeCuotasUrl } from "@/lib/api-config";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: string;
      required?: string[];
    };
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

export function useAdobeCuotas() {
  const [data, setData] = useState<AdobeCuotasDto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiDisponible = Boolean(API_BASE_URL);

  const cargar = useCallback(async () => {
    if (!apiDisponible) {
      setError("API no configurada (NEXT_PUBLIC_API_BASE_URL)");
      return null;
    }
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(getAdobeCuotasUrl(), {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(await parseError(res));
      const json = (await res.json()) as AdobeCuotasDto;
      setData(json);
      return json;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar las cuotas"
      );
      return null;
    } finally {
      setCargando(false);
    }
  }, [apiDisponible]);

  return { apiDisponible, data, cargando, error, cargar, setError };
}
