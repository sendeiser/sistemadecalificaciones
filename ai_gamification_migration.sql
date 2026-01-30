-- Tabla para almacenar los logros/medallas de los perfiles
CREATE TABLE IF NOT EXISTS public.perfiles_logros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    medal_key VARCHAR(100) NOT NULL, -- Ej: 'asistencia_perfecta', 'excelencia_academica'
    otorgado_en TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(perfil_id, medal_key)
);

-- Tabla para cachear diagnósticos de IA y evitar llamadas excesivas
CREATE TABLE IF NOT EXISTS public.ai_diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    docente_id UUID REFERENCES public.perfiles(id),
    analisis TEXT NOT NULL,
    recomendaciones JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.perfiles_logros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_diagnostics ENABLE ROW LEVEL SECURITY;

-- Políticas para Logros
CREATE POLICY "Alumnos pueden ver sus propios logros"
ON public.perfiles_logros FOR SELECT
USING (auth.uid() = perfil_id);

CREATE POLICY "Admins y Preceptores pueden ver todos los logros"
ON public.perfiles_logros FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
);

-- Políticas para Diagnósticos
CREATE POLICY "Usuarios pueden ver diagnósticos de sus alumnos"
ON public.ai_diagnostics FOR SELECT
USING (
    auth.uid() = alumno_id OR
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor', 'docente'))
);

CREATE POLICY "Solo docentes y admin pueden crear diagnósticos"
ON public.ai_diagnostics FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor', 'docente'))
);
