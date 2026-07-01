import type { RegistroBanner } from "@/application/dto/aprovisionar.dto";

const BANNER_ID_HEADERS = ["banner_id", "bannerid", "clave_banner", "clave", "id"];
const EMAIL_HEADERS = ["email", "email_inst"];
const NOMBRES_HEADERS = ["nombres", "firstname", "nombre"];
const APELLIDOS_HEADERS = ["apellidos", "lastname", "apellido"];

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(normalizeHeader(h)));
}

function parseCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

export function parseCsvText(text: string): RegistroBanner[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("El CSV debe incluir encabezados y al menos una fila de datos");
  }

  const headers = parseCsvLine(lines[0]);
  const bannerIdx = findColumnIndex(headers, BANNER_ID_HEADERS);
  if (bannerIdx === -1) {
    throw new Error(
      "El CSV debe incluir una columna de clave Banner (banner_id, clave_banner o id)"
    );
  }

  const emailIdx = findColumnIndex(headers, EMAIL_HEADERS);
  const nombresIdx = findColumnIndex(headers, NOMBRES_HEADERS);
  const apellidosIdx = findColumnIndex(headers, APELLIDOS_HEADERS);

  const registros: RegistroBanner[] = [];

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const bannerId = cells[bannerIdx]?.trim();
    if (!bannerId) continue;

    registros.push({
      bannerId,
      ...(emailIdx >= 0 && cells[emailIdx] ? { email: cells[emailIdx] } : {}),
      ...(nombresIdx >= 0 && cells[nombresIdx] ? { nombres: cells[nombresIdx] } : {}),
      ...(apellidosIdx >= 0 && cells[apellidosIdx]
        ? { apellidos: cells[apellidosIdx] }
        : {}),
    });
  }

  if (!registros.length) {
    throw new Error("No se encontraron registros válidos en el CSV");
  }

  return registros;
}

export async function parseCsvFile(file: File): Promise<RegistroBanner[]> {
  const text = await file.text();
  return parseCsvText(text);
}
