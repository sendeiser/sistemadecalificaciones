-- =====================================================
-- 02_FULL_RLS_POLICIES.SQL
-- Sistema de Calificaciones - Seguridad y Permisos (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudiantes_divisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_calificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias_preceptor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anuncios_leidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_logros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutores_alumnos ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de PERFILES
CREATE POLICY "Public profiles are viewable by everyone" ON perfiles FOR SELECT USING (true);
CREATE POLICY "Admins can manage profiles" ON perfiles FOR ALL USING (
    auth.uid() IN (SELECT id FROM perfiles WHERE rol = 'admin' OR rol = 'preceptor')
);

-- 2. Políticas de DIVISIONES y MATERIAS
CREATE POLICY "View divisions and materias" ON divisiones FOR SELECT USING (true);
CREATE POLICY "View materias" ON materias FOR SELECT USING (true);

-- 3. Políticas de ASIGNACIONES
CREATE POLICY "Admins and Teachers view assignments" ON asignaciones FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    OR docente_id = auth.uid()
);
CREATE POLICY "Students view assignments in their division" ON asignaciones FOR SELECT USING (
    EXISTS (SELECT 1 FROM estudiantes_divisiones ed WHERE ed.division_id = asignaciones.division_id AND ed.alumno_id = auth.uid())
);
CREATE POLICY "Tutors view assignments for their children" ON asignaciones FOR SELECT USING (
    EXISTS (SELECT 1 FROM tutores_alumnos ta JOIN estudiantes_divisiones ed ON ed.alumno_id = ta.alumno_id WHERE ta.tutor_id = auth.uid() AND ed.division_id = asignaciones.division_id)
);

-- 4. Políticas de CALIFICACIONES
CREATE POLICY "Docentes and Admins manage grades" ON calificaciones FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    OR EXISTS (SELECT 1 FROM asignaciones a WHERE a.id = calificaciones.asignacion_id AND a.docente_id = auth.uid())
);
CREATE POLICY "Students view own grades" ON calificaciones FOR SELECT USING (alumno_id = auth.uid());
CREATE POLICY "Tutors view grades for their children" ON calificaciones FOR SELECT USING (
    EXISTS (SELECT 1 FROM tutores_alumnos ta WHERE ta.tutor_id = auth.uid() AND ta.alumno_id = calificaciones.alumno_id)
);

-- 5. Políticas de ASISTENCIAS (Materia)
CREATE POLICY "Docentes manage attendance" ON asistencias FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    OR EXISTS (SELECT 1 FROM asignaciones a WHERE a.id = asistencias.asignacion_id AND a.docente_id = auth.uid())
);
CREATE POLICY "Students view own attendance" ON asistencias FOR SELECT USING (estudiante_id = auth.uid());

-- 6. Políticas de ASISTENCIAS_PRECEPTOR (General)
CREATE POLICY "Admins and Preceptors manage general attendance" ON asistencias_preceptor FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
);
CREATE POLICY "Students and Tutors view general attendance" ON asistencias_preceptor FOR SELECT USING (
    estudiante_id = auth.uid() OR EXISTS (SELECT 1 FROM tutores_alumnos ta WHERE ta.tutor_id = auth.uid() AND ta.alumno_id = asistencias_preceptor.estudiante_id)
);

-- 7. Políticas de MENSAJES
CREATE POLICY "Users can see their messages" ON mensajes FOR SELECT USING (
    auth.uid() = remitente_id OR auth.uid() = destinatario_id OR (rol_destinatario IS NOT NULL AND (SELECT rol::text FROM perfiles WHERE id = auth.uid()) = rol_destinatario)
);
CREATE POLICY "Users can send messages" ON mensajes FOR INSERT WITH CHECK (auth.uid() = remitente_id);

-- 8. Políticas de CALENDARIO y ANUNCIOS
CREATE POLICY "Events viewable by role" ON eventos_calendario FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol::text = ANY(visible_para))
);
CREATE POLICY "Announcements viewable by role" ON anuncios FOR SELECT USING (
    publicado = true AND EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol::text = ANY(destinatarios))
);

-- 9. Políticas de TUTORES_ALUMNOS y VÍNCULOS
CREATE POLICY "Tutors view children links" ON tutores_alumnos FOR SELECT USING (auth.uid() = tutor_id OR auth.uid() = alumno_id);
CREATE POLICY "Admins manage links" ON tutores_alumnos FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
);
