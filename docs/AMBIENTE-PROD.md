# Ambiente productivo — Aprov Licencias

Guía de infraestructura Azure para **PROD**, alineada al ambiente **DEVL** actual y a la arquitectura del portal (SWA + Functions + Key Vault + ADF).

---

## 1. Resumen

| Ambiente | Propósito |
|----------|-----------|
| **DEVL** | Pruebas, SAML `amfsdevl`, secretos y storage de desarrollo |
| **PROD** | Usuarios reales, IdP productivo, secretos y storage aislados |

**Regla:** no compartir Key Vault, Storage, `FaApiKey`, `SESSION_SECRET` ni Client Secret de Adobe entre DEVL y PROD.

---

## 2. Mapa DEVL → PROD

| Tipo | DEVL | PROD |
|------|------|------|
| Resource Group | `RGUTM-Servicios_AprovLicencias` | `RGUTM-Servicios_AprovLicencias-PROD` |
| Key Vault | `KV-DEVL-AprovLicencias` | `KV-PROD-AprovLicencias` |
| Key Vault URL | `https://kv-devl-aprovlicencias.vault.azure.net/` | `https://kv-prod-aprovlicencias.vault.azure.net/` |
| Storage | `stgstddevaprovlicencias` | `stgprodaprovlicencias` |
| Data Factory | `ADF-DEVL-AprovLicencias` | `ADF-PROD-AprovLicencias` |
| Static Web App | `SWA-DEVL-AprovLicencias` | `SWA-PROD-AprovLicencias` |
| Function App | `FA-DEVL-AprovLicencias` | `FA-PROD-AprovLicencias` |
| Function URL | `https://fa-devl-aprovlicencias.azurewebsites.net` | `https://fa-prod-aprovlicencias.azurewebsites.net` |
| App Insights | *(si existe en DEVL)* | `AI-PROD-AprovLicencias` |
| Log Analytics | *(si existe)* | `LAW-PROD-AprovLicencias` |
| Self-hosted IR | *(Banner / on-prem)* | `SHIR-PROD-AprovLicencias` |

---

## 3. Diagrama

```
Usuarios → SWA-PROD (portal + /api BFF)
              ├─ SAML + Storage PROD  → AuthorizedUsers (ACS)
              ├─ FaApiKey + FaBaseUrl → FA-PROD (proxy Adobe / config / usuarios / upload)
              └─ FA-PROD ──► KV-PROD + Storage PROD + Adobe UMAPI
                                    ↑
ADF-PROD (Managed Identity) ──────┘  (solo lee secretos)
     └─ SHIR → Banner 8.7 (si aplica)
```

| Consumidor | Origen | Key Vault |
|------------|--------|-----------|
| Portal UMAPI (`/api/v1/adobe/*`) | Proxy SWA → FA (`FaApiKey`) | **FA lee KV** |
| Configuración Adobe (UI) | Proxy SWA → FA | **FA escribe KV** |
| FA | Managed Identity | **Lee y escribe** |
| ADF | Managed Identity | **Solo lee** |

---

## 4. SKUs recomendados

| Recurso | SKU PROD | Notas |
|---------|----------|--------|
| Static Web App | **Standard** | Dominio custom, SLA, staging, identidad |
| Function App | Consumption (**Y1**) o **Premium EP1** | Premium si hay carga nocturna / timeouts Adobe |
| Storage Account | **Standard LRS** (o GRS si DR) | Table + Blob |
| Key Vault | **Standard** | Soft-delete + **purge protection On** |
| Data Factory | Standard (pay-as-you-go) | Igual patrón DEVL |
| Application Insights | Workspace-based | Obligatorio para operación |
| Self-hosted IR | VM / on-prem | Solo si ADF conecta a Banner |

---

## 5. Contenedores y tablas (Storage)

En `stgprodaprovlicencias`:

