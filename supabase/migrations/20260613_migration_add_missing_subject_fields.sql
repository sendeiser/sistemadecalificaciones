-- Migración: Añadir campos faltantes a la tabla materias y corregir políticas de RLS
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase para poder editar/crear materias y realizar asignaciones docentes.

-- 1. Añadir columnas faltantes a la tabla de materias (si no existen)
ALTER TABLE public.materias 
ADD COLUMN IF NOT EXISTS anio TEXT,
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS campo_formacion TEXT,
ADD COLUMN IF NOT EXISTS ciclo TEXT;

-- 2. Políticas RLS para MATERIAS (Permitir inserción, edición y eliminación a administradores y preceptores)
DROP POLICY IF EXISTS "Admins can manage materias" ON public.materias;
CREATE POLICY "Admins can manage materias" ON public.materias 
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    );

-- 3. Políticas RLS para DIVISIONES (Permitir inserción, edición y eliminación a administradores y preceptores)
DROP POLICY IF EXISTS "Admins can manage divisiones" ON public.divisiones;
CREATE POLICY "Admins can manage divisiones" ON public.divisiones 
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    );

-- 4. Políticas RLS para ASIGNACIONES (Permitir inserción, edición y eliminación a administradores y preceptores)
DROP POLICY IF EXISTS "Admins can manage asignaciones" ON public.asignaciones;
CREATE POLICY "Admins can manage asignaciones" ON public.asignaciones 
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    );

-- 5. Políticas RLS para ESTUDIANTES_DIVISIONES (Permitir inscripción/desinscripción a administradores y preceptores)
DROP POLICY IF EXISTS "Admins can manage estudiantes_divisiones" ON public.estudiantes_divisiones;
CREATE POLICY "Admins can manage estudiantes_divisiones" ON public.estudiantes_divisiones 
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    );

-- Asegurar políticas de lectura básica para usuarios autenticados
DROP POLICY IF EXISTS "Public view materias" ON public.materias;
CREATE POLICY "Public view materias" ON public.materias 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public view divisiones" ON public.divisiones;
CREATE POLICY "Public view divisiones" ON public.divisiones 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public view estudiantes_divisiones" ON public.estudiantes_divisiones;
CREATE POLICY "Public view estudiantes_divisiones" ON public.estudiantes_divisiones 
    FOR SELECT TO authenticated USING (true);

-- Forzar la recarga del caché del esquema para PostgREST
SELECT pg_notify('pgrst', 'reload schema');
