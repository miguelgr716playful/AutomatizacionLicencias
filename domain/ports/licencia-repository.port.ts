import type { RegistroBanner } from "@/application/dto/aprovisionar.dto";
import type { ResultadoOperacion } from "@/domain/entities/licencia";
import type { SoftwareId, TipoOperacion } from "@/domain/value-objects/software";

export interface ProcesarLicenciasInput {
  software: SoftwareId;
  tipo: TipoOperacion;
  registros: RegistroBanner[];
  archivoNombre?: string;
}

export interface ILicenciaRepository {
  procesar(input: ProcesarLicenciasInput): Promise<ResultadoOperacion>;
}
