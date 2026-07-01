"use client";

import {
  CheckCircle2,
  ChevronDown,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { useAprovisionar } from "@/hooks/use-aprovisionar";
import type { SoftwareId } from "@/domain/value-objects/software";

export function AprovisionarSection() {
  const {
    software,
    setSoftware,
    tipoOp,
    setTipoOp,
    fileName,
    setFileName,
    drag,
    setDrag,
    procesando,
    resultado,
    error,
    procesar,
  } = useAprovisionar();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page-title">Aprovisionar Licencias</h1>
        <p className="text-page-subtitle">
          Aprovisiona o revoca licencias de software usando archivos CSV con
          Claves Banner.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">
        <h2 className="text-section-title">Gestión de Licencias</h2>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Software
          </label>
          <div className="relative">
            <select
              value={software}
              onChange={(e) =>
                setSoftware(e.target.value as SoftwareId | "")
              }
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-muted-foreground"
            >
              <option value="">Seleccionar software</option>
              <option value="adobe">Adobe Creative Cloud</option>
              <option value="minitab">Minitab</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Tipo de Operación
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoOp("aprov")}
              className={`flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-2 transition-all ${
                tipoOp === "aprov"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-border bg-white hover:border-emerald-300"
              }`}
            >
              <CheckCircle2
                className={`w-6 h-6 ${tipoOp === "aprov" ? "text-emerald-600" : "text-muted-foreground"}`}
              />
              <span
                className={`text-sm font-semibold ${tipoOp === "aprov" ? "text-emerald-700" : "text-foreground"}`}
              >
                Aprovisionamiento
              </span>
              <span
                className={`text-xs ${tipoOp === "aprov" ? "text-emerald-600" : "text-muted-foreground"}`}
              >
                Asignar nuevas licencias
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTipoOp("desaprov")}
              className={`flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-2 transition-all ${
                tipoOp === "desaprov"
                  ? "border-orange-400 bg-orange-50"
                  : "border-border bg-white hover:border-orange-300"
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${tipoOp === "desaprov" ? "text-orange-500" : "text-muted-foreground"}`}
              />
              <span
                className={`text-sm font-semibold ${tipoOp === "desaprov" ? "text-orange-600" : "text-foreground"}`}
              >
                Desaprovisionamiento
              </span>
              <span
                className={`text-xs ${tipoOp === "desaprov" ? "text-orange-500" : "text-muted-foreground"}`}
              >
                Revocar acceso masivo
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Archivo de Datos (Claves Banner)
          </label>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.currentTarget.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const file = e.dataTransfer.files[0];
              if (file) setFileName(file.name);
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".csv";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) setFileName(file.name);
              };
              input.click();
            }}
            className={`border-2 border-dashed rounded-xl px-8 py-12 text-center transition-colors cursor-pointer ${
              drag
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-300 hover:border-emerald-300 bg-gray-50"
            }`}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            {fileName ? (
              <p className="text-sm font-medium text-emerald-700">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  Arrastra tu archivo CSV aquí
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  o haz clic para explorar en tu equipo
                </p>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {resultado && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            <p className="font-semibold">{resultado.estado}</p>
            <p className="mt-1">{resultado.mensaje}</p>
            <p className="text-xs text-emerald-600 mt-1">
              Operación {resultado.operacionId} · {resultado.registrosProcesados}{" "}
              registros
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => procesar()}
            disabled={procesando}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {procesando ? "Procesando..." : "Procesar Archivo"}
          </button>
        </div>
      </div>
    </div>
  );
}
