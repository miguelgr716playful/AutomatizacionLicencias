import type { ElementType } from "react";
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  Settings,
  Users,
  KeyRound,
  Gauge,
} from "lucide-react";

export type Section =
  | "dashboard"
  | "aprovisionar"
  | "asignacion-licencias"
  | "cuotas-adobe"
  | "reportes"
  | "configuracion"
  | "usuarios";

export type Role = "admin" | "ejecutor" | "auditor";

export interface NavItem {
  id: Section;
  label: string;
  icon: ElementType;
  href: string;
  hidden?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "aprovisionar",
    label: "Carga archivo",
    icon: UserPlus,
    href: "/aprovisionar",
  },
  {
    id: "asignacion-licencias",
    label: "Asignación licencias",
    icon: KeyRound,
    href: "/asignacion-licencias",
  },
  {
    id: "cuotas-adobe",
    label: "Cuotas Adobe",
    icon: Gauge,
    href: "/cuotas-adobe",
  },
  {
    id: "dashboard",
    label: "Panel General",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "reportes",
    label: "Reportes",
    icon: FileText,
    href: "/reportes",
    hidden: true,
  },
  {
    id: "usuarios",
    label: "Usuarios",
    icon: Users,
    href: "/usuarios",
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: Settings,
    href: "/configuracion",
  },
];

/** Roles ocultos en el selector (se mantienen en código por si se reactivan). */
export const HIDDEN_ROLES: Role[] = ["auditor"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  ejecutor: "Ejecutor",
  auditor: "Auditor",
};

export const ROLE_INITIALS: Record<Role, string> = {
  admin: "AD",
  ejecutor: "EJ",
  auditor: "AU",
};

export const ROLE_SECTIONS: Record<Role, Section[]> = {
  admin: [
    "dashboard",
    "aprovisionar",
    "asignacion-licencias",
    "cuotas-adobe",
    "reportes",
    "usuarios",
    "configuracion",
  ],
  ejecutor: [
    "aprovisionar",
    "asignacion-licencias",
    "cuotas-adobe",
    "dashboard",
  ],
  auditor: ["dashboard", "reportes"],
};

export const SECTION_HREFS: Record<Section, string> = {
  dashboard: "/dashboard",
  aprovisionar: "/aprovisionar",
  "asignacion-licencias": "/asignacion-licencias",
  "cuotas-adobe": "/cuotas-adobe",
  reportes: "/reportes",
  configuracion: "/configuracion",
  usuarios: "/usuarios",
};

export function getDefaultHrefForRole(role: Role): string {
  return SECTION_HREFS[ROLE_SECTIONS[role][0]];
}

export function isSectionAllowedForRole(
  pathname: string,
  role: Role
): boolean {
  const allowedHrefs = ROLE_SECTIONS[role].map((s) => SECTION_HREFS[s]);
  return allowedHrefs.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  );
}
