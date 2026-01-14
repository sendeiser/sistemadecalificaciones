# Documento de Requisitos del Producto (PRD) - Sistema de Calificaciones Escolar

## 1. Propósito del Producto
El sistema tiene como objetivo digitalizar y automatizar la gestión de calificaciones y asistencias de una escuela técnica. Busca reemplazar las planillas de cálculo y papel por una aplicación web robusta, segura y fácil de usar, que replique la normativa de la "Planilla de Acreditación de Saberes".

## 2. Roles de Usuario
*   **Administrador**: Acceso total. Puede crear usuarios, gestionar materias, divisiones, cerrar periodos de notas y ver/editar todas las asistencias y calificaciones.
*   **Docente**: Puede ver sus cursos asignados, cargar notas (si el periodo está abierto), tomar asistencia diaria y ver listados de sus alumnos.
*   **Alumno**: Acceso de solo lectura a su propio historial de calificaciones y asistencia.

## 3. Características Principales

### 3.1 Gestión de Calificaciones
*   **Carga de Notas**: Interfaz estilo "planilla" para ingresar notas parciales (1-4), nota de intensificación y asistencia semestral.
*   **Cálculo Automático**:
    *   **Promedio**: Se calcula automáticamente basado en las notas parciales ingresadas.
    *   **Logro**: Se asigna una etiqueta (LD, LS, LB, LI) basada en el promedio.
    *   **Trayecto**: Se sugiere un "Trayecto de Acompañamiento" basado en el desempeño.
*   **Periodos de Calificación**: Los administradores pueden abrir/cerrar la carga de notas para periodos específicos (ej. "Parcial 1").
*   **Exportación**: Capacidad de exportar la planilla actual a CSV.

### 3.2 Gestión de Asistencias
*   **Registro Diario**: Los docentes marcan la asistencia (Presente, Ausente, Tarde, Justificado) para una fecha específica.
*   **Vista Admin**: Los administradores pueden auditar y modificar asistencias de cualquier curso.

### 3.3 Gestión de Usuarios y Datos
*   **Importación Masiva**: Carga de alumnos desde archivos CSV (DNI, Nombre, Email) que genera automáticamente usuarios y perfiles.
*   **Seguridad**: Uso de Row Level Security (RLS) en base de datos para asegurar que los alumnos solo vean sus datos y los docentes solo operen en sus cursos.

### 3.4 Reportes
*   **Boletines PDF**: Generación de informes en PDF con el formato oficial de la institución.

## 4. Flujo de Trabajo Esperado

### Escenario 1: Carga de Notas (Docente)
1.  El docente inicia sesión y va a "Mis Cursos".
2.  Selecciona una materia.
3.  Ve la lista de alumnos.
4.  Ingresa notas en las columnas habilitadas (ej. "Parcial 1").
5.  Si el periodo "Parcial 1" fue cerrado por el admin, el campo aparece deshabilitado.
6.  El sistema guarda automáticamente o mediante botón "Guardar".

### Escenario 2: Importación de Alumnos (Admin)
1.  El admin va a "Alumnos".
2.  Selecciona "Importar CSV".
3.  Sube un archivo con columnas `dni,nombre,email`.
4.  El sistema crea los usuarios en Supabase Auth y los perfiles en la base de datos.

## 5. Arquitectura Técnica
*   **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons.
*   **Backend**: Node.js + Express (API REST).
*   **Base de Datos**: PostgreSQL (Supabase) con Triggers y RLS.
*   **Infraestructura**: Autenticación manejada por Supabase.
