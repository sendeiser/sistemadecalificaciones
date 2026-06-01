# Análisis del Sistema — Calificaciones CGB

## 1. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite | React 19.2 + Vite 6.4 |
| Backend | Express | 4.21 |
| Base de Datos | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth + JWT | — |
| Testing Frontend | Vitest + Testing Library | Vitest 4.0 |
| Testing Backend | Jest + Supertest | Jest 30.2 |
| CSS | Tailwind CSS 4 + framer-motion | — |
| PDF | jsPDF + jspdf-autotable + PDFKit | — |
| IA | Google Gemini AI | @google/generative-ai |

---

## 2. Arquitectura General

```
┌──────────────────────────────────────────────────┐
│  Cliente (React SPA - Vite)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  AuthCtx  │ │ThemeCtx  │ │  Componentes     │  │
│  │  (sesión, │ │(tema     │ │  (Login, Sidebar,│  │
│  │  perfil)  │ │ oscuro)  │ │   MainLayout)    │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
│         ↕ supabase.auth (directo)                 │
│         ↕ fetch() → /api/*                        │
├──────────────────────────────────────────────────┤
│  Servidor (Express - Puerto 5000)                 │
│  ┌──────────┐ ┌────────────────┐ ┌────────────┐  │
│  │Auth Middl│ │ 19 Routers     │ │Controllers │  │
│  │(JWT→     │ │ (/api/*)       │ │(reportCtrl)│  │
│  │req.user) │ │                │ │            │  │
│  └──────────┘ └────────────────┘ └────────────┘  │
│         ↕ supabaseAdmin (service_role)            │
│         ↕ supabase (anon + token usuario)         │
├──────────────────────────────────────────────────┤
│  Supabase PostgreSQL                              │
│  ┌──────────────┐ ┌──────────┐ ┌───────────────┐ │
│  │ perfiles,    │ │mensajes, │ │asignaciones,  │ │
│  │ divisiones,  │ │anuncios, │ │calificaciones,│ │
│  │ materias     │ │eventos   │ │asistencias    │ │
│  │              │ │          │ │               │ │
│  │ RLS por rol  │ │ + chat   │ │ + triggers    │ │
│  └──────────────┘ └──────────┘ └───────────────┘ │
└──────────────────────────────────────────────────┘
```

### Roles del Sistema
| Rol | Acceso |
|-----|--------|
| `admin` | Todo el sistema |
| `preceptor` | Gestión administrativa (no docentes) |
| `docente` | Calificaciones, asistencia propias |
| `alumno` | Ver notas, asistencia propias |
| `tutor` | Panel de hijos |

---

## 3. Flujo 1: Autenticación (Login)

### Recorrido completo

```
Usuario → Login.jsx → AuthContext.signIn()
    → supabase.auth.signInWithPassword({ email, password })
    → Supabase Auth devuelve sesión con JWT
    → AuthContext.fetchProfile(userId)
        → supabase.from('perfiles').select('*').eq('id', userId).single()
    → App.jsx <ProtectedRoute> detecta session
    → Redirect a /dashboard
```

### Login.jsx → AuthContext → Supabase Auth (directo)
```
Login.jsx
  └─ onLogin(email, password)
       └─ AuthContext.signIn(email, password)
            └─ supabase.auth.signInWithPassword({ email, password })
                 ↳ { data: { session, user }, error }
                      └─ AuthContext.setSession(session)
                           └─ fetchProfile(user.id)
                                └─ supabase.from('perfiles').select('*').eq('id', user.id).single()
                                     ↳ { data: profile, error }
                                          └─ AuthContext.setProfile(profile)
```

### POST /api/auth/login (Endpoint alternativo)
```
Cliente → POST /api/auth/login { token }
  1. auth.js:4 — import { supabase } from config
  2. auth.js:14 — supabase.auth.getUser(token)
     ↳ Si error/no user → 401
  3. auth.js:21-25 — supabase.from('perfiles').select('*').eq('id', user.id).single()
     ↳ Si error → 500
  4. auth.js:33 — res.json({ user, profile }) → 200
```

### Middleware de autenticación (`authMiddleware.js`)
```
Request → authMiddleware
  1. Extraer token: Authorization: Bearer <token> o ?token=
  2. Crear cliente Supabase con token en headers
  3. supabase.auth.getUser() → verificar
  4. req.user = user; req.supabase = supabaseClientePerUser
  5. next()
```

