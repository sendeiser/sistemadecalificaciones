-- =============================================================
-- ESQUEMA COMERCIO GRAL. BELGRANA (CGB)
-- Escuela Pública con orientación en Educación Física
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUMS
-- =============================================================
CREATE TYPE role_type AS ENUM ('admin', 'preceptor', 'docente', 'alumno', 'tutor', 'prof_educacion_fisica');
CREATE TYPE logro_type AS ENUM ('LD', 'LS', 'LB', 'LI');
CREATE TYPE estado_asistencia AS ENUM ('presente', 'ausente', 'tarde', 'justificado');
CREATE TYPE orientacion_type AS ENUM ('comercial', 'educacion_fisica', 'ambas');
CREATE TYPE evaluacion_fisica_type AS ENUM ('resistencia', 'velocidad', 'fuerza', 'flexibilidad', 'coordinacion', 'salto', 'lanzamiento');
CREATE TYPE estado_torneo AS ENUM ('proximo', 'en_curso', 'finalizado', 'suspendido');
CREATE TYPE tipo_practica AS ENUM ('pasantia', 'feria_comercial', 'proyecto_aula', 'visita_tecnica', 'evento_deportivo');

-- =============================================================
-- PERFILES (Usuarios)
-- =============================================================
CREATE TABLE perfiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol role_type NOT NULL DEFAULT 'docente',
    dni TEXT,
    email TEXT,
    orientacion orientacion_type DEFAULT 'ambas',
    fecha_nacimiento DATE,
    telefono TEXT,
    direccion TEXT,
    obra_social TEXT,
    contacto_emergencia TEXT,
    apto_fisico BOOLEAN DEFAULT false,
    fecha_apto_fisico DATE
);

-- =============================================================
-- CICLOS LECTIVOS
-- =============================================================
CREATE TABLE ciclos_lectivos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    anio INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado', 'planificacion')),
    UNIQUE(anio)
);

-- =============================================================
-- DIVISIONES (Cursos)
-- =============================================================
CREATE TABLE divisiones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    anio TEXT NOT NULL,
    seccion TEXT NOT NULL,
    ciclo_lectivo_id UUID REFERENCES ciclos_lectivos(id) NOT NULL,
    orientacion orientacion_type NOT NULL DEFAULT 'ambas',
    turno TEXT DEFAULT 'mañana' CHECK (turno IN ('mañana', 'tarde', 'vespertino')),
    estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado'))
);

-- =============================================================
-- MATERIAS
-- =============================================================
CREATE TABLE materias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    orientacion orientacion_type DEFAULT 'comercial',
    carga_horaria INTEGER DEFAULT 3,
    es_deportiva BOOLEAN DEFAULT false,
    es_taller BOOLEAN DEFAULT false,
    area TEXT CHECK (area IN ('formacion_general', 'formacion_comercial', 'educacion_fisica', 'taller', 'practicas'))
);

-- =============================================================
-- DISCIPLINAS DEPORTIVAS
-- =============================================================
CREATE TABLE disciplinas_deportivas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('individual', 'conjunto', 'mixto')),
    descripcion TEXT,
    activa BOOLEAN DEFAULT true
);

-- =============================================================
-- EVALUACIONES FÍSICAS
-- =============================================================
CREATE TABLE evaluaciones_fisicas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alumno_id UUID REFERENCES perfiles(id) NOT NULL,
    disciplina_id UUID REFERENCES disciplinas_deportivas(id),
    tipo_evaluacion evaluacion_fisica_type NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    resultado NUMERIC(6,2),
    unidad_medida TEXT,
    observaciones TEXT,
    docente_id UUID REFERENCES perfiles(id),
    periodo TEXT,
    ciclo_lectivo_id UUID REFERENCES ciclos_lectivos(id)
);

-- =============================================================
-- TORNEOS Y EVENTOS DEPORTIVOS
-- =============================================================
CREATE TABLE torneos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    disciplina_id UUID REFERENCES disciplinas_deportivas(id),
    fecha_inicio DATE,
    fecha_fin DATE,
    estado estado_torneo DEFAULT 'proximo',
    ubicacion TEXT,
    organizador TEXT
);

CREATE TABLE participantes_torneo (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    torneo_id UUID REFERENCES torneos(id) NOT NULL,
    alumno_id UUID REFERENCES perfiles(id) NOT NULL,
    resultado TEXT,
    puntaje NUMERIC(5,2),
    posicion INTEGER,
    UNIQUE(torneo_id, alumno_id)
);

