-- Fix: Allow students to view assignments for their division
-- This is needed so students can see their subjects in the bulletin

DROP POLICY IF EXISTS "Students view assignments in their division" ON asignaciones;

CREATE POLICY "Students view assignments in their division" ON asignaciones 
FOR SELECT 
USING (
    -- Allow if user is a student enrolled in this division
    EXISTS (
        SELECT 1 
        FROM estudiantes_divisiones ed
        WHERE ed.division_id = asignaciones.division_id
        AND ed.alumno_id = auth.uid()
    )
);
