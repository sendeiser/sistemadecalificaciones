# Sistema de Gestión de Calificaciones

Bienvenido al Sistema de Gestión de Calificaciones. Esta aplicación permite administrar alumnos, docentes, materias, calificaciones y asistencias de forma integral.

---

## 🚀 Guía de Implementación desde Cero

Sigue estos pasos para configurar la aplicación en una instancia nueva de Supabase.

### 1. Preparación en Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com/).
2. Toma nota de la `URL` y la `service_role_key` (o `anon_key` según corresponda) para configurar el entorno.

### 2. Ejecución de Scripts SQL (MÉTODO RECOMENDADO)

Es **crítico** ejecutar los scripts en el siguiente orden para evitar errores de dependencias. Copia y pega el contenido de cada archivo ubicado en `/supabase/master_scripts/` en el **SQL Editor** de Supabase:

1.  **01_full_setup.sql**: Crea todas las tablas, funciones, tipos de datos y triggers.
2.  **02_full_rls_policies.sql**: Configura la seguridad completa (RLS) para todos los roles (Admin, Docente, Tutor, Alumno).
3.  **03_seed_data.sql**: (Opcional) Carga datos de prueba, divisiones y materias iniciales.

---

### 3. Configuración del Servidor (Backend)

1. Ubícate en la carpeta `server/`.
2. Crea un archivo `.env` con las siguientes variables:
   ```env
   SUPABASE_URL=tu_url_de_supabase
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   PORT=5000
   ```
3. Ejecuta los comandos:
   ```bash
   npm install
   npm start
   ```

### 4. Configuración del Cliente (Frontend)

1. Ubícate en la carpeta `client/`.
2. Crea un archivo `.env` con:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   VITE_API_URL=http://localhost:5000/api
   ```
3. Ejecuta los comandos:
   ```bash
   npm install
   npm run dev
   ```

---

## 🛠️ Tecnologías Utilizadas
- **Frontend**: React.js, Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express.
- **Base de Datos**: Supabase (PostgreSQL) con RLS (Row Level Security).
- **IA**: Análisis pedagógico algorítmico / Gemini (Opcional).

---

> [!TIP]
> Si encuentras errores de permisos al ejecutar SQL, asegúrate de estar usando una cuenta con rol de Propietario o Administrador en el panel de Supabase.
