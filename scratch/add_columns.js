const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });

async function runSql(sql) {
    const url = `${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    console.log('Trying to call RPC exec_sql...');
    let response = await fetch(url, {
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
        console.log('exec_sql failed:', text);
        
        console.log('Trying RPC pgquery...');
        const url2 = `${process.env.SUPABASE_URL}/rest/v1/rpc/pgquery`;
        response = await fetch(url2, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ query: sql })
        });
        
        if (!response.ok) {
            const text2 = await response.text();
            console.log('pgquery also failed:', text2);
            return false;
        }
    }
    console.log('SQL executed successfully!');
    return true;
}

async function main() {
    const sql = `
        ALTER TABLE public.materias 
        ADD COLUMN IF NOT EXISTS anio TEXT,
        ADD COLUMN IF NOT EXISTS descripcion TEXT,
        ADD COLUMN IF NOT EXISTS campo_formacion TEXT,
        ADD COLUMN IF NOT EXISTS ciclo TEXT;
    `;
    const success = await runSql(sql);
    if (success) {
        console.log('Table columns added. Checking current table row now...');
        const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));
        const { data, error } = await supabaseAdmin
            .from('materias')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error fetching row:', error.message);
        } else {
            console.log('Row after update:', data);
        }
    }
}

main().catch(console.error);
