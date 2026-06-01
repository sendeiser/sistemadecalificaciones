const path = require('path');
const serverDir = path.join(__dirname, '..', '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { createClient } = require(path.join(serverDir, 'node_modules', '@supabase', 'supabase-js'));

const sa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Check eventos table
  console.log('1. Checking eventos table...');
  const { data: events, error: evErr } = await sa.from('eventos').select('*').limit(5);
  if (evErr) {
    console.log('   ERROR:', evErr.code, '-', evErr.message);
    
    // Check eventos_calendario table
    console.log('\n2. Checking eventos_calendario table...');
    const { data: evCal, error: ecErr } = await sa.from('eventos_calendario').select('*').limit(5);
    if (ecErr) {
      console.log('   ERROR:', ecErr.code, '-', ecErr.message);
    } else {
      console.log('   FOUND! Events:', evCal?.length || 0);
      console.log(JSON.stringify(evCal, null, 2));
    }
  } else {
    console.log('   EXISTE! Events:', events?.length || 0);
    console.log(JSON.stringify(events, null, 2));
  }

  // List available tables
  console.log('\n3. Available calendar-related tables:');
  const { data: tables, error: tblErr } = await sa.rpc('exec_sql', {
    sql: "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%calendar%' OR table_name LIKE '%evento%' OR table_name LIKE '%calend%')"
  });
  if (tblErr) {
    console.log('   Cannot list tables (RPC not available)');
  } else {
    console.log('   Tables:', tables);
  }
}

main().catch(console.error);
