# Rediseño Portal Moderno — CGB

**Fecha:** 2026-06-01
**Base:** PRODUCT.md, DESIGN.md, Audit Health Score 12/20

---

## 1. Enfoque

Se adopta el enfoque **C — Portal Moderno** (tipo SaaS contemporáneo: Linear/Notion vibes). Mantiene el rojo institucional como identidad pero moderniza la superficie: sidebar colapsable, top bar global, dashboard con widgets reordenables, login tipo portada institucional.

## 2. Layout Global

Arquitectura de 3 capas:

```
┌──────────────────────────────────────────────┐
│  Top Bar (user, notif, tema, search)     56px │
├──────────┬───────────────────────────────────┤
│          │                                    │
│ Sidebar  │  Content Area                      │
│ 240→64px │  (scroll interno,                  │
│          │   page transitions,                │
│          │   max-w-7xl mx-auto)                │
│          │                                    │
└──────────┴────────────────────────────────────┘
```

### Sidebar
- Ancho expandido: 240px. Colapsado: 64px (solo iconos + tooltips)
- Toggle: botón hamburger en top bar (icono Menu)
- En reposo: sin fondo, texto Gris Tiza (#6b5c5c)
- Hover: bg-tech-surface, transición 200ms
- Active: bg-tech-cyan/10, texto Rojo Institucional (#dc2626)
- Active indicator: barra izquierda absoluta (4px, rounded-r-full) con opacidad 0→1 en hover/active, glow sutil
- Section headers en expandido: Label style (10px/900/0.2em uppercase), Gris Tiza, px-4
- Mobile: Overlay bg-black/60 backdrop-blur-sm, sidebar slide desde izquierda

### Top Bar (nueva)
- Altura fija 56px, bg-tech-secondary/80 backdrop-blur-xl
- Border-bottom: 1px tech-surface
- Elementos (LTR): Hamburger btn | Search input (global) | Spacer | ThemeToggle | Notifications bell (con badge rojo) | Avatar + user dropdown
- Dropdown user: Perfil, Configuración, Cerrar sesión

### Content Area
- Padding: p-6 md:p-10
- Max-width: 1280px (max-w-7xl mx-auto)
- Scroll interno (overflow-y-auto)

## 3. Dashboard — Widgets Reordenables

### Grid
- Desktop: 3 columnas (repeat(3, 1fr)), gap-6
- Tablet (>768): 2 columnas
- Mobile (<768): 1 columna

### Widget Card
- bg-tech-secondary, border tech-surface, rounded-xl (12px)
- **Sin sombra en reposo** (No-Shadow Rule)
- Padding: p-6 estándar
- Esquinas: rounded-xl (12px)
- Layout interno: icono + label arriba | valor grande centro | progress bar opcional | acción rápida hover

### Estados
- **Default:** borde tech-surface, sin glow
- **Hover:** border cambia a tech-cyan/40, glow sutil (`box-shadow: 0 0 20px rgba(220,38,38,0.12)`), grip handle (≡) aparece top-right, acción rápida aparece abajo, icono escala 1.1
- **Focus-visible:** ring-2 tech-cyan/30
- **Drag:** opacidad 0.8, shadow-xl (única excepción a No-Shadow)

### Acción rápida
- Label "Ir a {sección}" o "Cargar nota" o "Ver más"
- Text-[10px] font-black uppercase tracking-widest, color inherit from widget accent
- Aparece con opacity 0→1 en hover (200ms)

### Animación de entrada
- fade-in + slide-up (translateY(8px) → 0)
- Stagger: 50ms delay entre widgets
- 200ms ease-out

## 4. Login / Register

### Login
- Fondo: bg-tech-primary con patrón de cuadrícula (opacidad 0.02)
- Card: rounded-2xl (16px), max-w-md, shadow-2xl (flotante, permitido)
- Header: Escudo CGB (texto grande) + "Portal de Gestión Digital" + eslogan institucional
- Inputs: 48px altura, icono izquierdo (Mail, Lock), rounded-xl, focus ring tech-cyan
- Botón: primary full-width, con shine effect hover (degradado blanco/10 que cruza horizontalmente 700ms)
- Links: "¿Olvidaste tu contraseña?" y "¿No tenés cuenta?"
- Animación entrada: animate-in zoom-in-95 fade-in duration-300

### Register
- Mismo layout que Login
- Campos adicionales: Nombre, Selección de rol, Confirmar email
- Token de invitación como paso inicial (ya implementado, mantener)

## 5. Componentes Globales

### Botones
- Altura mínima: 48px (py-4 o py-3 + padding)
- Border-radius: 12px (rounded-xl)
- Primary: bg-tech-cyan, texto blanco, uppercase tracking-[0.2em] font-black text-[10px]
- Hover: scale[1.02], bg hacia rojo oscuro (#b91c1c)
- Active: scale[0.98]
- Disabled: opacity-50, no scale
- Ghost: transparente, texto tech-muted, hover => bg-tech-surface/50
- Con ícono: gap-2, icono 16-18px

### Tabs / Filter Pills
- Pill switcher container: bg-tech-secondary, border tech-surface, shadow-inner
- Active pill: bg-tech-cyan, texto blanco, shadow-lg
- Inactive pill: texto tech-muted, hover => text-tech-text
- Border-radius: 8px (rounded-lg)

### Tablas
- Container: rounded-xl overflow-hidden, border tech-surface
- Header row: bg-tech-primary, border-bottom tech-surface
  - Celdas: p-4, text-[10px] font-black uppercase tracking-widest text-tech-muted
- Body rows: border-bottom tech-surface
  - Hover: bg-tech-surface/30 transition-colors
- Mobile: filas se convierten en tarjetas apiladas (patrón ya existente en GradeEntry)

### Inputs
- Altura: 48px (h-12 o py-3)
- bg-tech-primary/50, border tech-surface (1px), rounded-xl
- Focus: ring-2 tech-cyan + border-tech-cyan
- Label: text-[10px] font-black uppercase tracking-widest text-tech-muted, ml-1
- Placeholder: tech-muted/50

## 6. Transiciones y Animaciones

### Timeline
- Hover micro-interactions: 200ms transition-all
- Sidebar collapse: 250ms ease-out-quart
- Page transitions (fade + slide-up): 200ms ease-out
- Stagger widgets: 50ms entre items
- Modal entrance: 200ms (operativo), 300ms (feedback)

### Easing
- Todas las transiciones: ease-out (cubic-bezier estándar)
- Duración: 150-250ms (product register: el usuario está en flow)
- Sin bounce, sin elastic

### Reduced Motion
- `@media (prefers-reduced-motion: reduce)`:
  - fade-in instantáneo (0→1, sin duración)
  - Sin slide-up, sin stagger
  - Sin scale en hover
  - Sin glow transitions

## 7. Principios Aplicados

| Principio | Aplicación |
|-----------|-----------|
| One Accent Rule | Tech-cyan (#dc2626) en ≤10% del viewport |
| Uppercase Ceiling | Uppercase solo hasta Title (1.25rem). Body en sentence case |
| No-Shadow Rule | Sin sombras en reposo. Solo elementos flotantes |
| Side-stripe ban | Sin border-l/ >1px como decoración |
| Identical card grid ban | Widgets con contenido específico, no tarjetas genéricas |
