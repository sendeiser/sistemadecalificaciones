-- ==============================================================
-- PASO 1: Replica Identity FULL para la tabla mensajes
-- Esto permite que realtime envíe el payload completo de la fila
-- en eventos INSERT/UPDATE/DELETE.
-- ==============================================================
ALTER TABLE public.mensajes REPLICA IDENTITY FULL;

-- ==============================================================
-- PASO 2: Verificar que la tabla está en la publicación
-- (Si ya lo corriste antes, este paso no hace nada de más)
-- ==============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'mensajes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
        RAISE NOTICE 'Tabla mensajes AGREGADA a supabase_realtime';
    ELSE
        RAISE NOTICE 'Tabla mensajes ya estaba en supabase_realtime ✓';
    END IF;
END $$;

-- ==============================================================
-- PASO 3: Verificar configuración (para diagnóstico)
-- ==============================================================
SELECT
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE tablename = 'mensajes';
