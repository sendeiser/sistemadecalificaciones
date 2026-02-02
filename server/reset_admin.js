const { supabaseAdmin } = require('./config/supabaseClient');
require('dotenv').config();

async function resetPassword() {
    try {
        const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();
        if (fetchError) throw fetchError;

        const user = users.users.find(u => u.email === 'martinchox33@gmail.com');
        if (!user) throw new Error('User not found');

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: 'admin123' }
        );

        if (updateError) throw updateError;

        console.log('--- PASSWORD RESET SUCCESSFUL ---');
        console.log('Email: martinchox33@gmail.com');
        console.log('New Password: admin123');

    } catch (err) {
        console.error('Error:', err.message);
    }
}

resetPassword();
