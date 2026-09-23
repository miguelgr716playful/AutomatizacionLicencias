# Federación SAML con AMFS (DEVL)

Guía operativa del login institucional contra **AMFS** (`amfsdevl.tec.mx`) para Automatización de Licencias.

## Flujo

1. El usuario abre la app → `/login`.
2. Clic en **Iniciar sesión con cuenta Tec**.
3. El BFF redirige a AMFS: `https://amfsdevl.tec.mx/nidp/saml2/sso` (AuthnRequest firmado).
4. El colaborador se autentica en AMFS (SSO con otras apps federadas).
5. AMFS responde al ACS: `/api/v1/auth/saml/acs`.
6. La app crea cookie de sesión y muestra el dashboard.
7. Al cerrar sesión: `/api/v1/auth/logout` → AMFS SLO `.../nidp/saml2/slo` (logout global).

> Abrir solo la URL de SSO en el navegador **no** redirige a la app: el login debe iniciar desde el SP.

## Roles

| Pieza | Quién | URL / archivo |
|-------|--------|----------------|
| IdP | AMFS Tec | `https://amfsdevl.tec.mx` |
| SP (esta app) | Azure SWA | `https://ambitious-island-01ab11110.7.azurestaticapps.net` |
| Metadata SP | Estática | `/saml/sp-metadata.xml` |
| ACS | API | `/api/v1/auth/saml/acs` |
| SLO SP | API | `/api/v1/auth/saml/slo` |

### URLs IdP (DEVL)

| Uso | URL | ¿Configurar en el SP? |
|-----|-----|------------------------|
| SSO | `https://amfsdevl.tec.mx/nidp/saml2/sso` | Sí → `SAML_IDP_ENTRY_POINT` |
| SLO | `https://amfsdevl.tec.mx/nidp/saml2/slo` | Sí → `SAML_IDP_SLO_URL` |
| SLO return | `https://amfsdevl.tec.mx/nidp/saml2/slo_return` | **No** (lo usa AMFS) |
| Metadata IdP | `https://amfsdevl.tec.mx/nidp/saml2/metadata` | Para obtener `SAML_IDP_CERT` |

## Variables de entorno (Azure SWA → Variables de entorno → Production)

### Obligatorias

| Nombre | Valor ejemplo / notas |
|--------|------------------------|
| `SAML_IDP_ENTRY_POINT` | `https://amfsdevl.tec.mx/nidp/saml2/sso` |
| `SAML_IDP_SLO_URL` | `https://amfsdevl.tec.mx/nidp/saml2/slo` |
| `SAML_IDP_CERT` | Cert público IdP (PEM en una línea con `\n`). `npm run saml:idp-cert` |
| `SAML_SP_PUBLIC_CERT` | Cert público SP (PEM con `\n`) |
| `SAML_SP_PRIVATE_KEY` | Llave privada SP (PEM con `\n`). **No subir a Git** |
| `SAML_SP_AUTHN_REQUESTS_SIGNED` | `true` |
| `SAML_SP_ENTITY_ID` | `https://ambitious-island-01ab11110.7.azurestaticapps.net/` |
| `SAML_FRONTEND_URL` | `https://ambitious-island-01ab11110.7.azurestaticapps.net` |
| `SAML_FUNCTIONS_BASE_URL` | `https://ambitious-island-01ab11110.7.azurestaticapps.net` |
| `SESSION_SECRET` | Secreto largo aleatorio |
| `StorageConnectionString` | ACS → tabla `AuthorizedUsers` |
| `FaApiKey` / `FaBaseUrl` | Proxy CRUD usuarios hacia FA C# (no SAML) |

### Front (build / GitHub Actions)

| Nombre | Valor |
|--------|--------|
| `NEXT_PUBLIC_SAML_LOGIN` | `true` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://ambitious-island-01ab11110.7.azurestaticapps.net/api` |

> **GitHub Secrets ≠ Variables de Azure.** Los secrets de Actions no llegan solos a la Function. Hay que cargarlos en **SWA → Variables de entorno**.

## Certificados SP

```bash
npm run saml:signing    # genera cert SP (si falta), .env.local, metadata
npm run saml:idp-cert   # descarga cert IdP AMFS → certs/saml/idp-public.crt
npm run saml:metadata   # regenera public/saml/sp-metadata.xml
```

- Metadata con `AuthnRequestsSigned="true"` y `X509Certificate`.
- Entregar `public/saml/sp-metadata.xml` a Identidad para el alta en AMFS.
- Cert SP auto-firmado es válido en SAML (confianza por metadata, no por CA pública).

## Claims AMFS → UI

El **Subject / NameID** suele ser un ID **opaco** (Base64). **No es la nómina cifrada** y **no se descifra** con la llave SP.

Claims reales (ejemplo SAML-tracer AMFS):

| Claim (Name) | Ejemplo | Uso en app |
|--------------|---------|------------|
| `.../claims/mail` | `caso1@tecmilenio.mx` | Email |
| `.../claims/givenname` | `Cesar Osmar` | Nombre |
| `.../claims/sn` | `Urdiales` | Apellido |
| `employeeType` (si viene) | `Colaborador` | Tipo |
| Subject / NameID | opaco Base64 | Solo federación / SLO |

Todos los attributes se guardan en `claims` (sesión + `GET /api/v1/auth/me`).

Mapeo: `api/src/lib/session.js` (`userFromProfile` / `buildClaims`).

