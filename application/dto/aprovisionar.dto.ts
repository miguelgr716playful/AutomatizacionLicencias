import type { SoftwareId, TipoOperacion } from "@/domain/value-objects/software";

export interface AprovisionarRequest {
  software: SoftwareId;
  periodo: string;
  tipo: TipoOperacion;
  archivoNombre: string;
}

export interface AprovisionarResponse {
  operacionId: string;
  registrosProcesados: number;
  estado: string;
  mensaje: string;
}
