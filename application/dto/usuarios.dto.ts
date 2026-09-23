import type { Role } from "@/lib/constants";

export type UsuarioRol = Extract<Role, "admin" | "ejecutor">;

export interface AuthorizedUserDto {
  email: string;
  nombre: string;
  nomina?: string;
  rol: UsuarioRol;
}

export interface UsuariosListResponse {
  users: AuthorizedUserDto[];
  total: number;
}

export interface UsuarioPayload {
  email: string;
  nombre: string;
  nomina?: string;
  rol: UsuarioRol;
}
