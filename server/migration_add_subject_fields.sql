-- Add campo_formacion and ciclo columns to materias table
-- This allows subjects to be categorized by educational field and cycle

ALTER TABLE materias 
ADD COLUMN campo_formacion TEXT,
ADD COLUMN ciclo TEXT;
