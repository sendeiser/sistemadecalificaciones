-- DIAGNOSTIC SCRIPT: Check RLS policies and student data access
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if RLS is enabled on calificaciones table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'calificaciones';

-- 2. List ALL policies on calificaciones table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'calificaciones';

-- 3. Check if the student policy exists
SELECT policyname
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'calificaciones' 
  AND policyname = 'Students view own grades';

-- 4. Sample query to test student access (replace with actual student auth.uid())
-- This simulates what a student would see
-- SELECT * FROM calificaciones WHERE alumno_id = auth.uid();

-- ============================================
-- IF THE POLICY DOESN'T EXIST, RUN THIS:
-- ============================================

-- Drop the policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Students view own grades" ON calificaciones;

-- Create the policy
CREATE POLICY "Students view own grades" ON calificaciones 
FOR SELECT 
USING (alumno_id = auth.uid());

-- Verify it was created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'calificaciones' 
  AND policyname = 'Students view own grades';
