-- =====================================================
-- MIGRATION: Fix calificaciones + divisiones
-- Fecha: 2026-06-14
-- =====================================================

-- ─────────────────────────────────────────────────
-- 1. AGREGAR COLUMNAS FALTANTES A calificaciones
-- ─────────────────────────────────────────────────

-- Columna cuatrimestre (1 o 2)
ALTER TABLE public.calificaciones
    ADD COLUMN IF NOT EXISTS cuatrimestre SMALLINT DEFAULT 1 CHECK (cuatrimestre IN (1, 2));

-- Logros calculados (texto)
ALTER TABLE public.calificaciones
    ADD COLUMN IF NOT EXISTS logro_parcial TEXT;

ALTER TABLE public.calificaciones
    ADD COLUMN IF NOT EXISTS logro_intensificacion TEXT;

ALTER TABLE public.calificaciones
    ADD COLUMN IF NOT EXISTS logro_trayecto TEXT;

-- Promedio del cuatrimestre (editable por docente si necesita ajuste)
ALTER TABLE public.calificaciones
    ADD COLUMN IF NOT EXISTS promedio_cuatrimestre NUMERIC(4,2);

-- ─────────────────────────────────────────────────
-- 2. ACTUALIZAR REGISTROS EXISTENTES (cuatrimestre = 1)
-- ─────────────────────────────────────────────────
UPDATE public.calificaciones
SET cuatrimestre = 1
WHERE cuatrimestre IS NULL;

-- ─────────────────────────────────────────────────
-- 3. REEMPLAZAR UNIQUE CONSTRAINT para incluir cuatrimestre
-- (permite tener nota del 1ro y 2do cuatrimestre para
-- el mismo alumno en la misma asignación)
-- ─────────────────────────────────────────────────
ALTER TABLE public.calificaciones
    DROP CONSTRAINT IF EXISTS calificaciones_alumno_id_asignacion_id_key;

ALTER TABLE public.calificaciones
    DROP CONSTRAINT IF EXISTS calificaciones_alumno_asignacion_cuatrimestre_key;

ALTER TABLE public.calificaciones
    ADD CONSTRAINT calificaciones_alumno_asignacion_cuatrimestre_key
    UNIQUE (alumno_id, asignacion_id, cuatrimestre);

-- ─────────────────────────────────────────────────
-- 4. RLS: Permitir INSERT/UPDATE en calificaciones
-- para docentes con sus asignaciones
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Docentes and Admins manage grades" ON public.calificaciones;
CREATE POLICY "Docentes and Admins manage grades"
    ON public.calificaciones FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
        OR EXISTS (SELECT 1 FROM public.asignaciones a WHERE a.id = calificaciones.asignacion_id AND a.docente_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
        OR EXISTS (SELECT 1 FROM public.asignaciones a WHERE a.id = calificaciones.asignacion_id AND a.docente_id = auth.uid())
    );

-- ─────────────────────────────────────────────────
-- 5. CREAR divisiones que faltan (las que ya usan
-- las asignaciones y estudiantes_divisiones)
-- ─────────────────────────────────────────────────

-- Insertar divisiones que ya están referenciadas pero que no aparecen
-- en la tabla divisiones (la tabla puede estar vacía por un bug de migración).
-- Usamos los datos reales de las asignaciones existentes.

INSERT INTO public.divisiones (anio, seccion, ciclo_lectivo)
SELECT DISTINCT d.anio, d.seccion, d.ciclo_lectivo
FROM public.asignaciones a
JOIN public.divisiones d ON d.id = a.division_id
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────
-- 6. TABLA document_validations (para QR en PDF)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_hash TEXT UNIQUE NOT NULL,
    document_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.perfiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.document_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can verify documents" ON public.document_validations;
CREATE POLICY "Anyone can verify documents"
    ON public.document_validations FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins and teachers create validations" ON public.document_validations;
CREATE POLICY "Admins and teachers create validations"
    ON public.document_validations FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor', 'docente'))
    );
