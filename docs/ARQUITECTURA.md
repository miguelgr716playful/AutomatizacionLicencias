# Arquitectura — Automatización de Licencias

## 1. Resumen

Sistema frontend para la gestión de licencias de software educativo. Permite aprovisionar y desaprovisionar licencias mediante archivos CSV con claves Banner, consultar reportes de auditoría y configurar integraciones con proveedores (Adobe, Minitab).

La aplicación está construida con **Next.js 15 (App Router)**, **React 18** y **TypeScript**, siguiendo **Clean Architecture** con capas de dominio, aplicación, infraestructura y presentación (hooks + componentes).

---

## 2. Stack tecnológico

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| Framework | Next.js 15 | SSR/SSG, enrutamiento, optimización de assets |
| UI | React 18 | Componentes interactivos |
| Lenguaje | TypeScript | Tipado estático y mantenibilidad |
| Estilos | Tailwind CSS 4 | Diseño utility-first y tema institucional |
| Gráficas | Recharts | Visualización de tendencias de licencias |
| Iconos | Lucide React | Iconografía consistente |
| Componentes base | Radix UI + shadcn/ui | Accesibilidad y primitivos UI |

---

## 3. Diagrama de arquitectura

### 3.1 Capas del portal (Clean Architecture)

```mermaid
flowchart TB
    subgraph Presentacion["Presentación"]
        Pages["app/ (páginas)"]
        Sections["components/sections/"]
        Hooks["hooks/"]
    end

    subgraph Aplicacion["Aplicación"]
        UseCases["use-cases/"]
        DTOs["dto/"]
    end

    subgraph Dominio["Dominio"]
        Entities["entities/"]
        Ports["ports/"]
    end

    subgraph Infra["Infraestructura (portal)"]
        Repos["repositories/ (mock | http)"]
        DI["di/container.ts"]
    end

    Pages --> Sections
    Sections --> Hooks
    Hooks --> DI
    DI --> UseCases
    UseCases --> Ports
    Repos -.->|implementa| Ports
```

### 3.2 Integración Azure (version4)

```mermaid
flowchart LR
    subgraph portal["Portal — Azure SWA"]
        Next["Next.js static export"]
        BFF["API Node BFF<br/>SAML + proxy"]
    end

    subgraph back["Backend C#"]
        FA["FA-DEVL-AprovLicencias"]
        KV["Key Vault"]
    end

    subgraph etl["Procesamiento"]
        ADF["Azure Data Factory"]
        SHIR["Self-hosted IR"]
        Banner["Banner 8.7 on-prem"]
    end

    subgraph proveedores["Proveedores"]
        Adobe["Adobe UMAPI"]
        Minitab["Minitab API"]
    end

    subgraph identity["Identidad"]
        AMFS["AMFS / SAML"]
    end

    Next --> BFF
    Next --> AMFS
    BFF -->|"x-fa-api-key"| FA
    FA --> KV
    FA --> Adobe
    BFF -->|"ACS allowlist"| Storage["Table + Blob"]
    FA --> Storage
    FA -.->|"futuro: operaciones"| ADF
    ADF --> SHIR --> Banner
    ADF --> Adobe
    ADF --> Minitab
```

> **Implementado:** Adobe, configuración, usuarios y upload CSV vía **proxy BFF → FA C#**. Credenciales Adobe en **Key Vault**. Upload CSV persiste en Blob (`actual/` + `historico/`) para consumo ADF. Ver [FRONT-BACK.md](./FRONT-BACK.md) y [DECISIONES-ARQUITECTURA.md](./DECISIONES-ARQUITECTURA.md).

---

## 4. Estructura de carpetas

