export type SoftwareId = "adobe" | "minitab";

export type TipoOperacion = "aprov" | "desaprov";

export const SOFTWARE_IDS: SoftwareId[] = ["adobe", "minitab"];

export const SOFTWARE_LABELS: Record<SoftwareId, string> = {
  adobe: "Adobe",
  minitab: "Minitab",
};

export function getSoftwareFileLabel(software: SoftwareId): string {
  return `Claves Banner ${SOFTWARE_LABELS[software]}`;
}

export function validarNombreArchivoSoftware(
  fileName: string,
  software: SoftwareId
): void {
  const expectedLabel = getSoftwareFileLabel(software).toLowerCase();
  const normalizedName = fileName.toLowerCase().replace(/\.csv$/i, "").trim();

  if (!normalizedName.includes(expectedLabel)) {
    throw new Error(
      `El archivo "${fileName}" no corresponde a ${SOFTWARE_LABELS[software]}. ` +
        `Se espera un archivo como "${getSoftwareFileLabel(software)}.csv".`
    );
  }
}
