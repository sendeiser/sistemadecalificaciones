-- =====================================================
-- MIGRATION: Crear tabla tutores_alumnos
-- Fecha: 2026-06-14
-- =====================================================
-- Esta tabla fue definida en el script maestro pero nunca
-- fue ejecutada en la base de datos de producción.

-- 1. Crear la tabla
CREATE TABLE IF NOT EXISTS public.tutores_alumnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    alumno_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    parentesco VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, alumno_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.tutores_alumnos ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS

-- Tutores pueden ver sus propios vínculos, alumnos pueden verse a sí mismos
DROP POLICY IF EXISTS "Tutors view children links" ON public.tutores_alumnos;
CREATE POLICY "Tutors view children links"
    ON public.tutores_alumnos FOR SELECT
    USING (auth.uid() = tutor_id OR auth.uid() = alumno_id);

-- Admin y preceptor pueden gestionar todos los vínculos (CRUD completo)
DROP POLICY IF EXISTS "Admins manage links" ON public.tutores_alumnos;
CREATE POLICY "Admins manage links"
    ON public.tutores_alumnos FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    );