| Recurso | Nombre | Uso |
|---------|--------|-----|
| Table | `AuthorizedUsers` | Usuarios del portal (roles) |
| Blob container | `csv-uploads` | Cargas CSV (`actual/` + `historico/`) |

Ver [CSV-STORAGE.md](./CSV-STORAGE.md).

---

## 6. Secretos en Key Vault PROD

Vault: `KV-PROD-AprovLicencias` → `https://kv-prod-aprovlicencias.vault.azure.net/`

| Secreto | Uso |
|---------|-----|
| `AdobeOrgId` | Organization ID — portal UMAPI (vía FA) + ADF |
| `AdobeClientId` | Client ID OAuth S2S — portal + ADF |
| `AdobeClientSecret` | Client secret — portal + ADF |
| *(opcional)* secretos Minitab | Si el proveedor se usa en ADF |

Crear valores **de producción** (no clonar DEVL si Adobe tiene app distinta).

Documentación: [CONFIG-KEYVAULT.md](./CONFIG-KEYVAULT.md).

---

## 7. Managed Identity e IAM

### 7.1 Activar identidad

| Recurso | Acción |
|---------|--------|
| `FA-PROD-AprovLicencias` | Identidad → System assigned → **On** |
| `ADF-PROD-AprovLicencias` | Identidad → System assigned → **On** |
| `SWA-PROD-AprovLicencias` | Opcional (Configuración usa FA) |

### 7.2 Roles en `KV-PROD-AprovLicencias` (RBAC)

| Identidad | Rol | Operaciones |
|-----------|-----|-------------|
| `FA-PROD-AprovLicencias` | **Key Vault Secrets Officer** | Get, Set, List |
| `ADF-PROD-AprovLicencias` | **Key Vault Secrets User** | Get, List |
| Admins humanos (opcional) | Secrets Officer / Administrator | Operación |

Usar **Azure RBAC** en el vault (no access policies clásicas, si DEVL ya está en RBAC).

### 7.3 Storage

| Quién | Acceso |
|-------|--------|
| SWA / FA | `StorageConnectionString` (como DEVL) **o** MI con roles Table/Blob Data Contributor |

---

## 8. App Settings

### 8.1 SWA-PROD-AprovLicencias

| Setting | Valor / nota |
|---------|----------------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://<dominio-prod>/api` |
| `NEXT_PUBLIC_SAML_LOGIN` | `true` |
| `SAML_IDP_ENTRY_POINT` | IdP **productivo** (no `amfsdevl`) |
| `SAML_IDP_SLO_URL` | SLO productivo |
| `SAML_IDP_CERT` | Cert IdP PROD |
| `SAML_SP_PUBLIC_CERT` / `SAML_SP_PRIVATE_KEY` | SP PROD |
| `SAML_FUNCTIONS_BASE_URL` / `SAML_FRONTEND_URL` | Dominio PROD |
| `SESSION_SECRET` | Nuevo, largo, distinto de DEVL |
| `StorageConnectionString` | `stgprodaprovlicencias` (ACS → `AuthorizedUsers`) |
| `AuthorizedUsersTable` | `AuthorizedUsers` |
| `FaApiKey` | Mismo valor que FA-PROD |
| `FaBaseUrl` | `https://fa-prod-aprovlicencias.azurewebsites.net` |

**No poner en SWA:** `AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret` (solo Key Vault vía FA).

### 8.2 FA-PROD-AprovLicencias

| Setting | Valor |
|---------|--------|
| `KeyVaultUrl` | `https://kv-prod-aprovlicencias.vault.azure.net` |
| `FaApiKey` | Mismo que SWA-PROD |
| `StorageConnectionString` | `stgprodaprovlicencias` (usuarios CRUD + upload CSV) |
| `CsvUploadContainer` | `csv-uploads` |
| `AuthorizedUsersTable` | `AuthorizedUsers` |

**No poner en FA:** `AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret` en App Settings (usar Key Vault).

### 8.3 ADF-PROD-AprovLicencias

