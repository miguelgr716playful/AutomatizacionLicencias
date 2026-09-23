# Adobe Reporte Miembros (consola C#)

Consola .NET 8 que descarga los miembros de estos **product profiles** de Adobe UMAPI y los exporta a **CSV**:

| ID CLI | Product profile |
|--------|-----------------|
| `estudiantes` | Alumnos Tecmilenio |
| `profesores` | Colaboradores y Profesores Tecmilenio |

Equivalente a lo que el portal expone en `GET /api/v1/adobe/miembros`, pero como herramienta local para ADF, auditoría o pruebas.

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Credenciales OAuth Server-to-Server (User Management API) en [Adobe Developer Console](https://developer.adobe.com/console)

## Configuración

```powershell
cd tools/AdobeReporteMiembros
copy appsettings.example.json appsettings.json
```

Edita `appsettings.json`:

```json
{
  "Adobe": {
    "OrganizationId": "XXXX@AdobeOrg",
    "ClientId": "tu-client-id",
    "ClientSecret": "tu-client-secret"
  },
  "Reporte": {
    "DirectorioSalida": "output",
    "DominioFiltroEstudiantes": "tecmilenio.mx",
    "FiltrarDominioEstudiantes": true
  }
}
```

No subas `appsettings.json` con secretos.

### Reintentos ante 504 / 429

Para grupos grandes (`directOnly=false`) Adobe puede tardar >90s o devolver 504/429. Ajusta en `Reporte`:

| Setting | Default | Uso |
|---------|---------|-----|
| `DirectOnly` | `false` | `false` = reporte completo (~469). `true` = solo directos (~7). |
| `ReintentosMax` | `12` | Intentos por página |
| `TimeoutSegundos` | `600` | Timeout cliente por request |
| `EsperaInicialSegundos` | `180` | Primera espera tras 504 |
| `EsperaMaxSegundos` | `300` | Tope de espera entre reintentos |
| `PausaEntrePaginasSegundos` | `3` | Evita 429 al paginar |

Tras un 504 espera ~3 min y reintenta automáticamente. Cada línea del log lleva `[yyyy-MM-dd HH:mm:ss]`.

Para correr en madrugada y guardar log:

```powershell
dotnet run -- --grupo profesores 2>&1 | Tee-Object -FilePath "output\reporte-$(Get-Date -Format yyyyMMdd-HHmmss).log"
```

## Ejecutar

Menú interactivo:

```powershell
dotnet run
```

Por línea de comandos:

```powershell
dotnet run -- --grupo estudiantes
dotnet run -- --grupo profesores
dotnet run -- --grupo todos
dotnet run -- --grupo todos --salida C:\reportes\adobe
```

## Salida CSV

Columnas: `perfil`, `groupName`, `email`, `firstname`, `lastname`, `status`, `type`, `domain`, `username`, `fechaConsulta`.

Archivos en `output/` (o la ruta de `--salida`):

- `estudiantes-20260902-123045.csv`
- `profesores-20260902-123112.csv`

## UMAPI usada

1. `GET /groups/{orgId}/{page}` — lee cuota del profile (`memberCount`, `licenseQuota`)
2. `GET /users/{orgId}/{page}/{groupName}?directOnly=false&excludeGroups=true` — lista miembros paginado hasta `lastPage=true` (sin groups por usuario; más rápido)

Para estudiantes aplica filtro de dominio (`tecmilenio.mx` por defecto), igual que la API del portal.

## Relación con otros proyectos

| Proyecto | Uso |
|----------|-----|
| `tools/AdobeUmapiConsole/` | Menú interactivo: consultar, asignar, revocar |
| `tools/AdobeReporteMiembros/` | **Este** — exportar reportes CSV por grupo |
| `api/` (BFF Node SWA) | SAML + proxy a FA C# (`/api/v1/adobe/*`) |

Documentación UMAPI: [docs/ADOBE-UMAPI.md](../../docs/ADOBE-UMAPI.md)