-- =============================================================
-- APTOS FÍSICOS / CERTIFICADOS MÉDICOS
-- =============================================================
CREATE TABLE certificados_medicos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alumno_id UUID REFERENCES perfiles(id) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    apto BOOLEAN DEFAULT false,
    observaciones TEXT,
    archivo_url TEXT,
    medico TEXT,
    UNIQUE(alumno_id, fecha_emision)
);

-- =============================================================
-- ASIGNACIONES (Docente -> Materia -> Division)
-- =============================================================
CREATE TABLE asignaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    docente_id UUID REFERENCES perfiles(id) NOT NULL,
    materia_id UUID REFERENCES materias(id) NOT NULL,
    division_id UUID REFERENCES divisiones(id) NOT NULL,
    UNIQUE(docente_id, materia_id, division_id)
);

-- =============================================================
-- CALIFICACIONES
-- =============================================================
CREATE TABLE calificaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alumno_id UUID REFERENCES perfiles(id) NOT NULL,
    asignacion_id UUID REFERENCES asignaciones(id) NOT NULL,
    trimestre_1 NUMERIC(4,2) CHECK (trimestre_1 >= 1 AND trimestre_1 <= 10),
    trimestre_2 NUMERIC(4,2) CHECK (trimestre_2 >= 1 AND trimestre_2 <= 10),
    trimestre_3 NUMERIC(4,2) CHECK (trimestre_3 >= 1 AND trimestre_3 <= 10),
    asistencia NUMERIC(5,2) DEFAULT 0,
    promedio_anual NUMERIC(4,2) GENERATED ALWAYS AS (
        ROUND((COALESCE(trimestre_1, 0) + COALESCE(trimestre_2, 0) + COALESCE(trimestre_3, 0)) / 
        NULLIF((CASE WHEN trimestre_1 IS NOT NULL THEN 1 ELSE 0 END + 
                CASE WHEN trimestre_2 IS NOT NULL THEN 1 ELSE 0 END + 
                CASE WHEN trimestre_3 IS NOT NULL THEN 1 ELSE 0 END), 0), 2)
    ) STORED,
    logro logro_type,
    observaciones TEXT,
    UNIQUE(alumno_id, asignacion_id)
);

-- =============================================================
-- ASISTENCIA
-- =============================================================
CREATE TABLE asistencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    estudiante_id UUID REFERENCES perfiles(id) NOT NULL,
    asignacion_id UUID REFERENCES asignaciones(id) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    estado estado_asistencia DEFAULT 'presente',
    observaciones TEXT,
    justificacion TEXT,
    UNIQUE(estudiante_id, asignacion_id, fecha)
);

-- =============================================================
-- PRÁCTICAS COMERCIALES (Pasantías / Ferias / Proyectos)
-- =============================================================
CREATE TABLE practicas_comerciales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alumno_id UUID REFERENCES perfiles(id) NOT NULL,
    tipo tipo_practica NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    horas_cumplidas INTEGER DEFAULT 0,
    entidad_externa TEXT,
    tutor_externo TEXT,
    docente_id UUID REFERENCES perfiles(id),
    calificacion NUMERIC(4,2) CHECK (calificacion >= 1 AND calificacion <= 10),
    observaciones TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'finalizada', 'aprobada', 'rechazada'))
);

-- =============================================================
-- RENDIMIENTO DEPORTIVO (Evolución)
-- =============================================================
CREATE TABLE rendimiento_deportivo (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alumno_id UUID REFERENCES perfiles(id) NOT NULL,
    disciplina_id UUID REFERENCES disciplinas_deportivas(id) NOT NULL,
    periodo TEXT NOT NULL,
    nota_tecnica NUMERIC(4,2) CHECK (nota_tecnica >= 1 AND nota_tecnica <= 10),
    nota_actitudinal NUMERIC(4,2) CHECK (nota_actitudinal >= 1 AND nota_actitudinal <= 10),
    nota_conceptual NUMERIC(4,2) CHECK (nota_conceptual >= 1 AND nota_conceptual <= 10),
    promedio NUMERIC(4,2) GENERATED ALWAYS AS (
        ROUND((COALESCE(nota_tecnica, 0) + COALESCE(nota_actitudinal, 0) + COALESCE(nota_conceptual, 0)) / 3, 2)
    ) STORED,
    ciclo_lectivo_id UUID REFERENCES ciclos_lectivos(id),
    UNIQUE(alumno_id, disciplina_id, periodo, ciclo_lectivo_id)
);

