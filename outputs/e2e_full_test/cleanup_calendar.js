const path = require('path');
const serverDir = path.join(__dirname, '..', '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { createClient } = require(path.join(serverDir, 'node_modules', '@supabase', 'supabase-js'));

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Find and delete test events created by e2etest
  const { data: events } = await supabase
    .from('eventos')
    .select('id, titulo, creador_id')
    .eq('titulo', 'Test Event from E2E');
  
  if (!events || events.length === 0) {
    console.log('No test events to clean up.');
    return;
  }
  
  for (const ev of events) {
    const { error } = await supabase.from('eventos').delete().eq('id', ev.id);
    if (error) {
      console.log(`Error deleting ${ev.id}:`, error.message);
    } else {
      console.log(`Deleted: ${ev.titulo} (${ev.id})`);
    }
  }
}

main().catch(console.error);
