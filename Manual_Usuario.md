# Sistema de Gestión de Calificaciones Escolar
## Manual de Usuario Oficial

---

**NOTA**: Este documento sirve como guía oficial para el uso del Sistema de Gestión de Calificaciones. Está dividido según los perfiles o roles de usuario disponibles en la plataforma. 

## Índice
1. [Introducción](#1-introducción)
2. [Rol: Administrador](#2-rol-administrador)
3. [Rol: Preceptor](#3-rol-preceptor)
4. [Rol: Docente](#4-rol-docente)
5. [Rol: Alumno](#5-rol-alumno)
6. [Resolución de Problemas Comunes](#6-resolución-de-problemas-comunes)

---

## 1. Introducción
El **Sistema de Gestión de Calificaciones** es una plataforma web diseñada para agilizar la carga de notas, asistencias y la generación de reportes escolares (como boletines). Todo funciona de manera automática y segura, asegurando que cada tipo de usuario acceda únicamente a la información que le corresponde.

### Inicio de Sesión
Al acceder a la URL principal, encontrarás una pantalla de inicio de sesión. Ingresa con el email y contraseña provistos por la institución.

<img src="./WhatsApp Image 2026-01-03 at 19.33.41.jpeg" alt="Pantalla de Inicio de Sesión" width="600"/>

---

## 2. Rol: Administrador

El Administrador tiene el control total sobre la plataforma. Su objetivo es preparar el entorno para que los docentes, preceptores y alumnos puedan operar.

### 2.1 Gestión de Usuarios y Alumnos
- **Importación Masiva**: En la pestaña **Alumnos**, puedes subir un archivo `.csv` (con columnas DNI, Nombre y Email) para registrar masivamente a los estudiantes. El sistema creará sus cuentas automáticamente.
- **Creación Individual**: Utiliza el botón `Nuevo Alumno` para registrar perfiles de a uno.

### 2.2 Gestión de Cursos y Materias
1. Ve a la sección **Materias**.
2. Añade las materias correspondientes al ciclo lectivo (ej. Matemáticas, Programación I).
3. **Asignaciones**: Vincula qué Docente imparte qué Materia en qué División (Año y Sección). Esto es crucial para que al Docente le aparezca el curso en su panel.

### 2.3 Apertura y Cierre de Periodos de Nota
Para evitar que se modifiquen calificaciones fuera de término, el administrador puede **bloquear la carga de notas** por periodo (ej. "Parcial 1").
- Las columnas bloqueadas aparecerán en gris (deshabilitadas) para los docentes.

---

## 3. Rol: Preceptor

El Preceptor juega un rol de apoyo y control fundamental en el día a día escolar, enfocado en el seguimiento de los alumnos y la gestión administrativa de los cursos.

### 3.1 Control de Asistencia y Seguimiento
- **Toma de Asistencia General**: El preceptor tiene acceso a las planillas de los cursos que tiene a cargo para registrar y auditar las asistencias diarias (Presente, Ausente, Tarde, Justificado).
- **Justificación de Faltas**: Puede actualizar el estado de una inasistencia cuando el alumno presenta el certificado médico o la nota de los tutores.

### 3.2 Supervisión de Alumnos y Notas
- **Vista Panorámica**: Puede consultar el rendimiento académico de todos los alumnos de sus divisiones asignadas, lo que facilita la comunicación con las familias.
- **Generación de Boletines**: El preceptor puede descargar e imprimir los boletines de todo su curso de manera ágil al finalizar cada periodo o ciclo lectivo.

---

## 4. Rol: Docente

El Docente interactúa con la plataforma principalmente para registrar el rendimiento de los alumnos.

### 4.1 Mis Cursos y Carga de Notas

**IMPORTANTE:** Si no ves cursos asignados en tu panel, comunícate con el Administrador o Preceptor para que realicen tu asignación.

1. Ve a **Mis Cursos** y selecciona la materia/división a evaluar.
2. Verás una planilla similar a un Excel con la lista de alumnos.
3. **Notas Parciales**: Ingresa calificaciones numéricas del **1 al 10**.
4. **Cálculo Automático**: El sistema calculará automáticamente el **Promedio**, determinará la etiqueta de **Logro** (LD, LS, LB, LI) y sugerirá un **Trayecto de Acompañamiento**.

### 4.2 Registro de Asistencias (por Materia)
- En la pestaña de **Asistencias** (si aplica a su modalidad), el docente puede registrar la presencia de los alumnos en su clase o módulo horario específico.
- Guarda los cambios para que queden reflejados en el sistema central.

---

## 5. Rol: Alumno

El acceso del Alumno es de **Solo Lectura**. Está diseñado para brindar transparencia y seguimiento de su propio progreso.

### 5.1 Consulta de Historial
- Al iniciar sesión, el alumno ve directamente un panel con su información personal y las materias en las que está inscripto.
- Se muestran los promedios calculados y las asistencias.

### 5.2 Descarga de Boletín
- Busca el botón de **"Descargar Boletín"**. El sistema generará un documento PDF con el formato oficial de la escuela incluyendo firmas correspondientes y detalle de logros.

---

## 6. Resolución de Problemas Comunes

| Problema | Causa Probable | Solución |
| :--- | :--- | :--- |
| **Error "Failed to fetch" al iniciar sesión** | Proyecto Pausado o Ad-blocker activo | Revisa si el servidor de Base de Datos está pausado o desactiva tu AdBlocker para la página. |
| **El docente no ve sus materias** | Falta de asignación | El administrador debe ir al menú "Asignaciones" y vincular al Docente con la Materia y División. |
| **Las notas no se promedian** | Error temporal de cálculo | Es posible que el número ingresado no esté en el rango válido. Revisa que las notas sean numéricas y reintenta guardar. |
