-- Tabla de Mensajes
CREATE TABLE IF NOT EXISTS public.mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remitente_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    destinatario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE, -- NULL si es para un grupo/rol
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    leido_at TIMESTAMPTZ,
    tipo VARCHAR(50) DEFAULT 'privado', -- 'privado', 'rol', 'difusion'
    rol_destinatario VARCHAR(50), -- Para mensajes enviados a todos los de un rol
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Políticas RLS para Mensajes
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver mensajes donde son remitentes o destinatarios
CREATE POLICY "Usuarios pueden ver sus propios mensajes" 
ON public.mensajes FOR SELECT 
USING (
    auth.uid() = remitente_id OR 
    auth.uid() = destinatario_id OR
    (rol_destinatario IS NOT NULL AND (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = rol_destinatario)
);

-- Los usuarios pueden enviar mensajes
CREATE POLICY "Usuarios pueden enviar mensajes"
ON public.mensajes FOR INSERT
WITH CHECK (auth.uid() = remitente_id);

-- Los usuarios pueden marcar como leídos sus propios mensajes recibidos
CREATE POLICY "Usuarios pueden marcar como leidos"
ON public.mensajes FOR UPDATE
USING (auth.uid() = destinatario_id)
WITH CHECK (auth.uid() = destinatario_id);
