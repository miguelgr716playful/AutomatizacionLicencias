import type { SoftwareId, TipoOperacion } from "@/domain/value-objects/software";

export type EstadoOperacion = "Completado" | "En Proceso" | "Error";

export interface ResultadoOperacion {
  operacionId: string;
  software: SoftwareId;
  tipo: TipoOperacion;
  registrosProcesados: number;
  estado: EstadoOperacion;
  mensaje: string;
}

export interface ActividadLicencia {
  fecha: string;
  software: string;
  tipo: "APROV" | "DESAP";
  estado: EstadoOperacion;
}
