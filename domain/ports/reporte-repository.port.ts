import type { MovimientoReporte } from "@/domain/entities/reporte";

export interface FiltrosReporte {
  software: string;
  accion: string;
  origen: string;
  busqueda: string;
}

export interface ReportesPaginados {
  items: MovimientoReporte[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IReporteRepository {
  listar(
    filtros: FiltrosReporte,
    page: number,
    pageSize: number
  ): Promise<ReportesPaginados>;
  obtenerEstadisticas(): Promise<{
    totalMovimientos: string;
    altasTotales: string;
    bajasTotales: string;
    movimientosManuales: string;
  }>;
}
