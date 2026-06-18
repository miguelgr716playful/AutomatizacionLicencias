import type { IProveedorGateway } from "@/domain/ports/proveedor-gateway.port";
import type { SoftwareId } from "@/domain/value-objects/software";

export class AdobeAdapter implements IProveedorGateway {
  readonly software: SoftwareId = "adobe";

  async procesarLote(
    tipo: "alta" | "baja",
    registros: number
  ): Promise<{ exitosos: number; fallidos: number }> {
    await delay(300);
    const fallidos = tipo === "baja" ? Math.floor(registros * 0.01) : 0;
    return { exitosos: registros - fallidos, fallidos };
  }
}

export class MinitabAdapter implements IProveedorGateway {
  readonly software: SoftwareId = "minitab";

  async procesarLote(
    _tipo: "alta" | "baja",
    registros: number
  ): Promise<{ exitosos: number; fallidos: number }> {
    await delay(300);
    return { exitosos: registros, fallidos: 0 };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
