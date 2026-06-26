import { describe, it, expect, vi } from "vitest";
import { ObtenerConfiguracionUseCase } from "../obtener-configuracion.use-case";
import type { IConfiguracionRepository } from "@/domain/ports/configuracion-repository.port";

describe("ObtenerConfiguracionUseCase", () => {
  it("obtiene proveedores y programador en paralelo", async () => {
    const proveedores = [{ id: "adobe", nombre: "Adobe" }];
    const programador = { periodicidad: "semanal", activo: true };
    const repo = {
      obtenerProveedores: vi.fn().mockResolvedValue(proveedores),
      obtenerProgramador: vi.fn().mockResolvedValue(programador),
    } as unknown as IConfiguracionRepository;

    const useCase = new ObtenerConfiguracionUseCase(repo);
    const result = await useCase.ejecutar();

    expect(result.proveedores).toEqual(proveedores);
    expect(result.programador).toEqual(programador);
    expect(repo.obtenerProveedores).toHaveBeenCalledOnce();
    expect(repo.obtenerProgramador).toHaveBeenCalledOnce();
  });
});
