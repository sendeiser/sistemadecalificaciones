---
name: CGB Portal
description: "Sistema de gestión integral de la Escuela Comercio Gral. Belgrano"
colors:
  primary: "#dc2626"
  primary-deep: "#b91c1c"
  primary-bright: "#ef4444"
  neutral-bg: "#faf5f5"
  neutral-bg-dark: "#0f0b0b"
  neutral-surface: "#ffffff"
  neutral-surface-dark: "#1a1414"
  neutral-border: "#e5e0e0"
  neutral-border-dark: "#2c2222"
  neutral-text: "#1f1a1a"
  neutral-text-dark: "#faf0f0"
  neutral-muted: "#6b5c5c"
  neutral-muted-dark: "#9c8888"
  accent: "#4b5563"
  accent-bright: "#9ca3af"
  success: "#16a34a"
  success-bright: "#22c55e"
  danger: "#b91c1c"
  danger-bright: "#f87171"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 2.25rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.2em"
    textTransform: "uppercase"
  mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "16px 32px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "16px 32px"
    typography: "{typography.label}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-muted}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
    typography: "{typography.label}"
  button-ghost-active:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
    typography: "{typography.label}"
  card-default:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
    textColor: "{colors.neutral-text}"
  input-default:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    textColor: "{colors.neutral-text}"
    height: "48px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-muted}"
    rounded: "{rounded.lg}"
    padding: "12px"
  nav-link-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "12px"
  tab-active:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  tab-inactive:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-muted}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
---

# Design System: CGB Portal / El Expediente Digital

## 1. Overview

**Creative North Star: "El Expediente Digital"**

El sistema se concibe como un expediente digital institucional: cada pantalla es un folio bien organizado donde la información está en su lugar exacto, accesible al instante, con la autoridad de un documento oficial pero sin la pesadez burocrática. La metáfora no es decorativa — determina cada decisión visual. No hay sorpresas, no hay adornos que distraigan: todo elemento existe porque Responde a una tarea real del usuario.

La personalidad es institucional y moderna. La calidad se transmite por precisión tipográfica, espaciado generoso, transiciones rápidas y un uso sobrio del color institucional (rojo CGB) como acento selectivo. El sistema rechaza explícitamente las tarjetas genéricas de SaaS con bordes laterales de color, el glassmorphism decorativo, los gradientes de fondo, y los paneles de métricas que nadie mira.

**Key Characteristics:**
- Expediente digital: organizado, autoritativo, sin fricción
- Rojo institucional como identidad, no como decoración
- Tipografía como herramienta de jerarquía, no adorno
- Plano por defecto, capas tonales para profundidad
- Consistencia de patrón en todos los módulos

## 2. Colors

La paleta gira en torno al rojo institucional como identidad, con neutros cálidos (tierra/papel) que mantienen la legibilidad sin competir.

