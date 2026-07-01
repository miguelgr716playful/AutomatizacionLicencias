import type { ResultadoOperacion } from "@/domain/entities/licencia";
import type { SoftwareId, TipoOperacion } from "@/domain/value-objects/software";

export interface ProcesarLicenciasInput {
  software: SoftwareId;
  tipo: TipoOperacion;
  archivoNombre: string;
}

export interface ILicenciaRepository {
  procesar(input: ProcesarLicenciasInput): Promise<ResultadoOperacion>;
}
