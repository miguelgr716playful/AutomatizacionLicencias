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

## Producción

```bash
npm run build
npm start
```

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
