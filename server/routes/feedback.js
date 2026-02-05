const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Enviar feedback
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { tipo, contenido, prioridad } = req.body;

        if (!contenido || !tipo) {
            return res.status(400).json({ error: 'Tipo y contenido son requeridos' });
        }

        const { data, error } = await supabaseAdmin
            .from('sistema_feedback')
            .insert({
                user_id: userId,
                tipo,
                contenido,
                prioridad: prioridad || 'normal'
            })
            .select()
            .single();

        if (error) throw error;

        // Auditoría
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            userId,
            'feedback',
            data.id,
            'CREATE',
            null,
            { tipo, contenido, prioridad }
        );

        res.status(201).json(data);
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Error al enviar feedback' });
    }
});

// Obtener feedback (Admin/Preceptor solamente)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        // Verificar rol
        const { data: profile } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (!['admin', 'preceptor'].includes(profile?.rol)) {
            return res.status(403).json({ error: 'No tienes permisos para ver el feedback' });
        }

        const { data, error } = await supabaseAdmin
            .from('sistema_feedback')
            .select(`
                *,
                user:perfiles!user_id(nombre, rol, email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Error al obtener feedback' });
    }
});

// Actualizar feedback (Admin/Preceptor solamente - p.ej. marcar como leído o añadir notas)
router.patch('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { leido, admin_notas, prioridad } = req.body;

        const { data: profile } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (!['admin', 'preceptor'].includes(profile?.rol)) {
            return res.status(403).json({ error: 'No tienes permisos para actualizar feedback' });
        }

        const { data, error } = await supabaseAdmin
            .from('sistema_feedback')
            .update({ leido, admin_notas, prioridad })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(500).json({ error: 'Error al actualizar feedback' });
    }
});

module.exports = router;
