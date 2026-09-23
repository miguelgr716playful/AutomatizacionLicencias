import type { CampoMapeo, ProveedorConfig } from "@/domain/entities/configuracion";
import type { IConfiguracionRepository } from "@/domain/ports/configuracion-repository.port";
import type { SoftwareId } from "@/domain/value-objects/software";

export interface GuardarMapeoProveedorInput {
  proveedorId: SoftwareId;
  mapping: CampoMapeo[];
}

export class GuardarMapeoProveedorUseCase {
  constructor(private readonly configRepo: IConfiguracionRepository) {}

  async ejecutar(input: GuardarMapeoProveedorInput): Promise<ProveedorConfig[]> {
    return this.configRepo.guardarMapeoProveedor(
      input.proveedorId,
      input.mapping
    );
  }
}