Tras cambios de mapeo: **deploy + cerrar sesión + volver a entrar**.

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/auth/saml/login` | Inicia SSO |
| `POST` | `/api/v1/auth/saml/acs` | Assertion Consumer Service |
| `GET`/`POST` | `/api/v1/auth/saml/slo` | Single Logout Service (SP) |
| `GET` | `/api/v1/auth/saml/metadata` | Metadata dinámica |
| `GET` | `/api/v1/auth/me` | Usuario de sesión |
| `GET`/`POST` | `/api/v1/auth/logout` | Logout local (+ SLO IdP) |
| `GET` | `/api/v1/health` | Health + URLs SAML |

## Errores frecuentes

| Error | Causa | Qué hacer |
|-------|--------|-----------|
| `SAML no configurado` / falta `SAML_IDP_ENTRY_POINT`, `SAML_IDP_CERT` | Variables solo en GitHub Secrets o ausentes en Azure | Cargarlas en **Variables de entorno** del SWA |
| `Responder error: NoAuthnContext` | IdP rechaza `PasswordProtectedTransport` | SP con `disableRequestedAuthnContext: true` (ya en `api/src/lib/saml.js`) |
| Sidebar muestra `Usuario` + Subject opaco | Claims no mapeados o deploy viejo | Desplegar mapeo de `mail`/`givenName`/`sn` y re-login |
| Abrir `/nidp/saml2/sso` no vuelve a la app | Falta AuthnRequest del SP | Iniciar login desde `/login` de la app |

## Logs / trazas

1. Azure Portal → **SWA-DEVL-AprovLicencias** → Application Insights / Log stream.
2. Buscar: `ACS OK` (incluye `email`, `nombre`, `attrs=[...]`).
3. En el navegador: extensión **SAML-tracer** sobre el `POST .../saml/acs`.

## Filtro de acceso (allowlist)

Tras autenticar en AMFS, el ACS busca el correo en la tabla Azure **`AuthorizedUsers`**
(`stgstddevaprovlicencias`).

- Match solo por **correo** (case-insensitive).
- El **rol** de la tabla prevalece (`admin` / `ejecutor`).
- Si no está → `/login?error=unauthorized`.
- Si la tabla no responde, hay fallback a `api/src/lib/authorized-users.js` (`AuthorizedUsersFallback=true`).

### Edición (solo admin, cookie de sesión)

Rutas expuestas en el SWA; el BFF **reenvía** a FA C# (`x-fa-api-key`). La FA usa `StorageConnectionString` para la tabla.

| Método | Ruta | Acción |
|--------|------|--------|
| `GET` | `/api/v1/usuarios` | Listar |
| `POST` | `/api/v1/usuarios` | Alta `{ email, nombre, rol, nomina? }` |
| `PATCH` | `/api/v1/usuarios` | Cambiar `{ email, rol?, nombre?, nomina? }` |
| `DELETE` | `/api/v1/usuarios?email=` | Quitar |
| `POST` | `/api/v1/usuarios/seed` | Carga la lista inicial |

### Variable de entorno SWA

`StorageConnectionString` = connection string de `stgstddevaprovlicencias`  
(Portal → cuenta de almacenamiento → Claves de acceso)

`AuthorizedUsersTable` = `AuthorizedUsers`

### Poblar la tabla (está vacía)

**Opción A — script local** (recomendado la primera vez):

```bash
cd api
# Connection string: Portal → stgstddevaprovlicencias → Claves de acceso
set StorageConnectionString=DefaultEndpointsProtocol=https;AccountName=stgstddevaprovlicencias;...
npm run seed:users
```

Lee `api/data/authorized-users.import.json` (11 usuarios).

**Opción B — API** (requiere sesión admin):

```http
POST /api/v1/usuarios/seed
Cookie: licencias_session=...
```

**Opción C — Storage Explorer:** agregar filas manualmente:

| PartitionKey | RowKey | email | nombre | nomina | rol |
|--------------|--------|-------|--------|--------|-----|
| `users` | `caso1@tecmilenio.mx` | `caso1@tecmilenio.mx` | Cesar Osmar Urdiales | | `admin` |

**Verificar:** `GET /api/v1/health` debe mostrar `authorizedUsersCount: 11`.

Mientras la tabla esté vacía, deja `AuthorizedUsersFallback=true` para que el login siga usando la lista en código; cuando ya haya filas puedes poner `false`.

- [ ] Metadata SP entregada y SP dado de alta en AMFS DEVL
- [ ] Variables IdP + SP + `SESSION_SECRET` en Azure
- [ ] `NEXT_PUBLIC_SAML_LOGIN=true` desplegado
- [ ] Login desde la app → portal AMFS → dashboard
- [ ] Sidebar muestra nombre (`givenName` + `sn`) y `mail`
- [ ] Cerrar sesión limpia cookie y pasa por SLO IdP
- [ ] (Opcional) Filtro de autorización: quién puede ver el dashboard

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run saml:cert` | Genera cert/llave SP auto-firmado |
| `npm run saml:idp-cert` | Baja cert IdP desde metadata AMFS |
| `npm run saml:metadata` | Regenera `sp-metadata.xml` |
| `npm run saml:signing` | Cert SP + `.env.local` + `local.settings.json` + metadata |

## Referencias

- [FRONT-BACK.md](./FRONT-BACK.md) — arquitectura SAML + proxy
- [SWA-FA-PROXY.md](./SWA-FA-PROXY.md) — endpoints reenviados a FA
- [CSV-STORAGE.md](./CSV-STORAGE.md) — allowlist vs upload (storage en SWA vs FA)
