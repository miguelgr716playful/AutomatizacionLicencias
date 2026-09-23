"use client";

import { useCallback, useState } from "react";
import type { AprovisionarResponse, RegistroBanner } from "@/application/dto/aprovisionar.dto";
import type { SoftwareId, TipoOperacion } from "@/domain/value-objects/software";
import { validarNombreArchivoSoftware } from "@/domain/value-objects/software";
import { container } from "@/infrastructure/di/container";
import { parseCsvFile } from "@/lib/csv-parser";
import { API_BASE_URL } from "@/lib/api-config";
import { uploadCsvToStorage } from "@/lib/upload-csv";

export function useAprovisionar() {
  const [software, setSoftwareState] = useState<SoftwareId | "">("");
  const [tipoOp, setTipoOp] = useState<TipoOperacion>("aprov");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [registroCount, setRegistroCount] = useState<number | null>(null);
  const [registros, setRegistros] = useState<RegistroBanner[]>([]);
  const [drag, setDrag] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<AprovisionarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limpiarArchivo = useCallback(() => {
    setFile(null);
    setFileName("");
    setRegistroCount(null);
    setRegistros([]);
  }, []);

  const seleccionarArchivo = useCallback(
    async (selected: File) => {
      setResultado(null);
      setError(null);

      if (!software) {
        setError("Selecciona un software antes de cargar el archivo");
        return;
      }

      try {
        validarNombreArchivoSoftware(selected.name, software);
      } catch (e) {
        limpiarArchivo();
        setError(e instanceof Error ? e.message : "Archivo incompatible con el software");
        return;
      }

      setFile(selected);
      setFileName(selected.name);

      try {
        const parsed = await parseCsvFile(selected);
        setRegistros(parsed);
        setRegistroCount(parsed.length);
      } catch (e) {
        limpiarArchivo();
        setError(e instanceof Error ? e.message : "Error al leer el CSV");
      }
    },
    [software, limpiarArchivo]
  );

  const setSoftware = useCallback(
    (next: SoftwareId | "") => {
      setSoftwareState(next);
      setResultado(null);

      if (!file || !next) {
        if (!next) {
          limpiarArchivo();
        }
        setError(null);
        return;
      }

      try {
        validarNombreArchivoSoftware(file.name, next);
        setError(null);
      } catch (e) {
        limpiarArchivo();
        setError(e instanceof Error ? e.message : "Archivo incompatible con el software");
      }
    },
    [file, limpiarArchivo]
  );

  const procesar = useCallback(async () => {
    if (!software) {
      setError("Selecciona un software");
      return;
    }
    if (!file) {
      setError("Debe seleccionar un archivo CSV");
      return;
    }

    try {
      validarNombreArchivoSoftware(file.name, software);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archivo incompatible con el software");
      return;
    }

    setProcesando(true);
    setError(null);
    setResultado(null);

    try {
      const registros = await parseCsvFile(file);

      let blobName: string | undefined;
      let historicoBlobName: string | undefined;
      let blobContainer: string | undefined;

      if (API_BASE_URL) {
        const uploaded = await uploadCsvToStorage(file, software, tipoOp);
        blobName = uploaded.blobName;
        historicoBlobName = uploaded.historicoBlobName;
        blobContainer = uploaded.container;
      }

      const response = await container.aprovisionarLicencias.ejecutar({
        software,
        tipo: tipoOp,
        registros,
        archivoNombre: file.name,
      });

      setResultado({
        ...response,
        blobName,
        historicoBlobName,
        container: blobContainer,
        mensaje: blobName
          ? `${response.mensaje} · Vigente: ${blobContainer}/${blobName}${
              historicoBlobName
                ? ` · Histórico: ${blobContainer}/${historicoBlobName}`
                : ""
            }`
          : response.mensaje,
      });
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
    registros,
    seleccionarArchivo,
    drag,
    setDrag,
    procesando,
    resultado,
    error,
    procesar,
  };
}
