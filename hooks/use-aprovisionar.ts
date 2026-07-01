"use client";

import { useCallback, useState } from "react";
import type { AprovisionarResponse } from "@/application/dto/aprovisionar.dto";
import type { SoftwareId, TipoOperacion } from "@/domain/value-objects/software";
import { container } from "@/infrastructure/di/container";
import { parseCsvFile } from "@/lib/csv-parser";

export function useAprovisionar() {
  const [software, setSoftware] = useState<SoftwareId | "">("");
  const [tipoOp, setTipoOp] = useState<TipoOperacion>("aprov");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [registroCount, setRegistroCount] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<AprovisionarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seleccionarArchivo = useCallback(async (selected: File) => {
    setFile(selected);
    setFileName(selected.name);
    setResultado(null);
    setError(null);

    try {
      const registros = await parseCsvFile(selected);
      setRegistroCount(registros.length);
    } catch (e) {
      setFile(null);
      setFileName("");
      setRegistroCount(null);
      setError(e instanceof Error ? e.message : "Error al leer el CSV");
    }
  }, []);

  const procesar = useCallback(async () => {
    if (!software) {
      setError("Selecciona un software");
      return;
    }
    if (!file) {
      setError("Debe seleccionar un archivo CSV");
      return;
    }

    setProcesando(true);
    setError(null);
    setResultado(null);

    try {
      const registros = await parseCsvFile(file);
      const response = await container.aprovisionarLicencias.ejecutar({
        software,
        tipo: tipoOp,
        registros,
        archivoNombre: file.name,
      });
      setResultado(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar el archivo");
    } finally {
      setProcesando(false);
    }
  }, [software, tipoOp, file]);

  return {
    software,
    setSoftware,
    tipoOp,
    setTipoOp,
    fileName,
    registroCount,
    seleccionarArchivo,
    drag,
    setDrag,
    procesando,
    resultado,
    error,
    procesar,
  };
}
