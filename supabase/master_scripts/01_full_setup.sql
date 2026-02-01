-- =====================================================
-- 01_FULL_SETUP.SQL
-- Sistema de Calificaciones - Configuración Inicial Completa
-- =====================================================

-- 0. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tipos ENUM
DO $$ BEGIN
    CREATE TYPE public.role_type AS ENUM ('admin', 'preceptor', 'docente', 'alumno', 'tutor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.logro_type AS ENUM ('LD', 'LS', 'LB', 'LI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.estado_asistencia AS ENUM ('presente', 'ausente', 'tarde', 'justificado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tablas Principales

-- PERFILES (Users)
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol public.role_type NOT NULL DEFAULT 'docente',
    dni TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DIVISIONES (Cursos)
CREATE TABLE IF NOT EXISTS public.divisiones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    anio TEXT NOT NULL,
    seccion TEXT NOT NULL,
    ciclo_lectivo INTEGER NOT NULL,
    estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado'))
);

-- MATERIAS
CREATE TABLE IF NOT EXISTS public.materias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    campo_formacion TEXT,
    ciclo TEXT
);

-- ASIGNACIONES (Docente -> Materia -> Division)
CREATE TABLE IF NOT EXISTS public.asignaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    docente_id UUID REFERENCES public.perfiles(id) NOT NULL,
    materia_id UUID REFERENCES public.materias(id) NOT NULL,
    division_id UUID REFERENCES public.divisiones(id) NOT NULL,
    UNIQUE(docente_id, materia_id, division_id)
);

-- ESTUDIANTES_DIVISIONES (Inscripciones)
CREATE TABLE IF NOT EXISTS public.estudiantes_divisiones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alumno_id UUID REFERENCES public.perfiles(id) NOT NULL,
    division_id UUID REFERENCES public.divisiones(id) NOT NULL,
    UNIQUE(alumno_id, division_id)
);

-- CALIFICACIONES
CREATE TABLE IF NOT EXISTS public.calificaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alumno_id UUID REFERENCES public.perfiles(id) NOT NULL,
    asignacion_id UUID REFERENCES public.asignaciones(id) NOT NULL,
    parcial_1 NUMERIC(4,2) CHECK (parcial_1 >= 1 AND parcial_1 <= 10),
    parcial_2 NUMERIC(4,2) CHECK (parcial_2 >= 1 AND parcial_2 <= 10),
    parcial_3 NUMERIC(4,2) CHECK (parcial_3 >= 1 AND parcial_3 <= 10),
    parcial_4 NUMERIC(4,2) CHECK (parcial_4 >= 1 AND parcial_4 <= 10),
    nota_intensificacion NUMERIC(4,2) CHECK (nota_intensificacion >= 1 AND nota_intensificacion <= 10),
    trayecto_acompanamiento TEXT,
    asistencia NUMERIC(5,2) DEFAULT 0,
    promedio NUMERIC(4,2) GENERATED ALWAYS AS (
        ROUND((COALESCE(parcial_1, 0) + COALESCE(parcial_2, 0) + COALESCE(parcial_3, 0) + COALESCE(parcial_4, 0)) / 
        NULLIF((CASE WHEN parcial_1 IS NOT NULL THEN 1 ELSE 0 END + 
                CASE WHEN parcial_2 IS NOT NULL THEN 1 ELSE 0 END + 
                CASE WHEN parcial_3 IS NOT NULL THEN 1 ELSE 0 END + 
                CASE WHEN parcial_4 IS NOT NULL THEN 1 ELSE 0 END), 0), 2)
    ) STORED,
    logro public.logro_type,
    observaciones TEXT,
    UNIQUE(alumno_id, asignacion_id)
);

-- PERIODOS DE CALIFICACIÓN
CREATE TABLE IF NOT EXISTS public.periodos_calificacion (
    clave TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    abierto BOOLEAN DEFAULT true 
);

-- ASISTENCIAS (Por materia)
CREATE TABLE IF NOT EXISTS public.asistencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    estudiante_id UUID REFERENCES public.perfiles(id) NOT NULL,
    asignacion_id UUID REFERENCES public.asignaciones(id) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    estado public.estado_asistencia DEFAULT 'presente',
    observaciones TEXT,
    UNIQUE(estudiante_id, asignacion_id, fecha)
);

-- ASISTENCIAS_PRECEPTOR (Asistencia General)
CREATE TABLE IF NOT EXISTS public.asistencias_preceptor (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    estudiante_id UUID REFERENCES public.perfiles(id) NOT NULL,
    division_id UUID REFERENCES public.divisiones(id) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    estado public.estado_asistencia DEFAULT 'presente',
    observaciones TEXT,
    UNIQUE(estudiante_id, division_id, fecha)
);

