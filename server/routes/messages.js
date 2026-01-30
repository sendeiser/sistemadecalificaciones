const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Obtener mensajes del usuario actual (enviados y recibidos)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        // Obtenemos el perfil del usuario para saber su rol
        const { data: profile } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (!profile) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        const { data, error } = await supabaseAdmin
            .from('mensajes')
            .select(`
                *,
                remitente:perfiles!remitente_id(nombre, rol, email),
                destinatario:perfiles!destinatario_id(nombre, rol, email)
            `)
            .or(`remitente_id.eq.${userId},destinatario_id.eq.${userId},rol_destinatario.eq.${profile.rol}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
});

// Enviar un nuevo mensaje
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { destinatario_id, rol_destinatario, contenido, tipo } = req.body;

        if (!contenido) return res.status(400).json({ error: 'Contenido requerido' });

        const { data, error } = await supabaseAdmin
            .from('mensajes')
            .insert({
                remitente_id: userId,
                destinatario_id: destinatario_id || null,
                rol_destinatario: rol_destinatario || null,
                contenido,
                tipo: tipo || 'privado'
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
});

// Marcar mensaje como leído
router.post('/:id/read', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('mensajes')
            .update({ leido: true, leido_at: new Date().toISOString() })
            .eq('id', id)
            .eq('destinatario_id', userId)
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ error: 'Error al actualizar mensaje' });
    }
});

module.exports = router;
