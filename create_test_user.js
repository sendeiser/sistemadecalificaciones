const path = require('path');
const serverDir = path.join(__dirname, 'server');
const dotenv = require(path.join(serverDir, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(serverDir, '.env') });
const { createClient } = require(path.join(serverDir, 'node_modules', '@supabase', 'supabase-js'));

const TEST_EMAIL = 'e2etest@cgb.edu.ar';
const TEST_PASS = 'Test123456!';

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from('perfiles')
    .select('id, email')
    .eq('email', TEST_EMAIL)
    .single();

  if (existing) {
    console.log('Test user already exists:', existing.id);
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASS
    });
    if (session) {
      console.log('Session OK:', session.access_token.substring(0, 20) + '...');
      process.exit(0);
    }
  }

  // Create auth user
  console.log('Creating test user...');
  const { data: { user }, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASS,
    email_confirm: true,
    user_metadata: { nombre: 'E2E Test Admin', dni: '99999999' }
  });

  if (createErr) {
    console.error('Create user error:', createErr.message);
    process.exit(1);
  }

  console.log('Auth user created:', user.id);

  // Insert profile (try/catch for FK issues)
  const { error: profErr } = await supabaseAdmin
    .from('perfiles')
    .insert({
      id: user.id,
      nombre: 'E2E Test Admin',
      rol: 'admin',
      email: TEST_EMAIL,
      dni: '99999999'
    });

  if (profErr) {
    console.error('Profile insert error:', profErr.message);
    process.exit(1);
  }

  console.log('Profile created!');

  // Verify login
  const { data: { session } } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASS
  });

  if (session) {
    console.log('Login OK, token obtained!');
    process.exit(0);
  } else {
    console.error('Login failed after creation');
    process.exit(1);
  }
}

main().catch(console.error);
