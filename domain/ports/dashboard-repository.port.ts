import type { DashboardData } from "@/domain/entities/dashboard";

export interface IDashboardRepository {
  obtenerResumen(): Promise<DashboardData>;
}
