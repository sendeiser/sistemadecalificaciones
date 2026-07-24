const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== PRUEBA DE CONEXIÓN A SUPABASE ===');
console.log('URL:', supabaseUrl);
console.log('');

async function test() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const adminClient = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    : supabase;

  console.log('--- Perfiles (admin) ---');
  const { data: perfiles, error: e1 } = await adminClient.from('perfiles').select('*').limit(10);
  if (e1) { console.log('ERROR:', e1.message); } else {
    console.log('OK -', perfiles.length, 'usuarios:');
    perfiles.forEach(p => console.log('  [' + p.rol + ']', p.nombre, '-', p.email));
  }

  console.log('\n--- Divisiones ---');
  const { data: divs, error: e2 } = await adminClient.from('divisiones').select('*');
  if (e2) { console.log('ERROR:', e2.message); } else {
    console.log('OK -', divs.length, 'divisiones');
    divs.forEach(d => console.log('  ', d.anio, d.seccion));
  }

  console.log('\n--- Materias ---');
  const { data: mats, error: e3 } = await adminClient.from('materias').select('*');
  if (e3) { console.log('ERROR:', e3.message); } else {
    console.log('OK -', mats.length, 'materias');
    mats.forEach(m => console.log('  -', m.nombre));
  }

  const tables = ['eventos_calendario', 'mensajes', 'calificaciones', 'asistencias_preceptor', 'asignaciones', 'anuncios'];
  for (const table of tables) {
    console.log('\n--- ' + table + ' ---');
    const { data, error } = await adminClient.from(table).select('*').limit(3);
    if (error) {
      console.log('ERROR:', error.message);
    } else {
      console.log('OK -', data.length, 'registros');
    }
  }

  console.log('\n=== PRUEBAS COMPLETADAS ===');
}

test().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
