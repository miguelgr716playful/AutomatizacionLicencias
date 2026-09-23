import type { MovimientoReporte } from "@/domain/entities/reporte";

function etiquetaAccion(accion: "Alta" | "Baja") {
  return accion === "Alta" ? "Aprovisionar" : "Desaprovisionar";
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADERS = [
  "Fecha",
  "Hora",
  "Alumno/Colaborador",
  "ID Banner",
  "Clave Banner",
  "Nivel",
  "Software",
  "Acción",
];

export function reportesToCsv(rows: MovimientoReporte[]): string {
  const lines = rows.map((row) =>
    [
      row.fecha,
      row.hora,
      row.nombre,
      row.id,
      row.clave,
      row.nivel,
      row.software,
      etiquetaAccion(row.accion),
    ]
      .map((value) => escapeCsv(value))
      .join(",")
  );

  return [HEADERS.join(","), ...lines].join("\n");
}

export function descargarReportesCsv(
  rows: MovimientoReporte[],
  filename = "reporte-asignaciones.csv"
) {
  const csv = reportesToCsv(rows);
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
