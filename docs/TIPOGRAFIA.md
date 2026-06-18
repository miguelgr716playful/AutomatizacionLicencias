# Tipografía — Automatización de Licencias

Documentación de la jerarquía, fuentes y estilos de texto utilizados en la aplicación.

---

## 1. Fuentes

| Uso | Familia | Pesos | Origen |
|-----|---------|-------|--------|
| **UI principal** | Inter | 400, 500, 600, 700 | Google Fonts |
| **Datos técnicos** | JetBrains Mono | 400, 500 | Google Fonts |
| **Fallback** | `sans-serif` del sistema | — | Navegador |

Las fuentes se importan en `app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

**Aplicación global:**

- `body` → `font-sans` (Inter)
- `AppShell` → `font-sans` explícito
- Datos tabulares (IDs, fechas, claves) → `font-mono` (JetBrains Mono)

---

## 2. Tamaño base

| Variable | Valor | Elemento |
|----------|-------|----------|
| `--font-size` | `16px` | `html` |
| `--font-sans` | `'Inter', sans-serif` | Texto general |
| `--font-mono` | `'JetBrains Mono', monospace` | Código y datos |

---

## 3. Colores de texto

| Token Tailwind | Variable CSS | Hex | Uso |
|----------------|--------------|-----|-----|
| `text-foreground` | `--foreground` | `#0d2d20` | Títulos, labels, texto principal |
| `text-muted-foreground` | `--muted-foreground` | `#4a7060` | Subtítulos, metadatos, placeholders |
| `text-primary` | `--primary` | `#00a85c` | Acentos institucionales |
| Sidebar | — | `#ffffff` / `white/60` / `white/40` | Navegación sobre fondo `#0B4D3C` |
| Acentos inline | — | `#00B364` | Métricas, estados, fechas en tablas |

---

## 4. Jerarquía tipográfica

### 4.1 Páginas principales

Patrón unificado en Dashboard, Aprovisionar, Reportes, Configuración y Login:

| Nivel | Elemento | Clases Tailwind | Tamaño aprox. |
|-------|----------|-----------------|---------------|
| **H1** | Título de página | `text-2xl font-bold text-foreground` | 24px |
| **Subtítulo** | Descripción bajo H1 | `text-sm text-muted-foreground` | 14px |

**Ejemplos:**

- Login → "Automatización de Licencias"
- Dashboard → "Panel General"
- Aprovisionar → "Aprovisionar Licencias"
- Reportes → "Reportes e Historial"
- Configuración → "Configuración del Sistema"

### 4.2 Secciones y cards

| Nivel | Elemento | Clases Tailwind | Tamaño aprox. |
|-------|----------|-----------------|---------------|
| **H2** | Título de card / bloque | `text-base font-semibold text-foreground` | 16px |
| **Subtítulo H2** | Descripción de card | `text-xs text-muted-foreground mt-0.5` | 12px |
| **H3** | Subsección (ej. proveedor) | `text-sm font-semibold text-foreground` | 14px |

### 4.3 Datos destacados (stat cards)

| Módulo | Valor numérico | Clases |
|--------|----------------|--------|
| Dashboard | Métricas principales | `text-[1.6rem] font-bold tracking-tight` (~25.6px) |
| Reportes | Totales | `text-xl font-bold` (20px) |
| Label de stat | — | `text-xs font-semibold` o `text-xs text-muted-foreground` |

### 4.4 Formularios

| Elemento | Clases Tailwind |
|----------|-----------------|
| Label | `text-sm font-medium text-foreground` |
| Input / Select | `text-sm` |
| Botón primario | `text-sm font-semibold` |
| Texto de ayuda / legal | `text-xs text-muted-foreground` |

### 4.5 Tablas

| Elemento | Clases Tailwind | Tamaño |
|----------|-----------------|--------|
| Encabezado de columna | `text-[10px] font-bold uppercase tracking-wide text-muted-foreground` | 10px |
| Celda estándar | `text-xs` | 12px |
| Celda densa (reportes) | `text-[11px]`, `text-[12px]` | 11–12px |
| Badge / chip | `text-[10px] font-semibold` o `font-bold` | 10px |
| Datos técnicos | `font-mono text-[10px]` / `text-[11px]` | 10–11px |

### 4.6 Sidebar

| Elemento | Clases Tailwind |
|----------|-----------------|
| Etiqueta de sección ("Rol Activo", "Navegación") | `text-[10px] font-semibold uppercase tracking-widest text-white/40` |
| Ítem de menú | `text-sm` — activo: `font-medium text-white` |
| Usuario / email | `text-xs font-medium` / `text-xs text-white/40` |
| Cerrar sesión | `text-sm font-medium text-white/80` |

---

## 5. Pesos tipográficos

| Peso | Clase Tailwind | Uso |
|------|----------------|-----|
| 400 | (normal) | Texto de cuerpo, inputs |
| 500 | `font-medium` | Labels, navegación activa, badges |
| 600 | `font-semibold` | H2, botones, tendencias |
| 700 | `font-bold` | H1, números destacados, encabezados de tabla |

