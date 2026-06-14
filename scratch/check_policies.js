const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
const { Client } = require(path.join(serverDir, 'node_modules', 'pg'));
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });

async function check() {
    const connStr = process.env.DATABASE_URL;
    if (!connStr) {
        console.error('DATABASE_URL is not set in env');
        return;
    }
    const client = new Client({ connectionString: connStr });
    await client.connect();
    try {
        const res = await client.query(`
            SELECT tablename, policyname, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE schemaname = 'public' 
              AND tablename IN ('ciclos_lectivos', 'divisiones', 'asignaciones', 'materias')
        `);
        console.log('=== POLICIES ===');
        res.rows.forEach(r => {
            console.log(`Table: ${r.tablename} | Policy: ${r.policyname} | Cmd: ${r.cmd} | Roles: ${r.roles}`);
        });
    } finally {
        await client.end();
    }
}
check().catch(console.error);
