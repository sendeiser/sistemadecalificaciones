const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Obtener medallas de un perfil
router.get('/medals/:perfilId', async (req, res) => {
    try {
        const { perfilId } = req.params;
        const { data, error } = await supabaseAdmin
            .from('perfiles_logros')
            .select('*')
            .eq('perfil_id', perfilId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching medals:', error);
        res.status(500).json({ error: 'Error al obtener medallas' });
    }
});

// Endpoint para "reclamar" o procesar medallas automáticas (ej: al cargar el dashboard)
router.post('/check-achievements', async (req, res) => {
    try {
        const userId = req.user.id;
        const achievements = [];

        // 1. Verificar Asistencia Perfecta (>95%)
        const { data: attendance } = await supabaseAdmin
            .from('asistencias_preceptor')
            .select('estado')
            .eq('estudiante_id', userId);

        if (attendance && attendance.length >= 10) {
            const presents = attendance.filter(a => a.estado === 'presente' || a.estado === 'tarde').length;
            const pct = (presents / attendance.length) * 100;

            if (pct >= 95) {
                achievements.push({ key: 'asistencia_perfecta', meta: { pct: Math.round(pct) } });
            }
        }

        // 2. Verificar Excelencia Académica (Promedio > 9 en todas)
        const { data: grades } = await supabaseAdmin
            .from('calificaciones')
            .select('promedio')
            .eq('alumno_id', userId);

        if (grades && grades.length > 0 && grades.every(g => g.promedio >= 9)) {
            achievements.push({ key: 'excelencia_academica', meta: { promedio_gral: 9 } });
        }

        // 3. Guardar nuevos logros (si no existen)
        for (const ach of achievements) {
            await supabaseAdmin.from('perfiles_logros').upsert({
                perfil_id: userId,
                medal_key: ach.key,
                metadata: ach.meta
            }, { onConflict: 'perfil_id,medal_key' });
        }

        res.json({ success: true, new_achievements: achievements });

    } catch (error) {
        console.error('Error checking achievements:', error);
        res.status(500).json({ error: 'Error al procesar logros' });
    }
});

module.exports = router;
