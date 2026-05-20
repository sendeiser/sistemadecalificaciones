# Sistema Integrado de Gestión Escolar
## Manual de Usuario Definitivo (Todos los Módulos por Rol)

---

**Introducción**
Este manual detalla el funcionamiento exhaustivo de los 11 módulos del sistema, segmentados según los perfiles de usuario. La plataforma está diseñada para garantizar fluidez, seguridad (RLS en base de datos) y trazabilidad completa de los datos educativos.

---

## 1. Módulos Transversales (Comunes a todos los roles)

### 1.1 Autenticación y Perfiles
- **Ingreso seguro**: Todo usuario debe autenticarse con correo y contraseña gestionados por Supabase.
- **Recuperación**: Acceso automático a herramientas de blanqueo de contraseñas.
- **Ajustes de Cuenta**: Los usuarios pueden modificar sus preferencias visuales y de notificación desde la sección de Perfil.

### 1.2 Comunicaciones (Mensajes y Avisos)
- **Mensajería Directa**: Bandeja de entrada privada que permite la comunicación fluida entre directivos, docentes, preceptores y tutores, sin necesidad de usar WhatsApp o emails externos.
- **Cartelera (Anuncios)**: Espacio de publicación donde se informan fechas importantes (ej. cierre de notas, reuniones de padres).

### 1.3 Calendario Institucional
- **Agenda compartida**: Un calendario unificado donde se visualizan feriados, fechas de exámenes y eventos escolares.

---

## 2. Rol: Administrador (Directivos)

El Administrador tiene permisos globales y es el encargado de la configuración del motor de la escuela.

### 2.1 Gestión Académica (Core)
- **Gestión de Materias**: Creación y modificación del catálogo completo de asignaturas del colegio.
- **Gestión de Cursos/Divisiones**: Creación de las aulas virtuales (Ej: "1ro A", "2do B") para el ciclo lectivo vigente.
- **Asignaciones Docentes**: Es el paso más crítico. El administrador vincula a un docente con una Materia específica dentro de una División. Si este paso no se realiza, el docente verá su panel vacío.
- **Matriculación de Alumnos**: Vincula estudiantes a cursos para que aparezcan en las planillas de los docentes.

### 2.2 Gestión de Usuarios
- **Importación Masiva**: A través de un archivo `.csv`, se pueden dar de alta a cientos de estudiantes y docentes en segundos.
- **Alta manual**: Creación uno a uno de perfiles desde el panel.

### 2.3 Módulo de Calificaciones y Periodos
- **Cierre y Apertura de Trimestres**: El administrador bloquea (cierra) la carga de notas de periodos específicos (ej. "Parcial 1") para evitar modificaciones fuera de término.
- **Auditoría de Notas (Audit Logs)**: Puede ver un registro de "quién modificó qué nota y cuándo", garantizando la transparencia.

### 2.4 Módulos Avanzados (IA y Configuraciones)
- **Inteligencia Artificial (Gemini)**: Panel de análisis predictivo para detectar alumnos en riesgo de reprobación basado en su historial.
- **Configuración Global**: Personalización de escalas de evaluación (ej. 1 al 10) y logos de la institución.

---

## 3. Rol: Preceptor

El preceptor es el administrador del día a día, enfocado en el seguimiento y el bienestar estudiantil.

### 3.1 Módulo de Asistencia (Avanzado)
- **Asistencia General**: El preceptor toma asistencia del curso completo al inicio del día.
- **Alertas y Discrepancias**: El sistema cruza la asistencia del preceptor (general) con la del docente (por materia). Si un alumno estaba presente pero luego falta a una clase particular, el sistema emite una "Alerta de Discrepancia".
- **Justificación Masiva**: Permite cargar certificados médicos o faltas justificadas rápidamente desde el panel o dispositivos móviles.

### 3.2 Supervisión y Reportes
- **Dashboard de Curso**: Visión completa de todos los alumnos de las divisiones que tiene a cargo.
- **Descarga de Boletines**: Puede generar e imprimir los boletines en PDF de todo el curso con un solo botón al cerrar el trimestre.

---

## 4. Rol: Docente

El trabajo del docente se enfoca netamente en la evaluación y registro del aula.

### 4.1 Módulo de Calificaciones
- **Planilla Interactiva**: Interfaz similar a Excel. Las notas se cargan con valores del **1 al 10**.
- **Cálculo Automático**: Al guardar, el sistema calcula de forma invisible:
  1. El Promedio final.
  2. El Nivel de Logro (LD, LS, LB, LI).
  3. Sugiere Trayectos de Acompañamiento si el alumno desaprobó.
- **Bloqueos**: Si el administrador cerró un periodo, esa columna aparecerá en gris y el docente no podrá editarla.

### 4.2 Asistencia por Materia
- Al iniciar su bloque de clase, el docente puede registrar la presencia (Presente, Ausente, Tarde) específica para su módulo, lo que alimenta el sistema de "Alertas de Discrepancias" del preceptor.

---

## 5. Rol: Alumno

Diseñado para empoderar al estudiante y darle seguimiento de su desempeño.

### 5.1 Portal de Alumno
- **Lectura de Calificaciones**: Ve su propio rendimiento en tiempo real sin poder modificar nada.
- **Descarga de Boletín**: Botón rápido para obtener su reporte oficial en PDF.

### 5.2 Gamificación
- (Si está activado) El alumno puede ver medallas o "logros" otorgados por asistencia perfecta o altas calificaciones, incentivando su participación.

---

## 6. Rol: Tutor (Padres)

### 6.1 Portal de Padres (Parent Dashboard)
- Permite a la familia monitorear el desempeño, notas y ausencias sin requerir citaciones físicas constantes.
- **Verificación de Documentos**: Pueden escanear los códigos QR de los boletines impresos para verificar su autenticidad directamente en el sistema escolar.
