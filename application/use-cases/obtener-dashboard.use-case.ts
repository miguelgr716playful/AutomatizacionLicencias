import type { DashboardData } from "@/application/dto/dashboard.dto";
import type { IDashboardRepository } from "@/domain/ports/dashboard-repository.port";

export class ObtenerDashboardUseCase {
  constructor(private readonly dashboardRepo: IDashboardRepository) {}

  async ejecutar(): Promise<DashboardData> {
    return this.dashboardRepo.obtenerResumen();
  }
}
