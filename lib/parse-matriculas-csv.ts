/**
 * Email institucional alumno: AL + matrícula (sin T inicial) + @tecmilenio.mx
 * CSV Banner: Matrícula = T07208601 → AL07208601@tecmilenio.mx
 *
 * Este formato es SOLO para perfil alumno.
 * CSV de profesores: pendiente de definir.
 */
export const ALUMNO_EMAIL_DOMAIN = "tecmilenio.mx";

/** Correos generados con AL+matrícula (lista CSV alumnos). */
export function isAlumnoListaEmail(email: string): boolean {
  return /^al[a-z0-9]+@tecmilenio\.mx$/i.test(String(email || "").trim());
}

export function assertEmailsFormatoAlumno(emails: string[]): void {
  const invalid = emails.filter((e) => !isAlumnoListaEmail(e));
  if (invalid.length) {
    throw new Error(
      `Este CSV solo genera correos AL*@tecmilenio.mx (perfil alumno). Inválidos: ${invalid.slice(0, 3).join(", ")}`
    );
  }
}

export function matriculaToAlumnoEmail(raw: string): string | null {
  let value = String(raw || "")
    .trim()
    .replace(/\s+/g, "");
  if (!value) return null;

  if (value.includes("@")) {
    const lower = value.toLowerCase();
    if (!isAlumnoListaEmail(lower) && !lower.endsWith(`@${ALUMNO_EMAIL_DOMAIN}`)) {
      return null;
    }
    return lower;
  }

  value = value.toUpperCase();
  // Evita duplicar prefijo AL
  if (value.startsWith("AL") && value.length > 2) {
    value = value.slice(2);
  }
  // Matrículas Banner suelen ir como T07208601 → quitar la T inicial
  if (value.startsWith("T") && value.length > 1) {
    value = value.slice(1);
  }

  const matricula = value.replace(/[^A-Z0-9]/g, "");
  if (!matricula) return null;

  return `AL${matricula}@tecmilenio.mx`.toLowerCase();
}

const MATRICULA_HEADERS = [
  "matricula",
  "matricula_alumno",
  "id_alumno",
  "alumno",
  "banner_id",
  "bannerid",
  "clave_banner",
];

const NOMBRE_HEADERS = [
  "nombre_del_alumno",
  "nombre_alumno",
  "alumno_nombre",
  "nombres",
  "nombre",
];

const MATERIA_HEADERS = [
  "materia",
  "asignatura",
  "clave_de_materia",
  "clave_materia",
  "subject",
  "curso",
];

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells.map((c) => c.replace(/^"|"$/g, ""));
}

export interface AlumnoListaFila {
  matricula: string;
  email: string;
  nombre?: string;
  materia?: string;
}

/**
 * Parsea CSV tipo detalle_alumno_y_grupos (columna Matrícula).
 * Deduplica por email (un alumno puede tener varias materias).
 */
export function parseMatriculasCsv(text: string): {
  filas: AlumnoListaFila[];
  emails: string[];
  headerMatricula: string;
  totalFilasCsv: number;
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("El CSV debe incluir encabezados y al menos una fila");
  }

  const headers = parseCsvLine(lines[0]);
  const normalized = headers.map(normalizeHeader);

  let matriculaIdx = normalized.findIndex((h) =>
    MATRICULA_HEADERS.includes(h)
  );
  if (matriculaIdx === -1 && headers.length === 1) {
    matriculaIdx = 0;
  }
  if (matriculaIdx === -1) {
    throw new Error(
      'No se encontró columna "Matrícula" (o matricula / banner_id)'
    );
  }

  const nombreIdx = normalized.findIndex((h) => NOMBRE_HEADERS.includes(h));
  const materiaIdx = normalized.findIndex((h) => MATERIA_HEADERS.includes(h));

  const seen = new Set<string>();
  const filas: AlumnoListaFila[] = [];
  let totalFilasCsv = 0;

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const matriculaRaw = cells[matriculaIdx]?.trim() || "";
    if (!matriculaRaw) continue;
    totalFilasCsv += 1;

    const email = matriculaToAlumnoEmail(matriculaRaw);
    if (!email || seen.has(email)) continue;
    seen.add(email);

    const fila: AlumnoListaFila = {
      matricula: matriculaRaw.toUpperCase(),
      email,
    };
    if (nombreIdx >= 0 && cells[nombreIdx]?.trim()) {
      fila.nombre = cells[nombreIdx].trim();
    }
    if (materiaIdx >= 0 && cells[materiaIdx]?.trim()) {
      fila.materia = cells[materiaIdx].trim();
    }
    filas.push(fila);
  }

  if (filas.length === 0) {
    throw new Error("No se encontraron matrículas válidas en el CSV");
  }

  return {
    filas,
    emails: filas.map((f) => f.email),
    headerMatricula: headers[matriculaIdx],
    totalFilasCsv,
  };
}
