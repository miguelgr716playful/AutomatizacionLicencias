import {
  PAGE_SIZE,
  type ReportesRequest,
  type ReportesResponse,
} from "@/application/dto/reportes.dto";
import type { IReporteRepository } from "@/domain/ports/reporte-repository.port";

export class ObtenerReportesUseCase {
  constructor(private readonly reporteRepo: IReporteRepository) {}

  async ejecutar(input: ReportesRequest): Promise<ReportesResponse> {
    const pageSize = PAGE_SIZE;
    const [paginado, estadisticas] = await Promise.all([
      this.reporteRepo.listar(
        {
          software: input.software,
          accion: input.accion,
          origen: input.origen,
          busqueda: input.busqueda,
        },
        input.page,
        pageSize
      ),
      this.reporteRepo.obtenerEstadisticas(),
    ]);

    return {
      items: paginado.items,
      total: paginado.total,
      page: paginado.page,
      pageSize: paginado.pageSize,
      totalPages: paginado.totalPages,
      estadisticas,
    };
  }
}
