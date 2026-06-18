import type {
  AprovisionarRequest,
  AprovisionarResponse,
} from "@/application/dto/aprovisionar.dto";
import type { ILicenciaRepository } from "@/domain/ports/licencia-repository.port";

export class AprovisionarLicenciasUseCase {
  constructor(private readonly licenciaRepo: ILicenciaRepository) {}

  async ejecutar(input: AprovisionarRequest): Promise<AprovisionarResponse> {
    if (!input.archivoNombre) {
      throw new Error("Debe seleccionar un archivo CSV");
    }

    const resultado = await this.licenciaRepo.procesar({
      software: input.software,
      periodo: input.periodo,
      tipo: input.tipo,
      archivoNombre: input.archivoNombre,
    });

    return {
      operacionId: resultado.operacionId,
      registrosProcesados: resultado.registrosProcesados,
      estado: resultado.estado,
      mensaje: resultado.mensaje,
    };
  }
}