-- =============================================================
-- AUDITORÍA
-- =============================================================
CREATE TABLE auditoria_notas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    calificacion_id UUID REFERENCES calificaciones(id),
    usuario_id UUID REFERENCES auth.users,
    accion TEXT NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================
-- ANUNCIOS
-- =============================================================
CREATE TABLE anuncios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    autor_id UUID REFERENCES perfiles(id),
    fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_expiracion DATE,
    dirigido_a TEXT[],
    adjuntos TEXT[]
);

-- =============================================================
-- MENSAJES
-- =============================================================
CREATE TABLE mensajes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    remitente_id UUID REFERENCES perfiles(id) NOT NULL,
    destinatario_id UUID REFERENCES perfiles(id) NOT NULL,
    asunto TEXT,
    cuerpo TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_lectura TIMESTAMP WITH TIME ZONE
);

-- =============================================================
-- EVENTOS (Calendario)
-- =============================================================
CREATE TABLE eventos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    tipo TEXT CHECK (tipo IN ('academico', 'deportivo', 'comercial', 'administrativo', 'cultural')),
    creador_id UUID REFERENCES perfiles(id),
    para_todos BOOLEAN DEFAULT true,
    division_id UUID REFERENCES divisiones(id)
);

-- =============================================================
-- FEEDBACK
-- =============================================================
CREATE TABLE feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES perfiles(id),
    tipo VARCHAR(20) DEFAULT 'sugerencia',
    contenido TEXT NOT NULL,
    prioridad VARCHAR(10) DEFAULT 'normal',
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado TEXT DEFAULT 'pendiente'
);