### Primary
- **Rojo Institucional** (#dc2626 / oklch(0.52 0.21 25)): Color identitario. Se usa en botones primarios, enlaces activos, indicadores de estado, badges. Su rareza en la pantalla (≤10% de cualquier viewport) es lo que le da potencia.
- **Rojo Fuego** (#ef4444 / oklch(0.63 0.22 30)): Versión dark mode del primario. Más brillante para mantener contraste sobre fondos oscuros.
- **Rojo Oscuro** (#b91c1c): Hover de botones primarios, errores graves.

### Neutral
- **Fondo Pizarra** (#faf5f5 → #0f0b0b dark): Fondo de página. Tono ligeramente cálido (casi imperceptible) que diferencia el sistema de un blanco frío genérico.
- **Superficie Blanca** (#ffffff → #1a1414 dark): Fondo de tarjetas, paneles, contenedores. Sin sombra: la distinción se logra por capa tonal, no por elevación.
- **Borde Arcilla** (#e5e0e0 → #2c2222 dark): Bordes de contenedores, inputs, divisores.
- **Carbón Grafito** (#1f1a1a → #faf0f0 dark): Texto principal. Contraste ≥10:1 sobre fondo.
- **Gris Tiza** (#6b5c5c → #9c8888 dark): Texto secundario, etiquetas, metadata.

### Accent
- **Gris Comercial** (#4b5563 → #9ca3af dark): Acento secundario para botones y elementos no críticos.

### Success & Danger
- **Verde Gestión** (#16a34a → #22c55e dark): Estados exitosos, confirmaciones.
- **Rosa Alerta** (#f87171): Danger en dark mode. Texto de error sobre fondos oscuros.

### The One Accent Rule.
El Rojo Institucional se usa en ≤10% de cualquier pantalla. Su rareza es su potencia. Si más del 10% de un viewport está en rojo, es momento de usar neutrales o el acento gris.

## 3. Typography

**Display Font:** Plus Jakarta Sans (con system-ui, -apple-system, BlinkMacSystemFont, sans-serif como fallback)
**Mono Font:** JetBrains Mono (monospace)

**Character:** Una sola familia sans-serif en múltiples pesos (300-800) más una mono para datos técnicos. Sin contraste de familias — la jerarquía se logra por peso, tamaño y espaciado. El uppercase casi universal es un rasgo de identidad: emula la señalética institucional.

### Hierarchy
- **Display** (900 Black, clamp(1.875rem, 4vw, 2.25rem), 1, -0.03em):
  Títulos de página. Uppercase, tracking-tighter. Solo un título de página por vista. Ej: "PANEL DE CONTROL", "GESTIÓN DE ALUMNOS".

- **Headline** (800 ExtraBold, clamp(1.25rem, 2.5vw, 1.5rem), 1.2, normal):
  Títulos de sección dentro de una página. Uppercase. Sin tracking ajustado.

- **Title** (700 Bold, 1.25rem, 1.3, -0.02em):
  Títulos de tarjetas, nombres de elementos en listas. Uppercase, tracking-tight.

- **Body** (500 Medium, 0.875rem, 1.5, normal):
  Texto corriente, descripciones, contenido de párrafos. Sin uppercase. Línea máxima 75ch.

- **Label** (900 Black, 0.625rem, 1, 0.2em):
  Etiquetas de formulario, badges, categorías. Uppercase forzado, tracking-widest. Máximo 4 palabras.

- **Mono** (400 Regular, 0.75rem, 1.4, normal):
  Datos técnicos (DNI, legajos, fechas), breadcrumbs, metadata, descripciones en tarjetas. Sin uppercase.

### The Uppercase Ceiling Rule.
El uppercase es la voz del sistema — pero solo hasta title (1.25rem). Body text, descripciones largas, y párrafos multi-línea NO van en uppercase. Si un texto ocupa más de 2 líneas, no lo pongas en mayúscula sostenida.

## 4. Elevation

El sistema es plano por defecto. La profundidad se comunica exclusivamente mediante capas tonales: fondo de página (--tech-primary), superficie de tarjeta (--tech-secondary), borde (--tech-surface). No hay sombras decorativas en contenedores en reposo.

La transición entre capas es inmediata: no hay gradientes de elevación. Un contenedor está en una capa o en otra, sin escalas intermedias.

Elementos flotantes (modales, dropdowns, tooltips) pueden usar sombras sutiles (≤8px blur) para distinguirse de la capa tonal, pero esa sombra nunca es decorativa — solo existe para indicar "esto está sobre el resto del contenido".

### No-Shadow Rule.
En reposo, ningún contenedor tiene sombra. Las sombras solo aparecen en elementos elevados dinámicamente: modales abiertos, dropdowns expandidos, tooltips visibles. Nunca en tarjetas estáticas.

## 5. Components

### Buttons
- **Shape:** Gently rounded (12px radius / rounded-xl). Altura mínima 48px.
- **Primary:** Fondo Rojo Institucional, texto blanco, label (10px/900/0.2em uppercase). Padding vertical 16px, horizontal 32px. Sombra sutil (shadow-lg) solo en contexto de CTA principal.
- **States:** Hover → Rojo Oscuro (#b91c1c), scale[1.02] suave, transición 200ms. Active → scale[0.98]. Disabled → opacidad 50%, sin escala.
- **Shine effect:** Opcional en CTAs principales. Degradado blanco/10 que cruza horizontalmente en hover (700ms ease-in-out).
- **Ghost/Toggle:** Sin fondo, texto Gris Tiza. Hover → fondo tech-surface/50. Active/selected → fondo Rojo Institucional + texto blanco (como tabs y filtros).

### Tabs / Filter Pills
- **Shape:** Rounded (8px / rounded-lg) o rounded-xl según contexto.
- **Tab strip:** Sin fondo de contenedor; los tabs individuales tienen borde inferior (2px) para indicar activo.
- **Pill switcher:** Fondo tech-secondary, borde tech-surface, shadow-inner. Pills individuales: 8px radius, padding 10px 24px.
- **Active:** Fondo Rojo Institucional, texto blanco, shadow-lg.
- **Inactive:** Texto Gris Tiza, hover → texto Carbón Grafito.

### Cards / Containers
- **Corner Style:** 12-16px radius (rounded-xl o rounded-2xl). Consistentes por contexto (todas las tarjetas del dashboard mismo radius).
- **Background:** Superficie Blanca. Sin shadow estático.
- **Border:** Borde Arcilla (1px). En hover/interactivo: borde cambia al color del acento contextual.
- **Internal Padding:** 24px (p-6) estándar. Variante compacta: 16px (p-4).
- **Hover State:** Borde cambia al acento contextual, opcionalmente con glow sutil (box-shadow: 0 0 15px rgba(color, 0.15)). Nunca border-left de color como indicador hover — usar barra izquierda que se revela con opacidad.

### Inputs / Fields
- **Style:** Fondo tech-primary/50, borde tech-surface (1px), 12px radius.
- **Focus:** Anillo de foco doble: ring-2 tech-cyan/20 + border cambia a tech-cyan. Outer ring 4px tech-cyan/5 en variantes de búsqueda.
- **Height:** 48px estándar (py-4 o py-3 + padding). Textarea: altura variable, mismo tratamiento de borde/foco.
- **Placeholder:** Gris Tiza al 40-50% opacidad. Contraste 4.5:1 mínimo.
- **Error:** Borde Rosa Alerta, texto de error en Rosa Alerta con icono.
- **Icons within inputs:** Absolute positioned left, color Gris Tiza inherit from group-focus-within → Rojo Institucional.
- **Labels above:** Label style (10px/900/0.2em uppercase), Gris Tiza, ml-1.

### Navigation (Sidebar)
- **Style:** Fondo tech-secondary/75 con backdrop-blur-xl, borde derecho tech-surface/50. Fijo (fixed), z-50.
- **Width:** 256px expandido, 80px colapsado (solo iconos).
- **Nav links:** Rounded-xl (12px), padding 12px. Sin fondo en reposo, texto Gris Tiza. Hover → fondo tech-surface, texto Carbón Grafito. Active → fondo tech-cyan/10, texto Rojo Institucional, borde tech-cyan/20.
- **Active indicator:** Barra izquierda (4px, rounded-r-full) con glow, solo en estado activo. No en hover.
- **Section headers:** Label style (10px/900/0.2em uppercase), Gris Tiza, padding-x 16px. Sin uppercase en colapsado.
- **Mobile:** Overlay bg-black/60 backdrop-blur-sm. Sidebar se desliza desde la izquierda.

### Tables
- **Container:** Fondo Superficie Blanca, borde Arcilla, overflow-hidden, shadow-xl (sutil).
- **Header row:** Fondo Pizarra, texto Gris Tiza, border-bottom. Celdas: p-4, label style (10px/900/0.2em uppercase).
- **Body rows:** Divididas por border-bottom Arcilla. Hover → fondo tech-primary/50, transition-colors.
- **Data cells:** p-4. Texto Carbón Grafito para valores principales, Gris Tiza para metadata.
- **Responsive:** En mobile (<768px), convertir filas a tarjetas apiladas (divide-y divide-tech-surface). Cada "fila" es un p-4 con nombres en Title style, valores en Body/Mono.

### Loading / Skeleton
- **Base:** Fondo tech-surface, animate-pulse (1.5s). Sin gradiente animado interno — la pulse animation es suficiente.
- **Variants:** rect (rounded), circle (rounded-full), text (h-4 w-full rounded).
- **Pattern:** DashboardSkeleton usa grilla 3-columnas con placeholders que imitan la forma de las tarjetas reales. TableSkeleton imita header + 4 filas.

### Modals
- **Backdrop:** fixed inset, bg-black/70, backdrop-blur-md (en modo feedback). Sin blur en modales operativos (más velocidad).
- **Content:** Fondo Superficie Blanca, rounded-2xl (16px), borde Arcilla. Max-width: 672px (max-w-2xl) estándar, 448px (max-w-md) para diálogos simples.
- **Header:** padding 24px, border-bottom Arcilla. Fondo tech-primary/50 opcional. Close button: p-2 hover:bg-tech-surface rounded-full.
- **Body:** padding 24px, max-height 70vh, overflow-y-auto con custom-scrollbar.
- **Footer:** padding 24px, bg-tech-primary/30, border-top Arcilla, flex justify-end.
- **Entrance:** animate-in zoom-in-95, fade-in, 200ms (operativo) o 300ms (feedback).

### Status Messages / Toasts
- **Container:** fixed o inline. Fondo de estado + borde + texto del mismo color. Ej: success → bg-tech-success/10, border-tech-success, text-tech-success.
- **Types:** success (Verde Gestión), error (Rojo Oscuro), warning (Gris Comercial), info (Rojo Institucional/10).
- **Motion:** fade-in + slide-down desde arriba. Auto-dismiss con setTimeout. Exit: fade-out + scale-down.

### Search Dropdown
- **Container:** absolute, top-full, mt-3, w-full, bg-tech-secondary, border-2, rounded-2xl, shadow-2xl, z-50, border-t-4 border-t-Rojo Institucional. Max height 320px, overflow-y-auto.
- **Items:** p-4, hover:bg-tech-surface/50, rounded-xl, borde transparente → hover:tech-cyan/20.
- **Icon:** w-10 h-10, rounded-lg, bg-tech-primary. Title: font-bold, grupo-hover:text-tech-cyan. Type: label style.

## 6. Do's and Don'ts

### Do:
- **Do** usar el Rojo Institucional como acento selectivo en ≤10% del viewport. Su rareza es su potencia.
- **Do** mantener la jerarquía tipográfica: Display para títulos de página, Headline para secciones, Title para tarjetas, Body para contenido, Label para etiquetas cortas.
- **Do** usar la capa tonal para profundidad: Fondo Pizarra → Superficie Blanca → Borde Arcilla. Sin sombras estáticas.
- **Do** mantener uppercase solo hasta 1.25rem (Title). Body text y párrafos multi-línea en sentence case.
- **Do** usar padding 24px (p-6) como estándar en tarjetas y contenedores. 16px (p-4) para variante compacta.
- **Do** usar transition-all 200ms en elementos interactivos. Sin animaciones lentas (>300ms para micro-interacciones).

### Don't:
- **Don't** usar border-left o border-right > 1px como acento decorativo en tarjetas. Usar revelación de barra con opacidad o bordes completos.
- **Don't** usar glassmorphism decorativo. Backdrop-blur solo en modales y overlays donde cumple función de enfoque.
- **Don't** usar gradient text (background-clip: text + gradient). Un color sólido es suficiente. Énfasis por peso.
- **Don't** repetir el patrón icono + título + descripción + enlace idéntico en grillas de tarjetas. Cada tarjeta debe tener contenido específico.
- **Don't** crear dashboards con métricas decorativas. Cada número en pantalla responde a una decisión real del usuario.
- **Don't** usar el patrón de "eyebrow" (texto tiny uppercase tracking-widest sobre cada sección) como scaffold default. Es el tropo AI más reconocible.
- **Don't** usar sombras en tarjetas en reposo. Solo elementos flotantes (modales, dropdowns) pueden tener sombras (≤8px blur).
- **Don't** usar background-image con gradientes decorativos, stripes (repeating-linear-gradient), o patrones de cuadrícula como default. El patrón de cuadrícula actual en body es aceptable como textura de fondo (opacidad 0.025), pero no debe replicarse en otros componentes.
- **Don't** exceder 24px en border-radius de tarjetas. El rango correcto es 12-16px (rounded-xl/rounded-2xl). 32px+ es el tell de diseño generativo.
