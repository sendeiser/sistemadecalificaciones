-- ==========================================
-- 03_SEED_DATA.SQL
-- Datos de Prueba para el Sistema de Calificaciones
-- ==========================================

-- 1. Cargar Divisiones (Cursos)
INSERT INTO public.divisiones (anio, seccion, ciclo_lectivo)
VALUES 
('1ro', 'A', 2024), ('1ro', 'B', 2024), ('2do', 'A', 2024), ('2do', 'B', 2024),
('3ro', 'A', 2024), ('4to', '1ra', 2024), ('5to', '1ra', 2024), ('6to', '1ra', 2024);

-- 2. Cargar Materias
INSERT INTO public.materias (nombre, campo_formacion, ciclo)
VALUES 
('Matemática', 'Ciencias Exactas', 'Ciclo Básico'),
('Lengua y Literatura', 'Comunicación', 'Ciclo Básico'),
('Biología', 'Ciencias Naturales', 'Ciclo Básico'),
('Historia', 'Ciencias Sociales', 'Ciclo Básico'),
('Geografía', 'Ciencias Sociales', 'Ciclo Básico'),
('Programación I', 'Técnico Profesional', 'Ciclo Superior'),
('Bases de Datos', 'Técnico Profesional', 'Ciclo Superior');

-- 3. Periodos de Calificación Iniciales
INSERT INTO public.periodos_calificacion (clave, nombre, abierto)
VALUES 
('P1', 'Primer Cuatrimestre', true),
('P2', 'Segundo Cuatrimestre', true),
('FINAL', 'Nota Final', true);

-- 4. Nota sobre Usuarios:
-- Los perfiles deben vincularse a usuarios de Auth. 
-- Se recomienda crear los usuarios (Admin, Preceptor, Docente) 
-- a través de la interfaz de Invitaciones de la App para asegurar la vinculación.
