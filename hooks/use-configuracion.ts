"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConfiguracionResponse } from "@/application/dto/configuracion.dto";
import type { CampoMapeo } from "@/domain/entities/configuracion";
import type { SoftwareId } from "@/domain/value-objects/software";
import { container } from "@/infrastructure/di/container";
import {
  API_BASE_URL,
  getConfiguracionAdobeUrl,
  getConfiguracionUrl,
} from "@/lib/api-config";

export interface AdobeCredentialsForm {
  adobeOrgId: string;
  adobeClientId: string;
  adobeClientSecret: string;
  adobeClientSecretConfigured: boolean;
  adobeClientSecretHint: string;
  storage: string;
}

type BorradoresProveedor = Partial<Record<SoftwareId, CampoMapeo[]>>;

function clonarMapeos(
  proveedores: ConfiguracionResponse["proveedores"]
): BorradoresProveedor {
  return Object.fromEntries(
    proveedores.map((p) => [p.id, p.mapping.map((m) => ({ ...m }))])
  ) as BorradoresProveedor;
}

function mapeosIguales(a: CampoMapeo[], b: CampoMapeo[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (campo, i) =>
      campo.local.trim() === b[i].local.trim() &&
      campo.api.trim() === b[i].api.trim()
  );
}

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

const EMPTY_CREDS: AdobeCredentialsForm = {
  adobeOrgId: "",
  adobeClientId: "",
  adobeClientSecret: "",
  adobeClientSecretConfigured: false,
  adobeClientSecretHint: "",
  storage: "keyvault",
};