### Componentes involucrados
- `client/src/components/Login.jsx` — formulario de login
- `client/src/context/AuthContext.jsx` — estado global de sesión
- `client/src/supabaseClient.js` — cliente Supabase anon
- `client/src/App.jsx` — `<ProtectedRoute>`, `<AuthRedirect>`
- `server/routes/auth.js` — POST /api/auth/login
- `server/middleware/authMiddleware.js` — verificación JWT en rutas protegidas

---

## 4. Flujo 2: Calificaciones (Upsert + Auditoría)

### Recorrido completo

```
Docente → GradeEntry.jsx → POST /api/grades
    → authMiddleware (JWT → req.user, req.supabase)
    → grades.js POST /
        → 1. Buscar calificación existente (maybeSingle)
        → 2. Upsert con conflicto en (alumno_id, asignacion_id, cuatrimestre)
        → 3. Log de auditoría
    → Respuesta 200 con newGrade
```

### Servicio de auditoría (`auditLogger.js`)
```
logAudit(userId, entityType, entityId, action, oldData, newData)
  ├─ Busca nombre del actor: supabaseAdmin.from('perfiles').select('nombre').eq('id', userId).single()
  └─ Inserta en auditoria_notas:
       { usuario_id, accion: 'calificacion:UPDATE', datos_anteriores, datos_nuevos, ... }
```

### Esquema de consultas a BD

**Paso 1 — Obtener registro anterior:**
```js
req.supabase                         // cliente anon + token del docente
  .from('calificaciones')
  .select('*')
  .eq('alumno_id', alumno_id)
  .eq('asignacion_id', asignacion_id)
  .eq('cuatrimestre', activeSemester)
  .maybeSingle()                     // { data: oldGrade | null, error }
```

**Paso 2 — Insertar o actualizar:**
```js
req.supabase
  .from('calificaciones')
  .upsert({ alumno_id, asignacion_id, parcial_1, ..., cuatrimestre }, 
          { onConflict: 'alumno_id, asignacion_id, cuatrimestre' })
  .select()
  .single()                         // { data: newGrade, error }
```

**Paso 3 — Registrar en auditoría:**
```js
supabaseAdmin                        // cliente service_role (bypass RLS)
  .from('auditoria_notas')
  .insert({ usuario_id, accion, datos_anteriores, datos_nuevos, ... })
```

### Componentes involucrados
- `client/src/pages/GradeEntry.jsx` — formulario de carga de notas
- `server/routes/grades.js` — GET + POST /api/grades
- `server/middleware/authMiddleware.js` — JWT → req.supabase
- `server/utils/auditLogger.js` — logAudit()
- `server/config/supabaseClient.js` — supabase + supabaseAdmin

### Tablas BD involucradas
- `calificaciones` — columnas: alumno_id, asignacion_id, parcial_1..4, asistencia, cuatrimestre
- `auditoria_notas` — columnas: usuario_id, accion, datos_anteriores, datos_nuevos, fecha
- Trigger: `check_grading_period()` — evita modificar períodos cerrados

---

## 5. Flujo 3: Mensajería Interna

### Recorrido completo

```
Usuario → Messages.jsx → GET /api/messages (ver bandeja)
    → authMiddleware
    → messages.js GET /
        → 1. Buscar perfil del usuario (single)
        → 2. Buscar mensajes (or + order)
    → Render lista mensajes

Usuario → Messages.jsx → POST /api/messages (enviar)
    → authMiddleware
    → messages.js POST /
        → 1. Insertar mensaje (insert + select + single)
        → 2. (Opcional) Buscar nombre destinatario
        → 3. Log de auditoría
    → Respuesta 201 con nuevo mensaje
```

### Endpoints de mensajería

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/api/messages` | Bandeja: mensajes recibidos/enviados según rol |
| GET | `/api/messages/users` | Lista contactos disponibles |
| POST | `/api/messages` | Enviar mensaje privado o por rol |
| POST | `/api/messages/:id/read` | Marcar como leído |
| GET | `/api/messages/unread-count` | Contador no leídos |

### Consultas BD clave

**Obtener mensajes (bandeja):**
```js
supabaseAdmin
  .from('mensajes')
  .select(`*, remitente:perfiles!remitente_id(nombre,rol,email),
               destinatario:perfiles!destinatario_id(nombre,rol,email)`)
  .or(`remitente_id.eq.${userId},destinatario_id.eq.${userId},rol_destinatario.eq.${profile.rol}`)
  .order('created_at', { ascending: false })
