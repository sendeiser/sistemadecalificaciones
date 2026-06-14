# Component System Implementation Plan

> **For agentic workers:** Implementation steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create reusable component primitives (Button, Input, Modal, Toast, Tabs, Table) matching the DESIGN.md spec, plus typography utility classes.

**Architecture:** Each component is a standalone file in `client/src/components/ui/`, following a consistent pattern: forwardRef + displayName + className merge with `tailwind-merge` + `clsx`. No external component library dependencies.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion 11, clsx, tailwind-merge, Lucide React icons

---

### Task 1: Typography Utility Classes

**Files:**
- Modify: `client/src/index.css`

- [ ] **Add typography utility classes to `index.css`**

Add these `@utility` blocks inside the `@layer utilities` section:

```css
@utility display {
  font-family: var(--font-sans);
  font-size: clamp(1.875rem, 4vw, 2.25rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

@utility headline {
  font-family: var(--font-sans);
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 800;
  line-height: 1.2;
  text-transform: uppercase;
}

@utility title {
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

@utility body {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
}

@utility label {
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

@utility mono {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.4;
}
```

---

### Task 2: Button Component

**Files:**
- Create: `client/src/components/ui/Button.jsx`

- [ ] **Create `Button.jsx`**

```jsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = {
  primary:
    'bg-tech-cyan text-white hover:bg-tech-cyan/90 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg',
  ghost:
    'bg-transparent text-tech-muted hover:bg-tech-surface/50 active:bg-tech-cyan active:text-white disabled:opacity-50',
  danger:
    'bg-tech-danger text-white hover:bg-tech-danger/90 active:scale-[0.98] disabled:opacity-50 disabled:scale-100',
};

const sizes = {
  sm: 'h-10 px-4 text-[0.625rem] font-black tracking-[0.2em] uppercase',
  md: 'h-12 px-8 text-[0.625rem] font-black tracking-[0.2em] uppercase',
  lg: 'h-14 px-10 text-[0.75rem] font-black tracking-[0.2em] uppercase',
};

const Button = forwardRef(({ className, variant = 'primary', size = 'md', children, shine, ...props }, ref) => (
  <button
    ref={ref}
    className={twMerge(
      clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 select-none cursor-pointer relative overflow-hidden',
        variants[variant],
        sizes[size],
      ),
      className,
    )}
    {...props}
  >
    {shine && variant === 'primary' && (
      <span className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    )}
    {children}
  </button>
));

Button.displayName = 'Button';
export default Button;
```

---

### Task 3: Input Component

**Files:**
- Create: `client/src/components/ui/Input.jsx`

- [ ] **Create `Input.jsx`**

```jsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({ className, label, error, icon: Icon, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-[0.625rem] font-black tracking-[0.2em] uppercase text-tech-muted ml-1 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tech-muted group-focus-within:text-tech-cyan transition-colors duration-200 pointer-events-none">
          <Icon size={18} />
        </div>
      )}
      <input
        ref={ref}
        className={twMerge(
          clsx(
            'w-full h-12 bg-tech-primary/50 border border-tech-surface rounded-xl px-4 text-tech-text placeholder:text-tech-muted/40',
            'transition-all duration-200 outline-none',
            'focus:border-tech-cyan focus:ring-2 focus:ring-tech-cyan/20',
            'file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[0.625rem] file:font-black file:tracking-[0.2em] file:uppercase file:bg-tech-cyan file:text-white file:cursor-pointer',
            Icon && 'pl-12',
            error && 'border-tech-danger focus:border-tech-danger focus:ring-tech-danger/20',
          ),
          className,
        )}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-tech-danger flex items-center gap-1">
        <span className="w-3.5 h-3.5">⚠</span>
        {error}
      </p>
    )}
  </div>
));

Input.displayName = 'Input';
export default Input;
```

---

### Task 4: Modal Component

**Files:**
- Create: `client/src/components/ui/Modal.jsx`

- [ ] **Create `Modal.jsx`**

```jsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${sizes[size]} bg-tech-secondary rounded-2xl border border-tech-surface shadow-2xl max-h-[85vh] flex flex-col`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-tech-surface">
                <h2 className="text-lg font-bold text-tech-text">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-tech-surface/50 rounded-full transition-colors text-tech-muted hover:text-tech-text"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="px-6 py-6 overflow-y-auto flex-1 custom-scrollbar">
              {children}
            </div>
            {footer && (
              <div className="px-6 py-4 bg-tech-primary/30 border-t border-tech-surface flex justify-end gap-3 rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
```

---

### Task 5: Toast Component

**Files:**
- Create: `client/src/components/ui/Toast.jsx`

- [ ] **Create `Toast.jsx`**

```jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: 'bg-tech-success/10 border-tech-success text-tech-success',
  error: 'bg-tech-danger/10 border-tech-danger text-tech-danger',
  warning: 'bg-tech-accent/10 border-tech-accent text-tech-accent',
  info: 'bg-tech-cyan/10 border-tech-cyan text-tech-cyan',
};

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = icons[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={twMerge(
                  clsx(
                    'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg',
                    styles[toast.type],
                  ),
                )}
              >
                <Icon size={18} className="shrink-0 mt-0.5" />
                <p className="flex-1 text-sm font-medium">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 hover:opacity-70 transition-opacity"
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
```

---

### Task 6: Tabs Component

**Files:**
- Create: `client/src/components/ui/Tabs.jsx`

- [ ] **Create `Tabs.jsx`**

```jsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Tabs = ({ tabs, activeTab, onChange, variant = 'pills' }) => {
  if (variant === 'underline') {
    return (
      <div className="flex gap-0 border-b border-tech-surface">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={twMerge(
              clsx(
                'px-6 py-3 text-[0.625rem] font-black tracking-[0.2em] uppercase transition-all duration-200 border-b-2 -mb-[1px]',
                activeTab === tab.value
                  ? 'border-tech-cyan text-tech-cyan'
                  : 'border-transparent text-tech-muted hover:text-tech-text',
              ),
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex bg-tech-primary/50 rounded-xl p-1 border border-tech-surface shadow-inner">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={twMerge(
            clsx(
              'px-6 py-2.5 rounded-lg text-[0.625rem] font-black tracking-[0.2em] uppercase transition-all duration-200',
              activeTab === tab.value
                ? 'bg-tech-cyan text-white shadow-lg'
                : 'text-tech-muted hover:text-tech-text',
            ),
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
```

---

### Task 7: Table Component

**Files:**
- Create: `client/src/components/ui/Table.jsx`

- [ ] **Create `Table.jsx`**

```jsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Table = ({ columns, data, onRowClick, className }) => (
  <div className={twMerge('w-full overflow-hidden border border-tech-surface rounded-xl shadow-xl', className)}>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-tech-primary">
            {columns.map(col => (
              <th
                key={col.key}
                className={twMerge(
                  clsx(
                    'px-4 py-4 text-left text-[0.625rem] font-black tracking-[0.2em] uppercase text-tech-muted border-b border-tech-surface',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  ),
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-tech-surface">
          {data.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              className={twMerge(
                clsx(
                  'transition-colors duration-150',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-tech-primary/50',
                ),
              )}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={twMerge(
                    clsx(
                      'px-4 py-4 text-sm text-tech-text',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.mono && 'font-mono text-xs',
                    ),
                  )}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Table;

```

---

### Task 8: Verify build

**Files:**
- Modify: `client/src/App.jsx` (import ToastProvider and wrap)

- [ ] **Wrap app in ToastProvider**

Add import and wrap in `App.jsx`:

```jsx
import { ToastProvider } from './components/ui/Toast';
// ... inside return
<ToastProvider>
  <AnimatePresence mode="wait">
    <Routes>...</Routes>
  </AnimatePresence>
</ToastProvider>
```

- [ ] **Run lint and build**

```bash
npx eslint client/src/components/ui/
cd client && npm run build
```

---
