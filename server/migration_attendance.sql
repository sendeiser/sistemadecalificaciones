-- Create ENUM for attendance status
CREATE TYPE estado_asistencia AS ENUM ('presente', 'ausente', 'tarde', 'justificado');

-- Create Asistencias Table
CREATE TABLE asistencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    estudiante_id UUID REFERENCES perfiles(id) NOT NULL,
    asignacion_id UUID REFERENCES asignaciones(id) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    estado estado_asistencia DEFAULT 'presente',
    observaciones TEXT,
    UNIQUE(estudiante_id, asignacion_id, fecha)
);

-- Enable RLS
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Docentes can manage attendance for their own assignments
CREATE POLICY "Docentes manage attendance" ON asistencias FOR ALL USING (
    EXISTS (
        SELECT 1 FROM asignaciones a
        WHERE a.id = asistencias.asignacion_id
        AND a.docente_id = auth.uid()
    )
);

-- 2. Admins have full access
CREATE POLICY "Admins full access asistencias" ON asistencias FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- 3. Students can view their own attendance
CREATE POLICY "Students view own attendance" ON asistencias FOR SELECT USING (
    estudiante_id = auth.uid()
);
