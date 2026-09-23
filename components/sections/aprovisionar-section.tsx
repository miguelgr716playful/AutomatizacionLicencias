"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Upload,
} from "lucide-react";
import { useAprovisionar } from "@/hooks/use-aprovisionar";
import { RegistrosPreviewDialog } from "@/components/sections/registros-preview-dialog";
import {
  getSoftwareFileLabel,
  SOFTWARE_IDS,
  SOFTWARE_LABELS,
  type SoftwareId,
} from "@/domain/value-objects/software";

export function AprovisionarSection() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const {
    software,
    setSoftware,
    fileName,
    registroCount,
    registros,
    seleccionarArchivo,
    drag,
    setDrag,
    procesando,
    resultado,
    error,
    procesar,
  } = useAprovisionar();

  const archivoLabel = software
    ? getSoftwareFileLabel(software)
    : "Archivo de Datos (Claves Banner)";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page-title">Carga archivo</h1>
        <p className="text-page-subtitle">
          Carga archivos CSV con Claves Banner para asignar licencias de software.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-border shadow-sm p-4 sm:p-8 space-y-6">
        <div>
          <h2 className="text-section-title">Gestión de Licencias</h2>
          <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">Carga archivo</p>
              <p className="text-xs text-emerald-600">Asignar nuevas licencias</p>
            </div>
          </div>
        </div>

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
              className="w-full text-base sm:text-sm px-3 py-3 sm:py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-muted-foreground"
            >
              <option value="">Seleccionar software</option>
              {SOFTWARE_IDS.map((id) => (
                <option key={id} value={id}>
                  {SOFTWARE_LABELS[id]}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            {archivoLabel}
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
              const dropped = e.dataTransfer.files[0];
              if (dropped) seleccionarArchivo(dropped);
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".csv";
              input.onchange = (e) => {
                const selected = (e.target as HTMLInputElement).files?.[0];
                if (selected) seleccionarArchivo(selected);
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
              <>
                <p className="text-sm font-medium text-emerald-700">{fileName}</p>
                {registroCount !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {registroCount}{" "}
                    {registroCount === 1 ? "registro listo" : "registros listos"} para
                    enviar ·{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewOpen(true);
                      }}
                      className="text-emerald-600 font-medium underline underline-offset-2 hover:text-emerald-700"
                    >
                      Ver datos cargados
                    </button>
                  </p>
                )}
              </>
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
            {resultado.blobName && (
              <p className="text-xs text-emerald-600 mt-1 font-mono break-all">
                Vigente: {resultado.container}/{resultado.blobName}
              </p>
            )}
            {resultado.historicoBlobName && (
              <p className="text-xs text-emerald-600/80 mt-1 font-mono break-all">
                Histórico: {resultado.container}/{resultado.historicoBlobName}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => procesar()}
            disabled={procesando}
            className="btn-primary w-full px-6 py-3 min-h-11 sm:w-auto"
          >
            {procesando ? "Procesando..." : "Procesar Archivo"}
          </button>
        </div>
      </div>

      <RegistrosPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        fileName={fileName}
        registros={registros}
      />
    </div>
  );
}
