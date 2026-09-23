export interface AdobeUserDto {
  email: string;
  firstname: string;
  lastname: string;
  status: string;
  type: string;
  domain: string;
  groups: string[];
}

export interface AdobeProductProfileDto {
  groupName: string;
  productName: string;
  memberCount: number | null;
  licenseQuota: string | null;
}

export type AdobeCuotaStatus =
  | "ok"
  | "alto"
  | "critico"
  | "lleno"
  | "ilimitado"
  | "sin_cuota"
  | "no_encontrado";

export interface AdobeCuotaProfileDto {
  groupName: string;
  /** Nombre real en Adobe si difiere del mostrado. */
  adobeGroupName?: string;
  /** USER_GROUP | PRODUCT_PROFILE | etc. */
  type?: string | null;
  label?: string;
  productName: string;
  memberCount: number;
  licenseQuota: string | null;
  quota: number | null;
  unlimited: boolean;
  available: number | null;
  usedPct: number | null;
  status: AdobeCuotaStatus;
  portal: boolean;
}

export interface AdobeCuotasDto {
  summary: {
    totalProductProfiles: number;
    portalProfiles: number;
    membersPortal: number;
    membersAll: number;
    nearCapacity: number;
    atCapacity: number;
    unlimitedProfiles: number;
  };
  portalProfiles: AdobeCuotaProfileDto[];
  otherProfiles: AdobeCuotaProfileDto[];
  fetchedAt: string;
}

export interface AdobeMiembroDto {
  email: string;
  firstname: string;
  lastname: string;
  status: string;
  type: string;
  domain: string;
  username: string;
}

export interface AdobeMiembrosDto {
  perfil: "alumno" | "profesor";
  label: string;
  displayGroupName: string;
  groupName: string;
  page: number;
  lastPage: boolean;
  domain: string | null;
  rawCount: number;
  count: number;
  users: AdobeMiembroDto[];
}

export type AdobeLicenciaAccion = "asignar" | "revocar";

export interface AdobeLicenciaResult {
  ok: boolean;
  accion: AdobeLicenciaAccion;
  email?: string;
  emails?: string[];
  mode?: "lista" | string;
  groupName?: string;
  groups?: string[];
  message?: string;
  success?: boolean;
  result?: string;
  completed?: number;
  notCompleted?: number;
  total?: number;
  errors?: Array<{ message: string; errorCode: string; user?: string }>;
  user?: AdobeUserDto | null;
  error?: string;
}
