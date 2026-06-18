"use client";

import { useCallback, useState } from "react";
import type { AprovisionarResponse } from "@/application/dto/aprovisionar.dto";
import type { SoftwareId, TipoOperacion } from "@/domain/value-objects/software";
import { container } from "@/infrastructure/di/container";

export function useAprovisionar() {
  const [software, setSoftware] = useState<SoftwareId | "">("");
  const [periodo, setPeriodo] = useState("");
  const [tipoOp, setTipoOp] = useState<TipoOperacion>("aprov");
  const [fileName, setFileName] = useState("");
  const [drag, setDrag] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<AprovisionarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const procesar = useCallback(async () => {
    if (!software) {
      setError("Selecciona un software");
      return;
    }
    if (!periodo) {
      setError("Selecciona un período académico");
      return;
    }

    setProcesando(true);
    setError(null);
    setResultado(null);

    try {
      const response = await container.aprovisionarLicencias.ejecutar({
        software,
        periodo,
        tipo: tipoOp,
        archivoNombre: fileName,
      });
      setResultado(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar el archivo");
    } finally {
      setProcesando(false);
    }
  }, [software, periodo, tipoOp, fileName]);

  return {
    software,
    setSoftware,
    periodo,
    setPeriodo,
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
  };
}
