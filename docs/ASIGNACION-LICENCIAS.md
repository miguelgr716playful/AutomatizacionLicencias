# Asignación licencias (Adobe UMAPI)

Asignar o revocar un **perfil de licencia** a un correo desde el portal.

## Perfiles permitidos

| UI | Grupo Adobe (`groupName`) |
|----|---------------------------|
| **Perfil profesor** | `Colaboradores y Profesores Tecmilenio` |
| **Perfil alumno** | `Alumnos Tecmilenio` |

Cuotas, detalle de miembros y asignar/revocar usan esos nombres. En esta org son **USER_GROUP** (no product profiles); la cuota numérica solo aplica si Adobe expone `licenseQuota`.

## Portal

Ruta: **`/asignacion-licencias`** (menú **Asignación licencias**)

Roles: **admin** y **ejecutor**

Flujo:

1. Buscar correo en Adobe
2. Elegir **Perfil profesor** o **Perfil alumno**
3. **Asignar** / **Revocar** (solo el perfil elegido)

| Acción | Efecto |
|--------|--------|
| Asignar | `add` del perfil profesor o alumno |
| Revocar | `remove` solo de ese perfil |

## API (SWA BFF → FA C#)

El browser llama al SWA; el BFF Node valida sesión/rol y reenvía a la FA C# con `x-fa-api-key`.

| Método | Ruta SWA | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/adobe/usuario?email=` | Consulta usuario + `groups` |
| `GET` | `/api/v1/adobe/profiles` | Solo los 2 perfiles de licencia |
| `GET` | `/api/v1/adobe/cuotas` | Cuotas (`memberCount` / `licenseQuota`) + resumen |
| `GET` | `/api/v1/adobe/miembros?perfil=` | Detalle paginado alumnos o profesores |
| `POST` | `/api/v1/adobe/licencias` | `{ email, groupName, accion: "asignar"\|"revocar" }` |

`groupName` debe ser exactamente uno de los dos de la tabla. Cualquier otro → `400`.

## Variables SWA (sin guion bajo)

| Setting | Valor |
|---------|--------|
| `FaApiKey` | Mismo que `FA-DEVL-AprovLicencias` |
| `FaBaseUrl` | `https://fa-devl-aprovlicencias.azurewebsites.net` *(default)* |

Credenciales Adobe (`AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret`) viven en **Key Vault** y las lee la FA C# — **no** en App Settings del SWA.

Verificar: `GET /api/v1/health` → `faProxy: true`, `adobeVia: "fa-csharp"`, `mode: "bff-proxy-to-fa-csharp"`

## Archivos

| Ruta | Rol |
|------|-----|
| `lib/perfiles-licencia.ts` | Catálogo fijo profesor/alumno |
| `api/src/lib/fa-proxy.js` | Proxy SWA → FA C# |
| `api/src/functions/adobe-licencias.js` | Endpoints HTTP (proxy) |
| `hooks/use-adobe-licencias.ts` | Cliente front |
| `hooks/use-adobe-miembros-detalle.ts` | Detalle paginado miembros |
| `components/sections/asignacion-licencias-section.tsx` | UI |
| `components/sections/adobe-cuotas-section.tsx` | Cuotas y estadísticas |
| `hooks/use-adobe-cuotas.ts` | Cliente cuotas |

Lógica UMAPI real: `back-aprov-licencias/function-app-csharp` (`AdobeLicenciasFunction`, `AdobeUmapiService`).

## Cuotas Adobe

Ruta: **`/cuotas-adobe`** (menú **Cuotas Adobe**)

Muestra `memberCount`, `licenseQuota`, disponibles y % de uso de los **perfiles del portal** (profesor y alumno).

Detalle Postman: [ADOBE-UMAPI.md](./ADOBE-UMAPI.md) · Arquitectura: [FRONT-BACK.md](./FRONT-BACK.md)
