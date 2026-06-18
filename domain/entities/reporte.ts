export interface MovimientoReporte {
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
}
