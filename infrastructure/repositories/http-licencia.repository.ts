import type { ResultadoOperacion } from "@/domain/entities/licencia";
import type {
  ILicenciaRepository,
  ProcesarLicenciasInput,
} from "@/domain/ports/licencia-repository.port";
import { API_BASE_URL } from "@/lib/api-config";

/**
 * Implementación real: envía JSON en memoria a Azure Functions,
 * que dispara el pipeline de Azure Data Factory (sin Blob Storage).
 */
export class HttpLicenciaRepository implements ILicenciaRepository {
  async procesar(input: ProcesarLicenciasInput): Promise<ResultadoOperacion> {
    if (!API_BASE_URL) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL no está configurada");
    }

    const response = await fetch(`${API_BASE_URL}/v1/licencias/operaciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: Bearer <token NAM> — pendiente integración identidad
      },
      body: JSON.stringify({
        software: input.software,
        periodo: input.periodo,
        tipo: input.tipo,
        registros: input.registros,
        archivoNombre: input.archivoNombre,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Error al procesar la operación");
    }

    const data = await response.json();

    return {
      operacionId: data.operacionId,
      software: input.software,
      tipo: input.tipo,
      registrosProcesados: data.registrosProcesados,
      estado: data.estado,
      mensaje: data.mensaje,
    };
  }
}
