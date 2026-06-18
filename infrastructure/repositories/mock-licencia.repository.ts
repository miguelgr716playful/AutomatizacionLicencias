import type { ResultadoOperacion } from "@/domain/entities/licencia";
import type {
  ILicenciaRepository,
  ProcesarLicenciasInput,
} from "@/domain/ports/licencia-repository.port";
import { AdobeAdapter, MinitabAdapter } from "@/infrastructure/adapters/proveedor.adapters";

const gateways = {
  adobe: new AdobeAdapter(),
  minitab: new MinitabAdapter(),
};

export class MockLicenciaRepository implements ILicenciaRepository {
  async procesar(input: ProcesarLicenciasInput): Promise<ResultadoOperacion> {
    const gateway = gateways[input.software];
    const registrosSimulados = 150;
    const tipoApi = input.tipo === "aprov" ? "alta" : "baja";

    const { exitosos, fallidos } = await gateway.procesarLote(
      tipoApi,
      registrosSimulados
    );

    const operacionId = `OP-${Date.now().toString(36).toUpperCase()}`;
    const estado = fallidos > 0 ? "En Proceso" : "Completado";

    return {
      operacionId,
      software: input.software,
      tipo: input.tipo,
      registrosProcesados: exitosos,
      estado,
      mensaje:
        fallidos > 0
          ? `${exitosos} registros procesados, ${fallidos} pendientes de revisión`
          : `${exitosos} registros procesados correctamente desde ${input.archivoNombre}`,
    };
  }
}