export function useConfiguracion() {
  const [data, setData] = useState<ConfiguracionResponse | null>(null);
  const [borradores, setBorradores] = useState<BorradoresProveedor>({});
  const [adobeCreds, setAdobeCreds] =
    useState<AdobeCredentialsForm>(EMPTY_CREDS);
  const [adobeCredsInicial, setAdobeCredsInicial] =
    useState<AdobeCredentialsForm>(EMPTY_CREDS);
  const [periodicidadBorrador, setPeriodicidadBorrador] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<
    "proveedores" | "programador" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [keyVaultConfigured, setKeyVaultConfigured] = useState(false);
  const [portalAdobeConfigured, setPortalAdobeConfigured] = useState(false);

  const apiDisponible = Boolean(API_BASE_URL);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    setMensaje(null);
    try {
      if (apiDisponible) {
        const res = await fetch(getConfiguracionUrl(), {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(await parseError(res));
        const json = (await res.json()) as ConfiguracionResponse & {
          keyVaultConfigured?: boolean;
          portalAdobeConfigured?: boolean;
          keyVaultError?: string | null;
          adobeCredentials?: Partial<AdobeCredentialsForm>;
        };
        setKeyVaultConfigured(Boolean(json.keyVaultConfigured));
        setPortalAdobeConfigured(Boolean(json.portalAdobeConfigured));
        if (json.keyVaultError) {
          setError(json.keyVaultError);
        }
        setData({
          proveedores: json.proveedores,
          programador: json.programador,
        });
        setBorradores(clonarMapeos(json.proveedores));
        setPeriodicidadBorrador(json.programador.periodicidad);

        const creds: AdobeCredentialsForm = {
          adobeOrgId: json.adobeCredentials?.adobeOrgId || "",
          adobeClientId: json.adobeCredentials?.adobeClientId || "",
          adobeClientSecret: "",
          adobeClientSecretConfigured: Boolean(
            json.adobeCredentials?.adobeClientSecretConfigured
          ),
          adobeClientSecretHint:
            json.adobeCredentials?.adobeClientSecretHint || "",
          storage: json.adobeCredentials?.storage || "keyvault",
        };
        setAdobeCreds(creds);
        setAdobeCredsInicial(creds);
      } else {
        const config = await container.obtenerConfiguracion.ejecutar();
        setKeyVaultConfigured(false);
        setPortalAdobeConfigured(false);
        setData(config);
        setBorradores(clonarMapeos(config.proveedores));
        setPeriodicidadBorrador(config.programador.periodicidad);
        setAdobeCreds(EMPTY_CREDS);
        setAdobeCredsInicial(EMPTY_CREDS);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la configuración"
      );
    } finally {
      setCargando(false);
    }
  }, [apiDisponible]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const actualizarCampoBorrador = useCallback(
    (
      proveedorId: SoftwareId,
      index: number,
      campo: keyof CampoMapeo,
      valor: string
    ) => {
      setBorradores((prev) => {
        const mapping = [...(prev[proveedorId] ?? [])];
        mapping[index] = { ...mapping[index], [campo]: valor };
        return { ...prev, [proveedorId]: mapping };
      });
    },
    []
  );

  const actualizarAdobeCred = useCallback(
    (campo: keyof AdobeCredentialsForm, valor: string) => {
      setAdobeCreds((prev) => ({ ...prev, [campo]: valor }));
    },
    []
  );

  const adobeCredsTienenCambios = useMemo(() => {
    if (
      adobeCreds.adobeOrgId.trim() !== adobeCredsInicial.adobeOrgId.trim() ||
      adobeCreds.adobeClientId.trim() !== adobeCredsInicial.adobeClientId.trim()
    ) {
      return true;
    }
    return adobeCreds.adobeClientSecret.trim().length > 0;
  }, [adobeCreds, adobeCredsInicial]);

  const mapeosTienenCambios = useMemo(() => {
    if (!data) return false;
    return data.proveedores
      .filter((p) => p.id !== "adobe")
      .some((p) => !mapeosIguales(p.mapping, borradores[p.id] ?? []));
  }, [borradores, data]);

  const proveedoresTienenCambios =
    adobeCredsTienenCambios || mapeosTienenCambios;

  const programadorTieneCambios = useMemo(
    () =>
      !!data && periodicidadBorrador !== data.programador.periodicidad,
    [data, periodicidadBorrador]
  );

  const guardarProveedores = useCallback(async () => {
    if (!data) return;

    setGuardando("proveedores");
    setError(null);
    setMensaje(null);

    try {
      let proveedores = data.proveedores;

      if (apiDisponible && adobeCredsTienenCambios) {
        if (!adobeCreds.adobeOrgId.trim() || !adobeCreds.adobeClientId.trim()) {
          throw new Error("AdobeOrgId y AdobeClientId son requeridos");
        }
        if (
          !adobeCreds.adobeClientSecret.trim() &&
          !adobeCreds.adobeClientSecretConfigured
        ) {
          throw new Error("AdobeClientSecret es requerido la primera vez");
        }

        const res = await fetch(getConfiguracionAdobeUrl(), {
          method: "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adobeOrgId: adobeCreds.adobeOrgId.trim(),
            adobeClientId: adobeCreds.adobeClientId.trim(),
            adobeClientSecret: adobeCreds.adobeClientSecret.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error(await parseError(res));
        const json = (await res.json()) as {
          adobeCredentials: Partial<AdobeCredentialsForm>;
        };
        const next: AdobeCredentialsForm = {
          adobeOrgId: json.adobeCredentials?.adobeOrgId || "",
          adobeClientId: json.adobeCredentials?.adobeClientId || "",
          adobeClientSecret: "",
          adobeClientSecretConfigured: Boolean(
            json.adobeCredentials?.adobeClientSecretConfigured
          ),
          adobeClientSecretHint:
            json.adobeCredentials?.adobeClientSecretHint || "",
          storage: json.adobeCredentials?.storage || "keyvault",
        };
        setAdobeCreds(next);
        setAdobeCredsInicial(next);
        setKeyVaultConfigured(true);
        setMensaje(
          "Credenciales Adobe guardadas en Key Vault. Portal UMAPI y Data Factory usan los mismos secretos vía Function App."
        );
      }

      const pendientesMapeo = data.proveedores.filter((p) => {
        if (p.id === "adobe") return false;
        const mapping = borradores[p.id];
        if (!mapping?.length) return false;
        return !mapeosIguales(p.mapping, mapping);
      });

      for (const proveedor of pendientesMapeo) {
        const mapping = (borradores[proveedor.id] ?? []).map((m) => ({
          local: m.local.trim(),
          api: m.api.trim(),
        }));
        if (mapping.some((m) => !m.local || !m.api)) {
          throw new Error("Todos los campos de mapeo deben tener valor");
        }
        proveedores = await container.guardarMapeoProveedor.ejecutar({
          proveedorId: proveedor.id,
          mapping,
        });
      }

      setData((prev) => (prev ? { ...prev, proveedores } : prev));
      setBorradores(clonarMapeos(proveedores));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los proveedores"
      );
    } finally {
      setGuardando(null);
    }
  }, [adobeCreds, adobeCredsTienenCambios, apiDisponible, borradores, data]);

  const guardarProgramador = useCallback(async () => {
    if (!periodicidadBorrador.trim()) return;

    setGuardando("programador");
    setError(null);
    try {
      const programador = await container.actualizarPeriodicidad.ejecutar(
        periodicidadBorrador
      );
      setData((prev) => (prev ? { ...prev, programador } : prev));
      setPeriodicidadBorrador(programador.periodicidad);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la programación"
      );
    } finally {
      setGuardando(null);
    }
  }, [periodicidadBorrador]);

  return {
    data,
    borradores,
    adobeCreds,
    periodicidadBorrador,
    cargando,
    guardando,
    error,
    mensaje,
    keyVaultConfigured,
    portalAdobeConfigured,
    apiDisponible,
    actualizarCampoBorrador,
    actualizarAdobeCred,
    setPeriodicidadBorrador,
    proveedoresTienenCambios,
    programadorTieneCambios,
    guardarProveedores,
    guardarProgramador,
  };
}
