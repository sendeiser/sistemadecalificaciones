const path = require('path');
const serverDir = path.join(__dirname, '..', '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { createClient } = require(path.join(serverDir, 'node_modules', '@supabase', 'supabase-js'));

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  const { data: { session } } = await supabase.auth.signInWithPassword({
    email: 'e2etest@cgb.edu.ar',
    password: 'Test123456!'
  });

  console.log('Testing calendar API...\n');

  // Test 1: All events
  let resp = await fetch('http://localhost:5000/api/calendar/events', {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });
  let data = await resp.json();
  console.log(`1. ALL events (no date filter): ${resp.status} - ${data.length} events`);
  data.forEach(e => console.log(`   - ${e.titulo} (${e.fecha_inicio.split('T')[0]}) [${e.tipo}]`));

  // Test 2: March 2026 (has events)
  resp = await fetch('http://localhost:5000/api/calendar/events?start_date=2026-03-01&end_date=2026-03-31', {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });
  data = await resp.json();
  console.log(`\n2. MARCH 2026: ${resp.status} - ${data.length} events`);
  data.forEach(e => console.log(`   - ${e.titulo} (${e.fecha_inicio.split('T')[0]})`));

  // Test 3: Create an event
  console.log('\n3. Creating a new event...');
  resp = await fetch('http://localhost:5000/api/calendar/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      titulo: 'Test Event from E2E',
      descripcion: 'Created by test script',
      fecha_inicio: '2026-06-15',
      fecha_fin: '2026-06-15',
      tipo: 'academico',
      color: '#0ea5e9',
      todo_el_dia: true
    })
  });
  data = await resp.json();
  console.log(`   Status: ${resp.status}`);
  console.log(`   Created: ${JSON.stringify(data, null, 2).substring(0, 300)}`);

  // Test 4: Verify event appears
  resp = await fetch('http://localhost:5000/api/calendar/events?start_date=2026-06-01&end_date=2026-06-30', {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });
  data = await resp.json();
  console.log(`\n4. JUNE 2026 after create: ${resp.status} - ${data.length} events`);
  data.forEach(e => console.log(`   - ${e.titulo} (${e.fecha_inicio.split('T')[0]})`));
}

main().catch(console.error);
