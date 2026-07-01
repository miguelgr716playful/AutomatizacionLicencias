# Épica 2 — Endpoints front ↔ back

Definición de endpoints entre el **portal (Next.js en SWA)** y **Azure Functions (BFF)**, que a su vez dispara **Azure Data Factory**.

**Convención:** prefijo `/v1` en Azure Functions, JSON, autenticación **NAM** (ITESM). Base URL: `NEXT_PUBLIC_API_BASE_URL`.

Ver [DECISIONES-ARQUITECTURA.md](./DECISIONES-ARQUITECTURA.md) para el contexto de cada decisión.

---

## Mapa general

```mermaid
flowchart LR
    subgraph front["Portal — Azure SWA"]
        Login["/login"]
        Dash["/dashboard"]
        Aprov["/aprovisionar"]
        Rep["/reportes"]
        Config["/configuracion"]
    end

    subgraph fn["Azure Functions /v1"]
        Auth["auth/*"]
        D["dashboard"]
        L["licencias/*"]
        R["reportes/*"]
        C["configuracion/*"]
        Cat["catalogos/*"]
    end

    subgraph adf["Azure Data Factory"]
        Pipeline["Pipelines ETL"]
    end

    Login --> Auth
    Dash --> D
    Aprov -->|"JSON registros[]"| L
    Rep --> R
    Config --> C
    L --> Pipeline
```

---

## 1. Autenticación y sesión

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| `POST` | `/v1/auth/login` | Público | Login vía **NAM** (pendiente doc identidad) |
| `GET` | `/v1/auth/me` | Autenticado | Usuario + rol (`admin` \| `ejecutor` \| `auditor`) |
| `POST` | `/v1/auth/logout` | Autenticado | Cerrar sesión |
| `POST` | `/v1/auth/refresh` | Autenticado | Renovar token (si aplica) |

**Response `GET /auth/me` (ejemplo):**

```json
{
  "id": "usr-001",
  "email": "ejecutor@tecmilenio.mx",
  "nombre": "María López",
  "rol": "ejecutor"
}
```

---

## 2. Dashboard

**Caso de uso:** `ObtenerDashboardUseCase` · **Hook:** `useDashboard`

| Método | Endpoint | Roles |
|--------|----------|-------|
| `GET` | `/v1/dashboard` | admin, auditor |

**Response 200:**

```json
{
  "stats": [
    {
      "label": "Licencias activas",
      "value": "1,240",
      "sub": "Adobe + Minitab",
      "trend": "+12%",
      "positive": true
    }
  ],
  "tendencia": [
    { "mes": "Ene", "adobe": 312, "minitab": 88 }
  ],
  "actividadReciente": [
    {
      "fecha": "14 Feb 2024",
      "software": "Adobe",
      "tipo": "APROV",
      "estado": "Completado"
    }
  ]
}
```

---

## 3. Aprovisionamiento de licencias

**Caso de uso:** `AprovisionarLicenciasUseCase` · **Hook:** `useAprovisionar`

> El portal parsea el CSV en el navegador (`lib/csv-parser.ts`) y envía **JSON en memoria**. No se usa Blob Storage ni `multipart/form-data`. Functions dispara ADF.

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `POST` | `/v1/licencias/operaciones` | admin, ejecutor | Recibe registros JSON y dispara ADF |
| `GET` | `/v1/licencias/operaciones/{operacionId}` | admin, ejecutor | Estado de operación (async) |
| `GET` | `/v1/licencias/operaciones` | admin, ejecutor | Historial reciente (opcional) |

### `POST /v1/licencias/operaciones`

**Content-Type:** `application/json`

**Request:**

```json
{
  "software": "adobe",
  "tipo": "aprov",
  "archivoNombre": "alumnos.csv",
  "registros": [
    {
      "bannerId": "T00123456",
      "email": "alumno@tecmilenio.mx",
      "nombres": "Juan",
      "apellidos": "Pérez"
    }
  ]
}
```

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `software` | `adobe` \| `minitab` | Sí |
| `tipo` | `aprov` \| `desaprov` | Sí |
| `registros` | `RegistroBanner[]` | Sí |
| `archivoNombre` | string | No (referencia en auditoría) |

**Response 202 (async):**

```json
{
  "operacionId": "OP-ABC123",
  "registrosProcesados": 0,
  "estado": "En Proceso",
  "mensaje": "Operación en cola. Consulta el estado con operacionId."
}
```

