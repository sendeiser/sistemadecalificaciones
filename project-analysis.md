# Análisis del Proyecto: Sistema de Calificaciones (Edumate)

## 1. Descripción General

Sistema de gestión educativa con módulos de calificaciones, asistencia, comunicaciones, gamificación y verificación de documentos.

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, Framer Motion, React Router 7 |
| Backend | Node.js, Express 4, Supabase JS |
| BD | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth (roles: admin, preceptor, docente, alumno, tutor) |
| Testing | Vitest (frontend), Jest + Supertest (backend) |
| QR/Docs | html5-qrcode, qrcode.react, jsPDF, PDFKit |
| IA | @google/generative-ai |
| Charts | Chart.js + react-chartjs-2 |

## 3. Estructura del Proyecto

```
/
├── client/ (React SPA)
│   ├── src/
│   │   ├── components/   → 18 componentes reutilizables
│   │   │   ├── AiInsights.jsx
│   │   │   ├── AnnouncementTicker.jsx
│   │   │   ├── AttendanceCapture.jsx
│   │   │   ├── CriticalStudentsWidget.jsx
│   │   │   ├── CSVImporter.jsx
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── DiffViewer.jsx
│   │   │   ├── FeedbackFAB.jsx
│   │   │   ├── FeedbackModal.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MainLayout.jsx
│   │   │   ├── MedalBadge.jsx
│   │   │   ├── PageTransition.jsx
│   │   │   ├── QRScanner.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── pages/        → 32 páginas (lazy-loaded)
│   │   │   ├── AdminAttendanceReport.jsx
│   │   │   ├── AdminUserManagement.jsx
│   │   │   ├── Announcements.jsx
│   │   │   ├── Assignments.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── AttendanceAlerts.jsx
│   │   │   ├── AttendanceDiscrepancies.jsx
│   │   │   ├── AttendanceOverview.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DivisionEnrollment.jsx
│   │   │   ├── DivisionManagement.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── GradeEntry.jsx
│   │   │   ├── GradeReport.jsx
│   │   │   ├── HelpCenter.jsx
│   │   │   ├── MassJustification.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── MobileJustification.jsx
│   │   │   ├── ParentDashboard.jsx
│   │   │   ├── PeriodManagement.jsx
│   │   │   ├── ReportView.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── StudentManagement.jsx
│   │   │   ├── StudentReport.jsx
│   │   │   ├── SubjectManagement.jsx
│   │   │   ├── SystemSettings.jsx
│   │   │   ├── TeacherReports.jsx
│   │   │   ├── UserSettings.jsx
│   │   │   ├── VerifyDocument.jsx
│   │   │   └── Welcome.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/
│   │   │   └── useNotifications.js
│   │   ├── utils/
│   │   ├── assets/
│   │   ├── supabaseClient.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── server/ (Express API)
    ├── config/
    │   └── supabaseClient.js
    ├── controllers/
    │   ├── attendanceController.js
    │   ├── auditController.js
    │   ├── citationController.js
    │   ├── reportController.js
    │   └── searchController.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── routes/
    │   ├── ai.js
    │   ├── announcements.js
    │   ├── assignments.js
    │   ├── attendance.js
    │   ├── audit.js
    │   ├── auth-admin.js
    │   ├── auth.js
    │   ├── calendar.js
    │   ├── feedback.js
    │   ├── gamification.js
    │   ├── grades.js
    │   ├── messages.js
    │   ├── reports.js
    │   ├── search.js
    │   ├── settings.js
    │   ├── students.js
    │   ├── subjects.js
    │   ├── tutor.js
    │   └── verify.js
    ├── utils/
    │   ├── auditLogger.js
    │   ├── csvHandler.js
    │   └── pedagogicalHeuristics.js
    ├── tests/
    ├── uploads/
    ├── index.js
    └── package.json
```

## 4. Arquitectura

Patrón: **Arquitectura en capas (Layered)**

