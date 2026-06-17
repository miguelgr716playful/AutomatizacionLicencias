"use client";

import { useState } from "react";
import { Plus, Edit3, ChevronDown, Clock, CalendarDays } from "lucide-react";
import { adobeMapping, minitabMapping } from "@/lib/mock-data";

export function ConfiguracionSection() {
  const [editField, setEditField] = useState<string | null>(null);
  const [periodicidad, setPeriodicidad] = useState("Diario (Nocturno)");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Configuración del Sistema
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Proveedores de licencias y sincronización automática con Banner
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Configuración de Proveedores
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Adobe Creative Cloud", icon: "AC", mapping: adobeMapping },
            { name: "Minitab", icon: "Mt", mapping: minitabMapping },
          ].map(({ name, icon, mapping }) => (
            <div key={name} className="border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded bg-emerald-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-700">
                    {icon}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {name}
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
                            editField === `${name}-${m.local}`
                              ? null
                              : `${name}-${m.local}`
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
        <h2 className="text-base font-semibold text-foreground">
          Programador de Tareas
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 mb-5">
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
                  value={periodicidad}
                  onChange={(e) => setPeriodicidad(e.target.value)}
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
                Hoy, 23:59 hrs
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
