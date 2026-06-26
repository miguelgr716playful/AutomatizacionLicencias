import type {
  AprovisionarRequest,
  AprovisionarResponse,
} from "@/application/dto/aprovisionar.dto";
import type { ILicenciaRepository } from "@/domain/ports/licencia-repository.port";

export class AprovisionarLicenciasUseCase {
  constructor(private readonly licenciaRepo: ILicenciaRepository) {}

  async ejecutar(input: AprovisionarRequest): Promise<AprovisionarResponse> {
    if (!input.registros.length) {
      throw new Error("Debe incluir al menos un registro del CSV");
    }

    const resultado = await this.licenciaRepo.procesar({
      software: input.software,
      periodo: input.periodo,
      tipo: input.tipo,
      registros: input.registros,
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