```
Frontend (React SPA)
  → AuthContext (verifica sesión/rol)
  → Página/Componente
  → supabase cliente OR fetch a API
  → server/routes/{recurso}.js
  → server/controllers/{recurso}Controller.js (opcional)
  → server/config/supabaseClient.js
  → Supabase/PostgreSQL
  → Respuesta JSON
  → Renderizado con Chart.js / Tablas
```

### Flujo de autenticación

```
Login.jsx
  → supabase.auth.signInWithPassword()
  → AuthContext almacena session + profile
  → ProtectedRoute verifica session y allowedRoles
  → Redirección según rol
```

### Flujo de ejemplo: Registro de Calificaciones

```
GradeEntry.jsx (rol: docente)
  → AuthContext (verifica sesión/rol docente)
  → Fetch GET /api/grades/:studentId
  → server/routes/grades.js
  → supabase.from('grades').select(...)
  → Respuesta → renderizado con Chart.js
```

## 5. Módulos del Sistema

| Módulo | Rutas Frontend | API Routes | Roles |
|--------|---------------|-----------|-------|
| **Auth** | /login, /register, /forgot-password, /reset-password | /api/auth, /api/auth-admin | público |
| **Dashboard** | /dashboard | - | todos |
| **Welcome** | / | - | público |
| **Calificaciones** | /grades | /api/grades | docente |
| **Asistencia** | /attendance, /admin/attendance-capture, /admin/attendance-stats, /admin/attendance-alerts, /admin/attendance-discrepancies, /admin/mass-justification | /api/attendance | docente, admin/preceptor |
| **Materias** | /subjects | /api/subjects | admin, preceptor |
| **Estudiantes** | /students | /api/students | admin, preceptor |
| **Divisiones** | /divisions, /enrollment | - | admin, preceptor |
| **Asignaciones** | /assignments | /api/assignments | admin, preceptor |
| **Períodos** | /periods | - | admin, preceptor |
| **Reportes** | /reports, /teacher/reports, /student/report, /admin/reports | /api/reports | varios |
| **Mensajes** | /messages | /api/messages | todos |
| **Anuncios** | /announcements | /api/announcements | todos |
| **Calendario** | /calendar | /api/calendar | todos |
| **Auditoría** | /admin/audit | /api/audit | admin |
| **IA** | - | /api/ai, /api/tutor | - |
| **Gamificación** | - | /api/gamification | - |
| **Verificación Docs** | /verify/:hash | /api/verify | público |
| **Configuración** | /settings, /admin/system-settings | /api/settings | todos / admin |
| **Feedback** | - | /api/feedback | - |
| **Búsqueda** | - | /api/search | - |
| **Ayuda** | /help | - | todos |
| **Tutor/Padre** | /tutor, /tutor/justification | /api/tutor | tutor |

## 6. Base de Datos (Supabase/PostgreSQL)

### Tablas Principales

Basado en `schema.sql`, `seed_data.sql` y migraciones:

- **profiles** - Usuarios del sistema (rol: admin, preceptor, docente, alumno, tutor)
- **subjects** - Materias/cursos dictados
- **students** - Datos de estudiantes
- **grades** - Calificaciones por estudiante-materia-período
- **attendance** - Registro de asistencia
- **divisions** - Divisiones/grupos/cursos
- **periods** - Períodos lectivos (trimestres, cuatrimestres)
- **assignments** - Asignación docente → materia → división
- **messages** - Mensajería interna entre usuarios
- **announcements** - Anuncios generales
- **audit_logs** - Registro de auditoría de operaciones
- **gamification** - Puntos, logros y medallas
- **feedback** - Retroalimentación de usuarios
- **calendar_events** - Eventos del calendario
- **documents** - Documentos subidos/verificados
- **settings** - Configuración del sistema

### Esquemas SQL disponibles

- `schema.sql` - Esquema principal
- `seed_data.sql` - Datos de prueba
- `migration_*.sql` - Migraciones varias
- `ai_gamification_migration.sql` - Migración de gamificación IA
- `messaging_migration.sql` - Migración de mensajería

## 7. Seguridad

