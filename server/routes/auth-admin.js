const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// Validar si el usuario es Admin o Preceptor
const requireAdmin = async (req, res, next) => {
    try {
        const clientToUse = supabaseAdmin || supabase;
        const { data: profile } = await clientToUse
            .from('perfiles')
            .select('rol')
            .eq('id', req.user.id)
            .maybeSingle();

        const userRole = profile?.rol || req.user?.user_metadata?.rol || (req.user?.email === 'admin@cgb.edu.ar' ? 'admin' : null);

        if (userRole === 'admin' || userRole === 'preceptor') {
            req.userRole = userRole;
            return next();
        }

        return res.status(403).json({ error: 'Se requieren permisos de administrador' });
    } catch (err) {
        console.error('Admin check error:', err);
        return res.status(500).json({ error: 'Error al verificar permisos' });
    }
};

// Generar nueva invitación (Solo Admin/Preceptor)
router.post('/admin/invite', authMiddleware, requireAdmin, async (req, res) => {
    const { rol, email } = req.body;

    if (!rol || !['docente', 'preceptor', 'admin', 'tutor'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('invitaciones')
            .insert({
                rol,
                email: email || null,
                creado_por: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Generar Link (Frontend URL)
        // Adjust for production URL later if needed
        const clientUrl = req.headers.origin || 'http://localhost:5173';
        const inviteLink = `${clientUrl}/register?token=${data.token}`;

        // 3. Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'invitacion',
            data.id,
            'CREATE',
            null,
            data
        );

        res.json({ success: true, invitation: data, link: inviteLink });

    } catch (err) {
        console.error('Invite error:', err);
        res.status(500).json({ error: 'Error al crear la invitación' });
    }
});

// Listar invitaciones recientes (Solo Admin/Preceptor)
router.get('/admin/invites', authMiddleware, requireAdmin, async (req, res) => {
    try {
        // 1. Fetch invitations plain
        const { data: invites, error } = await supabaseAdmin
            .from('invitaciones')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!invites || invites.length === 0) {
            return res.json([]);
        }

        // 2. Fetch creator profiles manually
        const creatorIds = [...new Set(invites.map(i => i.creado_por).filter(Boolean))];
        let creatorsMap = {};

        if (creatorIds.length > 0) {
            const { data: profiles, error: pError } = await supabaseAdmin
                .from('perfiles')
                .select('id, nombre')
                .in('id', creatorIds);

            if (!pError && profiles) {
                profiles.forEach(p => creatorsMap[p.id] = p);
            }
        }

        // 3. Attach creator info
        const result = invites.map(inv => ({
            ...inv,
            creador: creatorsMap[inv.creado_por] || { nombre: 'Sistema' }
        }));

        res.json(result);
    } catch (err) {
        console.error('List invites error:', err);
        res.status(500).json({ error: 'Error al listar invitaciones' });
    }
});

// Eliminar invitación (Solo Admin/Preceptor)
router.delete('/admin/invite/:token', authMiddleware, requireAdmin, async (req, res) => {
    const { token } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from('invitaciones')
            .delete()
            .eq('token', token);

        if (error) throw error;

        // Log Audit (Using token as entityId since we deleted the record)
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'invitacion',
            token,
            'DELETE',
            { token },
            null
        );

        res.json({ success: true, message: 'Invitación eliminada' });
    } catch (err) {
        console.error('Delete invite error:', err);
        res.status(500).json({ error: 'Error al eliminar la invitación' });
    }
});

// Actualizar email de invitación (Solo Admin/Preceptor)
router.patch('/admin/invite/:token', authMiddleware, requireAdmin, async (req, res) => {
    const { token } = req.params;
    const { email } = req.body;

    try {
        const { error } = await supabaseAdmin
            .from('invitaciones')
            .update({ email: email || null })
            .eq('token', token);

        if (error) throw error;

        res.json({ success: true, message: 'Invitación actualizada' });
    } catch (err) {
        console.error('Update invite error:', err);
        res.status(500).json({ error: 'Error al actualizar la invitación' });
    }
});

// Validar Token (Público)
router.get('/invite/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const { data, error } = await supabaseAdmin
            .from('invitaciones')
            .select('rol, email, usado, expires_at')
            .eq('token', token)
            .single();

        if (error || !data) {
            return res.status(404).json({ valid: false, error: 'Token inválido' });
        }

        if (data.usado) {
            return res.status(400).json({ valid: false, error: 'Este token ya fue utilizado' });
        }

        const now = new Date();
        const expires = new Date(data.expires_at);

        if (now > expires) {
            return res.status(400).json({ valid: false, error: 'El token ha expirado' });
        }

        res.json({ valid: true, rol: data.rol, email: data.email });

    } catch (err) {
        console.error('Validation error:', err);
        res.status(500).json({ error: 'Error al validar token' });
    }
});

