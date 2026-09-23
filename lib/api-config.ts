/** Base URL de la API (SWA managed Functions). Ej: https://....azurestaticapps.net/api */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export function getLicenciasOperacionesUrl(): string {
  return `${API_BASE_URL}/v1/licencias/operaciones`;
}

export function getLicenciasUploadUrl(): string {
  return `${API_BASE_URL}/v1/licencias/upload`;
}

export function getSamlLoginUrl(returnTo = "/dashboard"): string {
  if (!API_BASE_URL) return "";
  const params = new URLSearchParams({ returnTo });
  return `${API_BASE_URL}/v1/auth/saml/login?${params.toString()}`;
}

export function getAuthMeUrl(): string {
  return `${API_BASE_URL}/v1/auth/me`;
}

export function getAuthLogoutUrl(): string {
  return `${API_BASE_URL}/v1/auth/logout`;
}

export function getUsuariosUrl(email?: string): string {
  const base = `${API_BASE_URL}/v1/usuarios`;
  if (!email) return base;
  return `${base}?email=${encodeURIComponent(email)}`;
}

export function getAdobeUsuarioUrl(email: string): string {
  return `${API_BASE_URL}/v1/adobe/usuario?email=${encodeURIComponent(email)}`;
}

export function getAdobeProfilesUrl(): string {
  return `${API_BASE_URL}/v1/adobe/profiles`;
}

export function getAdobeCuotasUrl(): string {
  return `${API_BASE_URL}/v1/adobe/cuotas`;
}

export function getAdobeMiembrosUrl(
  perfil: "alumno" | "profesor",
  page = 0,
  domain = "tecmilenio.mx"
): string {
  const params = new URLSearchParams({
    perfil,
    page: String(page),
    domain,
  });
  return `${API_BASE_URL}/v1/adobe/miembros?${params.toString()}`;
}

export function getAdobeLicenciasUrl(): string {
  return `${API_BASE_URL}/v1/adobe/licencias`;
}

export function getConfiguracionUrl(): string {
  return `${API_BASE_URL}/v1/configuracion`;
}

export function getConfiguracionAdobeUrl(): string {
  return `${API_BASE_URL}/v1/configuracion/adobe`;
}

/** true = SSO AMFS; false = login demo local. */
export function isSamlLoginEnabled(): boolean {
  return Boolean(API_BASE_URL) && process.env.NEXT_PUBLIC_SAML_LOGIN === "true";
}
