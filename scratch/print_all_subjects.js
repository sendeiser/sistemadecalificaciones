const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));

async function inspectData() {
    try {
        const { data: subjects, error: subError } = await supabaseAdmin
            .from('materias')
            .select('id, nombre, orientacion, area');
        if (subError) throw subError;
        console.log(JSON.stringify(subjects, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

inspectData();
