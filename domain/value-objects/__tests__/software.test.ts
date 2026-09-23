import { describe, it, expect } from "vitest";
import { validarNombreArchivoSoftware } from "../software";

describe("validarNombreArchivoSoftware", () => {
  it("acepta archivo que coincide con Adobe", () => {
    expect(() =>
      validarNombreArchivoSoftware("Claves Banner Adobe.csv", "adobe")
    ).not.toThrow();
  });

  it("acepta archivo que coincide con Minitab", () => {
    expect(() =>
      validarNombreArchivoSoftware("Claves Banner Minitab.csv", "minitab")
    ).not.toThrow();
  });

  it("rechaza archivo de Adobe cuando el software es Minitab", () => {
    expect(() =>
      validarNombreArchivoSoftware("Claves Banner Adobe.csv", "minitab")
    ).toThrow('no corresponde a Minitab');
  });

  it("rechaza archivo de Minitab cuando el software es Adobe", () => {
    expect(() =>
      validarNombreArchivoSoftware("Claves Banner Minitab.csv", "adobe")
    ).toThrow('no corresponde a Adobe');
  });
});
