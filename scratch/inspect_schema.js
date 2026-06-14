const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));

async function inspect() {
    // Check divisiones columns
    const { data: div, error: divErr } = await supabaseAdmin.from('divisiones').select('*').limit(2);
    console.log('divisiones sample:', JSON.stringify(div));
    if (divErr) console.log('divisiones error:', divErr.message);

    // Check ciclos_lectivos
    const { data: cl, error: clErr } = await supabaseAdmin.from('ciclos_lectivos').select('*').limit(2);
    console.log('ciclos_lectivos sample:', JSON.stringify(cl));
    if (clErr) console.log('ciclos_lectivos error:', clErr.message);

    // Check materias
    const { data: mat, error: matErr } = await supabaseAdmin.from('materias').select('*').limit(2);
    console.log('materias sample:', JSON.stringify(mat));
    if (matErr) console.log('materias error:', matErr.message);
}
inspect().catch(e => console.error(e.message));
