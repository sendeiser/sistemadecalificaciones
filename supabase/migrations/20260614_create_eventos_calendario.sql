-- =====================================================
-- MIGRATION: Crear tabla eventos_calendario
-- Fecha: 2026-06-14
-- =====================================================

-- 1. Crear la tabla
CREATE TABLE IF NOT EXISTS public.eventos_calendario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('feriado', 'cierre_notas', 'acto', 'examen', 'reunion', 'otro')),
    color VARCHAR(7) DEFAULT '#0ea5e9',
    todo_el_dia BOOLEAN DEFAULT true,
    hora_inicio TIME,
    hora_fin TIME,
    visible_para VARCHAR(20)[] DEFAULT ARRAY['admin', 'docente', 'alumno', 'preceptor', 'tutor'],
    creado_por UUID REFERENCES public.perfiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;

-- 3. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_eventos_calendario_updated_at ON public.eventos_calendario;
CREATE TRIGGER update_eventos_calendario_updated_at
BEFORE UPDATE ON public.eventos_calendario
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Políticas RLS

-- Cualquier usuario autenticado puede ver eventos según su rol
DROP POLICY IF EXISTS "Events viewable by role" ON public.eventos_calendario;
CREATE POLICY "Events viewable by role"
    ON public.eventos_calendario FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol::text = ANY(visible_para)
        )
    );

-- Solo admin y preceptor pueden crear/editar/borrar eventos
DROP POLICY IF EXISTS "Admins manage events" ON public.eventos_calendario;
CREATE POLICY "Admins manage events"
    ON public.eventos_calendario FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    );
