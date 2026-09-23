# API C# — referencia en el repo front

> **Producción:** el código desplegado en `FA-DEVL-AprovLicencias` vive en **`back-aprov-licencias/function-app-csharp`**.  
> Esta carpeta (`api-csharp/`) es **copia de referencia** en el monorepo front; mantenerla alineada cuando cambie el back.

## Modelo version4

| Capa | Repo / recurso | Rol |
|------|----------------|-----|
| **SWA `api/`** (Node) | `front-aprov-licencias/api/` | SAML, sesión, **proxy** a FA |
| **FA C#** | `back-aprov-licencias/function-app-csharp` | Adobe UMAPI, Key Vault, usuarios, CSV |

El portal React llama siempre al SWA (`NEXT_PUBLIC_API_BASE_URL=…/api`). El browser **nunca** lleva `FaApiKey`.

## Qué hace cada parte

| En SWA Node | En FA C# |
|-------------|----------|
| `GET /v1/auth/saml/login`, ACS, SLO, metadata | — |
| `GET /v1/auth/me`, `POST /v1/auth/logout` | — |
| `GET /v1/health` (modo `bff-proxy-to-fa-csharp`) | `GET /v1/health` (FA) |
| Proxy → FA | `GET\|PUT /v1/configuracion/*`, Key Vault Adobe |
| Proxy → FA | CRUD `/v1/usuarios` + seed |
| Proxy → FA | `POST /v1/licencias/upload` |
| Proxy → FA | `/v1/adobe/*` (UMAPI) |

## Estructura (referencia)

```
api-csharp/
├── AprovLicencias.Api.csproj
├── Program.cs
├── Services/
│   ├── AdobeUmapiService.cs
│   ├── AdobeKeyVaultService.cs
│   ├── UsersTableService.cs
│   ├── BlobStorageService.cs
│   └── ...
└── Functions/
    ├── AdobeLicenciasFunction.cs
    ├── ConfiguracionFunction.cs
    ├── UsuariosFunction.cs
    ├── LicenciasUploadFunction.cs
    └── ...
```

## App Settings FA (Azure)

| Setting | Uso |
|---------|-----|
| `FaApiKey` | Valida llamadas del SWA BFF |
| `KeyVaultUrl` | Secretos Adobe (`AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret`) |
| `StorageConnectionString` | Table `AuthorizedUsers` + Blob `csv-uploads` |
| `AuthorizedUsersTable` | `AuthorizedUsers` |
| `CsvUploadContainer` | `csv-uploads` |

**No usar** App Settings `AdobeOrgId` / `AdobeClientId` / `AdobeClientSecret` en la FA si ya están en Key Vault.

## App Settings SWA (solo BFF)

| Setting | Uso |
|---------|-----|
| `FaApiKey` / `FaBaseUrl` | Proxy hacia FA |
| SAML + `SESSION_SECRET` | Login |
| `StorageConnectionString` | ACS → allowlist `AuthorizedUsers` |

## Desarrollo local

```powershell
cd api-csharp
copy local.settings.json.example local.settings.json
dotnet build
func start
```

Para integración end-to-end con el portal, levantar también `api/` (Node) con `FaBaseUrl` apuntando a la FA local o DEVL.

## Despliegue

Publicar **`back-aprov-licencias/function-app-csharp`** en **FA-DEVL-AprovLicencias** (zip deploy, VS Code o pipeline del repo back).

El SWA se despliega por separado desde `front-aprov-licencias` (`api_location: api`).

## Documentación

- [docs/FRONT-BACK.md](../docs/FRONT-BACK.md)
- [docs/SWA-FA-PROXY.md](../docs/SWA-FA-PROXY.md)
- [docs/CONFIG-KEYVAULT.md](../docs/CONFIG-KEYVAULT.md)
