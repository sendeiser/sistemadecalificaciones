const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const attendanceController = require('../controllers/attendanceController');

router.use(authMiddleware);

// GET /api/attendance/:asignacionId
// Get attendance records for an assignment, optionally filtered by date query param
router.get('/:asignacionId', async (req, res) => {
    try {
        const { asignacionId } = req.params;
        const { date } = req.query;

        let query = req.supabase
            .from('asistencias')
            .select('*')
            .eq('asignacion_id', asignacionId);

        if (date) {
            query = query.eq('fecha', date);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching attendance:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/attendance/mass-justify
// Admin/Preceptor only
router.post('/mass-justify', async (req, res, next) => {
    // Basic role check (could be refined into a separate middleware)
    const { data: profile } = await req.supabase
        .from('perfiles')
        .select('rol')
        .eq('id', req.user.id)
        .single();

    if (profile?.rol !== 'admin' && profile?.rol !== 'preceptor') {
        return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
    }
    next();
}, attendanceController.massJustify);

// GET /api/attendance/alerts/:divisionId
router.get('/alerts/:divisionId', attendanceController.getCriticalAttendance);

// GET /api/attendance/discrepancies/:divisionId
router.get('/discrepancies/:divisionId', attendanceController.getAttendanceDiscrepancies);

// POST /api/attendance
// Upsert attendance record
router.post('/', async (req, res) => {
    try {
        const { estudiante_id, asignacion_id, fecha, estado, observaciones } = req.body;

        if (!estudiante_id || !asignacion_id || !fecha) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await req.supabase
            .from('asistencias')
            .upsert({
                estudiante_id,
                asignacion_id,
                fecha,
                estado,
                observaciones
            }, { onConflict: 'estudiante_id, asignacion_id, fecha' })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error saving attendance:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/attendance/general
// Record attendance for all students in a division (preceptor style)
router.post('/general', async (req, res) => {
    try {
        const { records } = req.body; // Array of objects: { estudiante_id, division_id, fecha, estado, observaciones }

        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty records array' });
        }

        const { data, error } = await req.supabase
            .from('asistencias_preceptor')
            .upsert(records, { onConflict: 'estudiante_id, division_id, fecha' })
            .select();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error saving general attendance:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
