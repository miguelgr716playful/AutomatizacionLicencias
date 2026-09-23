# Automatización de Licencias

Plataforma web para gestionar licencias de software educativo (**Adobe**, **Minitab**) en Tecmilenio: carga de archivos CSV, panel general, reportes y configuración.

## Stack

- **Next.js 15** (App Router, `output: "export"`)
- **React 18** + **TypeScript**
- **Tailwind CSS 4**
- **Recharts** · **Lucide React** · **Radix UI** (shadcn/ui)
- **Azure Static Web Apps** + **API Node BFF** (managed en el mismo SWA) para SAML y proxy
- **Function App C#** (`FA-DEVL-AprovLicencias`) para Adobe UMAPI, Key Vault, usuarios y CSV

## Requisitos

- Node.js 18.18 o superior
- npm 9+

## Instalación

```bash
npm install
```

Copia variables de entorno de ejemplo:

```bash
cp .env.example .env.local
```

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_API_BASE_URL` | Base de la API (`…/api`). Vacío = sin llamadas a Functions. |
| `NEXT_PUBLIC_SAML_LOGIN` | `true` = SSO AMFS (cuenta Tec); `false` = login demo local. |

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La raíz redirige a `/login`.

Con `NEXT_PUBLIC_SAML_LOGIN=true`, el login redirige a **AMFS DEVL** (`amfsdevl.tec.mx`). Con `false`, queda el login demo local.

## Producción (static export)

```bash
npm run build
npx serve out
```

El build genera `out/` para Azure Static Web Apps.

## Pruebas

```bash
npm test        # modo watch
npm run test:run
```

## Despliegue (Azure SWA)

Ver [docs/DEPLOY-AZURE-SWA.md](docs/DEPLOY-AZURE-SWA.md).

1. Repositorio en GitHub conectado al Static Web App
2. Secret: **`AZURE_STATIC_WEB_APPS_API_TOKEN_HAPPY_CLIFF_0FFA2420F`** (Portal → SWA → Manage deployment token)
3. Cada push despliega el portal (`out/`) y la API BFF en `api/` (Functions managed del SWA)
4. La FA C# se despliega desde `back-aprov-licencias` (repo aparte)

**Demo:** [https://ambitious-island-01ab11110.7.azurestaticapps.net](https://ambitious-island-01ab11110.7.azurestaticapps.net)

**Health:** [https://ambitious-island-01ab11110.7.azurestaticapps.net/api/v1/health](https://ambitious-island-01ab11110.7.azurestaticapps.net/api/v1/health) → `mode: bff-proxy-to-fa-csharp`, `faProxy: true`

### Auth SAML (AMFS DEVL)

La API en `api/` expone login, ACS, metadata, sesión y logout. Adobe, configuración, usuarios y upload CSV se **reenvían** a la FA C# (`FaApiKey` + `FaBaseUrl`). El front usa SSO cuando `NEXT_PUBLIC_SAML_LOGIN=true`.

| Setting | Valor DEVL |
|---------|------------|
| `SAML_IDP_ENTRY_POINT` | `https://amfsdevl.tec.mx/nidp/saml2/sso` |
| `SAML_IDP_SLO_URL` | `https://amfsdevl.tec.mx/nidp/saml2/slo` |
| `SAML_IDP_CERT` | Cert IdP (`npm run saml:idp-cert`) |
| `SAML_SP_PUBLIC_CERT` / `SAML_SP_PRIVATE_KEY` | Par SP (`npm run saml:signing`) |
| `SAML_SP_AUTHN_REQUESTS_SIGNED` | `true` |
| `SESSION_SECRET` | Secreto para cookie de sesión |
| `SAML_FRONTEND_URL` / `SAML_FUNCTIONS_BASE_URL` | URL del SWA |
| `FaApiKey` | Auth del BFF hacia `FA-DEVL-AprovLicencias` |
| `FaBaseUrl` | `https://fa-devl-aprovlicencias.azurewebsites.net` *(default)* |

Metadata SP: `public/saml/sp-metadata.xml` o `GET /api/v1/auth/saml/metadata`. Entregar esa metadata a Identidad para el alta en AMFS.

### Allowlist de usuarios (Azure Table Storage)

Tras el login AMFS, solo entran correos en la tabla **`AuthorizedUsers`** (cuenta `stgstddevaprovlicencias`). El rol (`admin` / `ejecutor`) viene de la tabla.

