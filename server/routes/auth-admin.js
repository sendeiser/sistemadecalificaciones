const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// Validar si el usuario es Admin o Preceptor
const requireAdmin = async (req, res, next) => {
    try {
        const { data: profile, error } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', req.user.id)
            .single();

        if (error || !profile) return res.status(403).json({ error: 'Acceso denegado' });

        if (profile.rol === 'admin' || profile.rol === 'preceptor') {
            req.userRole = profile.rol;
            next();
        } else {
            return res.status(403).json({ error: 'Se requieren permisos de administrador' });
        }
    } catch (err) {
        console.error('Admin check error:', err);
        return res.status(500).json({ error: 'Error al verificar permisos' });
    }
};

// Generar nueva invitación (Solo Admin/Preceptor)
router.post('/admin/invite', authMiddleware, requireAdmin, async (req, res) => {
    const { rol, email } = req.body;

    if (!rol || !['docente', 'preceptor', 'admin'].includes(rol)) {
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

        res.json({ success: true, message: 'Usuario creado exitosamente' });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: err.message || 'Error al registrar usuario' });
    }
});

module.exports = router;
