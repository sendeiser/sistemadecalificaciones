-- ==========================================
-- SCRIPT DE DATOS DE PRUEBA (SEED DATA)
-- Versión: 2.0 (Sincronizada con schema.sql)
-- ==========================================

-- 1. Cargar Divisiones (Cursos)
INSERT INTO public.divisiones (anio, seccion, ciclo_lectivo, campo_formacion)
VALUES 
('1ro', 'A', 2024, 'Ciclo Básico'),
('1ro', 'B', 2024, 'Ciclo Básico'),
('2do', 'A', 2024, 'Ciclo Básico'),
('2do', 'B', 2024, 'Ciclo Básico'),
('3ro', 'A', 2024, 'Ciclo Básico'),
('4to', '1ra', 2024, 'Informática (Técnico)'),
('5to', '1ra', 2024, 'Informática (Técnico)'),
('6to', '1ra', 2024, 'Informática (Técnico)');

-- 2. Cargar Materias
-- Nota: Solo incluye columna 'nombre' según schema.sql
INSERT INTO public.materias (nombre)
VALUES 
('Matemática'),
('Lengua y Literatura'),
('Biología'),
('Historia'),
('Geografía'),
('Física'),
('Química'),
('Inglés'),
('Programación I'),
('Sistemas Operativos'),
('Bases de Datos'),
('Educación Física');

-- 3. INSTRUCCIONES PARA USUARIOS (AUTH):
-- Para que el sistema funcione, los perfiles deben estar vinculados a usuarios reales de Supabase Auth.
-- Pasos para crear usuarios reales:
-- 1. Ve a tu proyecto en Supabase -> Authentication -> Users -> Add User.
-- 2. Copia el ID (UUID) de cada usuario y reemplázalo en los INSERTS de abajo.

-- NOTA: Los siguientes alumnos se insertan con UUIDs generados al azar. 
-- SI TIENES RESTRICCIONES DE CLAVE FORÁNEA ACTIVAS, ESTO FALLARÁ si no existen en auth.users.
-- Se recomienda usar el botón "Nuevo Alumno" en la App para crear alumnos reales.

-- 4. Alumnos de Prueba (Muestra)
INSERT INTO public.perfiles (id, nombre, rol, email, dni)
VALUES 
(gen_random_uuid(), 'Juan Manuel Pérez', 'alumno', 'juan.perez@test.com', '45000001'),
(gen_random_uuid(), 'Ana Lucía Silva', 'alumno', 'ana.silva@test.com', '45000002'),
(gen_random_uuid(), 'Carlos Alberto Gómez', 'alumno', 'carlos.gomez@test.com', '45000003'),
(gen_random_uuid(), 'Lucía Belén Fernández', 'alumno', 'lucia.f@test.com', '45000004'),
(gen_random_uuid(), 'Diego E. Martínez', 'alumno', 'diego.m@test.com', '45000005'),
(gen_random_uuid(), 'Sofía Milagros Rodríguez', 'alumno', 'sofia.r@test.com', '45000006'),
(gen_random_uuid(), 'Mateo Sebastián López', 'alumno', 'mateo.l@test.com', '45000007'),
(gen_random_uuid(), 'Valentina Jazmín Romero', 'alumno', 'valen.r@test.com', '45000008');

/*
-- EJEMPLO PARA VINCULAR UN DOCENTE REAL:
-- INSERT INTO public.perfiles (id, nombre, rol, email, dni)
-- VALUES ('UUID_DE_AUTH_USER', 'Prof. Roberto García', 'docente', 'docente@test.com', '20000002');
*/

-- 5. Crear una Asignación de prueba
-- Este script intenta vincular al primer docente que encuentre con una materia y división
-- (Solo funcionará si ya existe al menos un perfil con rol 'docente')
INSERT INTO public.asignaciones (docente_id, materia_id, division_id)
SELECT p.id, m.id, d.id
FROM public.perfiles p, public.materias m, public.divisiones d
WHERE p.rol = 'docente' 
  AND m.nombre = 'Programación I' 
  AND d.anio = '6to' AND d.seccion = '1ra'
LIMIT 1;

-- ==========================================
-- CONSULTAS DE VERIFICACIÓN:
-- SELECT * FROM public.divisiones;
-- SELECT * FROM public.materias;
-- SELECT * FROM public.perfiles WHERE rol = 'alumno';
-- ==========================================
