# SWA → Function App C# (proxy) — version4

El API managed del SWA (`api/`) hace **SAML + sesión** y **proxy** hacia la FA C# para negocio.

**FA DEVL:** https://fa-devl-aprovlicencias.azurewebsites.net  
**Código C#:** `back-aprov-licencias/function-app-csharp`

```
Browser ──cookie──► SWA /api/v1/adobe|configuracion|usuarios|licencias/upload
                      │  requireRole / requireAdmin
                      │  x-fa-api-key
                      ▼
                    FA C# ──► Key Vault / Adobe UMAPI / Storage
```

## Endpoints proxy (SWA → FA)

| Ruta SWA | Rol | FA C# |
|----------|-----|-------|
| `GET/POST /api/v1/adobe/*` | admin, ejecutor | `/api/v1/adobe/*` |
| `GET/PUT /api/v1/configuracion/*` | admin (+ ejecutor lectura) | `/api/v1/configuracion/*` |
| `GET/POST/PATCH/DELETE /api/v1/usuarios` | admin | `/api/v1/usuarios` |
| `POST /api/v1/licencias/upload` | admin, ejecutor | `/api/v1/licencias/upload` |

Quedan **en el SWA** (no proxy): `auth/saml/*`, `auth/me`, `auth/logout`, `health`.

## App Settings SWA (API)

| Setting | Valor |
|---------|--------|
| `FaApiKey` | Mismo que `FA-DEVL-AprovLicencias` |
| `FaBaseUrl` | `https://fa-devl-aprovlicencias.azurewebsites.net` (opcional; ese es el default) |

**Quitar del SWA** (ya no se usan): `AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret`, `FaKeyVaultBaseUrl`.

**Permanecen en SWA:** SAML, `SESSION_SECRET`, `StorageConnectionString` (ACS → `AuthorizedUsers`).

## App Settings FA C#

| Setting | Valor |
|---------|--------|
| `FaApiKey` | Valida llamadas del SWA |
| `KeyVaultUrl` | `https://kv-devl-aprovlicencias.vault.azure.net` |
| `StorageConnectionString` | Usuarios CRUD + upload CSV (misma cuenta que SWA) |

**Quitar de la FA:** `AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret` en App Settings (usar solo Key Vault).

## Código en el repo front

| Archivo | Rol |
|---------|-----|
| `api/src/lib/fa-proxy.js` | `proxyToFa`, header `x-fa-api-key` |
| `api/src/lib/env.js` | `faBaseUrl`, `faApiKey` |
| `api/src/functions/adobe-licencias.js` | Proxy Adobe |
| `api/src/functions/configuracion.js` | Proxy configuración |
| `api/src/functions/usuarios.js` | Proxy usuarios |
| `api/src/functions/licencias-upload.js` | Proxy upload multipart |

Eliminados (lógica movida a FA C#): `adobe-umapi.js`, `key-vault.js`, `blob-storage.js`.

## Verificar

1. FA C# desplegada (grupos `Alumnos Tecmilenio` + `USER_GROUP` en cuotas).
2. Push a `version4` (CI/CD dispara en `**`).
3. `GET /api/v1/health` → `"mode":"bff-proxy-to-fa-csharp"`, `"faProxy":true`.
4. Cuotas / detalle / Configuración / Usuarios / upload CSV en el portal.

Diagrama completo: [FRONT-BACK.md](./FRONT-BACK.md)
