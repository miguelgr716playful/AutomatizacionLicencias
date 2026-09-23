"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/lib/constants";
import {
  getDefaultHrefForRole,
  isSectionAllowedForRole,
} from "@/lib/constants";
import {
  getAuthLogoutUrl,
  getAuthMeUrl,
  isSamlLoginEnabled,
} from "@/lib/api-config";

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: Role;
  givenName?: string | null;
  sn?: string | null;
  employeeType?: string | null;
  claims?: Record<string, string | string[]>;
}

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  user: AuthUser | null;
  cargando: boolean;
  samlActivo: boolean;
  refreshSession: (opts?: { silent?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

function isAppPath(pathname: string) {
  return (
    pathname.startsWith("/aprovisionar") ||
    pathname.startsWith("/asignacion-licencias") ||
    pathname.startsWith("/cuotas-adobe") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/reportes") ||
    pathname.startsWith("/configuracion") ||
    pathname.startsWith("/usuarios")
  );
}

function normalizeRole(value: unknown): Role {
  if (value === "admin" || value === "ejecutor" || value === "auditor") {
    return value;
  }
  return "ejecutor";
}

function pickNombre(data: {
  nombre?: string;
  email?: string;
  givenName?: string | null;
  givenname?: string | null;
  sn?: string | null;
  claims?: Record<string, string | string[]>;
}): string {
  const claims = data.claims || {};
  const claim = (key: string) => {
    const v = claims[key];
    if (Array.isArray(v)) return v[0] || "";
    return typeof v === "string" ? v : "";
  };

  const given =
    data.givenName ||
    data.givenname ||
    claim("givenName") ||
    claim("givenname") ||
    claim(
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
    ) ||
    claim(
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenName"
    );
  const family =
    data.sn ||
    claim("sn") ||
    claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sn");
  const composed = [given, family].filter(Boolean).join(" ").trim();

  const raw = (data.nombre || "").trim();
  if (raw && raw !== "Usuario") return raw;
  if (composed) return composed;
  if (data.email?.includes("@")) return data.email;
  return raw || "Usuario";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const samlActivo = isSamlLoginEnabled();
  const [role, setRoleState] = useState<Role>("admin");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cargando, setCargando] = useState(samlActivo);
  const router = useRouter();
  const pathname = usePathname();

  const refreshSession = useCallback(async (opts?: { silent?: boolean }) => {
    if (!samlActivo) {
      setCargando(false);
      return;
    }

    const silent = Boolean(opts?.silent);
    // silent: no desmontar la UI (p. ej. al volver del file picker del CSV)
    if (!silent) setCargando(true);
    try {
      const res = await fetch(`${getAuthMeUrl()}?_=${Date.now()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        // En refresh silencioso, no botar al login por un 401/transitorio
        // si aún no hay certeza (evita perder el CSV seleccionado).
        if (silent) return;
        setUser(null);
        setRoleState("ejecutor");
        if (isAppPath(pathname)) {
          router.replace("/login");
        }
        return;
      }

      const data = (await res.json()) as {
        id?: string;
        email?: string;
        nombre?: string;
        rol?: string;
        givenName?: string | null;
        givenname?: string | null;
        sn?: string | null;
        employeeType?: string | null;
        claims?: Record<string, string | string[]>;
      };

      const nextRole = normalizeRole(data.rol);
      const givenName = data.givenName ?? data.givenname ?? null;
      const nextUser: AuthUser = {
        id: data.id || data.email || "usuario",
        email: data.email || "",
        nombre: pickNombre({ ...data, givenName }),
        rol: nextRole,
        givenName,
        sn: data.sn ?? null,
        employeeType: data.employeeType ?? null,
        claims: data.claims || {},
      };

      setUser(nextUser);
      setRoleState(nextRole);

      if (pathname === "/login") {
        router.replace(getDefaultHrefForRole(nextRole));
        return;
      }

      if (!isSectionAllowedForRole(pathname, nextRole)) {
        router.replace(getDefaultHrefForRole(nextRole));
      }
    } catch {
      if (silent) return;
      setUser(null);
      if (isAppPath(pathname)) {
        router.replace("/login");
      }
    } finally {
      if (!silent) setCargando(false);
    }
  }, [pathname, router, samlActivo]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!samlActivo) return;
    const onFocus = () => {
      void refreshSession({ silent: true });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshSession, samlActivo]);

  const setRole = useCallback(
    (nextRole: Role) => {
      if (samlActivo) return;
      setRoleState(nextRole);
      if (!isSectionAllowedForRole(pathname, nextRole)) {
        router.push(getDefaultHrefForRole(nextRole));
      }
    },
    [pathname, router, samlActivo]
  );

  const logout = useCallback(async () => {
    if (samlActivo) {
      const logoutUrl = getAuthLogoutUrl();
      // Navegación completa para enviar cookie cross-site y limpiar sesión SP
      window.location.href = `${logoutUrl}?redirect=1`;
      return;
    }
    setUser(null);
    setRoleState("admin");
    router.push("/login");
  }, [router, samlActivo]);

  const value = useMemo(
    () => ({
      role,
      setRole,
      user,
      cargando,
      samlActivo,
      refreshSession,
      logout,
    }),
    [role, setRole, user, cargando, samlActivo, refreshSession, logout]
  );

  return (
    <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole debe usarse dentro de RoleProvider");
  }
  return context;
}