```
AutomatizacionLicencias/
├── app/                          # App Router (Next.js)
│   ├── layout.tsx                # Layout raíz + metadata + RoleProvider
│   ├── globals.css               # Tema Tailwind y variables CSS
│   ├── page.tsx                  # Redirección a /login
│   ├── login/page.tsx            # Pantalla de autenticación
│   └── (app)/                    # Grupo de rutas con shell compartido
│       ├── layout.tsx            # AppShell (sidebar + contenido)
│       ├── dashboard/page.tsx
│       ├── aprovisionar/page.tsx
│       ├── reportes/page.tsx
│       └── configuracion/page.tsx
│
├── domain/                       # Capa de dominio (sin dependencias externas)
│   ├── entities/                 # Entidades y agregados
│   ├── value-objects/            # Tipos de valor (SoftwareId, TipoOperacion)
│   └── ports/                    # Interfaces (repositorios, gateways)
│
├── application/                  # Casos de uso y DTOs
│   ├── dto/
│   └── use-cases/
│
├── infrastructure/               # Implementaciones concretas
│   ├── mocks/data.ts             # Datos de demostración
│   ├── repositories/             # Repositorios mock
│   ├── adapters/                 # Adobe, Minitab
│   └── di/container.ts           # Inyección de dependencias
│
├── hooks/                        # Puente UI ↔ casos de uso
│   ├── use-aprovisionar.ts
│   ├── use-dashboard.ts
│   ├── use-reportes.ts
│   └── use-configuracion.ts
│
├── components/
│   ├── auth/
│   ├── layout/
│   ├── sections/                 # Solo presentación (usan hooks)
│   └── ui/
│
├── lib/
│   ├── constants.ts              # Rutas, roles y navegación
│   ├── csv-parser.ts             # Parseo CSV → RegistroBanner[] (cliente)
│   ├── api-config.ts             # URL base Azure Functions
│   └── mock-data.ts              # Reexport temporal (deprecated)
│
├── public/
├── docs/
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Patrones de diseño

### 5.1 App Router y rutas por módulo

Cada módulo funcional tiene su propia ruta:

| Ruta | Módulo | Rol(es) con acceso |
|------|--------|-------------------|
| `/dashboard` | Panel general | Admin, Auditor |
| `/aprovisionar` | Gestión de licencias | Admin, Ejecutor |
| `/reportes` | Historial y auditoría | Admin, Auditor |
| `/configuracion` | Proveedores y ETL | Admin, Ejecutor |

El grupo `(app)` agrupa las rutas que comparten el mismo layout (sidebar + área de contenido) sin afectar la URL.

### 5.2 Server vs Client Components

| Tipo | Ubicación | Uso |
|------|-----------|-----|
| **Server Component** | `app/**/page.tsx`, `app-shell.tsx` | Páginas estáticas, composición sin estado |
| **Client Component** | `components/sections/*`, `sidebar.tsx` | Estado local, gráficas, formularios, drag & drop |

Las secciones llevan `"use client"` porque usan `useState`, eventos del DOM o librerías solo compatibles con cliente (Recharts).

### 5.3 Contexto de rol (`RoleProvider`)

El selector de rol (Administrador / Ejecutor / Auditor) vive en un React Context en `components/layout/role-provider.tsx`:

- Filtra ítems de navegación visibles en el sidebar.
- Redirige automáticamente si el usuario cambia a un rol sin acceso a la ruta actual.

En producción, el rol debe provenir de **NAM** (autenticación institucional ITESM) y validarse en el portal y en Azure Functions.

### 5.4 Clean Architecture — flujo de dependencias

Las dependencias apuntan siempre hacia el dominio:

```
components/sections → hooks/ → application/use-cases → domain/ports
                                              ↑
                              infrastructure/repositories (implementa ports)
```

| Capa | Responsabilidad |
|------|-----------------|
| **domain/** | Entidades, value objects y puertos (interfaces) |
| **application/** | Casos de uso que orquestan la lógica de negocio |
| **infrastructure/** | Repositorios mock, adapters Adobe/Minitab, DI |
| **hooks/** | Estado de UI y llamadas a casos de uso |
| **components/sections/** | Renderizado; sin lógica de filtrado ni acceso a datos |

Casos de uso actuales:

| Caso de uso | Hook | Sección |
|-------------|------|---------|
| `AprovisionarLicenciasUseCase` | `useAprovisionar` | aprovisionar |
| `ObtenerDashboardUseCase` | `useDashboard` | dashboard |
| `ObtenerReportesUseCase` | `useReportes` | reportes |
| `ObtenerConfiguracionUseCase` | `useConfiguracion` | configuración |

Al conectar APIs reales, crear implementaciones HTTP en `infrastructure/repositories/` (p. ej. `http-licencia.repository.ts`) que llamen a **Azure Functions** sin modificar dominio ni casos de uso.

---

## 6. Flujos principales

### 6.1 Aprovisionamiento de licencias

```mermaid
sequenceDiagram
    participant U as Ejecutor
    participant UI as AprovisionarSection
    participant Hook as useAprovisionar
    participant Parser as csv-parser
    participant UC as AprovisionarLicenciasUseCase
    participant Repo as LicenciaRepository
    participant Fn as Azure Functions
    participant ADF as Azure Data Factory

    U->>UI: Selecciona software y tipo
    U->>UI: Sube archivo CSV (claves Banner)
    UI->>Hook: seleccionarArchivo(file)
    Hook->>Parser: parseCsvFile()
    Parser-->>Hook: registros[]
    U->>UI: Procesar
    Hook->>UC: ejecutar({ registros, ... })
    UC->>Repo: procesar(input)
    Repo->>Fn: POST JSON (sin Blob)
    Fn->>ADF: Trigger pipeline
    ADF-->>Fn: operacionId / estado
    Fn-->>Repo: respuesta
    Repo-->>UC: ResultadoOperacion
    UC-->>Hook: AprovisionarResponse
    Hook-->>UI: resultado + mensaje
```

### 6.2 Reportes de auditoría

```mermaid
sequenceDiagram
    participant A as Auditor
    participant UI as ReportesSection
    participant Hook as useReportes
    participant UC as ObtenerReportesUseCase
    participant Repo as ReporteRepository

    A->>UI: Aplica filtros y búsqueda
    UI->>Hook: actualiza filtros / página
    Hook->>UC: ejecutar(filtros, page)
    UC->>Repo: listar() + obtenerEstadisticas()
    Repo-->>UC: ReportesPaginados
    UC-->>Hook: ReportesResponse
    Hook-->>UI: tabla + paginación
    A->>UI: Exporta a Excel/CSV
```

---

## 7. Modelo de dominio (conceptual)

```mermaid
erDiagram
    USUARIO ||--o{ OPERACION : ejecuta
    OPERACION ||--|{ MOVIMIENTO : contiene
    MOVIMIENTO }o--|| ESTUDIANTE : afecta
    MOVIMIENTO }o--|| SOFTWARE : referencia
    SOFTWARE ||--o{ MAPEO_CAMPO : define

    USUARIO {
        string id
        string rol
        string email
    }
    OPERACION {
        string id
        string tipo
        datetime fecha
        string estado
    }
    MOVIMIENTO {
        string estudiante_id
        string accion
        string origen
    }
    SOFTWARE {
        string nombre
        string proveedor_api
    }
    MAPEO_CAMPO {
        string campo_banner
        string campo_api
    }
```

---

## 8. Seguridad y roles

| Rol | Permisos |
|-----|----------|
| **Administrador** | Dashboard, aprovisionar, reportes, configuración |
| **Ejecutor** | Aprovisionar, configuración |
| **Auditor** | Dashboard (lectura), reportes |

**Recomendaciones para producción:**

1. Autenticación **NAM** gestionada con `dsi.identidad@itesm.mx`.
2. Azure Functions valida token/sesión y rol antes de disparar ADF.
3. Credenciales Adobe/Minitab en **Key Vault** (validar con Juan Manuel).
4. Self-hosted IR para Banner 8.7 (validar con Oliver).
5. Auditoría de movimientos vía salida del ETL (origen por confirmar).

---

## 9. Variables de entorno

### Portal (front — SWA)

```env
NEXT_PUBLIC_API_BASE_URL=https://<swa>.azurestaticapps.net/api
NEXT_PUBLIC_SAML_LOGIN=true
```

### SWA API Node (BFF — App Settings)

```env
FaApiKey=...
FaBaseUrl=https://fa-devl-aprovlicencias.azurewebsites.net
SESSION_SECRET=...
StorageConnectionString=...   # ACS → AuthorizedUsers
# SAML_* (ver docs/SAML-AMFS.md)
```

### FA C# + ADF (no en el repositorio front)

Secretos Adobe en **Key Vault** (`AdobeOrgId`, `AdobeClientId`, `AdobeClientSecret`). La FA los lee con Managed Identity. ADF también lee el mismo vault.

> Las credenciales de proveedores **nunca** van en el front ni en App Settings del SWA. Solo `NEXT_PUBLIC_*` en build del portal.

---

## 10. Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en puerto 3000 |
| `npm run build` | Compilación de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | Análisis estático con ESLint de Next.js |

---

## 11. Roadmap técnico

1. **Fase 1 (hecho):** UI, deploy SWA static, SAML AMFS, allowlist.
2. **Fase 2 (parcial):** BFF proxy → FA C# (Adobe, config, usuarios, upload CSV); mocks restantes en dashboard/reportes.
3. **Fase 3:** `POST /licencias/operaciones` → ADF; reportes desde ETL.
4. **Fase 4:** Jobs programados Banner (ADF + SHIR).
5. **Fase 5:** Tests E2E (Playwright) y monitoreo de operaciones masivas.

---

## 12. Decisiones técnicas

| Decisión | Motivo |
|----------|--------|
| Next.js App Router | Rutas por módulo, layouts anidados, preparado para SSR y API |
| TypeScript estricto | Contratos claros entre capas y menos errores en integraciones |
| Tailwind CSS 4 | Consistencia visual y tema Tecmilenio ya definido |
| Client Components en secciones | Interactividad inmediata sin complejidad de hidratación en gráficas |
| Clean Architecture | Dominio estable; infraestructura intercambiable sin tocar UI |
| Repositorios mock | Desacopla UI de backends aún no implementados |
| SWA static + BFF Node + FA C# | Portal sin backend embebido; negocio en FA desplegada aparte |
| CSV → Blob vía FA | Ruta fija `actual/` para ADF + histórico por auditoría |
| Proxy `fa-proxy.js` | Browser nunca expone `FaApiKey` ni secretos Adobe |

---

## 13. Documentación relacionada

- [Front ↔ Back (diagramas)](./FRONT-BACK.md)
- [Proxy SWA → FA](./SWA-FA-PROXY.md)
- [Decisiones de arquitectura Azure](./DECISIONES-ARQUITECTURA.md)
- [Endpoints Épica 2](./EPICA-2-ENDPOINTS.md)
- [Deploy Azure SWA](./DEPLOY-AZURE-SWA.md)

---

*Última actualización: septiembre 2026*
