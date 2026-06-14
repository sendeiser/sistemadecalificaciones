-- Habilitar RLS en ciclos_lectivos si no está habilitado
ALTER TABLE public.ciclos_lectivos ENABLE ROW LEVEL SECURITY;

-- Permitir lectura de ciclos_lectivos a todos los usuarios autenticados
DROP POLICY IF EXISTS "Ciclos lectivos visibles para todos" ON public.ciclos_lectivos;
CREATE POLICY "Ciclos lectivos visibles para todos" ON public.ciclos_lectivos
    FOR SELECT TO authenticated USING (true);

-- Permitir a admins y preceptores gestionar ciclos_lectivos
DROP POLICY IF EXISTS "Admins can manage ciclos_lectivos" ON public.ciclos_lectivos;
CREATE POLICY "Admins can manage ciclos_lectivos" ON public.ciclos_lectivos
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
    );

-- Permitir lectura de asignaciones a todos los usuarios autenticados (necesario para docentes, alumnos y tutores)
DROP POLICY IF EXISTS "Asignaciones visibles para todos" ON public.asignaciones;
CREATE POLICY "Asignaciones visibles para todos" ON public.asignaciones
    FOR SELECT TO authenticated USING (true);

-- Forzar recarga del caché de esquemas para PostgREST
SELECT pg_notify('pgrst', 'reload schema');
