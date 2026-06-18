export const PAGE_SIZE = 5;

export interface ReportesRequest {
  software: string;
  accion: string;
  origen: string;
  busqueda: string;
  page: number;
}

export interface ReportesResponse {
  items: {
    fecha: string;
    hora: string;
    nombre: string;
    id: string;
    clave: string;
    nivel: string;
    software: string;
    accion: "Alta" | "Baja";
    origen: "ETL" | "Manual";
    operador: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  estadisticas: {
    totalMovimientos: string;
    altasTotales: string;
    bajasTotales: string;
    movimientosManuales: string;
  };
}
