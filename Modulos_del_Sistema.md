# Arquitectura y Módulos del Sistema de Gestión Escolar
## Documentación Detallada de Componentes

---

El sistema está construido como una solución integral (tipo ERP) para instituciones educativas. A partir del análisis del código fuente (rutas del servidor y vistas del cliente), se han identificado los siguientes **11 módulos principales**:

### 1. Módulo de Autenticación y Gestión de Usuarios
Es el pilar de seguridad del sistema.
- **Autenticación (Auth)**: Maneja el inicio de sesión, recuperación de contraseñas (`ForgotPassword`, `ResetPassword`) y cierre de sesión de forma segura integrándose con Supabase Auth.
- **Gestión de Roles**: Soporta diferentes niveles de acceso: `admin`, `docente`, `preceptor`, `alumno` y `tutor`.
- **Administración de Perfiles (`AdminUserManagement`)**: Permite a los administradores crear cuentas manualmente o importar usuarios de forma masiva a través de archivos CSV, asignando los roles correspondientes.

### 2. Módulo Académico (Core)
Se encarga de estructurar la organización de la escuela.
- **Gestión de Materias (`SubjectManagement`)**: Catálogo de asignaturas dictadas en la institución.
- **Gestión de Cursos y Divisiones (`DivisionManagement`)**: Estructuración por años y secciones (ej. 1ro A, 5to 1ra).
- **Matriculación (`DivisionEnrollment`)**: Vinculación de alumnos a cursos específicos.
- **Asignaciones Docentes (`Assignments`)**: Motor que relaciona a un Docente con una Materia específica dentro de una División. Esto es lo que determina qué cursos ve un docente al iniciar sesión.

### 3. Módulo de Calificaciones (Grades)
Núcleo del seguimiento del rendimiento de los estudiantes.
- **Carga de Notas (`GradeEntry`)**: Planilla de cálculo interactiva para docentes donde ingresan calificaciones parciales numéricas (del 1 al 10).
- **Cálculo de Promedios y Logros**: De manera automática, la base de datos computa promedios, determina la etiqueta de nivel de logro (LD, LS, LB, LI) y sugiere "Trayectos de Acompañamiento".
- **Gestión de Periodos (`PeriodManagement`)**: Los directivos pueden abrir y cerrar temporalmente los periodos de carga de notas (ej. "Primer Trimestre cerrado").
- **Reportes y Boletines (`GradeReport`, `StudentReport`)**: Vistas consolidadas para generar boletines en PDF listos para imprimir.

### 4. Módulo de Asistencia (Attendance)
Especialmente útil para preceptores y docentes.
- **Toma de Asistencia Diaria (`Attendance`)**: Registro rápido de presentismo (Presente, Ausente, Tarde, Justificado).
- **Justificaciones y Justificación Masiva (`MassJustification`, `MobileJustification`)**: Herramientas para ingresar rápidamente certificados médicos.
- **Alertas y Discrepancias (`AttendanceAlerts`, `AttendanceDiscrepancies`)**: Módulo avanzado que alerta sobre estudiantes con demasiadas inasistencias o inconsistencias en la carga de datos.
- **Dashboard de Asistencias (`AttendanceOverview`)**: Vistas panorámicas del estado de presentismo del colegio.

### 5. Módulo de Comunicaciones y Mensajería
- **Mensajes Directos (`Messages`)**: Sistema de comunicación interna estilo chat entre docentes, directivos, alumnos y tutores.
- **Cartelera de Anuncios (`Announcements`)**: Publicación de avisos institucionales globales o por cursos (ej. "Reunión de padres", "Feriado").

### 6. Módulo de Calendario y Eventos
- **Agenda Institucional (`Calendar`)**: Un calendario centralizado para organizar fechas de exámenes, actos escolares, feriados y eventos cívicos.

### 7. Módulo de Tutoría (Parent Portal)
- **Portal de Padres (`ParentDashboard`)**: Un espacio dedicado para que los tutores legales puedan hacer seguimiento de las notas y asistencias de sus hijos sin necesidad de comunicarse constantemente con el colegio.

### 8. Módulo de Inteligencia Artificial (AI)
- **Asistente Pedagógico (`ai.js`)**: Integración con Google Gemini para realizar análisis algorítmico del desempeño de los estudiantes, detectar patrones de deserción o proponer intervenciones pedagógicas basadas en datos históricos.

### 9. Módulo de Gamificación (Gamification)
- **Incentivos (`gamification.js`)**: Sistema de recompensas e incentivos para los alumnos (ej. medallas por asistencia perfecta o participación destacada) enfocado en mejorar el compromiso escolar.

### 10. Módulo de Auditoría y Verificación
- **Logs de Auditoría (`AuditLogs`)**: Un registro de trazabilidad ("quién hizo qué y cuándo"). Crucial para saber si una nota fue modificada, cuándo y por qué usuario administrativo o docente.
- **Verificación de Documentos (`VerifyDocument`)**: Probablemente un sistema para comprobar la autenticidad de boletines o constancias a través de un código QR.

### 11. Módulo de Configuración del Sistema (Settings)
- **Ajustes Globales (`SystemSettings`)**: Parametrización de la escuela (logo, nombre, reglas de negocio de notas).
- **Centro de Ayuda (`HelpCenter`)**: Soporte y feedback (`feedback.js`) para reportar errores técnicos.
