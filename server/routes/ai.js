const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

const { analyzeStudentData } = require('../utils/pedagogicalHeuristics');

router.use(authMiddleware);

// Generar diagnóstico pedagógico para un alumno (Heurístico)
router.post('/diagnostics/:alumnoId', async (req, res) => {
    try {
        const { alumnoId } = req.params;
        const userId = req.user.id;

        console.log(`[PEDAGOGY] Generating heuristic diagnostic for student: ${alumnoId}`);

        // 1. Obtener datos del alumno (notas, asistencia, perfil)
        const { data: profile } = await supabaseAdmin.from('perfiles').select('*').eq('id', alumnoId).single();
        const { data: grades } = await supabaseAdmin.from('calificaciones').select('*').eq('alumno_id', alumnoId);
        const { data: attendance } = await supabaseAdmin.from('asistencias_preceptor').select('*').eq('estudiante_id', alumnoId);

        if (!profile) return res.status(404).json({ error: 'Alumno no encontrado' });

        // 2. Ejecutar motor heurístico
        const result = analyzeStudentData(profile, grades || [], attendance || []);

        // 3. Guardar en base de datos para historial
        const { error: dbErr } = await supabaseAdmin.from('ai_diagnostics').insert({
            alumno_id: alumnoId,
            docente_id: userId,
            analisis: result.analisis,
            recomendaciones: result
        });

        if (dbErr) console.error('[PEDAGOGY] Error saving diagnostic:', dbErr);

        res.json(result);

    } catch (error) {
        console.error('Pedagogical Diagnostic Error:', error);
        res.status(500).json({ error: 'Error al procesar el diagnóstico pedagógico.' });
    }
});

module.exports = router;
