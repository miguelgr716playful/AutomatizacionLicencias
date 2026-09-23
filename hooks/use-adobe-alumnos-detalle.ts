"use client";

import { useAdobeMiembrosDetalle } from "@/hooks/use-adobe-miembros-detalle";

/** @deprecated Prefer useAdobeMiembrosDetalle("alumno") */
export function useAdobeAlumnosDetalle() {
  return useAdobeMiembrosDetalle("alumno");
}
