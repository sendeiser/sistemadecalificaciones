const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));

const TABLES = [
    'perfiles',
    'divisiones',
    'materias',
    'asignaciones',
    'estudiantes_divisiones',
    'calificaciones',
    'tutores_alumnos',
    'asistencias',
    'asistencias_preceptor',
    'mensajes',
    'eventos_calendario',
    'anuncios',
    'invitaciones',
];

async function checkAllTables() {
    console.log('=== Verificación de tablas en Supabase ===\n');
    const results = { ok: [], missing: [] };

    for (const table of TABLES) {
        try {
            const { data, error } = await supabaseAdmin
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                results.missing.push({ table, error: error.message });
                console.log(`❌ ${table.padEnd(30)} ERROR: ${error.message}`);
            } else {
                results.ok.push(table);
                console.log(`✅ ${table.padEnd(30)} OK (${data.length} rows fetched)`);
            }
        } catch (err) {
            results.missing.push({ table, error: err.message });
            console.log(`❌ ${table.padEnd(30)} EXCEPTION: ${err.message}`);
        }
    }

    console.log('\n=== Resumen ===');
    console.log(`✅ Tablas OK:      ${results.ok.length}/${TABLES.length}`);
    if (results.missing.length > 0) {
        console.log(`❌ Tablas faltantes: ${results.missing.length}`);
        results.missing.forEach(r => console.log(`   - ${r.table}: ${r.error}`));
    } else {
        console.log('🎉 Todas las tablas están disponibles!');
    }
}

checkAllTables();