// Registro de usuario vía Invitación (Bypass public signUp)
router.post('/register-invite', async (req, res) => {
    const { email, password, nombre, dni, token } = req.body;

    if (!token || !email || !password) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
        // 1. Validar Token manuálmente (Double check)
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('invitaciones')
            .select('*')
            .eq('token', token)
            .single();

        if (inviteError || !invite) return res.status(400).json({ error: 'Invitación inválida' });
        if (invite.usado) return res.status(400).json({ error: 'Invitación ya utilizada' });
        if (new Date(invite.expires_at) < new Date()) return res.status(400).json({ error: 'Invitación expirada' });
        if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
            return res.status(400).json({ error: 'El email no coincide con la invitación' });
        }

        // 2. Crear Usuario Auth usando Admin Client (Privileged)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm
            user_metadata: {
                nombre,
                dni,
                token // Pass token so trigger validates and assigns role
            }
        });

        if (authError) throw authError;

        // 2b. Garantizar creación de Perfil en la DB (por si el Trigger de la DB no se ejecutó)
        const { error: profileError } = await supabaseAdmin
            .from('perfiles')
            .upsert({
                id: authData.user.id,
                nombre: nombre || 'Nuevo Usuario',
                dni: dni || '',
                rol: invite.rol || 'alumno',
                email: email
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('⚠️ [register-invite] Warning inserting profile into perfiles:', profileError);
        }

        // 2c. Marcar la invitación como usada
        await supabaseAdmin
            .from('invitaciones')
            .update({ usado: true })
            .eq('token', token);

        // 3. Log Audit (Registration)
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            authData.user.id,
            'perfil',
            authData.user.id,
            'REGISTER',
            null,
            { email, nombre, dni, rol: invite.rol }
        );

        res.json({ success: true, message: 'Usuario creado exitosamente' });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: err.message || 'Error al registrar usuario' });
    }
});


// Admin Override Password (Security)
router.post('/admin/users/reset-password', authMiddleware, requireAdmin, async (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
        return res.status(400).json({ error: 'Faltan datos requeridos (userId, newPassword)' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        // 1. Get user email for audit log
        const { data: user, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (fetchError || !user) throw new Error('Usuario no encontrado');

        // 2. Update Password
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        // 3. Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'seguridad',
            userId,
            'RESET_PASSWORD',
            null,
            { target_email: user.user.email }
        );

        res.json({ success: true, message: 'Contraseña actualizada correctamente' });

    } catch (err) {
        console.error('Admin password reset error:', err);
        res.status(500).json({ error: err.message || 'Error al restablecer contraseña' });
    }
});

// Admin Change User Role (Security)
router.post('/admin/users/change-role', authMiddleware, requireAdmin, async (req, res) => {
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
        return res.status(400).json({ error: 'Faltan datos requeridos (userId, newRole)' });
    }

    const validRoles = ['admin', 'docente', 'preceptor', 'alumno', 'tutor'];
    if (!validRoles.includes(newRole)) {
        return res.status(400).json({ error: 'Rol no válido' });
    }

    try {
        const clientToUse = supabaseAdmin || supabase;
        const { error } = await clientToUse
            .from('perfiles')
            .update({ rol: newRole })
            .eq('id', userId);

        if (error) throw error;

        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'seguridad',
            userId,
            'CHANGE_ROLE',
            null,
            { target_user_id: userId, new_role: newRole }
        );

        res.json({ success: true, message: `Rol actualizado a ${newRole}` });
    } catch (err) {
        console.error('Admin change role error:', err);
        res.status(500).json({ error: err.message || 'Error al cambiar rol' });
    }
});

// Admin List All Users (Security)
router.get('/admin/users', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { query } = req.query;
        const clientToUse = supabaseAdmin || supabase;
        let dbQuery = clientToUse
            .from('perfiles')
            .select('*');

        if (query && query.trim()) {
            const q = query.trim();
            dbQuery = dbQuery.or(`email.ilike.%${q}%,nombre.ilike.%${q}%,dni.ilike.%${q}%`);
        }

        const { data, error } = await dbQuery;
        if (error) {
            console.error('Error querying perfiles in GET /admin/users:', error);
            throw error;
        }

        res.json(data || []);
    } catch (err) {
        console.error('Admin list users error:', err);
        res.status(500).json({ error: err.message || 'Error al listar usuarios' });
    }
});

// Admin Delete User Account (Security)
router.delete('/admin/users/:userId', authMiddleware, requireAdmin, async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: 'Falta ID de usuario' });
    }

    if (userId === req.user.id) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
    }

    try {
        // 1. Obtener email del usuario para auditoría
        const { data: profile } = await supabaseAdmin
            .from('perfiles')
            .select('email, nombre, rol')
            .eq('id', userId)
            .maybeSingle();

        // 2. Eliminar de public.perfiles
        const { error: profileErr } = await supabaseAdmin
            .from('perfiles')
            .delete()
            .eq('id', userId);

        if (profileErr) {
            console.error('Warning deleting profile:', profileErr);
        }

        // 3. Eliminar de Supabase Auth (auth.users)
        const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authErr) {
            console.error('Error deleting auth user:', authErr);
            throw authErr;
        }

        // 4. Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'seguridad',
            userId,
            'DELETE_USER',
            null,
            { target_email: profile?.email || 'desconocido', target_name: profile?.nombre }
        );

        res.json({ success: true, message: 'Cuenta de usuario eliminada correctamente' });
    } catch (err) {
        console.error('Admin delete user error:', err);
        res.status(500).json({ error: err.message || 'Error al eliminar usuario' });
    }
});

module.exports = router;