-- MENSAJES (Chat Institucional)
CREATE TABLE IF NOT EXISTS public.mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remitente_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    destinatario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    leido_at TIMESTAMPTZ,
    tipo VARCHAR(50) DEFAULT 'privado',
    rol_destinatario VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- EVENTOS_CALENDARIO
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

-- ANUNCIOS
CREATE TABLE IF NOT EXISTS public.anuncios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    tipo VARCHAR(50) DEFAULT 'general' CHECK (tipo IN ('general', 'academico', 'administrativo', 'evento')),
    autor_id UUID REFERENCES public.perfiles(id) NOT NULL,
    destinatarios VARCHAR(20)[] DEFAULT ARRAY['admin', 'docente', 'alumno', 'preceptor', 'tutor'],
    division_id UUID REFERENCES public.divisiones(id),
    adjunto_url TEXT,
    publicado BOOLEAN DEFAULT false,
    fecha_publicacion TIMESTAMP,
    fecha_expiracion TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ANUNCIOS_LEIDOS
CREATE TABLE IF NOT EXISTS public.anuncios_leidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anuncio_id UUID REFERENCES public.anuncios(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    leido_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(anuncio_id, usuario_id)
);

-- PERFILES_LOGROS (Gamificación)
CREATE TABLE IF NOT EXISTS public.perfiles_logros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    medal_key VARCHAR(100) NOT NULL,
    otorgado_en TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(perfil_id, medal_key)
);

-- AI_DIAGNOSTICS
CREATE TABLE IF NOT EXISTS public.ai_diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    docente_id UUID REFERENCES public.perfiles(id),
    analisis TEXT NOT NULL,
    recomendaciones JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- INVITACIONES
CREATE TABLE IF NOT EXISTS public.invitaciones (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('docente', 'preceptor', 'admin', 'tutor')),
    email VARCHAR(255),
    usado BOOLEAN DEFAULT false,
    creado_por UUID REFERENCES public.perfiles(id),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP DEFAULT NOW()
);

-- TUTORES_ALUMNOS (Vínculos Familiares)
CREATE TABLE IF NOT EXISTS public.tutores_alumnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    alumno_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    parentesco VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, alumno_id)
);

-- 3. Funciones y Triggers

-- Cálculo de Logro Automático
CREATE OR REPLACE FUNCTION calculate_logro() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.promedio >= 9 THEN NEW.logro := 'LD';
    ELSIF NEW.promedio >= 7 THEN NEW.logro := 'LS';
    ELSIF NEW.promedio >= 6 THEN NEW.logro := 'LB';
    ELSIF NEW.promedio >= 1 THEN NEW.logro := 'LI';
    ELSE NEW.logro := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_logro
BEFORE INSERT OR UPDATE ON public.calificaciones
FOR EACH ROW EXECUTE FUNCTION calculate_logro();

-- Registro Automático de Perfiles (Post-Auth)
CREATE OR REPLACE FUNCTION handle_new_user_with_invitation()
RETURNS TRIGGER AS $$
DECLARE
    invite_token_str TEXT;
    invite_token UUID;
    invite_record RECORD;
    assigned_role VARCHAR;
    user_nombre VARCHAR;
    user_dni VARCHAR;
BEGIN
    invite_token_str := NEW.raw_user_meta_data->>'token';
    user_nombre := NEW.raw_user_meta_data->>'nombre';
    user_dni := NEW.raw_user_meta_data->>'dni';
    assigned_role := 'alumno';

    IF invite_token_str IS NOT NULL AND invite_token_str ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        invite_token := invite_token_str::UUID;
        SELECT * INTO invite_record FROM public.invitaciones WHERE token = invite_token;

        IF invite_record.token IS NOT NULL AND invite_record.usado = false THEN
            assigned_role := invite_record.rol;
            UPDATE public.invitaciones SET usado = true WHERE token = invite_token;
        END IF;
    END IF;

    INSERT INTO public.perfiles (id, nombre, dni, rol, email)
    VALUES (
        NEW.id,
        COALESCE(user_nombre, 'Nuevo Usuario'),
        COALESCE(user_dni, ''),
        assigned_role::public.role_type,
        NEW.email
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user_with_invitation();

-- Updated_At Column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_eventos_calendario_updated_at
BEFORE UPDATE ON public.eventos_calendario
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_anuncios_updated_at
BEFORE UPDATE ON public.anuncios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
