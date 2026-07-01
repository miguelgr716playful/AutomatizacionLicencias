import { describe, it, expect, vi } from "vitest";
import { ActualizarPeriodicidadUseCase } from "../actualizar-periodicidad.use-case";
import type { IConfiguracionRepository } from "@/domain/ports/configuracion-repository.port";

describe("ActualizarPeriodicidadUseCase", () => {
  it("actualiza periodicidad en el repositorio", async () => {
    const programador = { periodicidad: "mensual", activo: true };
    const repo = {
      actualizarPeriodicidad: vi.fn().mockResolvedValue(programador),
    } as unknown as IConfiguracionRepository;

    const useCase = new ActualizarPeriodicidadUseCase(repo);
    const result = await useCase.ejecutar("mensual");

    expect(result).toEqual(programador);
    expect(repo.actualizarPeriodicidad).toHaveBeenCalledWith("mensual");
  });
});
