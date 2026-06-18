import type { ActividadLicencia } from "@/domain/entities/licencia";

export interface StatCard {
  label: string;
  value: string;
  sub?: string | null;
  trend?: string | null;
  positive?: boolean;
}

export interface TendenciaMes {
  mes: string;
  adobe: number;
  minitab: number;
}

export interface DashboardData {
  periodo: string;
  stats: StatCard[];
  tendencia: TendenciaMes[];
  actividadReciente: ActividadLicencia[];
}
