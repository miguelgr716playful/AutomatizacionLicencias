import { describe, it, expect, vi } from "vitest";
import { AprovisionarLicenciasUseCase } from "../aprovisionar-licencias.use-case";
import type { ILicenciaRepository } from "@/domain/ports/licencia-repository.port";

describe("AprovisionarLicenciasUseCase", () => {
  it("lanza error si no hay archivo", async () => {
    const repo = { procesar: vi.fn() } as unknown as ILicenciaRepository;
    const useCase = new AprovisionarLicenciasUseCase(repo);

    await expect(
      useCase.ejecutar({
        software: "adobe",
        periodo: "2026-1",
        tipo: "aprov",
        archivoNombre: "",
      })
    ).rejects.toThrow("Debe seleccionar un archivo CSV");

    expect(repo.procesar).not.toHaveBeenCalled();
  });

  it("delega al repositorio y devuelve respuesta", async () => {
    const repo = {
      procesar: vi.fn().mockResolvedValue({
        operacionId: "OP-123",
        registrosProcesados: 150,
        estado: "Completado",
        mensaje: "OK",
      }),
    } as unknown as ILicenciaRepository;

    const useCase = new AprovisionarLicenciasUseCase(repo);
    const result = await useCase.ejecutar({
      software: "adobe",
      periodo: "2026-1",
      tipo: "aprov",
      archivoNombre: "alumnos.csv",
    });

    expect(result.operacionId).toBe("OP-123");
    expect(result.registrosProcesados).toBe(150);
    expect(repo.procesar).toHaveBeenCalledOnce();
  });
});
