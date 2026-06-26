# Automatización de Licencias

Plataforma web para gestionar licencias de software educativo (Adobe Creative Cloud, Minitab) en Tecmilenio.

## Stack

- **Next.js 15** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS 4**
- **Recharts** · **Lucide React** · **Radix UI** (shadcn/ui)

## Requisitos

- Node.js 18.18 o superior
- npm 9+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La ruta raíz redirige a `/login`.

## Producción (static export)

```bash
npm run build
npx serve out
```

El build genera la carpeta `out/` lista para Azure Static Web Apps.

## Pruebas

```bash
npm test        # modo watch
npm run test:run
```

## Despliegue

Ver [docs/DEPLOY-AZURE-SWA.md](docs/DEPLOY-AZURE-SWA.md) para el plan de publicación en Azure Static Web Apps.

1. Subir el repo a GitHub
2. Crear el recurso **Static Web App** en Azure y conectar el repositorio
3. Configurar el secret `AZURE_STATIC_WEB_APPS_API_TOKEN` (Azure lo crea al vincular GitHub)
4. Cada push a `main` despliega automáticamente; cada PR genera una preview URL

## Documentación

Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) para la arquitectura del sistema, estructura de carpetas y decisiones técnicas.

## Módulos

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/dashboard` | Panel general y métricas |
| `/aprovisionar` | Alta/baja masiva de licencias vía CSV |
| `/reportes` | Historial y auditoría |
| `/configuracion` | Mapeo de proveedores y tareas programadas |

## Roles (demo)

- **Administrador**: acceso completo
- **Ejecutor**: aprovisionar y configuración
- **Auditor**: dashboard y reportes
