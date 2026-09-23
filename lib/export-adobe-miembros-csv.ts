import type { AdobeMiembroDto } from "@/application/dto/adobe-licencias.dto";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADERS = [
  "email",
  "firstname",
  "lastname",
  "status",
  "type",
  "domain",
  "username",
];

export function adobeMiembrosToCsv(rows: AdobeMiembroDto[]): string {
  const lines = rows.map((row) =>
    [
      row.email,
      row.firstname,
      row.lastname,
      row.status,
      row.type,
      row.domain,
      row.username,
    ]
      .map((value) => escapeCsv(value ?? ""))
      .join(",")
  );

  return [HEADERS.join(","), ...lines].join("\n");
}

export function descargarAdobeMiembrosCsv(
  rows: AdobeMiembroDto[],
  filename = "alumnos-tecmilenio.csv"
) {
  const csv = adobeMiembrosToCsv(rows);
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
