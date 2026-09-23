# Credenciales Adobe → Azure Key Vault

**Fuente única:** Key Vault (vía Function App C#).  
El portal **no** guarda `AdobeOrgId` / `AdobeClientId` / `AdobeClientSecret` en App Settings del SWA.

| Secreto KV | Uso |
|------------|-----|
| `AdobeOrgId` | Organization ID — portal UMAPI + ADF |
| `AdobeClientId` | Client ID OAuth S2S — portal + ADF |
| `AdobeClientSecret` | Client secret — portal + ADF |

Vault DEVL: `KV-DEVL-AprovLicencias` → `https://kv-devl-aprovlicencias.vault.azure.net/`

---

## Flujo (version4)

```
Browser → SWA (SAML) → BFF Node (x-fa-api-key) → FA C# → Key Vault / Adobe
```

Detalle: [SWA-FA-PROXY.md](./SWA-FA-PROXY.md) · Diagrama: [FRONT-BACK.md](./FRONT-BACK.md)

| Método | Ruta FA | Uso |
|--------|---------|-----|
| GET/PUT | `/api/v1/keyvault/adobe` | Configuración (secret enmascarado en GET) |
| GET/PUT | `/api/v1/configuracion/adobe` | UI Configuración (proxy desde SWA) |
| GET | `/api/v1/adobe/*` | Cuotas, miembros, licencias |
| GET/PUT | `/api/v1/configuracion/*` | Resto de configuración |

---

## App Settings SWA (BFF)

| Setting | Valor |
|---------|--------|
| `FaApiKey` | Mismo que `FA-DEVL-AprovLicencias` |
| `FaBaseUrl` | `https://fa-devl-aprovlicencias.azurewebsites.net` *(default)* |

**Quitar del SWA:** `AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret`, `FaKeyVaultBaseUrl`.

Health SWA: `GET /api/v1/health` → `mode: bff-proxy-to-fa-csharp`, `faProxy: true`, `adobeVia: fa-csharp`.

---

## App Settings FA C#

| Setting | Valor |
|---------|--------|
| `FaApiKey` | Valida llamadas del SWA |
| `KeyVaultUrl` | `https://kv-devl-aprovlicencias.vault.azure.net` |
| `StorageConnectionString` | Usuarios + upload CSV |

**Quitar de la FA:** `AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret` si ya están en Key Vault (evita conflicto con cache).

---

## IAM (DEVL)

| Identidad | Rol en KV |
|-----------|-----------|
| `FA-DEVL-AprovLicencias` | Key Vault Secrets Officer (Get, Set, List) |
| `ADF-DEVL-AprovLicencias` | Key Vault Secrets User (Get, List) |

---

## Operación

1. **Guardar credenciales:** UI Configuración (admin) → proxy → FA → `Set` en KV.
2. **Rotar secret Adobe:** actualizar en [Adobe Developer Console](https://developer.adobe.com/console), guardar en KV vía UI, **reiniciar FA** (cache de secretos).
3. **Error `invalid client_secret`:** el secret en KV no coincide con el Client ID activo — re-guardar desde consola Adobe.

PROD: [AMBIENTE-PROD.md](./AMBIENTE-PROD.md)
