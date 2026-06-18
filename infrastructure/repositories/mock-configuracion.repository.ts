import type {
  ProgramadorTareas,
  ProveedorConfig,
} from "@/domain/entities/configuracion";
import type { IConfiguracionRepository } from "@/domain/ports/configuracion-repository.port";
import {
  adobeMapping,
  getPeriodicidad,
  minitabMapping,
  setPeriodicidad,
} from "@/infrastructure/mocks/data";

export class MockConfiguracionRepository implements IConfiguracionRepository {
  async obtenerProveedores(): Promise<ProveedorConfig[]> {
    return [
      {
        id: "adobe",
        nombre: "Adobe Creative Cloud",
        icon: "AC",
        mapping: adobeMapping,
      },
      {
        id: "minitab",
        nombre: "Minitab",
        icon: "Mt",
        mapping: minitabMapping,
      },
    ];
  }

  async obtenerProgramador(): Promise<ProgramadorTareas> {
    return {
      periodicidad: getPeriodicidad(),
      proximaEjecucion: "Hoy, 23:59 hrs",
    };
  }

  async actualizarPeriodicidad(periodicidad: string): Promise<ProgramadorTareas> {
    setPeriodicidad(periodicidad);
    return this.obtenerProgramador();
  }
}
