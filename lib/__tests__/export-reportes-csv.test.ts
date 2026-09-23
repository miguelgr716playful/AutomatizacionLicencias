import { describe, it, expect } from "vitest";
import { reportesToCsv } from "../export-reportes-csv";
import type { MovimientoReporte } from "@/domain/entities/reporte";

const fila: MovimientoReporte = {
  fecha: "2026-06-12",
  hora: "04:02",
  nombre: "Javier Torres Ramírez",
  id: "A01198234",
  clave: "EST-201",
  nivel: "Mtra.",
  software: "Minitab",
  accion: "Alta",
  origen: "ETL",
  operador: "sistema",
};

describe("reportesToCsv", () => {
  it("genera encabezados y filas con las columnas de la tabla", () => {
    const csv = reportesToCsv([fila]);

    expect(csv).toContain(
      "Fecha,Hora,Alumno/Colaborador,ID Banner,Clave Banner,Nivel,Software,Acción"
    );
    expect(csv).toContain(
      "2026-06-12,04:02,Javier Torres Ramírez,A01198234,EST-201,Mtra.,Minitab,Aprovisionar"
    );
  });

  it("escapa valores con comas", () => {
    const csv = reportesToCsv([
      {
        ...fila,
        nombre: "García, Ana",
      },
    ]);

    expect(csv).toContain('"García, Ana"');
  });
});
