import { describe, it, expect, vi } from "vitest";
import { ObtenerReportesUseCase } from "../obtener-reportes.use-case";
import type { IReporteRepository } from "@/domain/ports/reporte-repository.port";

describe("ObtenerReportesUseCase", () => {
  it("combina listado paginado y estadísticas", async () => {
    const paginado = {
      items: [{ id: "1" }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };
    const estadisticas = { total: 1, altas: 1, bajas: 0 };
    const repo = {
      listar: vi.fn().mockResolvedValue(paginado),
      obtenerEstadisticas: vi.fn().mockResolvedValue(estadisticas),
    } as unknown as IReporteRepository;

    const useCase = new ObtenerReportesUseCase(repo);
    const result = await useCase.ejecutar({
      software: "adobe",
      accion: "alta",
      origen: "manual",
      busqueda: "",
      page: 1,
    });

    expect(result.items).toEqual(paginado.items);
    expect(result.estadisticas).toEqual(estadisticas);
    expect(repo.listar).toHaveBeenCalledOnce();
    expect(repo.obtenerEstadisticas).toHaveBeenCalledOnce();
  });
});
