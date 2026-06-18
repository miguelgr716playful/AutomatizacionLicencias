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

    subgraph Infra["Infraestructura"]
        Repos["repositories/ (mock)"]
        Adapters["adapters/ (Adobe, Minitab)"]
        DI["di/container.ts"]
    end

    subgraph Futuro["Integraciones futuras"]
        Banner["Banner SIS"]
        Azure["Azure Blob Storage"]
    end

    Pages --> Sections
    Sections --> Hooks
    Hooks --> DI
    DI --> UseCases
    UseCases --> Ports
    Repos -.->|implementa| Ports
    Adapters -.->|implementa| Ports
    Repos -.-> Azure
    Adapters -.-> Banner
```

> **Nota:** La versión actual usa repositorios mock en `infrastructure/`. Al conectar APIs reales, se sustituyen las implementaciones mock sin modificar dominio ni casos de uso.

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

En producción, el rol debería provenir de autenticación (JWT, SSO institucional) y validarse en middleware de Next.js.

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

Al conectar APIs reales, crear implementaciones en `infrastructure/repositories/` (p. ej. `azure-reporte.repository.ts`) que implementen los mismos puertos.

---

## 6. Flujos principales

### 6.1 Aprovisionamiento de licencias

```mermaid
sequenceDiagram
    participant U as Ejecutor
    participant UI as AprovisionarSection
    participant Hook as useAprovisionar
    participant UC as AprovisionarLicenciasUseCase
    participant Repo as LicenciaRepository
    participant Prov as Proveedor (Adobe/Minitab)

    U->>UI: Selecciona software, período y tipo
    U->>UI: Sube archivo CSV (claves Banner)
    UI->>Hook: procesar()
    Hook->>UC: ejecutar(dto)
    UC->>Repo: procesar(input)
    Repo->>Prov: procesarLote()
    Prov-->>Repo: exitosos / fallidos
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
        string periodo
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

1. Middleware de Next.js para validar sesión y rol en cada ruta.
2. API Routes protegidas con tokens de servicio para Adobe/Minitab.
3. Variables de entorno para credenciales (`.env.local`, nunca en repositorio).
4. Auditoría inmutable en Azure Blob Storage.

---

## 9. Variables de entorno (planificadas)

```env
# Adobe
ADOBE_CLIENT_ID=
ADOBE_CLIENT_SECRET=
ADOBE_ORG_ID=

# Minitab
MINITAB_API_KEY=
MINITAB_BASE_URL=

# Azure
AZURE_STORAGE_CONNECTION_STRING=
AZURE_CONTAINER_REPORTES=

# Banner / ETL
BANNER_API_URL=
BANNER_API_TOKEN=
```

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

1. **Fase 1 (actual):** UI funcional, Clean Architecture con repositorios mock y navegación por roles.
2. **Fase 2:** Sustituir repositorios mock por implementaciones reales (API Routes, Adobe, Minitab, Azure).
3. **Fase 3:** Autenticación institucional (SSO) y middleware de autorización.
4. **Fase 4:** Persistencia en Azure y jobs programados (sincronización Banner).
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
| `components/ui/` shadcn | Base extensible para formularios y diálogos futuros |

---

*Última actualización: junio 2026*