- Linked service → Key Vault PROD (Managed Identity)
- Pipelines equivalentes a DEVL leyendo `AdobeOrgId` / `AdobeClientId` / `AdobeClientSecret`
- Si aplica: linked service Banner vía `SHIR-PROD-AprovLicencias`

---

## 9. Observabilidad y operación

| Pieza | Acción |
|-------|--------|
| Application Insights | Ligar SWA + FA |
| Log Analytics | Workspace `LAW-PROD-AprovLicencias` |
| Alertas sugeridas | 5xx API, fallos pipeline ADF, timeouts Adobe (504) |
| GitHub Environment `production` | Approval manual + secrets de deploy PROD |

---

## 10. Orden de alta

1. Crear Resource Group `RGUTM-Servicios_AprovLicencias-PROD`
2. Key Vault (soft-delete + purge protection) + secretos Adobe
3. Storage Account (table + contenedor blob)
4. Function App + Managed Identity + rol Secrets Officer
5. Data Factory + Managed Identity + rol Secrets User + linked services
6. Application Insights + Log Analytics
7. Static Web App **Standard** + App Settings + deploy
8. Dominio custom + registro SAML en AMFS/NAM **PROD**
9. Self-hosted IR (si Banner)
10. Pruebas de humo (sección 11)

---

## 11. Pruebas de humo PROD

- [ ] `GET /api/v1/health` → `ok`, `faProxy: true`, `mode: bff-proxy-to-fa-csharp`, `adobeVia: fa-csharp`
- [ ] Login SAML (IdP productivo)
- [ ] Configuración → leer/guardar Adobe en KV vía FA
- [ ] Cuotas Adobe
- [ ] Detalle alumnos (`/cuotas-adobe/alumnos`) y profesores (`/cuotas-adobe/profesores`)
- [ ] Export CSV
- [ ] Pipeline ADF (token + consulta miembros / cupos)
- [ ] Carga CSV / aprovisionar (si ya está cableado a ADF)

---

## 12. Texto para ticket a infraestructura

> Solicitud de ambiente productivo **Aprov Licencias**:
>
> Resource Group `RGUTM-Servicios_AprovLicencias-PROD` con:
>
> - Key Vault `KV-PROD-AprovLicencias` (`https://kv-prod-aprovlicencias.vault.azure.net/`) — soft-delete y purge protection
> - Storage `stgprodaprovlicencias` (Table `AuthorizedUsers`, Blob `csv-uploads`)
> - Function App `FA-PROD-AprovLicencias`
> - Data Factory `ADF-PROD-AprovLicencias`
> - Static Web App Standard `SWA-PROD-AprovLicencias`
> - Application Insights `AI-PROD-AprovLicencias` + Log Analytics `LAW-PROD-AprovLicencias`
>
> Activar Managed Identity en FA y ADF. En el Key Vault asignar:
>
> 1. FA → **Key Vault Secrets Officer**
> 2. ADF → **Key Vault Secrets User**
>
> Ambiente 100 % separado de DEVL (secretos, storage y SAML productivo).

---

## 13. Referencias

- [FRONT-BACK.md](./FRONT-BACK.md) — Arquitectura front ↔ FA
- [SWA-FA-PROXY.md](./SWA-FA-PROXY.md) — Contrato proxy
- [CONFIG-KEYVAULT.md](./CONFIG-KEYVAULT.md) — Adobe → Key Vault / FA
- [CSV-STORAGE.md](./CSV-STORAGE.md) — Blob CSV
- [DEPLOY-AZURE-SWA.md](./DEPLOY-AZURE-SWA.md) — Deploy portal
- [SAML-AMFS.md](./SAML-AMFS.md) — SSO
- [ARQUITECTURA.md](./ARQUITECTURA.md) — Vista general
- [DECISIONES-ARQUITECTURA.md](./DECISIONES-ARQUITECTURA.md) — Decisiones de integración
