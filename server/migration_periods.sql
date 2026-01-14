-- Create table for Grading Periods
CREATE TABLE IF NOT EXISTS periodos_calificacion (
    clave TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    abierto BOOLEAN DEFAULT true 
);

-- Enable RLS
ALTER TABLE periodos_calificacion ENABLE ROW LEVEL SECURITY;

-- Policies: Only Admins can update, everyone can read
CREATE POLICY "Admins manage periods" ON periodos_calificacion FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Everyone reads periods" ON periodos_calificacion FOR SELECT USING (true);

-- Insert default periods
INSERT INTO periodos_calificacion (clave, nombre, abierto) VALUES
('parcial_1', 'Parcial 1', true),
('parcial_2', 'Parcial 2', true),
('parcial_3', 'Parcial 3', true),
('parcial_4', 'Parcial 4', true),
('nota_intensificacion', 'Intensificación', true),
('promedio_cuatrimestre', 'Cierre Cuatrimestre', true)
ON CONFLICT (clave) DO NOTHING;

-- Trigger Function to validate updates based on active periods
CREATE OR REPLACE FUNCTION check_grading_period() RETURNS TRIGGER AS $$
DECLARE
    p_status BOOLEAN;
BEGIN
    -- Check Parcial 1
    IF NEW.parcial_1 IS DISTINCT FROM OLD.parcial_1 THEN
        SELECT abierto INTO p_status FROM periodos_calificacion WHERE clave = 'parcial_1';
        IF p_status = false THEN RAISE EXCEPTION 'El periodo para Parcial 1 está cerrado.'; END IF;
    END IF;

    -- Check Parcial 2
    IF NEW.parcial_2 IS DISTINCT FROM OLD.parcial_2 THEN
        SELECT abierto INTO p_status FROM periodos_calificacion WHERE clave = 'parcial_2';
        IF p_status = false THEN RAISE EXCEPTION 'El periodo para Parcial 2 está cerrado.'; END IF;
    END IF;

    -- Check Parcial 3
    IF NEW.parcial_3 IS DISTINCT FROM OLD.parcial_3 THEN
        SELECT abierto INTO p_status FROM periodos_calificacion WHERE clave = 'parcial_3';
        IF p_status = false THEN RAISE EXCEPTION 'El periodo para Parcial 3 está cerrado.'; END IF;
    END IF;

    -- Check Parcial 4
    IF NEW.parcial_4 IS DISTINCT FROM OLD.parcial_4 THEN
        SELECT abierto INTO p_status FROM periodos_calificacion WHERE clave = 'parcial_4';
        IF p_status = false THEN RAISE EXCEPTION 'El periodo para Parcial 4 está cerrado.'; END IF;
    END IF;

    -- Check Intensificacion
    IF NEW.nota_intensificacion IS DISTINCT FROM OLD.nota_intensificacion THEN
        SELECT abierto INTO p_status FROM periodos_calificacion WHERE clave = 'nota_intensificacion';
        IF p_status = false THEN RAISE EXCEPTION 'El periodo de Intensificación está cerrado.'; END IF;
    END IF;
    
    -- Check Promedio Cuatrimestre (if editable manually)
    IF NEW.promedio_cuatrimestre IS DISTINCT FROM OLD.promedio_cuatrimestre THEN
        SELECT abierto INTO p_status FROM periodos_calificacion WHERE clave = 'promedio_cuatrimestre';
        IF p_status = false THEN RAISE EXCEPTION 'El cierre de Cuatrimestre está finalizado.'; END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach Trigger to calificaciones
DROP TRIGGER IF EXISTS trigger_check_grading_period_update ON calificaciones;

CREATE TRIGGER trigger_check_grading_period_update
BEFORE UPDATE ON calificaciones
FOR EACH ROW EXECUTE FUNCTION check_grading_period();
