# Plan de despliegue — Azure Static Web Apps

Guía para publicar **Automatización de Licencias** en Azure Static Web Apps (SWA), alineada al stack actual (Next.js 15 static export, BFF Node en `api/`, FA C# aparte).

---

## 1. Resumen ejecutivo

| Modelo | Cuándo usarlo | Para este proyecto |
|--------|---------------|-------------------|
| **Static** (`output: "export"`) | Portal sin backend embebido | **Recomendado — implementado** |
| **Hybrid** (`output: "standalone"`) | SSR + `/api/*` en Next.js | **No necesario** — la API vive en Azure Functions |

El portal encaja en **modo Static** porque:

- La API (BFF) está en **Azure Functions**, no en Next.js
- ADF se invoca desde Functions, no desde el navegador
- El CSV se parsea en cliente y se envía como JSON (`lib/csv-parser.ts`)

**No se requiere migrar a hybrid Next.js** cuando se conecte el backend real.

---

## 2. Arquitectura objetivo

```mermaid
flowchart TB
    subgraph dev["Desarrollo"]
        Dev["Local: npm run dev"]
        Tests["Vitest + lint + build"]
    end

    subgraph github["GitHub"]
        PR["Pull Request"]
        Main["rama main"]
        GHA["GitHub Actions"]
    end

    subgraph azure["Azure"]
        SWA["Static Web App (portal + api/ BFF)"]
        CDN["CDN global SWA"]
        FA["Function App C# (FA-DEVL)"]
        KV["Key Vault"]
        ADF["Azure Data Factory"]
    end

    Dev --> PR
    PR --> GHA
    GHA -->|"preview"| SWA
    Main --> GHA
    GHA -->|"production"| SWA
    SWA --> CDN
    SWA -->|"FaApiKey proxy"| FA
    FA --> KV
    FA --> ADF
```

---

## 3. Prerrequisitos

| Recurso | Acción |
|---------|--------|
| **Repositorio GitHub** | Subir el proyecto |
| **Suscripción Azure** | Con permisos para crear SWA |
| **Cuenta de despliegue** | GitHub Actions con secretos de SWA |
| **Node.js 20** | En CI y en configuración de SWA |

---

## 4. Cambios de código (Fase 1 — Static)

### 4.1 `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true }, // requerido para static export (usa next/image en sidebar)
};

export default nextConfig;
```

### 4.2 Redirección `/` → `/login`

`redirect()` de servidor **no funciona** con static export. Opciones:

- **Opción A (recomendada):** regla en `staticwebapp.config.json`
- **Opción B:** componente cliente en `app/page.tsx` con `useRouter().replace("/login")`

### 4.3 `staticwebapp.config.json` (raíz del proyecto)

```json
{
  "navigationFallback": {
    "rewrite": "/login/index.html",
    "exclude": ["/_next/*", "/*.{css,js,png,jpg,jpeg,gif,svg,ico,woff,woff2}"]
  },
  "routes": [
    { "route": "/", "redirect": "/login", "statusCode": 302 }
  ]
}
```

Ajustar `exclude` según los assets en `public/`.

### 4.4 Scripts en `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "build:static": "next build"
  }
}
```

Con `output: "export"`, `next build` genera la carpeta `out/`.

### 4.5 Verificación local antes de Azure

```bash
npm run build
npx serve out
```

Comprobar manualmente:

- `/login`
- `/dashboard`
- `/aprovisionar`
- `/reportes`
- `/configuracion`
- Assets en `public/` (p. ej. `tecMilenioFondo.jpeg`)

---

## 5. CI/CD — GitHub Actions

### 5.1 Pipeline de calidad (`.github/workflows/ci.yml`)

En cada PR y push a `main`:

1. `npm ci`
2. `npm run lint`
3. `npm run test:run` (cuando existan tests)
4. `npm run build` (valida que el export estático compila)

Ejemplo:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - run: npm run lint

      - run: npm run test:run

      - run: npm run build
```

### 5.2 Pipeline de deploy (generado por Azure)

Al crear la SWA desde el portal, Azure genera `.github/workflows/azure-static-web-apps-*.yml`. Parámetros clave para **modo Static**:

| Parámetro | Valor |
|-----------|-------|
| `app_location` | `/` |
| `api_location` | `api` (Azure Functions managed en `/api/*`, mismo dominio SWA) |
| `output_location` | `out` |
| `app_build_command` | `npm run build` |

Vincular **Azure Functions** como Linked Backend en la SWA desde el portal de Azure.

En la tarea de deploy, para static export:

```yaml
env:
  IS_STATIC_EXPORT: true
```

### 5.3 Flujo de ramas

| Rama / evento | Resultado |
|---------------|-----------|
| PR → `main` | Preview URL (`*.azurestaticapps.net`) |
| Merge a `main` | Producción |
| Push a otras ramas | Opcional: previews si se configuran |