```

**Enviar mensaje:**
```js
supabaseAdmin
  .from('mensajes')
  .insert({ remitente_id, destinatario_id, contenido, tipo })
  .select()
  .single()
```

**Contador no leídos:**
```js
supabaseAdmin
  .from('mensajes')
  .select('*', { count: 'exact', head: true })
  .eq('destinatario_id', userId)
  .eq('leido', false)
```

### Componentes involucrados
- `client/src/pages/Messages.jsx` — interfaz de chat
- `server/routes/messages.js` — 5 endpoints
- `server/middleware/authMiddleware.js`
- `server/utils/auditLogger.js`

---

## 6. Clientes Supabase — Diferencia Clave

El sistema usa **dos clientes Supabase** en el servidor:

### `supabase` (cliente anónimo)
```js
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```
- **Usado en:** `routes/auth.js` (login), `routes/verify.js`
- **Comportamiento:** respeta RLS del usuario anónimo

### `supabaseAdmin` (cliente service_role)
```js
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
```
- **Usado en:** `routes/messages.js`, `routes/announcements.js`, `routes/gamification.js`, `routes/search.js`, `utils/auditLogger.js`, `controllers/*`
- **Comportamiento:** bypass RLS, acceso completo

### `req.supabase` (cliente por-usuario)
```js
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});
```
- **Creado en:** `middleware/authMiddleware.js`
- **Usado en:** `routes/grades.js`, `routes/assignments.js`, `routes/attendance.js`, `routes/students.js`, etc.
- **Comportamiento:** respeta RLS según el rol del usuario autenticado

---

## 7. Patrones Comunes

### Manejo de errores (API)
```js
try {
  const { data, error } = await supabase.from(...)...;
  if (error) throw error;
  res.json(data);
} catch (err) {
  console.error('Contexto del error:', err);
  res.status(500).json({ error: err.message });
}
```

### Patrón de chaining Supabase
```js
// Lectura con filtros + single result
await supabase.from('perfiles').select('rol').eq('id', userId).single()

// Lectura con relaciones + orden
await supabase.from('calificaciones').select(`*, alumno:perfiles(...)`).order('id')

// Upsert + select + single (INSERT or UPDATE)
await supabase.from('calificaciones').upsert({...}, {onConflict: '...'}).select().single()

// Count query
await supabase.from('mensajes').select('*', { count: 'exact', head: true }).eq('...', val)
```

### Lazy loading (Frontend)
```jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
// Envuelto en <Suspense fallback={<Loader />}>
```

### Protección de rutas (Frontend)
```jsx
<ProtectedRoute allowedRoles={['admin', 'preceptor']}>
  <MainLayout><PageTransition><Assignments /></PageTransition></MainLayout>
</ProtectedRoute>
```

---

## 8. Tabla Completa de Rutas API

| Método | Ruta | Auth | Controller | Función |
|--------|------|------|-----------|---------|
| POST | `/api/auth/login` | — | — | Verificar token + perfil |
| POST | `/api/register-invite` | — | — | Registro por invitación |
| GET | `/api/invite/:token` | — | — | Validar token invitación |
| POST | `/api/admin/invite` | admin/preceptor | — | Crear invitación |
| GET | `/api/grades` | auth | — | Listar calificaciones |
| POST | `/api/grades` | auth | — | Upsert calificación |
| GET | `/api/students` | auth | — | Listar alumnos |
| POST | `/api/students/register` | auth | — | Registrar alumno |
| POST | `/api/students/import` | auth | — | Importar CSV |
| DELETE | `/api/students/:id` | auth | — | Eliminar alumno (cascada) |
| GET | `/api/assignments` | auth | — | Listar asignaciones |
| POST | `/api/assignments` | auth | — | Crear asignación |
| GET | `/api/attendance/:asignacionId` | auth | — | Asistencias por asignación |
| POST | `/api/attendance` | auth | — | Upsert asistencia |
| POST | `/api/attendance/general` | auth | — | Asistencia por división |
| GET | `/api/messages` | auth | — | Bandeja mensajes |
| POST | `/api/messages` | auth | — | Enviar mensaje |
| GET | `/api/messages/unread-count` | auth | — | Contador no leídos |
| GET | `/api/reports/dashboard-stats` | auth | reportController | Estadísticas dashboard |
| GET | `/api/reports/at-risk` | auth | reportController | Alumnos en riesgo |
| GET | `/api/reports/grades` | auth | reportController | Reporte notas PDF |
| GET | `/api/reports/bulletin/:studentId` | auth | reportController | Boletín PDF |
| GET | `/api/audit` | admin | auditController | Logs de auditoría |
| GET | `/api/search` | auth | searchController | Búsqueda global |
| POST | `/api/feedback` | auth | — | Enviar feedback |
| GET | `/api/settings` | admin | — | Configuración sistema |
| GET | `/api/health` | — | — | Health check |
| +26 rutas más | ... | | | |

---

## 9. Testing

### Tests existentes (55 pasan, 1 falla pre-existente)

| Archivo | Framework | Tests | Cobertura |
|---------|-----------|-------|-----------|
| `client/src/App.test.jsx` | Vitest | 1 | Render login no autenticado |
| `client/src/pages/Dashboard.test.jsx` | Vitest | 20 | Vistas por rol, tabs, búsqueda, acciones |
| `client/src/pages/Messages.test.jsx` | Vitest | 13 | Loading, vacío, tabs, compose, enviar, leer |
| `server/tests/server.test.js` | Jest | 4✅ + 1❌ | Health, grades GET, grades POST (falla maybeSingle) |
| `server/tests/messages.test.js` | Jest | 13 | CRUD mensajes, contador, errores |
| `server/tests/reports.test.js` | Jest | 4 | Dashboard stats, at-risk |

### Patrón de mocks (servidor)
```js
// Mock de Supabase con cadena de métodos retornando el mismo objeto
const mockSupabaseChain = {
  select: mockSelect, insert: mockInsert, ...,
  then(resolve) { return resolve({ data: null, error: null }); }
};
mockSelect.mockReturnValue(mockSupabaseChain);
```

---

## 10. Convenciones de Nomenclatura

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Rutas API | `archivo.js` → `routes/` | `grades.js`, `messages.js` |
| Controladores | `nombreController.js` | `reportController.js` |
| Componentes React | `PascalCase.jsx` | `GradeEntry.jsx`, `MainLayout.jsx` |
| Tests | `Nombre.test.jsx` | `Dashboard.test.jsx` |
| Contextos | `NombreContext.jsx` | `AuthContext.jsx` |
| Hooks | `useNombre.js` | `useNotifications.js` |
| DB: tablas | `snake_case` plural | `calificaciones`, `auditoria_notas` |
| DB: columnas | `snake_case` | `alumno_id`, `rol_destinatario` |
| DB: joins FK | `tabla!fk_columna` | `perfiles!remitente_id` |

---

## 11. Resumen de Patrones para Nuevas Features

1. **Crear ruta:**
   - Agregar archivo en `server/routes/`
   - Importar `authMiddleware` y aplicarlo con `router.use(authMiddleware)`
   - Usar `supabaseAdmin` o `req.supabase` según necesidad de RLS

2. **Crear componente:**
   - Archivo en `client/src/pages/` o `client/src/components/`
   - Import lazy en `App.jsx` + agregar `<Route>` en `AnimatedRoutes`

3. **Operación BD:**
   - Determinar RLS: `supabase` (anon) vs `supabaseAdmin` (bypass) vs `req.supabase` (por-usuario)
   - Usar `try/catch` con patrón `if (error) throw error`
   - Si es escritura crítica → agregar `logAudit()`

4. **Pruebas:**
   - Mock de Supabase con objeto chain + `then()`
   - Reset de mocks: `jest.clearAllMocks()` + `mockReset()` individual

5. **Validación:**
   - Errores 400 para datos faltantes
   - Errores 401 para auth
   - Errores 403 para roles no autorizados (vía `allowedRoles`)
   - Errores 404 para recursos no encontrados
   - Errores 500 para errores de BD
