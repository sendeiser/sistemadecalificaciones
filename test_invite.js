const path = require('path');
const serverDir = path.join(__dirname, 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { createClient } = require(path.join(serverDir, 'node_modules', '@supabase', 'supabase-js'));

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Get table structure info
  console.log('=== Table Structure ===');
  
  // Try direct insert with known IDs to test
  const { data: profiles } = await supabaseAdmin.from('perfiles').select('id').eq('rol', 'admin').limit(1);
  
  if (profiles && profiles[0]) {
    console.log('Admin profile ID:', profiles[0].id);
    console.log('Testing insert into invitaciones...');
    
    const { data: ins, error: insErr } = await supabaseAdmin
      .from('invitaciones')
      .insert({ rol: 'docente', email: 'test@test.com', creado_por: profiles[0].id })
      .select()
      .single();

    if (insErr) {
      console.log('\nINSERT ERROR:', insErr.message);
      console.log('Code:', insErr.code);
      console.log('Details:', insErr.details);
      console.log('Hint:', insErr.hint);
    } else {
      console.log('Insert OK:', ins.token);
      // Clean up test record
      await supabaseAdmin.from('invitaciones').delete().eq('token', ins.token);
    }
  }

  // Get auth user list
  console.log('\n=== Auth Users ===');
  const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.log('Error listing users:', listErr.message);
  } else if (users) {
    for (const u of users) {
      const p = profiles?.find(p => p.id === u.id);
      console.log(`${u.email} - Auth ID: ${u.id} - Profile match: ${p ? 'YES' : 'NO'}`);
    }
  }
}

main().catch(console.error);