---

## 6. Creación del recurso en Azure

### Paso a paso (portal)

1. **Azure Portal** → Create → **Static Web App**
2. **Subscription / Resource group** (ej. `rg-licencias-prod`)
3. **Name:** `swa-licencias-tecmilenio` (debe ser único globalmente)
4. **Plan:** Free (dev/demo) o Standard (dominio custom, más slots, auth avanzada)
5. **Deployment source:** GitHub → seleccionar repo + rama `main`
6. **Build Presets:** Next.js
7. Ajustar:
   - App location: `/`
   - Output location: `out`
   - API location: `api` (carpeta managed Functions en el repo)

Azure crea automáticamente el workflow y el secret `AZURE_STATIC_WEB_APPS_API_TOKEN` en GitHub.

### API SAML (managed Functions en el mismo SWA)

El código en `api/` (Node BFF) se publica con el portal (`api_location: api`). La **FA C#** se despliega aparte desde `back-aprov-licencias`.

App settings en **SWA → Configuration**:

**SAML / sesión:**
- `SAML_IDP_ENTRY_POINT`, `SAML_IDP_CERT`, `SESSION_SECRET`, etc.
- `SAML_FRONTEND_URL` / `SAML_FUNCTIONS_BASE_URL`
- `StorageConnectionString` (ACS → `AuthorizedUsers`)

**Proxy hacia FA C#:**
- `FaApiKey` — mismo valor que `FA-DEVL-AprovLicencias`
- `FaBaseUrl` — `https://fa-devl-aprovlicencias.azurewebsites.net`

**No configurar en SWA:** `AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret`.

Build / runtime:

`NEXT_PUBLIC_API_BASE_URL=https://<tu-swa>.azurestaticapps.net/api`

Endpoints:

- `GET /api/v1/auth/saml/login`
- `POST /api/v1/auth/saml/acs`
- `GET|POST /api/v1/auth/saml/slo`
- `GET /api/v1/auth/saml/metadata`
- `GET /api/v1/auth/me`
- Metadata estática: `/saml/sp-metadata.xml`

### Entornos sugeridos

| Entorno | Recurso SWA | Rama |
|---------|-------------|------|
| **Preview** | Mismo SWA (staging automático por PR) | PRs |
| **Producción** | Mismo SWA | `main` |
| **Producción aislada** (opcional) | Segunda SWA | `main` con approval manual |

---

## 7. Pruebas unitarias (integradas al plan)

Prioridad alineada con Clean Architecture:

| Fase | Qué probar | Herramienta |
|------|------------|-------------|
| 1 | 5 casos de uso en `application/use-cases/` | Vitest + mocks de ports |
| 2 | Hooks principales (`use-aprovisionar`, etc.) | Vitest + Testing Library |
| 3 | Smoke E2E opcional (`/login` → `/dashboard`) | Playwright en CI (opcional) |

El CI **bloquea deploy** si fallan lint, tests o build.

### Instalación de Vitest

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### Ejemplo de test (caso de uso)

```typescript
// application/use-cases/__tests__/aprovisionar-licencias.use-case.test.ts
import { describe, it, expect, vi } from "vitest";
import { AprovisionarLicenciasUseCase } from "../aprovisionar-licencias.use-case";
import type { ILicenciaRepository } from "@/domain/ports/licencia-repository.port";

describe("AprovisionarLicenciasUseCase", () => {
  it("lanza error si no hay archivo", async () => {
    const repo = { procesar: vi.fn() } as unknown as ILicenciaRepository;
    const useCase = new AprovisionarLicenciasUseCase(repo);

    await expect(
      useCase.ejecutar({
        software: "adobe",
        tipo: "aprov",
        archivoNombre: "",
      })
    ).rejects.toThrow("Debe seleccionar un archivo CSV");
  });
});
```

---

## 8. Variables de entorno

Hoy no hay `.env` críticos (mocks). Preparar para integraciones futuras:

| Variable | Cuándo | Dónde configurar |
|----------|--------|------------------|
| `NEXT_PUBLIC_API_BASE_URL` | Llamadas al BFF SWA | SWA → Configuration |
| `FaApiKey` / `FaBaseUrl` | Proxy → FA C# | SWA → Configuration (API) |
| SAML + `SESSION_SECRET` | Login AMFS | SWA → Configuration |
| Secrets Adobe | Nunca en SWA | Key Vault → FA C# (Managed Identity) |

> En static export, solo variables `NEXT_PUBLIC_*` están disponibles en el cliente (se inlined en build).

---

## 9. Autenticación (SAML AMFS — implementado DEVL)

