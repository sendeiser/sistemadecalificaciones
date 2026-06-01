# Portal Moderno — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar CGB Portal con layout de 3 capas (TopBar + Sidebar colapsable + Content), dashboard de widgets reordenables, y login modernizado.

**Architecture:** Layout global manejado por `MainLayout.jsx` que wrappea TopBar + Sidebar + contenido. Dashboard refactorizado para renderizar widgets dinámicos desde un array configurable. Sidebar existente modificada para soportar colapso animado. Login/Register usan el mismo card layout con inputs estandarizados.

**Tech Stack:** React + Tailwind CSS + Framer Motion + react-chartjs-2

---

### Task 1: TopBar component

**Files:**
- Create: `client/src/components/TopBar.jsx`

- [ ] **Create TopBar.jsx**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Sun, Moon, User, Settings, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const TopBar = ({ onToggleSidebar, unreadMessages, unreadAnnouncements }) => {
    const navigate = useNavigate();
    const { profile, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        <header className="h-14 bg-tech-secondary/80 backdrop-blur-xl border-b border-tech-surface flex items-center justify-between px-4 md:px-6 gap-4 sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 hover:bg-tech-surface rounded-lg text-tech-muted hover:text-tech-text transition-all focus-visible:ring-2 focus-visible:ring-tech-cyan/30 focus:outline-none"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>
                <div className="hidden md:flex relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted group-focus-within:text-tech-cyan transition-colors" />
                    <input
                        type="text"
                        placeholder="Búsqueda rápida..."
                        className="w-64 pl-9 pr-3 py-2 bg-tech-primary/50 border border-tech-surface rounded-lg text-xs text-tech-text placeholder-tech-muted/50 focus:outline-none focus:border-tech-cyan/50 focus:ring-2 focus:ring-tech-cyan/5 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                    onClick={() => navigate('/messages')}
                    className="relative p-2 hover:bg-tech-surface rounded-lg text-tech-muted hover:text-tech-text transition-all focus-visible:ring-2 focus-visible:ring-tech-cyan/30 focus:outline-none"
                    aria-label="Mensajes"
                >
                    <Bell size={18} />
                    {(unreadMessages + unreadAnnouncements) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tech-cyan rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-tech-secondary">
                            {unreadMessages + unreadAnnouncements}
                        </span>
                    )}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-1.5 hover:bg-tech-surface rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-tech-cyan/30 focus:outline-none"
                    >
                        <div className="w-7 h-7 bg-tech-cyan/10 rounded-lg flex items-center justify-center text-[10px] font-black text-tech-cyan uppercase">
                            {profile?.nombre?.[0] || '?'}
                        </div>
                        <span className="hidden md:block text-xs font-bold text-tech-text max-w-[100px] truncate">
                            {profile?.nombre || 'Usuario'}
                        </span>
                    </button>

                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-tech-secondary border border-tech-surface rounded-xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-tech-text hover:bg-tech-surface/50 transition-colors">
                                    <Settings size={14} /> Configuración
                                </button>
                                <hr className="border-tech-surface my-1" />
                                <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-tech-danger hover:bg-tech-danger/5 transition-colors">
                                    <LogOut size={14} /> Cerrar Sesión
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
```

- [ ] **Add to MainLayout.jsx**: Import TopBar, pass unread counts from useNotifications hook.

### Task 2: Collapsible Sidebar

**Files:**
- Modify: `client/src/components/Sidebar.jsx`

- [ ] **Read current Sidebar.jsx** to understand existing nav structure

- [ ] **Add collapsible state**: Accept `collapsed` prop + `onToggle` prop. Control from MainLayout.

- [ ] **Modify render logic**: When collapsed, hide labels (show only icons + tooltips). Change width from `w-60` to `w-16`. Animate with `transition-all duration-250`.

- [ ] **Tooltips**: Add `title` attribute or a custom tooltip component on nav links when collapsed.

- [ ] **Active indicator**: Replace any `border-l-4` with absolute positioned bar (4px, rounded-r-full, bg-tech-cyan) that reveals on hover/active with opacity transition.

### Task 3: MainLayout integration

**Files:**
- Modify: `client/src/components/MainLayout.jsx`

- [ ] **Read current MainLayout.jsx**

- [ ] **Integrate TopBar**: Add TopBar above sidebar + content. TopBar receives `onToggleSidebar` to control sidebar collapse.

- [ ] **Add collapsed state**: `useState(false)` for sidebar. Pass to Sidebar as prop.

- [ ] **Adjust layout**: Content area takes full width minus sidebar width. When sidebar collapsed, content expands.

```jsx
// Layout structure
<div className="min-h-screen bg-tech-primary">
    <TopBar onToggleSidebar={() => setCollapsed(!collapsed)} unreadMessages={unreadMessages} unreadAnnouncements={unreadAnnouncements} />
    <div className="flex">
        <Sidebar collapsed={collapsed} />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto transition-all duration-250">
            {children}
        </main>
    </div>
</div>
```

### Task 4: Dashboard Widget System

**Files:**
- Modify: `client/src/pages/Dashboard.jsx`
- Modify: `client/src/components/DashboardStats.jsx`
- Modify: `client/src/components/CriticalStudentsWidget.jsx`

- [ ] **Add drag-and-drop reordering** to Dashboard.jsx:

```jsx
import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Widget order state
const [widgetOrder, setWidgetOrder] = useState(() => {
    const saved = localStorage.getItem('dashboard-widget-order');
    return saved ? JSON.parse(saved) : ['stats', 'critical', 'attendance', 'calendar'];
});

const moveWidget = useCallback((from, to) => {
    setWidgetOrder(prev => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        // Persist
        localStorage.setItem('dashboard-widget-order', JSON.stringify(next));
        return next;
    });
}, []);
```

- [ ] **Render widgets from ordered array**:

```jsx
{widgetOrder.map((key, idx) => {
    const widgets = {
        stats: <DashboardStats role={profile.rol} profileId={profile.id} />,
        critical: profile.rol === 'admin' || profile.rol === 'preceptor' ? <CriticalStudentsWidget /> : null,
        // ...
    };
    return widgets[key];
})}
```

- [ ] **Add grip handle** to DashboardStats and CriticalStudentsWidget widgets for drag affordance.

- [ ] **Update DashboardStats cards**: Remove shadow-xl/2xl (already done). Add hover glow effect: `hover:shadow-[0_0_20px_rgba(220,38,38,0.12)] hover:border-tech-cyan/40`.

- [ ] **Widget entrance animation**: Wrap each widget in `motion.div` with fade + slide-up, stagger 50ms.

```jsx
import { motion } from 'framer-motion';

<motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.05, duration: 0.2, ease: 'easeOut' }}
>
    {widget}
</motion.div>
```

### Task 5: Login Redesign

**Files:**
- Modify: `client/src/components/Login.jsx`

- [ ] **Redesign layout**: Centered card, max-w-md, shadow-2xl, rounded-2xl. Add escudo CGB header.

- [ ] **Add grid background pattern** to page (opacidad 0.02) using CSS background-image or Tailwind.

- [ ] **Add shine effect** to primary button on hover:

```css
.shine-effect::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left 0.7s ease-in-out;
}
.shine-effect:hover::after {
    left: 100%;
}
```

- [ ] **Keep existing formlogic and validation**, only change visual layer.

### Task 6: Register Redesign

**Files:**
- Modify: `client/src/components/Register.jsx`

- [ ] **Same visual treatment as Login**: card layout, inputs, button.

- [ ] **Keep existing logic** (invite token validation, role selection). Only visual.

### Task 7: Page Transitions

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/PageTransition.jsx`

- [ ] **Read current PageTransition.jsx** and App.jsx route structure.

- [ ] **Add AnimatePresence** to App.jsx routes wrapper:

```jsx
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const location = useLocation();

<AnimatePresence mode="wait">
    <PageTransition key={location.pathname}>
        <Routes location={location}>...</Routes>
    </PageTransition>
</AnimatePresence>
```

- [ ] **Update PageTransition.jsx**:

```jsx
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
    >
        {children}
    </motion.div>
);
```

### Task 8: Reduced Motion Support

**Files:**
- Modify: `client/src/index.css`

- [ ] **Add reduced motion media query**:

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

### Task 9: Final Lint + Build Verification

- [ ] **Lint all modified files**:

```bash
npx eslint --no-ignore "client/src/components/TopBar.jsx" "client/src/components/Sidebar.jsx" "client/src/components/MainLayout.jsx" "client/src/pages/Dashboard.jsx" "client/src/components/DashboardStats.jsx" "client/src/components/CriticalStudentsWidget.jsx" "client/src/components/Login.jsx" "client/src/components/Register.jsx" "client/src/App.jsx" "client/src/components/PageTransition.jsx"
```

- [ ] **Build production**:

```bash
Set-Location -LiteralPath "client"; if ($?) { npm run build }
```

Expected: 0 errors.
