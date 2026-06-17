import type { ElementType } from "react";
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  Settings,
} from "lucide-react";

export type Section =
  | "dashboard"
  | "aprovisionar"
  | "reportes"
  | "configuracion";

export type Role = "admin" | "ejecutor" | "auditor";

export interface NavItem {
  id: Section;
  label: string;
  icon: ElementType;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "aprovisionar",
    label: "Aprovisionar",
    icon: UserPlus,
    href: "/aprovisionar",
  },
  {
    id: "reportes",
    label: "Reportes",
    icon: FileText,
    href: "/reportes",
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: Settings,
    href: "/configuracion",
  },
];

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
  admin: ["dashboard", "aprovisionar", "reportes", "configuracion"],
  ejecutor: ["aprovisionar", "configuracion"],
  auditor: ["dashboard", "reportes"],
};

export const SECTION_HREFS: Record<Section, string> = {
  dashboard: "/dashboard",
  aprovisionar: "/aprovisionar",
  reportes: "/reportes",
  configuracion: "/configuracion",
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
