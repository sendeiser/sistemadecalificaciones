-- Fix RLS Policies for Reporting and General Access
-- Run this in your Supabase SQL Editor to ensure all tables are accessible.

-- 1. Divisiones: Allow all users to see divisions
DROP POLICY IF EXISTS "Public view divisions" ON divisiones;
CREATE POLICY "Public view divisions" ON divisiones FOR SELECT USING (true);

-- 2. Materias: Allow all users to see subjects
DROP POLICY IF EXISTS "Public view materias" ON materias;
CREATE POLICY "Public view materias" ON materias FOR SELECT USING (true);

-- 3. Asignaciones: Allow admins and assigned teachers to see links
DROP POLICY IF EXISTS "Admins and Teachers view assignments" ON asignaciones;
CREATE POLICY "Admins and Teachers view assignments" ON asignaciones FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
    OR docente_id = auth.uid()
);

-- 4. Estudiantes Divisiones: Allow all to see who belongs where
DROP POLICY IF EXISTS "Public view enrollment" ON estudiantes_divisiones;
CREATE POLICY "Public view enrollment" ON estudiantes_divisiones FOR SELECT USING (true);

-- 5. Perfiles: Fix public access if needed
DROP POLICY IF EXISTS "Public profiles" ON perfiles;
CREATE POLICY "Public profiles" ON perfiles FOR SELECT USING (true);
