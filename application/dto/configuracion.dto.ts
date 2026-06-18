import type {
  ProgramadorTareas,
  ProveedorConfig,
} from "@/domain/entities/configuracion";

export interface ConfiguracionResponse {
  proveedores: ProveedorConfig[];
  programador: ProgramadorTareas;
}
