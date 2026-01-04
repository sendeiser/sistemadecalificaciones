-- ==========================================
-- SCRIPT DE DATOS DE PRUEBA (SEED DATA)
-- ==========================================

-- 1. Cargar Divisiones (Cursos)
INSERT INTO public.divisiones (anio, seccion, ciclo_lectivo, campo_formacion)
VALUES 
('1ro', 'A', 2024, 'Ciclo Básico'),
('1ro', 'B', 2024, 'Ciclo Básico'),
('2do', 'A', 2024, 'Ciclo Básico'),
('6to', '1ra', 2024, 'Informática');

-- 2. Cargar Materias
INSERT INTO public.materias (nombre, descripcion)
VALUES 
('Matemática', 'Álgebra y geometría básica'),
('Lengua y Literatura', 'Análisis de textos y gramática'),
('Programación I', 'Introducción a algoritmos y JS'),
('Sistemas Operativos', 'Gestión de procesos y memoria'),
('Educación Física', 'Desarrollo motor y deportes');

-- 3. NOTA SOBRE USUARIOS:
-- Para los perfiles, necesitas IDs que ya existan en la tabla auth.users de Supabase.
-- Puedes crear 3 usuarios en la pestaña "Authentication" -> "Users" de Supabase
-- y luego copiar sus IDs (UUID) en los siguientes comandos:

/*
-- EJEMPLO DE CARGA DE PERFILES (Reemplaza los UUIDs con los reales de tu panel):

INSERT INTO public.perfiles (id, nombre, rol, email, dni)
VALUES 
('UUID_ADMIN_AQUI', 'Director Administrador', 'admin', 'admin@escuela.com', '11111111'),
('UUID_DOCENTE_AQUI', 'Profesor de Prueba', 'docente', 'docente@escuela.com', '22222222'),
('UUID_ALUMNO_AQUI', 'Estudiante de Prueba', 'alumno', 'alumno@escuela.com', '33333333');

-- 4. Vincular Alumno a una División
-- (Usa el UUID del alumno y el ID de una división creada arriba)
INSERT INTO public.estudiantes_divisiones (alumno_id, division_id)
SELECT p.id, d.id 
FROM public.perfiles p, public.divisiones d 
WHERE p.rol = 'alumno' AND d.anio = '1ro' AND d.seccion = 'A'
LIMIT 1;

-- 5. Crear una Asignación (Materia + Docente + División)
-- (Vincular al docente con Matemática en 1ro A)
INSERT INTO public.asignaciones (docente_id, materia_id, division_id)
SELECT p.id, m.id, d.id
FROM public.perfiles p, public.materias m, public.divisiones d
WHERE p.rol = 'docente' AND m.nombre = 'Matemática' AND d.anio = '1ro' AND d.seccion = 'A'
LIMIT 1;
*/

-- ==========================================
-- COMANDOS ÚTILES PARA VERIFICAR:
-- SELECT * FROM public.divisiones;
-- SELECT * FROM public.materias;
-- SELECT * FROM public.perfiles;
-- ==========================================
