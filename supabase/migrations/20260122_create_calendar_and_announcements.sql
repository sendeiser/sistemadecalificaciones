-- Phase 10: Academic Calendar and Communication Module
-- Migration: create_calendar_and_announcements
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- =====================================================
-- CALENDAR EVENTS TABLE
-- =====================================================
CREATE TABLE eventos_calendario (
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
    visible_para VARCHAR(20)[] DEFAULT ARRAY['admin', 'docente', 'alumno', 'preceptor'],
    creado_por UUID REFERENCES perfiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- =====================================================
-- ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE anuncios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    tipo VARCHAR(50) DEFAULT 'general' CHECK (tipo IN ('general', 'academico', 'administrativo', 'evento')),
    autor_id UUID REFERENCES perfiles(id) NOT NULL,
    destinatarios VARCHAR(20)[] DEFAULT ARRAY['admin', 'docente', 'alumno', 'preceptor'],
    division_id UUID REFERENCES divisiones(id),
    adjunto_url TEXT,
    publicado BOOLEAN DEFAULT false,
    fecha_publicacion TIMESTAMP,
    fecha_expiracion TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- =====================================================
-- ANNOUNCEMENTS READ TRACKING TABLE
-- =====================================================
CREATE TABLE anuncios_leidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anuncio_id UUID REFERENCES anuncios(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
    leido_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(anuncio_id, usuario_id)
);
-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_eventos_fecha_inicio ON eventos_calendario(fecha_inicio);
CREATE INDEX idx_eventos_fecha_fin ON eventos_calendario(fecha_fin);
CREATE INDEX idx_eventos_tipo ON eventos_calendario(tipo);
CREATE INDEX idx_eventos_visible_para ON eventos_calendario USING GIN(visible_para);
CREATE INDEX idx_anuncios_publicado ON anuncios(publicado);
CREATE INDEX idx_anuncios_fecha_publicacion ON anuncios(fecha_publicacion);
CREATE INDEX idx_anuncios_fecha_expiracion ON anuncios(fecha_expiracion);
CREATE INDEX idx_anuncios_autor ON anuncios(autor_id);
CREATE INDEX idx_anuncios_destinatarios ON anuncios USING GIN(destinatarios);
CREATE INDEX idx_anuncios_leidos_usuario ON anuncios_leidos(usuario_id);
CREATE INDEX idx_anuncios_leidos_anuncio ON anuncios_leidos(anuncio_id);
-- =====================================================
-- ROW LEVEL SECURITY POLICIES - EVENTOS_CALENDARIO
-- =====================================================
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;
-- Everyone can view events visible to their role
CREATE POLICY "Users can view events for their role"
    ON eventos_calendario FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol::text = ANY(eventos_calendario.visible_para)
        )
    );
-- Only admins can insert events
CREATE POLICY "Only admins can insert events"
    ON eventos_calendario FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol::text = 'admin'
        )
    );
-- Only admins can update events
CREATE POLICY "Only admins can update events"
    ON eventos_calendario FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol::text = 'admin'
        )
    );
-- Only admins can delete events
CREATE POLICY "Only admins can delete events"
    ON eventos_calendario FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol::text = 'admin'
        )
    );
-- =====================================================
-- ROW LEVEL SECURITY POLICIES - ANUNCIOS
-- =====================================================
ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;
-- Users can view published announcements for their role
CREATE POLICY "Users can view published announcements for their role"
    ON anuncios FOR SELECT
    USING (
        publicado = true 
        AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
        AND EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol::text = ANY(anuncios.destinatarios)
        )
    );
-- Admins and preceptors can view all announcements (including drafts)
CREATE POLICY "Admins and preceptors can view all announcements"
    ON anuncios FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol::text IN ('admin', 'preceptor')
        )
    );
-- Admins and preceptors can insert announcements
CREATE POLICY "Admins and preceptors can insert announcements"
    ON anuncios FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol::text IN ('admin', 'preceptor')
        )
    );
-- Authors and admins can update announcements
CREATE POLICY "Authors and admins can update announcements"
    ON anuncios FOR UPDATE
    USING (
        autor_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol::text = 'admin'
        )
    );
-- Authors and admins can delete announcements
CREATE POLICY "Authors and admins can delete announcements"
    ON anuncios FOR DELETE
    USING (
        autor_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol::text = 'admin'
        )
    );
-- =====================================================
-- ROW LEVEL SECURITY POLICIES - ANUNCIOS_LEIDOS
-- =====================================================
ALTER TABLE anuncios_leidos ENABLE ROW LEVEL SECURITY;
-- Users can view their own read status
CREATE POLICY "Users can view their own read status"
    ON anuncios_leidos FOR SELECT
    USING (usuario_id = auth.uid());
-- Users can mark announcements as read
CREATE POLICY "Users can mark announcements as read"
    ON anuncios_leidos FOR INSERT
    WITH CHECK (usuario_id = auth.uid());
-- Users can delete their own read marks (if needed)
CREATE POLICY "Users can delete their own read marks"
    ON anuncios_leidos FOR DELETE
    USING (usuario_id = auth.uid());
-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_eventos_calendario_updated_at
    BEFORE UPDATE ON eventos_calendario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anuncios_updated_at
    BEFORE UPDATE ON anuncios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();