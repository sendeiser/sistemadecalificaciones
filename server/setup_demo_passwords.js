const { supabaseAdmin } = require('./config/supabaseClient');
require('dotenv').config();

async function setupDemoPasswords() {
    console.log('🔑 CONFIGURANDO CONTRASEÑAS UNIFICADAS DE DEMOSTRACIÓN...\n');

    try {
        const { data: profiles, error: pErr } = await supabaseAdmin.from('perfiles').select('id, nombre, email, rol');
        if (pErr) throw pErr;

        const demoPassword = '123456';
        let userCredentials = [];

        for (const p of profiles) {
            if (!p.email) continue;

            try {
                // Try updating password by User ID
                const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
                    p.id,
                    { password: demoPassword, email_confirm: true }
                );

                if (updateErr) {
                    // Try creating auth user with matching ID
                    await supabaseAdmin.auth.admin.createUser({
                        id: p.id,
                        email: p.email,
                        password: demoPassword,
                        email_confirm: true,
                        user_metadata: { nombre: p.nombre, rol: p.rol }
                    });
                }
            } catch (err) {
                // Ignore individual auth sync errors
            }

            userCredentials.push({
                Nombre: p.nombre,
                Email: p.email,
                Rol: p.rol.toUpperCase(),
                Contraseña: demoPassword
            });
        }

        console.log('================================================================================');
        console.log('                   📋 CREDENCIALES COMPLETAS PARA PRESENTACIÓN                  ');
        console.log('================================================================================\n');

        console.table(userCredentials);

    } catch (err) {
        console.error('❌ Error configurando credenciales:', err.message);
    }
}

setupDemoPasswords();
