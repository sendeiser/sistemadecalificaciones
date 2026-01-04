-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES ENUM
CREATE TYPE role_type AS ENUM ('admin', 'docente', 'alumno');

-- ESTADOS LOGRO ENUM
CREATE TYPE logro_type AS ENUM ('LD', 'LS', 'LB', 'LI');

-- PERFILES (Users)
CREATE TABLE perfiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol role_type NOT NULL DEFAULT 'docente',
    dni TEXT,
    email TEXT
);

-- DIVISIONES (Cursos)
CREATE TABLE divisiones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    anio TEXT NOT NULL, -- "1ro", "2do", etc.
    seccion TEXT NOT NULL, -- "A", "B", "C", "Unica"
    ciclo_lectivo INTEGER NOT NULL,
    campo_formacion TEXT, -- "Cientifico Tecnologico", "Tecnico Especifico"
    estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado'))
);

-- MATERIAS
CREATE TABLE materias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL
);

-- ASIGNACIONES (Docente -> Materia -> Division)
CREATE TABLE asignaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    docente_id UUID REFERENCES perfiles(id) NOT NULL,
    materia_id UUID REFERENCES materias(id) NOT NULL,
    division_id UUID REFERENCES divisiones(id) NOT NULL,
    UNIQUE(docente_id, materia_id, division_id)
);

-- CALIFICACIONES
CREATE TABLE calificaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alumno_id UUID REFERENCES perfiles(id) NOT NULL,
    asignacion_id UUID REFERENCES asignaciones(id) NOT NULL,
    parcial_1 NUMERIC(4,2) CHECK (parcial_1 >= 1 AND parcial_1 <= 10),
    parcial_2 NUMERIC(4,2) CHECK (parcial_2 >= 1 AND parcial_2 <= 10),
    parcial_3 NUMERIC(4,2) CHECK (parcial_3 >= 1 AND parcial_3 <= 10),
    parcial_4 NUMERIC(4,2) CHECK (parcial_4 >= 1 AND parcial_4 <= 10),
    asistencia NUMERIC(5,2) DEFAULT 0,
    promedio NUMERIC(4,2) GENERATED ALWAYS AS (
        ROUND((COALESCE(parcial_1, 0) + COALESCE(parcial_2, 0) + COALESCE(parcial_3, 0) + COALESCE(parcial_4, 0)) / 
        NULLIF((CASE WHEN parcial_1 IS NOT NULL THEN 1 ELSE 0 END + 
                CASE WHEN parcial_2 IS NOT NULL THEN 1 ELSE 0 END + 
                CASE WHEN parcial_3 IS NOT NULL THEN 1 ELSE 0 END + 
                CASE WHEN parcial_4 IS NOT NULL THEN 1 ELSE 0 END), 0), 2)
    ) STORED,
    logro logro_type, -- Se calculará via trigger o en aplicación, aquí lo haremos via trigger para consistencia
    observaciones TEXT,
    UNIQUE(alumno_id, asignacion_id)
);

-- AUDITORIA
CREATE TABLE auditoria_notas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    calificacion_id UUID REFERENCES calificaciones(id),
    usuario_id UUID REFERENCES auth.users,
    accion TEXT NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_notas ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for dev, refine for prod)
CREATE POLICY "Public profiles are viewable by everyone" ON perfiles FOR SELECT USING (true);
CREATE POLICY "Docentes update own grades" ON calificaciones FOR ALL USING (
    EXISTS (
        SELECT 1 FROM asignaciones a
        WHERE a.id = calificaciones.asignacion_id
        AND a.docente_id = auth.uid()
    )
);
CREATE POLICY "Admins full access" ON calificaciones FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- TRIGGER FUNCTION: Calculate Logro
CREATE OR REPLACE FUNCTION calculate_logro() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.promedio >= 9 THEN
        NEW.logro := 'LD';
    ELSIF NEW.promedio >= 7 THEN
        NEW.logro := 'LS';
    ELSIF NEW.promedio >= 6 THEN
        NEW.logro := 'LB';
    ELSIF NEW.promedio >= 1 THEN
        NEW.logro := 'LI';
    ELSE
        NEW.logro := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_logro
BEFORE INSERT OR UPDATE ON calificaciones
FOR EACH ROW EXECUTE FUNCTION calculate_logro();

-- TRIGGER FUNCTION: Audit
CREATE OR REPLACE FUNCTION audit_grade_changes() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_notas (calificacion_id, usuario_id, accion, datos_anteriores, datos_nuevos)
    VALUES (NEW.id, auth.uid(), TC, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_grades
AFTER UPDATE ON calificaciones
FOR EACH ROW EXECUTE FUNCTION audit_grade_changes();

-- TRIGGER FUNCTION: Prevent changes if closed
CREATE OR REPLACE FUNCTION prevent_closed_updates() RETURNS TRIGGER AS $$
DECLARE
    estado_division TEXT;
BEGIN
    SELECT d.estado INTO estado_division
    FROM divisiones d
    JOIN asignaciones a ON a.division_id = d.id
    WHERE a.id = NEW.asignacion_id;

    IF estado_division = 'cerrado' THEN
        RAISE EXCEPTION 'No se pueden modificar calificaciones de un ciclo cerrado.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_period_open
BEFORE UPDATE ON calificaciones
FOR EACH ROW EXECUTE FUNCTION prevent_closed_updates();
