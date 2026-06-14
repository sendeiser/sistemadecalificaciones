const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));

async function inspectData() {
    try {
        console.log('Fetching divisions...');
        const { data: divisions, error: divError } = await supabaseAdmin
            .from('divisiones')
            .select('*');
        if (divError) throw divError;
        console.log('Divisions found:', divisions);

        console.log('\nFetching subjects...');
        const { data: subjects, error: subError } = await supabaseAdmin
            .from('materias')
            .select('*');
        if (subError) throw subError;
        console.log('Subjects found (first 10):', subjects.slice(0, 10));
        console.log('Total subjects count:', subjects.length);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

inspectData();
