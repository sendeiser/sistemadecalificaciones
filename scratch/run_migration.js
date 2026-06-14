/**
 * Ejecuta DDL directamente via Supabase REST API usando el service role key
 */
const https = require('https');

const SUPABASE_URL = 'https://lezpbmuqbvlahrjluhoe.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlenBibXVxYnZsYWhyamx1aG9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ4NjYwMiwiZXhwIjoyMDk1MDYyNjAyfQ.BJ7f0-mwr9rAJMFb2B7LElQH69JcMy4cih09jCvWPMc';

function runSQL(sql) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

        // Use pg REST endpoint directly
        const options = {
            hostname: 'lezpbmuqbvlahrjluhoe.supabase.co',
            path: '/rest/v1/rpc/exec_sql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ ok: true, data });
                } else {
                    resolve({ ok: false, status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// Use Supabase Management API to execute SQL
function runSQLViaManagement(sql) {
    return new Promise((resolve, reject) => {
        const projectRef = 'lezpbmuqbvlahrjluhoe';
        const body = JSON.stringify({ query: sql });

        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${projectRef}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const sqlStatements = [
    ['Agregar cuatrimestre', `ALTER TABLE public.calificaciones ADD COLUMN IF NOT EXISTS cuatrimestre SMALLINT DEFAULT 1 CHECK (cuatrimestre IN (1, 2))`],
    ['Agregar logro_parcial', `ALTER TABLE public.calificaciones ADD COLUMN IF NOT EXISTS logro_parcial TEXT`],
    ['Agregar logro_intensificacion', `ALTER TABLE public.calificaciones ADD COLUMN IF NOT EXISTS logro_intensificacion TEXT`],
    ['Agregar logro_trayecto', `ALTER TABLE public.calificaciones ADD COLUMN IF NOT EXISTS logro_trayecto TEXT`],
    ['Agregar promedio_cuatrimestre', `ALTER TABLE public.calificaciones ADD COLUMN IF NOT EXISTS promedio_cuatrimestre NUMERIC(4,2)`],
    ['Set cuatrimestre = 1 en existentes', `UPDATE public.calificaciones SET cuatrimestre = 1 WHERE cuatrimestre IS NULL`],
    ['Drop constraint vieja', `ALTER TABLE public.calificaciones DROP CONSTRAINT IF EXISTS calificaciones_alumno_id_asignacion_id_key`],
    ['Drop constraint duplicada', `ALTER TABLE public.calificaciones DROP CONSTRAINT IF EXISTS calificaciones_alumno_asignacion_cuatrimestre_key`],
    ['Nueva UNIQUE con cuatrimestre', `ALTER TABLE public.calificaciones ADD CONSTRAINT calificaciones_alumno_asignacion_cuatrimestre_key UNIQUE (alumno_id, asignacion_id, cuatrimestre)`],
    ['Drop policy grades vieja', `DROP POLICY IF EXISTS "Docentes and Admins manage grades" ON public.calificaciones`],
    ['Crear policy grades completa', `CREATE POLICY "Docentes and Admins manage grades" ON public.calificaciones FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor')) OR EXISTS (SELECT 1 FROM public.asignaciones a WHERE a.id = calificaciones.asignacion_id AND a.docente_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor')) OR EXISTS (SELECT 1 FROM public.asignaciones a WHERE a.id = calificaciones.asignacion_id AND a.docente_id = auth.uid()))`],
    ['Crear document_validations', `CREATE TABLE IF NOT EXISTS public.document_validations (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), validation_hash TEXT UNIQUE NOT NULL, document_type TEXT NOT NULL, metadata JSONB DEFAULT '{}', created_by UUID REFERENCES public.perfiles(id), created_at TIMESTAMP DEFAULT NOW())`],
    ['RLS document_validations', `ALTER TABLE public.document_validations ENABLE ROW LEVEL SECURITY`],
    ['Policy SELECT validaciones', `CREATE POLICY "Anyone can verify documents" ON public.document_validations FOR SELECT USING (true)`],
    ['Policy INSERT validaciones', `CREATE POLICY "Admins and teachers create validations" ON public.document_validations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor', 'docente')))`],
];

async function run() {
    console.log('\n🔧 EJECUTANDO MIGRACIÓN via Management API...\n');

    for (const [name, sql] of sqlStatements) {
        const result = await runSQLViaManagement(sql);
        if (result.status === 200 || result.status === 201) {
            console.log(`  ✅ ${name}`);
        } else {
            const parsed = JSON.parse(result.data || '{}');
            const msg = parsed.message || parsed.error || result.data;
            if (msg && (msg.includes('already exists') || msg.includes('does not exist'))) {
                console.log(`  ⚠️  ${name} (ya aplicado)`);
            } else {
                console.log(`  ❌ ${name} [${result.status}]: ${msg}`);
            }
        }
    }

    console.log('\n✅ Proceso terminado.');
}

run().catch(e => console.error('Fatal:', e.message));
