-- Migration for General Attendance (Preceptor)
CREATE TABLE asistencias_preceptor (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    estudiante_id UUID REFERENCES perfiles(id) NOT NULL,
    division_id UUID REFERENCES divisiones(id) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    estado estado_asistencia DEFAULT 'presente',
    observaciones TEXT,
    UNIQUE(estudiante_id, division_id, fecha)
);

ALTER TABLE asistencias_preceptor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access asistencias_preceptor" ON asistencias_preceptor FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Students view own general attendance" ON asistencias_preceptor FOR SELECT USING (
    estudiante_id = auth.uid()
);
