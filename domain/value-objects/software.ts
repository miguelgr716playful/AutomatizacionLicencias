export type SoftwareId = "adobe" | "minitab";

export type TipoOperacion = "aprov" | "desaprov";

export const SOFTWARE_LABELS: Record<SoftwareId, string> = {
  adobe: "Adobe Creative Cloud",
  minitab: "Minitab",
};