-- =============================================================
-- CONFIGURACIÓN DEL SISTEMA
-- =============================================================
CREATE TABLE configuracion (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clave TEXT UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descripcion TEXT,
    actualizado_por UUID REFERENCES perfiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================
-- DATOS INICIALES
-- =============================================================
INSERT INTO materias (nombre, orientacion, carga_horaria, area) VALUES
    ('Lengua y Literatura', 'comercial', 4, 'formacion_general'),
    ('Matemática', 'comercial', 4, 'formacion_general'),
    ('Inglés', 'comercial', 3, 'formacion_general'),
    ('Historia', 'comercial', 3, 'formacion_general'),
    ('Geografía', 'comercial', 3, 'formacion_general'),
    ('Formación Ética y Ciudadana', 'comercial', 2, 'formacion_general'),
    ('Educación Física', 'educacion_fisica', 3, 'educacion_fisica'),
    ('Contabilidad', 'comercial', 4, 'formacion_comercial'),
    ('Economía', 'comercial', 3, 'formacion_comercial'),
    ('Gestión Organizacional', 'comercial', 3, 'formacion_comercial'),
    ('Práctica Impositiva', 'comercial', 3, 'formacion_comercial'),
    ('Sistemas de Información Contable', 'comercial', 3, 'formacion_comercial'),
    ('Derecho Comercial', 'comercial', 2, 'formacion_comercial'),
    ('Deporte y Recreación', 'educacion_fisica', 3, 'educacion_fisica'),
    ('Anatomía y Fisiología', 'educacion_fisica', 2, 'formacion_general'),
    ('Nutrición Deportiva', 'educacion_fisica', 2, 'taller'),
    ('Primeros Auxilios', 'educacion_fisica', 2, 'taller'),
    ('Taller de Emprendedurismo', 'comercial', 2, 'taller'),
    ('Prácticas Profesionalizantes', 'comercial', 3, 'practicas');

INSERT INTO disciplinas_deportivas (nombre, tipo) VALUES
    ('Atletismo', 'individual'),
    ('Natación', 'individual'),
    ('Gimnasia Deportiva', 'individual'),
    ('Fútbol', 'conjunto'),
    ('Vóleibol', 'conjunto'),
    ('Básquetbol', 'conjunto'),
    ('Handball', 'conjunto'),
    ('Hockey', 'conjunto'),
    (' Rugby', 'conjunto'),
    ('Atletismo de Campo', 'individual'),
    ('Danza y Expresión Corporal', 'mixto');

INSERT INTO configuracion (clave, valor, descripcion) VALUES
    ('institucion.nombre', '"Comercio General Belgrano"', 'Nombre oficial de la institución'),
    ('institucion.sigla', '"CGB"', 'Sigla institucional'),
    ('institucion.tipo', '"escuela_publica"', 'Tipo de institución'),
    ('institucion.orientacion', '"educacion_fisica"', 'Orientación principal'),
    ('institucion.colores', '{"primario": "#dc2626", "secundario": "#4b5563", "fondo": "#faf5f5"}', 'Colores institucionales'),
    ('institucion.direccion', '"Sin especificar"', 'Dirección de la institución'),
    ('institucion.telefono', '"Sin especificar"', 'Teléfono de contacto'),
    ('institucion.email', '"contacto@cgb.edu.ar"', 'Email institucional'),
    ('academico.periodos', '["trimestre_1", "trimestre_2", "trimestre_3"]', 'Períodos de evaluación'),
    ('academico.escala_notas', '{"min": 1, "max": 10, "aprobado": 6}', 'Escala de calificaciones'),
    ('deportivo.evaluaciones_fisicas', '["resistencia", "velocidad", "fuerza", "flexibilidad", "coordinacion"]', 'Tipos de evaluaciones físicas'),
    ('deportivo.apto_fisico_obligatorio', 'true', 'Obligatoriedad del apto físico');

-- =============================================================
-- RLS POLICIES
-- =============================================================
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE practicas_comerciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendimiento_deportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE torneos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes_torneo ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- RLS Policies básicas
CREATE POLICY "Perfiles visibles para usuarios autenticados" ON perfiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Divisiones visibles para todos" ON divisiones FOR SELECT USING (true);
CREATE POLICY "Materias visibles para todos" ON materias FOR SELECT USING (true);
CREATE POLICY "Docentes gestionan sus calificaciones" ON calificaciones FOR ALL USING (
    EXISTS (
        SELECT 1 FROM asignaciones a
        WHERE a.id = calificaciones.asignacion_id
        AND a.docente_id = auth.uid()
    )
);
CREATE POLICY "Admins acceso completo calificaciones" ON calificaciones FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Docentes gestionan asistencia" ON asistencias FOR ALL USING (
    EXISTS (
        SELECT 1 FROM asignaciones a
        WHERE a.id = asistencias.asignacion_id
        AND a.docente_id = auth.uid()
    )
);
CREATE POLICY "Alumnos ven su propia asistencia" ON asistencias FOR SELECT USING (
    estudiante_id = auth.uid()
);

-- =============================================================
-- TRIGGER: Calcular Logro
-- =============================================================
CREATE OR REPLACE FUNCTION calculate_logro() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.promedio_anual >= 9 THEN
        NEW.logro := 'LD';
    ELSIF NEW.promedio_anual >= 7 THEN
        NEW.logro := 'LS';
    ELSIF NEW.promedio_anual >= 6 THEN
        NEW.logro := 'LB';
    ELSIF NEW.promedio_anual >= 1 THEN
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

-- =============================================================
-- TRIGGER: Auditoría de cambios
-- =============================================================
CREATE OR REPLACE FUNCTION audit_grade_changes() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_notas (calificacion_id, usuario_id, accion, datos_anteriores, datos_nuevos)
    VALUES (NEW.id, auth.uid(), 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_grades
AFTER UPDATE ON calificaciones
FOR EACH ROW EXECUTE FUNCTION audit_grade_changes();

-- =============================================================
-- TRIGGER: Prevenir cambios en ciclo cerrado
-- =============================================================
CREATE OR REPLACE FUNCTION prevent_closed_updates() RETURNS TRIGGER AS $$
DECLARE
    estado_ciclo TEXT;
BEGIN
    SELECT c.estado INTO estado_ciclo
    FROM ciclos_lectivos c
    JOIN divisiones d ON d.ciclo_lectivo_id = c.id
    JOIN asignaciones a ON a.division_id = d.id
    WHERE a.id = NEW.asignacion_id;

    IF estado_ciclo = 'cerrado' THEN
        RAISE EXCEPTION 'No se pueden modificar calificaciones de un ciclo cerrado.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_period_open
BEFORE UPDATE ON calificaciones
FOR EACH ROW EXECUTE FUNCTION prevent_closed_updates();
