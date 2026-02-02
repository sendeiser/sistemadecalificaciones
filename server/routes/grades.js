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

        // Upsert involves using the UNIQUE constraint (alumno_id, asignacion_id)
        const { data, error } = await req.supabase
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
                cuatrimestre: cuatrimestre || 1
            }, { onConflict: 'alumno_id, asignacion_id, cuatrimestre' })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error saving grade:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
