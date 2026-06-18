import { ActualizarPeriodicidadUseCase } from "@/application/use-cases/actualizar-periodicidad.use-case";
import { AprovisionarLicenciasUseCase } from "@/application/use-cases/aprovisionar-licencias.use-case";
import { ObtenerConfiguracionUseCase } from "@/application/use-cases/obtener-configuracion.use-case";
import { ObtenerDashboardUseCase } from "@/application/use-cases/obtener-dashboard.use-case";
import { ObtenerReportesUseCase } from "@/application/use-cases/obtener-reportes.use-case";
import { MockConfiguracionRepository } from "@/infrastructure/repositories/mock-configuracion.repository";
import { MockDashboardRepository } from "@/infrastructure/repositories/mock-dashboard.repository";
import { MockLicenciaRepository } from "@/infrastructure/repositories/mock-licencia.repository";
import { MockReporteRepository } from "@/infrastructure/repositories/mock-reporte.repository";

const licenciaRepo = new MockLicenciaRepository();
const dashboardRepo = new MockDashboardRepository();
const reporteRepo = new MockReporteRepository();
const configRepo = new MockConfiguracionRepository();

export const container = {
  aprovisionarLicencias: new AprovisionarLicenciasUseCase(licenciaRepo),
  obtenerDashboard: new ObtenerDashboardUseCase(dashboardRepo),
  obtenerReportes: new ObtenerReportesUseCase(reporteRepo),
  obtenerConfiguracion: new ObtenerConfiguracionUseCase(configRepo),
  actualizarPeriodicidad: new ActualizarPeriodicidadUseCase(configRepo),
};
