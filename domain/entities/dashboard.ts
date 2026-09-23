import type { ActividadLicencia } from "@/domain/entities/licencia";

export interface StatCard {
  label: string;
  value: string;
  sub?: string | null;
  alumnos?: number;
  colaboradores?: number;
  trend?: string | null;
  positive?: boolean;
}

export interface TendenciaMes {
  mes: string;
  adobe: number;
  minitab: number;
  adobeAlumnos: number;
  adobeColaboradores: number;
  minitabAlumnos: number;
  minitabColaboradores: number;
}

export interface DashboardData {
  stats: StatCard[];
  tendencia: TendenciaMes[];
  actividadReciente: ActividadLicencia[];
}
