import type { DashboardData } from "@/domain/entities/dashboard";
import type { IDashboardRepository } from "@/domain/ports/dashboard-repository.port";
import {
  actividadReciente,
  barData,
} from "@/infrastructure/mocks/data";

export class MockDashboardRepository implements IDashboardRepository {
  async obtenerResumen(): Promise<DashboardData> {
    return {
      stats: [
        {
          label: "Total Licencias Activas",
          value: "12,450",
          sub: "Adobe + Minitab",
          trend: null,
        },
        {
          label: "Aprovisionadas",
          value: "1,150",
          trend: "+12% vs mes anterior",
          positive: true,
        },
        {
          label: "Desaprovisionadas",
          value: "420",
          trend: "-5% vs mes anterior",
          positive: false,
        },
        {
          label: "Usuarios Pendientes",
          value: "84",
          sub: "Esperando sincronización",
          trend: null,
        },
      ],
      tendencia: barData,
      actividadReciente,
    };
  }
}