Variables CSS disponibles:

- `--font-weight-normal: 400`
- `--font-weight-medium: 500`

---

## 6. Escala de tamaños (referencia Tailwind)

Con base `16px`:

| Clase | Tamaño | Uso en la app |
|-------|--------|---------------|
| `text-[10px]` | 10px | Sidebar labels, badges, headers de tabla |
| `text-[11px]` | 11px | Filtros, celdas mono en reportes |
| `text-xs` | 12px | Metadatos, tablas, subtítulos de card |
| `text-sm` | 14px | Labels, inputs, botones, navegación |
| `text-base` | 16px | Títulos de sección (H2) |
| `text-lg` | 18px | — (no usado actualmente) |
| `text-xl` | 20px | Valores en stat cards de reportes |
| `text-2xl` | 24px | Títulos de página (H1) |
| `text-[1.6rem]` | ~25.6px | Valores en stat cards del dashboard |

---

## 7. Diagrama de jerarquía

```
Página
├── H1          text-2xl font-bold          (24px)
├── Subtítulo   text-sm muted               (14px)
│
├── Card
│   ├── H2          text-base font-semibold (16px)
│   ├── Subtítulo   text-xs muted           (12px)
│   ├── Valor       text-[1.6rem] bold      (~26px)  ← dashboard
│   └── Valor       text-xl bold            (20px)   ← reportes
│
├── Formulario
│   ├── Label       text-sm font-medium     (14px)
│   ├── Input       text-sm                 (14px)
│   └── Botón       text-sm font-semibold   (14px)
│
└── Tabla
    ├── Header      text-[10px] bold upper  (10px)
    ├── Celda       text-xs                 (12px)
    └── ID / Fecha  font-mono text-[11px]   (11px)
```

---

## 8. Convenciones por módulo

### Login (`/login`)

| Elemento | Estilo |
|----------|--------|
| Título | `text-2xl font-bold` |
| Subtítulo | `text-sm text-muted-foreground` |
| Labels | `text-sm font-medium` |
| Botón | `text-sm font-semibold` + `bg-emerald-600` |
| Aviso legal | `text-xs text-center text-muted-foreground` |

### Dashboard (`/dashboard`)

| Elemento | Estilo |
|----------|--------|
| H1 + subtítulo | Patrón estándar de página |
| Badges de estado API | `text-xs font-medium` |
| Valores stat | `text-[1.6rem] font-bold` |
| Título de gráfica | `text-base font-semibold` |
| Tabla actividad | `text-xs` / headers `text-[11px]` |

### Aprovisionar (`/aprovisionar`)

| Elemento | Estilo |
|----------|--------|
| H1 + subtítulo | Patrón estándar |
| H2 card | `text-base font-semibold` |
| Opciones de operación | `text-sm font-semibold` + `text-xs` descriptivo |
| Zona de upload | `text-sm font-medium` + `text-xs` |

### Reportes (`/reportes`)

| Elemento | Estilo |
|----------|--------|
| H1 + subtítulo | Patrón estándar |
| Botón exportar | `text-sm font-semibold` |
| H2 tabla | `text-section-title` |
| Datos técnicos | `font-mono text-xs` en fechas, IDs y claves |

### Configuración (`/configuracion`)

| Elemento | Estilo |
|----------|--------|
| H1 + subtítulo | Patrón estándar |
| H2 sección | `text-base font-semibold` |
| Campos mapeo | `text-xs font-mono` |
| Labels formulario | `text-sm font-medium` |

---

## 9. Clases utilitarias centralizadas

Definidas en `app/globals.css` (`@layer components`):

| Clase | Equivalente | Uso |
|-------|-------------|-----|
| `text-page-title` | `text-2xl font-bold` | H1 de página |
| `text-page-subtitle` | `text-sm muted` | Subtítulo bajo H1 |
| `text-section-title` | `text-base font-semibold` | H2 de cards |
| `text-section-subtitle` | `text-xs muted` | Subtítulo de cards |
| `text-stat-value` | `text-2xl font-bold` | Valores en stat cards |
| `text-table-header` | `text-xs bold upper` | Encabezados de tabla |
| `text-table-cell` | `text-xs` | Celdas estándar |
| `text-badge` | `text-xs font-semibold` | Chips y badges |
| `text-sidebar-label` | `text-xs upper wide` | Etiquetas del sidebar |

---

## 10. Archivos relacionados

| Archivo | Contenido tipográfico |
|---------|----------------------|
| `app/globals.css` | Fuentes, variables de color, `font-sans` en body |
| `components/layout/app-shell.tsx` | `font-sans` en contenedor |
| `components/sections/*.tsx` | Jerarquía por módulo |
| `components/auth/login-form.tsx` | Tipografía del login |
| `components/layout/sidebar.tsx` | Tipografía de navegación |

---

*Última actualización: junio 2026*
