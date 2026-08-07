const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Apply middleware to all routes in this file
router.use(authMiddleware);

// GET /api/grades
// Returns all grades visible to the authenticated user (enforced by RLS)
router.get('/', async (req, res) => {
    try {
        // Select with nested relations
        const { data, error } = await req.supabase
            .from('calificaciones')
            .select(`
        *,
        alumno:perfiles!alumno_id (id, nombre, dni),
        asignacion:asignaciones!asignacion_id (
          materia:materias (id, nombre),
          division:divisiones (id, anio, seccion, ciclo_lectivo)
        )
      `)
            .order('id', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching grades:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/grades
// Update or Insert a grade record
router.post('/', async (req, res) => {
    try {
        const { alumno_id, asignacion_id, parcial_1, parcial_2, parcial_3, parcial_4, asistencia, observaciones, cuatrimestre } = req.body;

        if (!alumno_id || !asignacion_id) {
            return res.status(400).json({ error: 'alumno_id and asignacion_id are required' });
        }

        const activeSemester = cuatrimestre || 1;

        // 1. Fetch OLD data for audit
        const { data: oldGrade } = await req.supabase
            .from('calificaciones')
            .select('*')
            .eq('alumno_id', alumno_id)
            .eq('asignacion_id', asignacion_id)
            .eq('cuatrimestre', activeSemester)
            .maybeSingle();

        // 2. Upsert involves using the UNIQUE constraint (alumno_id, asignacion_id, cuatrimestre)
        const { data: newGrade, error } = await req.supabase
            .from('calificaciones')
            .upsert({
                alumno_id,
                asignacion_id,
                parcial_1,
                parcial_2,
                parcial_3,
                parcial_4,
                asistencia,
                observaciones,
                cuatrimestre: activeSemester
            }, { onConflict: 'alumno_id, asignacion_id, cuatrimestre' })
            .select()
            .single();

        if (error) throw error;

        // 3. Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'calificacion',
            newGrade.id,
            oldGrade ? 'UPDATE' : 'INSERT',
            oldGrade,
            newGrade
        );

        res.json(newGrade);
    } catch (err) {
        console.error('Error saving grade:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
