const { supabaseAdmin } = require('./config/supabaseClient');
require('dotenv').config();

async function verifyAuditLog() {
    try {
        const { data: logs, error } = await supabaseAdmin
            .from('auditoria_notas')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(1);

        if (error) throw error;

        console.log('--- RECENT AUDIT LOG (RAW) ---');
        console.log(JSON.stringify(logs, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

verifyAuditLog();
