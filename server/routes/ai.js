const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.use(authMiddleware);

// Generar diagnóstico pedagógico para un alumno
router.post('/diagnostics/:alumnoId', async (req, res) => {
    try {
        const { alumnoId } = req.params;
        const userId = req.user.id;

        console.log(`[AI] Generating diagnostic for student: ${alumnoId} requested by user: ${userId}`);

        if (!process.env.GEMINI_API_KEY) {
            console.error('[AI] Missing GEMINI_API_KEY');
            return res.status(503).json({ error: 'Servicio de IA no configurado. Falta API KEY.' });
        }

        // 1. Obtener datos del alumno (notas, asistencia, perfil)
        const { data: profile } = await supabaseAdmin.from('perfiles').select('*').eq('id', alumnoId).single();
        const { data: grades } = await supabaseAdmin.from('calificaciones').select('*, asignacion:asignaciones(materia:materias(nombre))').eq('alumno_id', alumnoId);
        const { data: attendance } = await supabaseAdmin.from('asistencias_preceptor').select('*').eq('estudiante_id', alumnoId);

        if (!profile) {
            console.warn(`[AI] Profile not found for student: ${alumnoId}`);
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }

        // 2. Preparar el prompt con seguridad
        const gradesData = (grades || []).map(g => ({
            materia: g.asignacion?.materia?.nombre || 'Materia desconocida',
            promedio: g.promedio || 'N/A',
            logro: g.logro_parcial || 'Sin dato'
        }));

        const attendanceData = (attendance || []).slice(0, 20).map(a => ({
            fecha: a.fecha,
            estado: a.estado
        }));

        const prompt = `
            Eres un experto en pedagogía y análisis educativo. Analiza los siguientes datos del alumno ${profile.nombre} 
            y genera un diagnóstico constructivo.
            
            DATOS DE CALIFICACIONES:
            ${JSON.stringify(gradesData)}
            
            DATOS DE ASISTENCIA:
            ${JSON.stringify(attendanceData)}

            REQUERIMIENTOS:
            1. Genera un análisis general de su situación académica (1 párrafo).
            2. Proporciona 3 recomendaciones específicas para mejorar o mantener su rendimiento.
            3. Identifica fortalezas y áreas de riesgo.
            4. Responde ÚNICAMENTE con un objeto JSON con esta estructura exacta: 
               { "analisis": "...", "recomendaciones": ["rec1", "rec2", "rec3"], "riesgo": "bajo/medio/alto" }
        `;

        // 3. Llamar a Gemini
        console.log('[AI] Calling Gemini model (gemini-1.5-flash)...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        console.log('[AI] Gemini response received.');

        // Limpiar el texto si Gemini incluye markdown
        let aiResult;
        try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            aiResult = JSON.parse(cleanJson);
        } catch (jsonErr) {
            console.error('[AI] JSON Parse Error. Raw response:', responseText);
            throw new Error('La respuesta de la IA no pudo ser procesada como JSON.');
        }

        // 4. Guardar en base de datos para historial/caché
        const { error: dbErr } = await supabaseAdmin.from('ai_diagnostics').insert({
            alumno_id: alumnoId,
            docente_id: userId,
            analisis: aiResult.analisis,
            recomendaciones: aiResult
        });

        if (dbErr) console.error('[AI] Error saving to DB:', dbErr);

        res.json(aiResult);

    } catch (error) {
        console.error('AI Diagnostic Error:', error);
        res.status(500).json({
            error: 'Error al procesar el diagnóstico con IA.',
            details: error.message
        });
    }
});

module.exports = router;
