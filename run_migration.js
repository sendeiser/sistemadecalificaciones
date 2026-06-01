const path = require('path');
const serverDir = path.join(__dirname, 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { createClient } = require(path.join(serverDir, 'node_modules', '@supabase', 'supabase-js'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('Verificando tabla invitaciones...');
  const { error } = await supabase.from('invitaciones').select('count', { count: 'exact', head: true });

  if (error && error.code === '42P01') {
    console.log('Tabla no existe. Intentando crear via REST...');
    
    // Use Supabase Management API to run SQL
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
    
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const text = await response.text();
      console.log('exec_sql falló, probando pgquery...');
      
      const resp2 = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/pgquery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!resp2.ok) {
        const text2 = await resp2.text();
        console.log('No se pudo crear via RPC.');
        console.log('\nEJECUTA ESTE SQL EN EL SQL EDITOR DE SUPABASE:\n');
        console.log(sql);
        process.exit(1);
      }
      console.log('Tabla creada via pgquery!');
    } else {
      console.log('Tabla creada via exec_sql!');
    }
  } else if (error) {
    console.log('Error:', error.message);
    process.exit(1);
  } else {
    console.log('Tabla invitaciones ya existe!');
  }
}

main().catch(console.error);
