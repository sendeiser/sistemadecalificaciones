const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/tutor/children - Get list of children linked to the current tutor
router.get('/children', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('tutores_alumnos')
            .select(`
                alumno_id,
                parentesco,
                alumno:perfiles!alumno_id(
                    id, 
                    nombre, 
                    dni,
                    division:estudiantes_divisiones(
                        division:divisiones(id, anio, seccion)
                    )
                )
            `)
            .eq('tutor_id', req.user.id);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching children:', error);
        res.status(500).json({ error: 'Error al obtener lista de hijos' });
    }
});

// GET /api/tutor/child-summary/:alumnoId - Get a quick summary for a specific child
router.get('/child-summary/:alumnoId', async (req, res) => {
    try {
        const { alumnoId } = req.params;
        const tutorId = req.user.id;

        // Verify link
        const { data: link, error: linkErr } = await supabaseAdmin
            .from('tutores_alumnos')
            .select('*')
            .eq('tutor_id', tutorId)
            .eq('alumno_id', alumnoId)
            .single();

        if (!link || linkErr) return res.status(403).json({ error: 'No tienes acceso a los datos de este alumno' });

        // Fetch grades summary
        const { data: grades } = await supabaseAdmin
            .from('calificaciones')
            .select('promedio, asignacion:asignaciones(materia:materias(nombre))')
            .eq('alumno_id', alumnoId);

        // Fetch attendance summary
        const { data: attendance } = await supabaseAdmin
            .from('asistencias_preceptor')
            .select('estado')
            .eq('estudiante_id', alumnoId);

        const totalAtt = attendance?.length || 0;
        const presentAtt = attendance?.filter(a => a.estado === 'presente' || a.estado === 'tarde').length || 0;

        res.json({
            grades: grades || [],
            attendance: {
                total: totalAtt,
                present: presentAtt,
                pct: totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 100
            }
        });
    } catch (error) {
        console.error('Error fetching child summary:', error);
        res.status(500).json({ error: 'Error al obtener resumen informativo' });
    }
});

module.exports = router;
