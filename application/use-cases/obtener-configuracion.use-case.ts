import type { ConfiguracionResponse } from "@/application/dto/configuracion.dto";
import type { IConfiguracionRepository } from "@/domain/ports/configuracion-repository.port";

export class ObtenerConfiguracionUseCase {
  constructor(private readonly configRepo: IConfiguracionRepository) {}

  async ejecutar(): Promise<ConfiguracionResponse> {
    const [proveedores, programador] = await Promise.all([
      this.configRepo.obtenerProveedores(),
      this.configRepo.obtenerProgramador(),
    ]);

    return { proveedores, programador };
  }
}
