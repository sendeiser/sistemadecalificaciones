-- 1. ASIGNACIONES: Allow tutors to see assignments for divisions where their children are enrolled
DROP POLICY IF EXISTS "Tutors view assignments for their children" ON public.asignaciones;
CREATE POLICY "Tutors view assignments for their children" ON public.asignaciones
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tutores_alumnos ta
        JOIN public.estudiantes_divisiones ed ON ed.alumno_id = ta.alumno_id
        WHERE ta.tutor_id = auth.uid()
        AND ed.division_id = asignaciones.division_id
    )
);

-- 2. CALIFICACIONES: Allow tutors to see grades for their linked students
DROP POLICY IF EXISTS "Tutors view grades for their children" ON public.calificaciones;
CREATE POLICY "Tutors view grades for their children" ON public.calificaciones
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tutores_alumnos ta
        WHERE ta.tutor_id = auth.uid()
        AND ta.alumno_id = calificaciones.alumno_id
    )
);

-- 3. ASISTENCIAS PRECEPTOR: Allow tutors to see attendance for their linked students
DROP POLICY IF EXISTS "Tutors view attendance for their children" ON public.asistencias_preceptor;
CREATE POLICY "Tutors view attendance for their children" ON public.asistencias_preceptor
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tutores_alumnos ta
        WHERE ta.tutor_id = auth.uid()
        AND ta.alumno_id = asistencias_preceptor.estudiante_id
    )
);

-- 4. AI DIAGNOSTICS: Allow tutors to see diagnostics for their children
DROP POLICY IF EXISTS "Tutors view diagnostics for their children" ON public.ai_diagnostics;
CREATE POLICY "Tutors view diagnostics for their children" ON public.ai_diagnostics
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tutores_alumnos ta
        WHERE ta.tutor_id = auth.uid()
        AND ta.alumno_id = ai_diagnostics.alumno_id
    )
);

-- 5. PERFILES LOGROS: Allow tutors to see medals for their children
DROP POLICY IF EXISTS "Tutors view medals for their children" ON public.perfiles_logros;
CREATE POLICY "Tutors view medals for their children" ON public.perfiles_logros
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tutores_alumnos ta
        WHERE ta.tutor_id = auth.uid()
        AND ta.alumno_id = perfiles_logros.perfil_id
    )
);
