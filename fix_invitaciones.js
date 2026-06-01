const path = require('path');
const serverDir = path.join(__dirname, 'server');
const dotenv = require(path.join(serverDir, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(serverDir, '.env') });
const { createClient } = require(path.join(serverDir, 'node_modules', '@supabase', 'supabase-js'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Step 1: Check if the table exists in information_schema via REST
  console.log('1. Checking if invitaciones table exists...');
  
  // Try to query the table
  const { error: queryError } = await supabase.from('invitaciones').select('*').limit(1);
  if (queryError) {
    console.log('   Table NOT accessible:', queryError.message);
  } else {
    console.log('   Table exists and accessible!');
    process.exit(0);
  }

  // Step 2: Create the table using Supabase Management API
  // We'll use the pg_dump endpoint or raw SQL via the Supabase project's management API
  console.log('2. Creating invitaciones table via Supabase SQL...');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS public.invitaciones (
      token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rol VARCHAR(50) NOT NULL CHECK (rol IN ('docente', 'preceptor', 'admin', 'tutor')),
      email VARCHAR(255),
      usado BOOLEAN DEFAULT false,
      creado_por UUID REFERENCES public.perfiles(id),
      expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitaciones;
    CREATE POLICY "Admins can manage invitations"
      ON public.invitaciones USING (
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin', 'preceptor'))
      );
  `;

  // Try multiple RPC endpoints
  for (const rpcName of ['exec_sql', 'pgquery', 'sql']) {
    console.log(`   Trying rpc.${rpcName}...`);
    const { error: rpcError } = await supabase.rpc(rpcName, { query: sql, sql });
    if (rpcError) {
      console.log(`   ${rpcName} failed: ${rpcError.message}`);
    } else {
      console.log(`   Success via ${rpcName}!`);
      
      // Verify
      const { error: vErr } = await supabase.from('invitaciones').select('*').limit(1);
      if (!vErr) {
        console.log('   Table created and verified!');
        process.exit(0);
      }
    }
  }

  // Step 3: If all RPCs fail, try via direct HTTP with service key
  console.log('\n3. Trying direct HTTP API...');
  const url = `${process.env.SUPABASE_URL}/rest/v1/`;
  const headers = {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'params=single-object'
  };

  // Try creating via introspection (some Supabase projects allow CREATE TABLE via REST)
  const createResp = await fetch(url + 'rpc/pgquery', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql.replace(/\n/g, ' ') })
  });

  if (createResp.ok) {
    console.log('   Table created via HTTP RPC!');
    process.exit(0);
  }

  const errText = await createResp.text();
  console.log(`   HTTP RPC failed: ${createResp.status} ${errText.substring(0, 200)}`);

  // Step 4: Provide SQL to run manually
  console.log('\n⚠️  EJECUTA ESTE SQL EN SUPABASE SQL EDITOR:\n');
  console.log('='.repeat(60));
  console.log(sql);
  console.log('='.repeat(60));
  console.log('\n3. Luego ejecuta:');
  console.log(`   NOTIFY pgrst, 'reload schema';`);
  console.log('\n   O en Dashboard > SQL > Ejecuta el SQL de arriba y luego:');
  console.log('   SELECT reload_schema_cache();');
}

main().catch(console.error);
