import type {
  ProgramadorTareas,
  ProveedorConfig,
  CampoMapeo,
} from "@/domain/entities/configuracion";
import type { SoftwareId } from "@/domain/value-objects/software";

export interface IConfiguracionRepository {
  obtenerProveedores(): Promise<ProveedorConfig[]>;
  obtenerProgramador(): Promise<ProgramadorTareas>;
  actualizarPeriodicidad(periodicidad: string): Promise<ProgramadorTareas>;
  guardarMapeoProveedor(
    proveedorId: SoftwareId,
    mapping: CampoMapeo[]
  ): Promise<ProveedorConfig[]>;
}
