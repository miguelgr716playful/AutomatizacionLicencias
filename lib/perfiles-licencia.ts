/** Perfiles de licencia Adobe usados en el portal (solo estos). */

export const PERFILES_LICENCIA = [
  {
    id: "profesor",
    label: "Perfil profesor",
    groupName: "Colaboradores y Profesores Tecmilenio",
  },
  {
    id: "alumno",
    label: "Perfil alumno",
    /** Nombre exacto en Adobe (USER_GROUP). */
    groupName: "Alumnos Tecmilenio",
  },
] as const;

export type PerfilLicenciaId = (typeof PERFILES_LICENCIA)[number]["id"];

export const PERFIL_LICENCIA_GROUP_NAMES = PERFILES_LICENCIA.map(
  (p) => p.groupName
);

export function isPerfilLicenciaPermitido(groupName: string): boolean {
  return PERFIL_LICENCIA_GROUP_NAMES.includes(
    groupName as (typeof PERFIL_LICENCIA_GROUP_NAMES)[number]
  );
}

/** Nombre Adobe del que se lee la cuota (mismo que el detalle). */
export function quotaGroupNameOf(
  perfil: (typeof PERFILES_LICENCIA)[number]
): string {
  return perfil.groupName;
}
