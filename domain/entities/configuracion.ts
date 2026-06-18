import type { SoftwareId } from "@/domain/value-objects/software";

export interface CampoMapeo {
  local: string;
  api: string;
}

export interface ProveedorConfig {
  id: SoftwareId;
  nombre: string;
  icon: string;
  mapping: CampoMapeo[];
}

export interface ProgramadorTareas {
  periodicidad: string;
  proximaEjecucion: string;
}
