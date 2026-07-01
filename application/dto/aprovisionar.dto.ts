import type { SoftwareId, TipoOperacion } from "@/domain/value-objects/software";

/** Registro parseado del CSV (claves Banner) listo para enviar a Azure Functions → ADF */
export interface RegistroBanner {
  bannerId: string;
  email?: string;
  nombres?: string;
  apellidos?: string;
}

export interface AprovisionarRequest {
  software: SoftwareId;
  tipo: TipoOperacion;
  registros: RegistroBanner[];
  /** Nombre del archivo original; solo referencia en mensajes de auditoría */
  archivoNombre?: string;
}

export interface AprovisionarResponse {
  operacionId: string;
  registrosProcesados: number;
  estado: string;
  mensaje: string;
}