**Response 200 (sync):**

```json
{
  "operacionId": "OP-ABC123",
  "registrosProcesados": 150,
  "estado": "Completado",
  "mensaje": "150 registros procesados correctamente"
}
```

### `GET /v1/licencias/operaciones/{operacionId}`

```json
{
  "operacionId": "OP-ABC123",
  "software": "adobe",
  "tipo": "aprov",
  "registrosProcesados": 148,
  "registrosFallidos": 2,
  "estado": "Completado",
  "mensaje": "148 OK, 2 pendientes de revisión",
  "detalleErroresUrl": "/v1/licencias/operaciones/OP-ABC123/errores.csv"
}
```

---

## 4. Reportes e historial

**Caso de uso:** `ObtenerReportesUseCase` · **Hook:** `useReportes`

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/v1/reportes` | admin, auditor | Listado paginado + filtros + estadísticas |
| `GET` | `/v1/reportes/estadisticas` | admin, auditor | KPIs del panel (opcional) |
| `GET` | `/v1/reportes/export` | admin, auditor | Export Excel/CSV |
| `GET` | `/v1/reportes/{movimientoId}` | admin, auditor | Detalle de un movimiento |

### `GET /v1/reportes`

**Query params:**

| Param | Ejemplo |
|-------|---------|
| `software` | `adobe`, `minitab`, `todos` |
| `accion` | `alta`, `baja`, `todas` |
| `origen` | `etl`, `manual`, `todos` |
| `busqueda` | texto libre (nombre, id, clave) |
| `page` | `1` |
| `pageSize` | `5` (default) |

**Response 200:**

```json
{
  "items": [
    {
      "fecha": "17/06/2026",
      "hora": "09:15",
      "nombre": "Ana García",
      "id": "T00123456",
      "clave": "BAN-8821",
      "nivel": "Profesional",
      "software": "Adobe",
      "accion": "Alta",
      "origen": "Manual",
      "operador": "ejecutor@tecmilenio.mx"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 5,
  "totalPages": 9,
  "estadisticas": {
    "totalMovimientos": "1,284",
    "altasTotales": "895",
    "bajasTotales": "389",
    "movimientosManuales": "156"
  }
}
```

### `GET /v1/reportes/export`

Mismos filtros que el listado.

**Response:** `Content-Type: text/csv` o `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## 5. Configuración del sistema

**Casos de uso:** `ObtenerConfiguracionUseCase`, `ActualizarPeriodicidadUseCase` · **Hook:** `useConfiguracion`

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/v1/configuracion` | admin, ejecutor | Proveedores + programador |
| `PATCH` | `/v1/configuracion/programador` | admin, ejecutor | Actualizar periodicidad ETL |
| `PATCH` | `/v1/configuracion/proveedores/{softwareId}/mapping` | admin, ejecutor | Editar mapeo Banner ↔ API |
| `POST` | `/v1/configuracion/proveedores` | admin | Registrar nuevo proveedor |

### `GET /v1/configuracion`

```json
{
  "proveedores": [
    {
      "id": "adobe",
      "nombre": "Adobe Creative Cloud",
      "icon": "Ad",
      "mapping": [
        { "local": "banner_id", "api": "federatedID" }
      ]
    }
  ],
  "programador": {
    "periodicidad": "Diario (Nocturno)",
    "proximaEjecucion": "25/06/2026 02:00"
  }
}
```

### `PATCH /v1/configuracion/programador`

**Request:**

```json
{ "periodicidad": "Semanal" }
```

**Response:** objeto `ProgramadorTareas` actualizado.

### `PATCH /v1/configuracion/proveedores/{softwareId}/mapping`

**Request:**

```json
{
  "mapping": [
    { "local": "banner_id", "api": "federatedID" }
  ]
}
```

---

## 6. Catálogos

Valores hoy hardcodeados en la UI; conviene servirlos desde el backend.

| Método | Endpoint | Roles | Uso |
|--------|----------|-------|-----|
| `GET` | `/v1/catalogos/software` | Autenticado | Select en aprovisionar |
| `GET` | `/v1/catalogos/filtros-reportes` | admin, auditor | Valores dinámicos de filtros |

---

## 7. Jobs y operaciones del sistema (Fase 4)

Sincronización automática con Banner (mencionada en UI, sin caso de uso aún).

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `POST` | `/v1/jobs/sincronizacion-banner` | admin, sistema | Disparo manual del ETL |
| `GET` | `/v1/jobs/sincronizacion-banner/ultima` | admin, ejecutor | Última ejecución y resultado |
| `GET` | `/v1/health` | Público / interno | Health check |

---

## 8. Resumen por prioridad

### MVP (Épica 2 — reemplazar mocks)

| # | Método | Endpoint | Caso de uso |
|---|--------|----------|-------------|
| 1 | `GET` | `/v1/dashboard` | ObtenerDashboard |
| 2 | `POST` | `/v1/licencias/operaciones` | AprovisionarLicencias |
| 3 | `GET` | `/v1/reportes` | ObtenerReportes |
| 4 | `GET` | `/v1/configuracion` | ObtenerConfiguracion |
| 5 | `PATCH` | `/v1/configuracion/programador` | ActualizarPeriodicidad |
| 6 | `GET` | `/v1/auth/me` | Sesión y rol |

### Fase 2.1 (UI ya lo anticipa)

| # | Método | Endpoint |
|---|--------|----------|
| 7 | `GET` | `/v1/reportes/export` |
| 8 | `GET` | `/v1/licencias/operaciones/{operacionId}` |
| 9 | `GET` | `/v1/catalogos/software` |
| 10 | `PATCH` | `/v1/configuracion/proveedores/{softwareId}/mapping` |

### Fase 3–4 (producción institucional)

| # | Método | Endpoint |
|---|--------|----------|
| 11 | `POST` | `/v1/auth/login` (+ NAM) |
| 12 | `POST` | `/v1/jobs/sincronizacion-banner` |
| 13 | `GET` | `/v1/health` |

---

## 9. Matriz de autorización

| Endpoint | admin | ejecutor | auditor |
|----------|:-----:|:--------:|:-------:|
| `GET /dashboard` | ✓ | — | ✓ |
| `POST /licencias/operaciones` | ✓ | ✓ | — |
| `GET /licencias/operaciones/*` | ✓ | ✓ | — |
| `GET /reportes*` | ✓ | — | ✓ |
| `GET /configuracion` | ✓ | ✓ | — |
| `PATCH /configuracion/*` | ✓ | ✓ | — |
| `POST /configuracion/proveedores` | ✓ | — | — |
| `POST /jobs/*` | ✓ | — | — |
| `GET /catalogos/*` | ✓ | ✓ | ✓ |

---

## 10. Flujo implementado en el frontend

El hook `useAprovisionar` ya implementa el flujo acordado:

1. `seleccionarArchivo(file)` → `parseCsvFile()` valida y cuenta registros
2. `procesar()` → parsea CSV y llama al caso de uso con `registros[]`
3. `HttpLicenciaRepository` (cuando `NEXT_PUBLIC_API_BASE_URL` esté configurada) envía JSON a Functions

```typescript
// hooks/use-aprovisionar.ts
const registros = await parseCsvFile(file);
await container.aprovisionarLicencias.ejecutar({
  software,
  tipo: tipoOp,
  registros,
  archivoNombre: file.name,
});
```

Polling a `GET /v1/licencias/operaciones/{id}` si Functions responde `202`.

---

## 11. Mapeo endpoint ↔ capa del proyecto

| Endpoint | Caso de uso | Hook | Puerto de dominio |
|----------|-------------|------|-------------------|
| `GET /dashboard` | `ObtenerDashboardUseCase` | `useDashboard` | `IDashboardRepository` |
| `POST /licencias/operaciones` | `AprovisionarLicenciasUseCase` | `useAprovisionar` | `ILicenciaRepository` |
| `GET /reportes` | `ObtenerReportesUseCase` | `useReportes` | `IReporteRepository` |
| `GET /configuracion` | `ObtenerConfiguracionUseCase` | `useConfiguracion` | `IConfiguracionRepository` |
| `PATCH /configuracion/programador` | `ActualizarPeriodicidadUseCase` | `useConfiguracion` | `IConfiguracionRepository` |

Al implementar Azure Functions, crear repositorios HTTP en `infrastructure/repositories/` (p. ej. `http-licencia.repository.ts`) que implementen los mismos puertos.

---

## Referencias

- [Decisiones de arquitectura](./DECISIONES-ARQUITECTURA.md)
- [Arquitectura del proyecto](./ARQUITECTURA.md)
- [Plan de despliegue Azure SWA](./DEPLOY-AZURE-SWA.md)
