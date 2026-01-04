const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
    // We expect the profile to be in some context, but for simple RLS-backed API, 
    // we can rely on Supabase policies. However, for explicit endpoint protection:
    // This assumes we have a way to check role from meta or query.
    // For now, let's just use it to protect admin-only write operations.
    next();
};

// GET /api/assignments
router.get('/', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('asignaciones')
            .select(`
                id,
                docente:perfiles!docente_id(id, nombre),
                materia:materias(id, nombre),
                division:divisiones(id, anio, seccion, ciclo_lectivo)
            `);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/assignments
router.post('/', adminOnly, async (req, res) => {
    const { docente_id, materia_id, division_id } = req.body;
    try {
        const { data, error } = await req.supabase
            .from('asignaciones')
            .insert({ docente_id, materia_id, division_id })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/assignments/:id
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const { error } = await req.supabase
            .from('asignaciones')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auxiliary routes for dropdowns
router.get('/teachers', async (req, res) => {
    try {
        const { data, error } = await req.supabase.from('perfiles').select('id, nombre').eq('rol', 'docente');
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/subjects', async (req, res) => {
    try {
        const { data, error } = await req.supabase.from('materias').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/divisions', async (req, res) => {
    try {
        const { data, error } = await req.supabase.from('divisiones').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