Configura en **SWA → Configuration** (nombres **sin guion bajo**):

| Setting | Valor |
|---------|--------|
| `StorageConnectionString` | Connection string completo de la cuenta de storage |
| `AuthorizedUsersTable` | `AuthorizedUsers` |
| `AuthorizedUsersFallback` | `true` / `false` |

Detalle CSV + Blob Storage: [docs/CSV-STORAGE.md](docs/CSV-STORAGE.md)

**Verificar storage:** `GET /api/v1/health` → `authorizedUsersCount > 0`, `faProxy: true`. Upload CSV requiere `StorageConnectionString` en la **FA C#** (proxy desde SWA).

**Poblar usuarios iniciales** (11 filas desde `api/data/authorized-users.import.json`):

```powershell
cd api
$env:StorageConnectionString = "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
npm run seed:users
```

**Verificar que jale:**

1. `GET /api/v1/health` → `authorizedUsersTable: true` y `authorizedUsersCount > 0`
2. Login con correo en la tabla → dashboard
3. Login con correo que no esté → `/login?error=unauthorized`

CRUD (solo admin): `GET|POST|PATCH|DELETE /api/v1/usuarios` · carga rápida: `POST /api/v1/usuarios/seed`

Detalle: [docs/SAML-AMFS.md](docs/SAML-AMFS.md#filtro-de-acceso-allowlist)

## Módulos

| Ruta | UI | Descripción |
|------|-----|-------------|
| `/login` | Login | Demo local o SSO NAM (cuando esté activo) |
| `/dashboard` | Panel General | Métricas y tendencias (entrada por defecto) |
| `/aprovisionar` | Carga archivo | Alta/baja masiva vía CSV (Adobe / Minitab) |
| `/asignacion-licencias` | Asignación licencias | Asignar / revocar product profile Adobe |
| `/cuotas-adobe` | Cuotas Adobe | Cupo y uso de product profiles (UMAPI) |
| `/reportes` | Reportes | Historial, filtros y export CSV |
| `/configuracion` | Configuración | Mapeo de proveedores y tareas |
| `/usuarios` | Usuarios | Allowlist post-SAML (solo admin) |

## Roles

| Rol | Acceso |
|-----|--------|
| **Administrador** | Panel, carga archivo, reportes, configuración |
| **Ejecutor** | Panel, carga archivo, configuración |
| **Auditor** | Panel y reportes (oculto en selector demo) |

En modo SAML el rol viene de `/api/v1/auth/me` (tabla `AuthorizedUsers`); el switcher de rol se desactiva.

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/FRONT-BACK.md](docs/FRONT-BACK.md) | Arquitectura front ↔ FA C# (diagramas) |
| [docs/SWA-FA-PROXY.md](docs/SWA-FA-PROXY.md) | Contrato BFF proxy SWA → FA |
| [docs/CONFIG-KEYVAULT.md](docs/CONFIG-KEYVAULT.md) | Credenciales Adobe en Key Vault (vía FA) |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Clean Architecture, flujos, stack |
| [docs/DECISIONES-ARQUITECTURA.md](docs/DECISIONES-ARQUITECTURA.md) | Decisiones Azure (Functions, ADF, NAM, CSV) |
| [docs/EPICA-2-ENDPOINTS.md](docs/EPICA-2-ENDPOINTS.md) | Contratos API front ↔ Functions (incl. SAML) |
| [docs/DEPLOY-AZURE-SWA.md](docs/DEPLOY-AZURE-SWA.md) | Plan de despliegue en Azure SWA |
| [docs/AMBIENTE-PROD.md](docs/AMBIENTE-PROD.md) | Mapa DEVL → PROD |
| [docs/SAML-AMFS.md](docs/SAML-AMFS.md) | SSO AMFS + allowlist `AuthorizedUsers` |
| [docs/CSV-STORAGE.md](docs/CSV-STORAGE.md) | Carga CSV → Blob (`actual/` + `historico/`) vía FA |
| [docs/ASIGNACION-LICENCIAS.md](docs/ASIGNACION-LICENCIAS.md) | Asignar/revocar licencia Adobe (individual o lista) |
| [docs/ADOBE-UMAPI.md](docs/ADOBE-UMAPI.md) | Consultar, asignar y desasignar licencias Adobe (UMAPI / Postman) |
| [tools/AdobeUmapiConsole](tools/AdobeUmapiConsole/README.md) | Consola C# (.NET 8) con los flujos UMAPI |
