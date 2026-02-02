const { supabaseAdmin } = require('./config/supabaseClient');
require('dotenv').config();

async function getTestUsers() {
    try {
        const { data: profiles, error } = await supabaseAdmin
            .from('perfiles')
            .select('id, nombre, rol, email')
            .limit(10);

        if (error) throw error;

        console.log('--- TEST USERS ---');
        console.log(JSON.stringify(profiles, null, 2));

        const admin = profiles.find(p => p.rol === 'admin');
        const teacher = profiles.find(p => p.rol === 'docente');

        console.log('\n--- IDENTIFIED ---');
        console.log('Admin:', admin ? admin.email : 'None found');
        console.log('Teacher:', teacher ? teacher.email : 'None found');

    } catch (err) {
        console.error('Error:', err.message);
    }
}

getTestUsers();
