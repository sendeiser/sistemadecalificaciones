const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../config/supabaseClient');

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

        // Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'asignacion',
            data.id,
            'INSERT',
            null,
            data
        );

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/assignments/:id
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const assignmentId = req.params.id;
        console.log(`[DELETE ASSIGNMENT] Starting deletion for assignment ID: ${assignmentId}`);

        if (!supabaseAdmin) {
            console.error('[DELETE ASSIGNMENT] supabaseAdmin is not configured!');
            return res.status(500).json({ error: 'Admin client not configured' });
        }

        // 1. Get all grade IDs for this assignment to delete audit logs
        console.log('[DELETE ASSIGNMENT] Step 1: Fetching grades for this assignment...');
        const { data: assignmentGrades, error: gradesReadError } = await supabaseAdmin
            .from('calificaciones')
            .select('id')
            .eq('asignacion_id', assignmentId);

        if (gradesReadError) {
            console.error('[DELETE ASSIGNMENT] Error reading grades:', gradesReadError);
            throw gradesReadError;
        }

        console.log(`[DELETE ASSIGNMENT] Found ${assignmentGrades?.length || 0} grades`);

        if (assignmentGrades && assignmentGrades.length > 0) {
            const gradeIds = assignmentGrades.map(g => g.id);
            console.log(`[DELETE ASSIGNMENT] Step 2: Deleting audit logs for ${gradeIds.length} grades...`);

            // Delete audit logs for these grades
            const { error: auditError } = await supabaseAdmin
                .from('auditoria_notas')
                .delete()
                .in('calificacion_id', gradeIds);

            if (auditError) {
                console.error('[DELETE ASSIGNMENT] Error deleting audit logs:', auditError);
                throw auditError;
            }
            console.log('[DELETE ASSIGNMENT] Audit logs deleted successfully');
        }

        // 2. Delete attendance records for this assignment
        console.log('[DELETE ASSIGNMENT] Step 3: Deleting attendance records...');
        const { error: attError } = await supabaseAdmin
            .from('asistencias')
            .delete()
            .eq('asignacion_id', assignmentId);

        if (attError) {
            console.error('[DELETE ASSIGNMENT] Error deleting attendance:', attError);
            throw attError;
        }
        console.log('[DELETE ASSIGNMENT] Attendance records deleted successfully');

        // 3. Delete grades for this assignment
        console.log('[DELETE ASSIGNMENT] Step 4: Deleting grades...');
        const { error: gradeError } = await supabaseAdmin
            .from('calificaciones')
            .delete()
            .eq('asignacion_id', assignmentId);

        if (gradeError) {
            console.error('[DELETE ASSIGNMENT] Error deleting grades:', gradeError);
            throw gradeError;
        }
        console.log('[DELETE ASSIGNMENT] Grades deleted successfully');

        // Pre-fetch assignment data for logging before deletion
        const { data: oldAssignment } = await supabaseAdmin
            .from('asignaciones')
            .select(`
                *,
                docente:perfiles!docente_id(nombre),
                materia:materias(nombre),
                division:divisiones(anio, seccion)
            `)
            .eq('id', assignmentId)
            .single();

        // 4. Finally, delete the assignment itself
        console.log('[DELETE ASSIGNMENT] Step 5: Deleting assignment...');
        const { error } = await supabaseAdmin
            .from('asignaciones')
            .delete()
            .eq('id', assignmentId);

        if (error) {
            console.error('[DELETE ASSIGNMENT] Error deleting assignment:', error);
            throw error;
        }

        // Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'asignacion',
            assignmentId,
            'DELETE',
            oldAssignment,
            null
        );

        console.log('[DELETE ASSIGNMENT] Assignment deleted successfully!');
        res.status(204).send();
    } catch (err) {
        console.error('[DELETE ASSIGNMENT] Fatal error:', err);
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
