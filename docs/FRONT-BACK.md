# Arquitectura Front–Back

Diagrama del portal (**front-aprov-licencias**) y el backend (**back-aprov-licencias** / FA C#) en el modelo actual (**version4**): BFF Node en el SWA + lógica de negocio en Function App C#.

---

## 1. Vista general

```mermaid
flowchart LR
  Browser["Browser<br/>Next.js portal"]
  SWA["Azure Static Web Apps<br/>Front + API Node BFF"]
  FA["FA-DEVL-AprovLicencias<br/>Azure Functions C#"]
  IdP["AMFS / IdP SAML"]
  KV["Key Vault"]
  Storage["Table + Blob Storage"]
  Adobe["Adobe UMAPI / IMS"]
  ADF["Data Factory"]

  Browser -->|"cookie sesión"| SWA
  Browser -.->|"login SAML"| IdP
  IdP -->|"ACS"| SWA
  SWA -->|"x-fa-api-key"| FA
  FA --> KV
  FA --> Storage
  FA --> Adobe
  ADF --> KV
  SWA -->|"ACS: AuthorizedUsers"| Storage
```

| Pieza | Repo / recurso | Rol |
|-------|----------------|-----|
| **Front** | `front-aprov-licencias` (Next.js → `out/`) | UI portal |
| **BFF Node** | `front-aprov-licencias/api/` en el mismo SWA | SAML, sesión, proxy |
| **Back C#** | `back-aprov-licencias/function-app-csharp` → `fa-devl-aprovlicencias` | Adobe, KV, usuarios, CSV |
| **Secretos Adobe** | `KV-DEVL-AprovLicencias` | Portal UMAPI + ADF |

---

## 2. Front (portal)

```mermaid
flowchart TB
  subgraph SWA_Static["SWA — estático"]
    Pages["app/ páginas"]
    Sections["components/sections"]
    Hooks["hooks/"]
    ApiCfg["lib/api-config.ts<br/>NEXT_PUBLIC_API_BASE_URL"]
  end

  Pages --> Sections
  Sections --> Hooks
  Hooks -->|"fetch + credentials"| ApiCfg
  ApiCfg -->|"/api/v1/*"| BFF["API Node del SWA"]
```

Rutas típicas del portal:

| UI | API (vía SWA) |
|----|----------------|
| Login | `/api/v1/auth/saml/login` → ACS |
| Cuotas Adobe | `GET /api/v1/adobe/cuotas` |
| Detalle alumnos / profesores | `GET /api/v1/adobe/miembros?perfil=` |
| Asignación licencias | `GET/POST /api/v1/adobe/*` |
| Usuarios | `/api/v1/usuarios` |
| Configuración Adobe | `GET/PUT /api/v1/configuracion/*` |
| Carga CSV | `POST /api/v1/licencias/upload` |

El browser **nunca** llama a la FA ni lleva `FaApiKey`.

---

## 3. Back (BFF Node + FA C#)

```mermaid
flowchart TB
  subgraph SWA_API["SWA API Node — BFF"]
    Auth["SAML + sesión<br/>login / acs / me / logout"]
    Health["health"]
    Proxy["proxy + requireRole/Admin<br/>adobe · configuracion · usuarios · upload"]
  end

  subgraph FA_CSharp["Function App C#"]
    AdobeFn["AdobeLicencias<br/>UMAPI"]
    ConfigFn["Configuracion + KeyVault"]
    UsersFn["Usuarios"]
    UploadFn["LicenciasUpload / CSV"]
  end

  Auth --> Table["AuthorizedUsers<br/>Table Storage"]
  Proxy -->|"x-fa-api-key"| AdobeFn
  Proxy --> ConfigFn
  Proxy --> UsersFn
  Proxy --> UploadFn
  AdobeFn --> KV["Key Vault"]
  AdobeFn --> UMAPI["Adobe IMS + UMAPI"]
  ConfigFn --> KV
  UsersFn --> Table
  UploadFn --> Blob["Blob csv-uploads"]
```

### Qué hace cada capa

| Capa | Activo | Responsabilidad |
|------|--------|-----------------|
| **Node (SWA)** | Sí — auth + proxy | Cookie SAML, roles, reenvío a FA |
| **C# (FA)** | Sí — negocio | Key Vault, UMAPI, CRUD usuarios, blob |
| **Node libs muertas** | Eliminadas | `adobe-umapi`, `key-vault`, `blob-storage` ya no existen |

### Auth

| Canal | Mecanismo |
|-------|-----------|
| Browser ↔ SWA | Cookie de sesión (HMAC, HttpOnly) + rol `admin` / `ejecutor` |
| SWA ↔ FA | Header `x-fa-api-key` (`FaApiKey`) |
| FA ↔ Key Vault | Managed Identity |
| FA ↔ Adobe | Client credentials (secretos en KV) |

---

## 4. Flujos principales

### 4.1 Login SAML

```mermaid
sequenceDiagram
  participant U as Usuario
  participant F as Front SWA
  participant N as API Node
  participant IdP as AMFS
  participant T as Table Storage

  U->>F: Abrir portal
  F->>N: GET /auth/saml/login
  N->>IdP: Redirect SSO
  IdP->>N: POST /auth/saml/acs
  N->>T: ¿email en AuthorizedUsers?
  N->>U: Cookie sesión + redirect dashboard
```

### 4.2 Cuotas / miembros / licencias Adobe

```mermaid
sequenceDiagram
  participant U as Browser
  participant N as SWA Node
  participant FA as FA C#
  participant KV as Key Vault
  participant A as Adobe UMAPI

  U->>N: GET /api/v1/adobe/cuotas (cookie)
  N->>N: requireRole admin|ejecutor
  N->>FA: GET /api/v1/adobe/cuotas + x-fa-api-key
  FA->>KV: AdobeOrgId / ClientId / Secret
  FA->>A: groups / users / action
  A-->>FA: JSON
  FA-->>N: JSON
  N-->>U: JSON
```

### 4.3 Configuración Adobe → Key Vault

```mermaid
sequenceDiagram
  participant U as Browser
  participant N as SWA Node
  participant FA as FA C#
  participant KV as Key Vault

  U->>N: PUT /api/v1/configuracion/adobe (admin)
  N->>FA: PUT + x-fa-api-key
  FA->>KV: Set AdobeOrgId / ClientId / Secret
  Note over KV: Mismos secretos para portal UMAPI y Data Factory
```

---

## 5. Despliegue (DEVL)

```mermaid
flowchart LR
  GH["GitHub<br/>front-aprov-licencias"]
  SWA["SWA<br/>ambitious-island-…"]
  Back["GitHub<br/>back-aprov-licencias"]
  FA["FA-DEVL-AprovLicencias"]

  GH -->|"CI/CD SWA<br/>app + api/"| SWA
  Back -->|"publish FA"| FA
  SWA -->|"FaApiKey"| FA
```

| Setting SWA (API) | Uso |
|-------------------|-----|
| `FaApiKey` | Auth hacia FA |
| `FaBaseUrl` | Default `https://fa-devl-aprovlicencias.azurewebsites.net` |
| SAML + `SESSION_SECRET` | Login |
| `StorageConnectionString` | ACS → AuthorizedUsers |

| Setting FA | Uso |
|------------|-----|
| `FaApiKey` | Valida llamadas del SWA |
| `KeyVaultUrl` | Secretos Adobe |
| `StorageConnectionString` | Usuarios + upload CSV |

Health del portal: `GET /api/v1/health` → `"mode":"bff-proxy-to-fa-csharp"`, `"faProxy":true`.

---

## 6. Repos

| Repo | Contenido |
|------|-----------|
| [front-aprov-licencias](https://github.com/ti-tecmilenio-oficial/front-aprov-licencias) | Next.js + API Node BFF |
| `back-aprov-licencias` | Function App C# (`function-app-csharp`) |

Detalle del proxy: [SWA-FA-PROXY.md](./SWA-FA-PROXY.md) · Key Vault: [CONFIG-KEYVAULT.md](./CONFIG-KEYVAULT.md)
