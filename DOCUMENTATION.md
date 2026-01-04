# Documentación del Sistema de Gestión de Calificaciones

## Arquitectura
- **Frontend**: React (Vite) con Tailwind CSS v4.
- **Backend**: Node.js + Express.
- **Base de Datos**: Supabase (PostgreSQL) con RLS (Row Level Security).
- **Reportes**: PDFKit para generación de boletines.

## Gestión de Usuarios y Roles
El sistema maneja tres roles definidos en la base de datos:
1.  **admin**: Acceso total. Gestión de materias, alumnos y asignaciones.
2.  **docente**: Carga de calificaciones para sus cursos asignados.
3.  **alumno**: Consulta de notas propias y descarga de boletín.

## Manual de Uso para Administradores
1.  **Carga de Materias**: Desde la sección "Materias", crea el catálogo de materias de la institución.
2.  **Gestión de Alumnos**: Crea los perfiles de los estudiantes. *Importante:* El ID del alumno debe coincidir con el ID generado en la pestaña "Authentication" de Supabase.
3.  **Asignaciones**: Vincula un Docente con una Materia y una División (Curso/Sección).
4.  **Vínculo Alumno-Curso**: Asegúrate de que los alumnos estén registrados en la tabla `estudiantes_divisiones` para que figuren en las planillas de los docentes.

## Configuración de CI/CD (Despliegue)
### Frontend (Vercel / Netlify)
1. Conecta tu repositorio.
2. Configura los comandos:
   - Build: `npm run build`
   - Output Directory: `dist`
3. Añade las variables de entorno de `client/.env`.

### Backend (Render / Heroku)
1. Conecta tu repositorio apuntando a la carpeta `server`.
2. Comando de inicio: `npm start`
3. Añade las variables de entorno de `server/.env`.

## Resolución de Problemas
- **Error de RLS (Infinite Recursion)**: Ejecutar el script SQL de la función `is_admin()` proporcionado anteriormente.
- **Notas no calculadas**: Las notas promedio y logros se calculan automáticamente vía triggers en la base de datos.
