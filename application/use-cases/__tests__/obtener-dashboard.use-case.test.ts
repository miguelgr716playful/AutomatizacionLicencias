import { describe, it, expect, vi } from "vitest";
import { ObtenerDashboardUseCase } from "../obtener-dashboard.use-case";
import type { IDashboardRepository } from "@/domain/ports/dashboard-repository.port";

describe("ObtenerDashboardUseCase", () => {
  it("obtiene resumen del repositorio", async () => {
    const resumen = {
      totalLicencias: 100,
      licenciasActivas: 80,
      licenciasPendientes: 10,
      licenciasVencidas: 10,
      tendencia: [],
    };
    const repo = {
      obtenerResumen: vi.fn().mockResolvedValue(resumen),
    } as unknown as IDashboardRepository;

    const useCase = new ObtenerDashboardUseCase(repo);
    const result = await useCase.ejecutar();

    expect(result).toEqual(resumen);
    expect(repo.obtenerResumen).toHaveBeenCalledOnce();
  });
});
