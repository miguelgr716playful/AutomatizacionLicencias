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
          label: "Aprovisionadas Adobe",
          value: "820",
          alumnos: 580,
          colaboradores: 240,
          trend: "+12% vs mes anterior",
          positive: true,
        },
        {
          label: "Aprovisionadas Minitab",
          value: "330",
          alumnos: 210,
          colaboradores: 120,
          trend: "+8% vs mes anterior",
          positive: true,
        },
        {
          label: "Desaprovisionadas Adobe",
          value: "290",
          alumnos: 200,
          colaboradores: 90,
          trend: "-5% vs mes anterior",
          positive: false,
        },
        {
          label: "Desaprovisionadas Minitab",
          value: "130",
          alumnos: 85,
          colaboradores: 45,
          trend: "-3% vs mes anterior",
          positive: false,
        },
      ],
      tendencia: barData,
      actividadReciente,
    };
  }
}
