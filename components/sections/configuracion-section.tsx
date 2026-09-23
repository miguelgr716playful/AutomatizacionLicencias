"use client";

import { ChevronDown, Clock, CalendarDays, Save } from "lucide-react";
import { useConfiguracion } from "@/hooks/use-configuracion";

const CAMPO_MAPEO_INPUT =
  "w-full text-xs font-mono font-normal text-foreground px-2.5 py-2 rounded-lg border border-border bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors";

export function ConfiguracionSection() {
  const {
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
    actualizarCampoBorrador,
    actualizarAdobeCred,
    setPeriodicidadBorrador,
    proveedoresTienenCambios,
    programadorTieneCambios,
    guardarProveedores,
    guardarProgramador,
  } = useConfiguracion();

  if (cargando || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando configuración...
      </div>
    );
  }

  const { proveedores, programador } = data;
  const minitab = proveedores.find((p) => p.id === "minitab");
  const minitabMapping = borradores.minitab ?? minitab?.mapping ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page-title">Configuración del Sistema</h1>
        <p className="text-page-subtitle">
          Proveedores de licencias y sincronización automática con Banner
        </p>
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

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h2 className="text-section-title">Configuración de Proveedores</h2>
            <p className="text-section-subtitle">
              Adobe → Key Vault vía Function App
              {keyVaultConfigured ? " · KV conectado" : " · falta FaApiKey / FA"}.
              Portal UMAPI:{" "}
              {portalAdobeConfigured
                ? "credenciales OK en KV"
                : "faltan secretos Adobe en KV"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void guardarProveedores()}
            disabled={!proveedoresTienenCambios || guardando === "proveedores"}
            className="btn-primary px-4 py-2"
          >
            <Save className="w-4 h-4" />
            {guardando === "proveedores"
              ? "Guardando..."
              : "Guardar proveedores"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded bg-emerald-100 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-700">AC</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground flex-1">
                Adobe
              </h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800">
                Key Vault · FA
              </span>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Guarda AdobeOrgId / ClientId / ClientSecret en Key Vault. Los usa
              el portal (cuotas, licencias, miembros), Data Factory y la
              Function App — no App Settings Adobe del SWA.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  AdobeOrgId
                </label>
                <input
                  type="text"
                  value={adobeCreds.adobeOrgId}
                  onChange={(e) =>
                    actualizarAdobeCred("adobeOrgId", e.target.value)
                  }
                  className={CAMPO_MAPEO_INPUT}
                  placeholder="XXXX@AdobeOrg"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  AdobeClientId
                </label>
                <input
                  type="text"
                  value={adobeCreds.adobeClientId}
                  onChange={(e) =>
                    actualizarAdobeCred("adobeClientId", e.target.value)
                  }
                  className={CAMPO_MAPEO_INPUT}
                  placeholder="Client ID OAuth S2S"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  AdobeClientSecret
                </label>
                <input
                  type="password"
                  value={adobeCreds.adobeClientSecret}
                  onChange={(e) =>
                    actualizarAdobeCred("adobeClientSecret", e.target.value)
                  }
                  className={CAMPO_MAPEO_INPUT}
                  placeholder={
                    adobeCreds.adobeClientSecretConfigured
                      ? `Guardado (${adobeCreds.adobeClientSecretHint || "••••"}) — deja vacío para no cambiar`
                      : "Client secret"
                  }
                  autoComplete="new-password"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Destino: Key Vault (portal + ADF vía FA)
                {adobeCreds.adobeClientSecretConfigured
                  ? " · secretos presentes"
                  : ""}
              </p>
            </div>
          </div>

          {minitab && (
            <div className="border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded bg-emerald-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-700">
                    {minitab.icon}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground flex-1">
                  {minitab.nombre}
                </h3>
              </div>
              <div className="space-y-0">
                <div className="grid grid-cols-2 gap-2 border-b border-border pb-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground px-0.5">
                    Campo Local (Banner)
                  </span>
                  <span className="text-xs font-medium text-muted-foreground px-0.5">
                    Campo Proveedor API
                  </span>
                </div>
                {minitabMapping.map((m, index) => (
                  <div
                    key={`minitab-${index}`}
                    className="grid grid-cols-2 items-center gap-2 py-2 border-b border-border last:border-0"
                  >
                    <input
                      type="text"
                      value={m.local}
                      onChange={(e) =>
                        actualizarCampoBorrador(
                          "minitab",
                          index,
                          "local",
                          e.target.value
                        )
                      }
                      className={CAMPO_MAPEO_INPUT}
                      aria-label={`Campo local Banner fila ${index + 1}`}
                    />
                    <input
                      type="text"
                      value={m.api}
                      onChange={(e) =>
                        actualizarCampoBorrador(
                          "minitab",
                          index,
                          "api",
                          e.target.value
                        )
                      }
                      className={CAMPO_MAPEO_INPUT}
                      aria-label={`Campo API para ${m.local}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-section-title">Programador de Tareas</h2>
        <p className="text-section-subtitle mb-5">
          Configura la sincronización automática con Banner
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Periodicidad de Sincronización
              </label>
              <div className="relative">
                <select
                  value={periodicidadBorrador}
                  onChange={(e) => setPeriodicidadBorrador(e.target.value)}
                  className={`${CAMPO_MAPEO_INPUT} text-sm py-2.5 appearance-none`}
                >
                  <option>Diario (Nocturno)</option>
                  <option>Cada 12 horas</option>
                  <option>Semanal</option>
                  <option>Manual</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-4 py-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Próxima ejecución programada:
              </span>
              <span className="text-emerald-600 font-semibold">
                {programador.proximaEjecucion}
              </span>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void guardarProgramador()}
                disabled={
                  !programadorTieneCambios || guardando === "programador"
                }
                className="btn-primary px-4 py-2"
              >
                <Save className="w-4 h-4" />
                {guardando === "programador"
                  ? "Guardando..."
                  : "Guardar programación"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <CalendarDays className="w-16 h-16 text-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
