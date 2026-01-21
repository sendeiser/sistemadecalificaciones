-- Add RLS policy for students to view their own grades
-- This allows students to SELECT from calificaciones table where alumno_id matches their auth.uid()

CREATE POLICY "Students view own grades" ON calificaciones FOR SELECT USING (
    alumno_id = auth.uid()
);