- **Autenticación**: Supabase Auth con email/password
- **RBAC**: 5 roles (admin, preceptor, docente, alumno, tutor) con control por ruta y componente
- **Middleware**: `authMiddleware.js` verifica tokens JWT en backend
- **Políticas RLS**: Row Level Security en Supabase (ver `fix_rls_policies.sql`, `migration_student_grades_policy.sql`)
- **Auditoría**: `auditLogger.js` registra operaciones críticas en `audit_logs`
- **CSV**: `csvHandler.js` sanitiza importaciones de archivos
- **Reset de admin**: Script `reset_admin.js`
- **Variables de entorno**: `.env` con SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

## 8. Convenciones de Código

### Frontend
- Componentes en PascalCase (`GradeEntry.jsx`)
- Lazy loading con `React.lazy()` + `Suspense`
- Animaciones con Framer Motion (`AnimatePresence`, `motion.div`)
- Estilos con Tailwind CSS (clases utilitarias, tema oscuro: `bg-tech-primary`, `text-tech-text`, `text-tech-cyan`)
- Context API para estado global (AuthContext, ThemeContext)
- React Router v7 con rutas anidadas y protección por roles

### Backend
- Rutas RESTful en `/routes/{recurso}.js`
- Controladores separados en `/controllers/` (para lógica compleja)
- Middleware de autenticación centralizado
- Exportación de `app` para testing con Supertest
- Uso de `require('dotenv').config()` en entrada principal

### Base de Datos
- Migraciones SQL incrementales (`migration_*.sql`)
- Políticas RLS por tabla
- Naming: snake_case para columnas y tablas

## 9. DevOps y Despliegue

- **Frontend**: Netlify (con `netlify.toml`)
- **Backend**: Render (con variables de entorno FRONTEND_URL)
- **Health check**: `GET /api/health` → `{ status: 'ok' }`
- **Endpoints**: API en puerto 5000 (dev), frontend en puerto 5173 (Vite)

## 10. Testing

- **Frontend**: Vitest con Testing Library (App.test.jsx, setupTests.js)
- **Backend**: Jest + Supertest (tests en `/server/tests/`)
- Cobertura actual: Básica, requiere expansión

## 11. Dependencias Clave

### Frontend (client/package.json)
- `react@^19.2.0`, `react-dom@^19.2.0`
- `react-router-dom@^7.0.0`
- `@supabase/supabase-js@^2.47.1`
- `framer-motion@^11.11.11`
- `chart.js@^4.5.1`, `react-chartjs-2@^5.3.1`
- `lucide-react@^0.456.0`
- `tailwindcss@^4.1.18`, `tailwind-merge@^3.4.0`
- `clsx@^2.1.1`
- `html5-qrcode@^2.3.8`, `qrcode.react@^4.2.0`
- `jspdf@^3.0.4`, `jspdf-autotable@^5.0.2`
- `xlsx@^0.18.5`
- `dexie@^4.2.1` (IndexedDB)

### Backend (server/package.json)
- `express@^4.21.1`
- `@supabase/supabase-js@^2.47.1`
- `@google/generative-ai@^0.24.1`
- `cors@^2.8.5`
- `dotenv@^16.4.5`
- `multer@^1.4.5-lts.1` (file uploads)
- `pdfkit@^0.15.0`, `jspdf@^2.5.1`
- `qrcode@^1.5.4`
- `uuid@^11.0.3`
- `crypto-js@^4.2.0`
- `csv-parser@^3.2.0`

## 12. Recomendaciones para Próxima Iteración

1. **Migrar a TypeScript** para mayor robustez y mantenibilidad
2. **Centralizar manejo de errores** en middleware Express
3. **Agregar validación de schemas** (Zod o Joi) en endpoints
4. **Documentar API REST** (OpenAPI/Swagger)
5. **Ampliar cobertura de tests** unitarios y de integración
6. **Separar lógica de negocio** de rutas (más controladores)
7. **Implementar caché** para consultas frecuentes
8. **Agregar migraciones automatizadas** con herramienta like Flyway
9. **Implementar WebSockets** para notificaciones en tiempo real
