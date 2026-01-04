const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../config/supabaseClient');

router.use(authMiddleware);

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    const { data: profile, error } = await req.supabase
        .from('perfiles')
        .select('rol')
        .eq('id', req.user.id)
        .single();

    if (error || profile?.rol !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
};

// GET /api/students
router.get('/', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('perfiles')
            .select('*')
            .eq('rol', 'alumno')
            .order('nombre');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/students/register
 * Creates a new Auth user and its profile.
 * Requires SUPABASE_SERVICE_ROLE_KEY to be configured.
 */
router.post('/register', isAdmin, async (req, res) => {
    const { email, password, nombre, dni } = req.body;

    if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase Admin Client not configured (missing Service Role Key)' });
    }

    if (!email || !password || !nombre || !dni) {
        return res.status(400).json({ error: 'Email, password, nombre and dni are required' });
    }

    try {
        // 1. Create the Auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre, dni, rol: 'alumno' }
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Fetch the profile (auto-created by DB trigger)
        const { data: profileData, error: profileError } = await req.supabase
            .from('perfiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            // Rollback auth user creation if profile fetching fails (should be rare)
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw profileError;
        }

        res.status(201).json(profileData);
    } catch (err) {
        console.error('Registration error:', err);
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/students/:id (Admin)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, dni, email } = req.body;
        const { data, error } = await req.supabase
            .from('perfiles')
            .update({ nombre, dni, email })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/students/:id (Admin)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Delete from Auth (Triggers cascading delete in profiles, grades, etc.)
        if (supabaseAdmin) {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) throw authError;
        } else {
            // Fallback: Delete from profiles only if admin client is not configured
            const { error } = await req.supabase.from('perfiles').delete().eq('id', id);
            if (error) throw error;
        }

        res.json({ message: 'Student and auth account deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
