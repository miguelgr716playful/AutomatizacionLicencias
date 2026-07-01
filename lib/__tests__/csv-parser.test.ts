import { describe, it, expect } from "vitest";
import { parseCsvText } from "@/lib/csv-parser";

describe("parseCsvText", () => {
  it("parsea columnas banner_id y email", () => {
    const csv = `banner_id,email_inst,nombres,apellidos
T00123456,alumno@tecmilenio.mx,Juan,Pérez
T00789012,maria@tecmilenio.mx,María,López`;

    const registros = parseCsvText(csv);

    expect(registros).toHaveLength(2);
    expect(registros[0]).toEqual({
      bannerId: "T00123456",
      email: "alumno@tecmilenio.mx",
      nombres: "Juan",
      apellidos: "Pérez",
    });
  });

  it("lanza error si falta columna de clave Banner", () => {
    expect(() =>
      parseCsvText("nombre,email\nJuan,juan@test.com")
    ).toThrow("columna de clave Banner");
  });

  it("ignora filas sin bannerId", () => {
    const csv = `banner_id,email
T001,a@test.com
,invalid@test.com`;

    expect(parseCsvText(csv)).toHaveLength(1);
  });
});
