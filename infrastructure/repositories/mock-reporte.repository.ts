import type {
  FiltrosReporte,
  IReporteRepository,
  ReportesPaginados,
} from "@/domain/ports/reporte-repository.port";
import { reporteData } from "@/infrastructure/mocks/data";

export class MockReporteRepository implements IReporteRepository {
  async listar(
    filtros: FiltrosReporte,
    page: number,
    pageSize: number
  ): Promise<ReportesPaginados> {
    const filtered = reporteData.filter(
      (r) =>
        (filtros.software === "Todo software" ||
          r.software === filtros.software) &&
        (filtros.accion === "Alta y Baja" || r.accion === filtros.accion) &&
        (filtros.origen === "ETL + Manual" || r.origen === filtros.origen) &&
        (filtros.busqueda === "" ||
          r.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
          r.id.includes(filtros.busqueda) ||
          r.clave.includes(filtros.busqueda))
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const items = filtered.slice(
      (safePage - 1) * pageSize,
      safePage * pageSize
    );

    return {
      items,
      total: filtered.length,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  async obtenerEstadisticas() {
    return {
      totalMovimientos: "2,847",
      altasTotales: "1,983",
      bajasTotales: "864",
      movimientosManuales: "47",
    };
  }
}