Login institucional vía **AMFS DEVL** (`amfsdevl.tec.mx`). Ver [SAML-AMFS.md](./SAML-AMFS.md).

- `NEXT_PUBLIC_SAML_LOGIN=true` en build del portal
- Roles desde tabla `AuthorizedUsers` tras ACS
- PROD: IdP productivo (no `amfsdevl`) — ver [AMBIENTE-PROD.md](./AMBIENTE-PROD.md)

---

## 10. Backend (BFF Node + FA C# — sin hybrid Next.js)

Estado **version4**:

```mermaid
flowchart LR
    SWA["SWA static + api/ BFF"] -->|"NEXT_PUBLIC_API_BASE_URL"| Browser
    Browser --> SWA
    SWA -->|"FaApiKey"| FA["FA C#"]
    FA --> KV["Key Vault"]
    FA --> ADF["ADF"]
```

Pasos operativos:

1. Desplegar SWA con `api_location: api` (SAML + proxy)
2. Desplegar **FA C#** desde `back-aprov-licencias`
3. Configurar `FaApiKey`, `FaBaseUrl`, SAML y `StorageConnectionString` en SWA
4. Configurar `KeyVaultUrl`, `FaApiKey`, `StorageConnectionString` en FA

Detalle: [FRONT-BACK.md](./FRONT-BACK.md), [SWA-FA-PROXY.md](./SWA-FA-PROXY.md).

**No es necesario** quitar `output: "export"` ni migrar a hybrid Next.js.

---

## 11. Plan por fases

### Fase 0 — Preparación (0.5 día)

- [ ] Inicializar git y subir a GitHub
- [ ] Definir rama `main` + protección con status checks

### Fase 1 — Static deploy (1 día)

- [ ] Ajustar `next.config.ts` (`export` + `images.unoptimized`)
- [ ] Crear `staticwebapp.config.json`
- [ ] Resolver redirect de `/`
- [ ] Validar `npm run build` + `serve out` local
- [ ] Crear SWA en Azure y conectar GitHub
- [ ] Primer deploy exitoso a URL `*.azurestaticapps.net`

### Fase 2 — CI de calidad (0.5–1 día)

- [ ] Vitest + tests de casos de uso
- [ ] Workflow `ci.yml` (lint + test + build)
- [ ] Branch protection en `main`

### Fase 3 — Producción institucional (1–2 días)

- [ ] Dominio custom (ej. `licencias.tecmilenio.mx`)
- [ ] Certificado SSL (automático en SWA)
- [ ] Plan Standard si se requiere SLA / más entornos
- [ ] Integración **NAM** para login real

### Fase 4 — Backend (parcial — version4)

- [x] BFF Node en SWA (SAML + proxy)
- [x] FA C# con Adobe UMAPI + Key Vault
- [x] Upload CSV → Blob vía FA
- [ ] `POST /licencias/operaciones` → ADF
- [ ] Dashboard / reportes desde ETL (sustituir mocks)

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| `redirect()` rompe static export | Regla en `staticwebapp.config.json` o redirect en cliente |
| `next/image` sin optimización server | `images.unoptimized: true` |
| Rutas SPA 404 al refrescar | `navigationFallback` en `staticwebapp.config.json` |
| Deploy híbrido con timeout (Next 15.3+) | Mantener modo Static hasta necesitar SSR/API |
| Secrets en frontend | Solo `NEXT_PUBLIC_*`; secrets en Functions/backend |
| Tamaño del bundle | Monitorear en CI; límite híbrido ~250 MB |

---

## 13. Checklist de listo para producción

- [ ] Build estático pasa en CI
- [ ] Las 5 rutas principales cargan en preview SWA
- [ ] Assets (`tecMilenioFondo.jpeg`, logos) se sirven correctamente
- [ ] PR previews funcionan
- [ ] Merge a `main` despliega automáticamente
- [ ] (Opcional) Dominio custom configurado
- [ ] (Opcional) Auth institucional activa

---

## 14. Referencias

- [Next.js support on Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/nextjs)
- [Deploy hybrid Next.js on SWA](https://learn.microsoft.com/en-us/azure/static-web-apps/deploy-nextjs-hybrid)
- [Configuration file for SWA](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration)
- [Front ↔ Back](./FRONT-BACK.md)
- [Proxy SWA → FA](./SWA-FA-PROXY.md)
- [Arquitectura del proyecto](./ARQUITECTURA.md)
- [Decisiones de arquitectura Azure](./DECISIONES-ARQUITECTURA.md)
- [Endpoints Épica 2](./EPICA-2-ENDPOINTS.md)

---

## 15. Orden de implementación recomendado

1. Cambios de código para static export
2. Workflow `ci.yml`
3. Repo en GitHub
4. Crear SWA en Azure (genera el workflow de deploy)
5. Vitest + tests de casos de uso
