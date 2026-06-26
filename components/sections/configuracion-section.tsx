"use client";

import { Plus, Edit3, ChevronDown, Clock, CalendarDays } from "lucide-react";
import { useConfiguracion } from "@/hooks/use-configuracion";

export function ConfiguracionSection() {
  const { data, cargando, editField, setEditField, actualizarPeriodicidad } =
    useConfiguracion();

  if (cargando || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando configuración...
      </div>
    );
  }

  const { proveedores, programador } = data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page-title">Configuración del Sistema</h1>
        <p className="text-page-subtitle">
          Proveedores de licencias y sincronización automática con Banner
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-section-title">Configuración de Proveedores</h2>
            <p className="text-section-subtitle">
              Mapeo de datos entre el sistema local y las APIs externas
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Servicio
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {proveedores.map(({ nombre, icon, mapping }) => (
            <div key={nombre} className="border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded bg-emerald-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-700">
                    {icon}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {nombre}
                </h3>
              </div>
              <div className="space-y-0">
                <div className="grid grid-cols-2 border-b border-border pb-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Campo Local (Banner)
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    Campo Proveedor API
                  </span>
                </div>
                {mapping.map((m) => (
                  <div
                    key={m.local}
                    className="grid grid-cols-2 items-center py-2 border-b border-border last:border-0"
                  >
                    <span className="text-xs font-mono text-muted-foreground">
                      {m.local}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {m.api}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditField(
                            editField === `${nombre}-${m.local}`
                              ? null
                              : `${nombre}-${m.local}`
                          )
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
                  value={programador.periodicidad}
                  onChange={(e) => actualizarPeriodicidad(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
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
          </div>

          <div className="flex items-center justify-center">
            <CalendarDays className="w-16 h-16 text-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
