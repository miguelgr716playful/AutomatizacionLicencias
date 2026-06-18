import type { ProgramadorTareas } from "@/domain/entities/configuracion";
import type { IConfiguracionRepository } from "@/domain/ports/configuracion-repository.port";

export class ActualizarPeriodicidadUseCase {
  constructor(private readonly configRepo: IConfiguracionRepository) {}

  async ejecutar(periodicidad: string): Promise<ProgramadorTareas> {
    return this.configRepo.actualizarPeriodicidad(periodicidad);
  }
}
