import type { DashboardData } from "@/domain/entities/dashboard";
import type { IDashboardRepository } from "@/domain/ports/dashboard-repository.port";
import {
  actividadReciente,
  barData,
} from "@/infrastructure/mocks/data";

export class MockDashboardRepository implements IDashboardRepository {
  async obtenerResumen(): Promise<DashboardData> {
    return {
      periodo: "2026-Agosto",
      stats: [
        {
          label: "Total Licencias Activas",
          value: "12,450",
          sub: "Adobe + Minitab",
          trend: null,
        },
        {
          label: "Aprovisionadas (Periodo)",
          value: "1,150",
          trend: "+12% vs periodo anterior",
          positive: true,
        },
        {
          label: "Desaprovisionadas (Periodo)",
          value: "420",
          trend: "-5% vs periodo anterior",
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
