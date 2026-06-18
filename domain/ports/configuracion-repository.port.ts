import type {
  ProgramadorTareas,
  ProveedorConfig,
} from "@/domain/entities/configuracion";

export interface IConfiguracionRepository {
  obtenerProveedores(): Promise<ProveedorConfig[]>;
  obtenerProgramador(): Promise<ProgramadorTareas>;
  actualizarPeriodicidad(periodicidad: string): Promise<ProgramadorTareas>;
}
