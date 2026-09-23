"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  AdobeMiembroDto,
  AdobeMiembrosDto,
} from "@/application/dto/adobe-licencias.dto";
import { API_BASE_URL, getAdobeMiembrosUrl } from "@/lib/api-config";
import { descargarAdobeMiembrosCsv } from "@/lib/export-adobe-miembros-csv";

const PAGE_SIZE = 50;

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    /* ignore */
  }
  return `Error ${res.status}`;
}

/** FA C# antigua anidaba en `result`; el front espera lastPage/users en la raíz. */
function normalizeMiembrosResponse(
  raw: AdobeMiembrosDto & { result?: Partial<AdobeMiembrosDto> }
): AdobeMiembrosDto {
  if (raw.result && raw.lastPage === undefined) {
    return { ...raw, ...raw.result };
  }
  return raw;
}

export type AdobeMiembrosPerfil = "alumno" | "profesor";

export type AdobeMiembrosSortKey =
  | "email"
  | "nombre"
  | "username"
  | "status"
  | "domain"
  | "type";

export type AdobeMiembrosSortDir = "asc" | "desc";

function sortValue(row: AdobeMiembroDto, key: AdobeMiembrosSortKey): string {
  switch (key) {
    case "nombre":
      return `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim().toLowerCase();
    case "email":
      return (row.email ?? "").toLowerCase();
    case "username":
      return (row.username ?? "").toLowerCase();
    case "status":
      return (row.status ?? "").toLowerCase();
    case "domain":
      return (row.domain ?? "").toLowerCase();
    case "type":
      return (row.type ?? "").toLowerCase();
    default:
      return "";
  }
}

export function useAdobeMiembrosDetalle(perfil: AdobeMiembrosPerfil) {
  const [miembros, setMiembros] = useState<AdobeMiembroDto[]>([]);
  const [meta, setMeta] = useState<Pick<
    AdobeMiembrosDto,
    "displayGroupName" | "groupName" | "label"
  > | null>(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [exportando, setExportando] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<AdobeMiembrosSortKey>("email");
  const [sortDir, setSortDir] = useState<AdobeMiembrosSortDir>("asc");

  const apiDisponible = Boolean(API_BASE_URL);
  const entidad = perfil === "profesor" ? "colaboradores" : "alumnos";
  const csvPrefix =
    perfil === "profesor"
      ? "colaboradores-profesores-tecmilenio"
      : "alumnos-tecmilenio";

  const cargar = useCallback(async () => {
    if (!apiDisponible) {
      setError("API no configurada (NEXT_PUBLIC_API_BASE_URL)");
      return;
    }

    setCargando(true);
    setError(null);
    setProgreso("Consultando Adobe…");
    setMiembros([]);
    setPage(0);

    try {
      const todos: AdobeMiembroDto[] = [];
      let pagina = 0;
      let lastPage = false;
      let primera: AdobeMiembrosDto | null = null;

      while (!lastPage) {
        setProgreso(`Cargando página ${pagina + 1}…`);
        const res = await fetch(getAdobeMiembrosUrl(perfil, pagina), {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(await parseError(res));

        const json = normalizeMiembrosResponse(
          (await res.json()) as AdobeMiembrosDto & {
            result?: Partial<AdobeMiembrosDto>;
          }
        );
        if (!primera) {
          primera = json;
          setMeta({
            displayGroupName: json.displayGroupName,
            groupName: json.groupName,
            label: json.label,
          });
        }

        const batch = json.users ?? [];
        todos.push(...batch);
        lastPage =
          Boolean(json.lastPage) ||
          batch.length === 0 ||
          (json.rawCount != null && json.rawCount === 0);
        pagina += 1;
        if (pagina > 100) break;
      }

      setMiembros(todos);
      setFetchedAt(new Date().toISOString());
      setProgreso(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `No se pudieron cargar los ${entidad}`
      );
      setProgreso(null);
    } finally {
      setCargando(false);
    }
  }, [apiDisponible, entidad, perfil]);

  const toggleSort = useCallback((key: AdobeMiembrosSortKey) => {
    setPage(0);
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = !q
      ? [...miembros]
      : miembros.filter((m) => {
          const nombre = `${m.firstname} ${m.lastname}`.toLowerCase();
          return (
            m.email.toLowerCase().includes(q) ||
            nombre.includes(q) ||
            m.username.toLowerCase().includes(q)
          );
        });

    const factor = sortDir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return a.email.localeCompare(b.email) * factor;
    });

    return filtered;
  }, [miembros, search, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginados = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtrados.slice(start, start + PAGE_SIZE);
  }, [filtrados, page]);

  const activos = useMemo(
    () => miembros.filter((m) => m.status === "active").length,
    [miembros]
  );

  const exportarCsv = useCallback(
    async (soloFiltrados = true) => {
      const rows = soloFiltrados ? filtrados : miembros;
      if (rows.length === 0) return;
      setExportando(true);
      try {
        const fecha = new Date().toISOString().slice(0, 10);
        descargarAdobeMiembrosCsv(rows, `${csvPrefix}-${fecha}.csv`);
      } finally {
        setExportando(false);
      }
    },
    [csvPrefix, filtrados, miembros]
  );

  const quitarMiembro = useCallback((email: string) => {
    const key = email.trim().toLowerCase();
    setMiembros((prev) => prev.filter((m) => m.email.toLowerCase() !== key));
  }, []);

  const upsertMiembro = useCallback((row: AdobeMiembroDto) => {
    const key = row.email.trim().toLowerCase();
    setMiembros((prev) => {
      const idx = prev.findIndex((m) => m.email.toLowerCase() === key);
      if (idx === -1) return [row, ...prev];
      const next = [...prev];
      next[idx] = { ...next[idx], ...row };
      return next;
    });
  }, []);

  return {
    apiDisponible,
    perfil,
    entidad,
    meta,
    miembros,
    filtrados,
    paginados,
    total: filtrados.length,
    totalPages,
    page,
    setPage,
    pageSize: PAGE_SIZE,
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
    quitarMiembro,
    upsertMiembro,
  };
}
