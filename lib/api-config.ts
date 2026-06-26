/** Base URL de Azure Functions (BFF). Ej: https://func-licencias.azurewebsites.net/api */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export function getLicenciasOperacionesUrl(): string {
  return `${API_BASE_URL}/v1/licencias/operaciones`;
}
