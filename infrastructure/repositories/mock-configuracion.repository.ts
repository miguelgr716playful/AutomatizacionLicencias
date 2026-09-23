import type {
  ProgramadorTareas,
  ProveedorConfig,
  CampoMapeo,
} from "@/domain/entities/configuracion";
import type { IConfiguracionRepository } from "@/domain/ports/configuracion-repository.port";
import {
  adobeMapping,
  getPeriodicidad,
  minitabMapping,
  setMapeoProveedor,
  setPeriodicidad,
} from "@/infrastructure/mocks/data";
import type { SoftwareId } from "@/domain/value-objects/software";
import { SOFTWARE_LABELS } from "@/domain/value-objects/software";

export class MockConfiguracionRepository implements IConfiguracionRepository {
  async obtenerProveedores(): Promise<ProveedorConfig[]> {
    return [
      {
        id: "adobe",
        nombre: SOFTWARE_LABELS.adobe,
        icon: "AC",
        mapping: adobeMapping,
      },
      {
        id: "minitab",
        nombre: SOFTWARE_LABELS.minitab,
        icon: "Mt",
        mapping: minitabMapping,
      },
    ];
  }

  async obtenerProgramador(): Promise<ProgramadorTareas> {
    return {
      periodicidad: getPeriodicidad(),
      proximaEjecucion: "Hoy, 04:00 hrs",
    };
  }

  async actualizarPeriodicidad(periodicidad: string): Promise<ProgramadorTareas> {
    setPeriodicidad(periodicidad);
    return this.obtenerProgramador();
  }

  async guardarMapeoProveedor(
    proveedorId: SoftwareId,
    mapping: CampoMapeo[]
  ): Promise<ProveedorConfig[]> {
    setMapeoProveedor(proveedorId, mapping);
    return this.obtenerProveedores();
  }
}
