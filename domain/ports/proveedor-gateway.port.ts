import type { SoftwareId } from "@/domain/value-objects/software";

export interface IProveedorGateway {
  readonly software: SoftwareId;
  procesarLote(
    tipo: "alta" | "baja",
    registros: number
  ): Promise<{ exitosos: number; fallidos: number }>;
}
