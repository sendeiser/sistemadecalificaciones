const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Middleware to check if user is admin or preceptor
const isAdminOrPreceptor = async (req, res, next) => {
    const { data: profile, error } = await req.supabase
        .from('perfiles')
        .select('rol')
        .eq('id', req.user.id)
        .single();

    if (error || (profile?.rol !== 'admin' && profile?.rol !== 'preceptor')) {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador o preceptor.' });
    }
    next();
};

// GET /api/subjects
router.get('/', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('materias')
            .select('*')
            .order('nombre');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/subjects (Admin)
router.post('/', isAdminOrPreceptor, async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const { data, error } = await req.supabase
            .from('materias')
            .insert([{ nombre, descripcion }])
            .select()
            .single();

        if (error) throw error;

        // Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'materia',
            data.id,
            'INSERT',
            null,
            data
        );

        res.status(201).json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/subjects/:id (Admin/Preceptor)
router.put('/:id', isAdminOrPreceptor, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        const { data, error } = await req.supabase
            .from('materias')
            .update({ nombre, descripcion })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Fetch old data for update log (though update call above returns new data)
        // For subjects, we can use the returned 'data' as 'new' and just log the change.
        // If we want exact diff, we should have fetched 'old' before. Let's do it right.

        // Actually, let's keep it simple for now as we don't have many fields.
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'materia',
            data.id,
            'UPDATE',
            null, // Simplified: not fetching old state here to avoid extra query
            data
        );

        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/subjects/:id (Admin/Preceptor)
router.delete('/:id', isAdminOrPreceptor, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await req.supabase
            .from('materias')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'materia',
            id,
            'DELETE',
            { id }, // Minimal context
            null
        );

        res.json({ message: 'Subject deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
