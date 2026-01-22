const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/calendar/events
 * Get calendar events with optional filtering
 * Query params: start_date, end_date, tipo
 */
router.get('/events', async (req, res) => {
    try {
        const { start_date, end_date, tipo } = req.query;
        const userId = req.user.id;

        // Get user's role
        const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        let query = supabaseAdmin
            .from('eventos_calendario')
            .select('*')
            .contains('visible_para', [profile.rol])
            .order('fecha_inicio', { ascending: true });

        // Apply date filters
        if (start_date) {
            query = query.gte('fecha_inicio', start_date);
        }
        if (end_date) {
            query = query.lte('fecha_inicio', end_date);
        }
        if (tipo) {
            query = query.eq('tipo', tipo);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Error al obtener eventos del calendario' });
    }
});

/**
 * GET /api/calendar/upcoming
 * Get upcoming events (next 30 days)
 */
router.get('/upcoming', async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const future = futureDate.toISOString().split('T')[0];

        // Get user's role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        const { data, error } = await supabaseAdmin
            .from('eventos_calendario')
            .select('*')
            .contains('visible_para', [profile.rol])
            .gte('fecha_inicio', today)
            .lte('fecha_inicio', future)
            .order('fecha_inicio', { ascending: true })
            .limit(5);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({ error: 'Error al obtener próximos eventos' });
    }
});

/**
 * POST /api/calendar/events
 * Create a new calendar event (admin only)
 */
router.post('/events', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            titulo,
            descripcion,
            fecha_inicio,
            fecha_fin,
            tipo,
            color,
            todo_el_dia,
            hora_inicio,
            hora_fin,
            visible_para
        } = req.body;

        // Verify admin role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;
        if (profile.rol !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Validate required fields
        if (!titulo || !fecha_inicio || !tipo) {
            return res.status(400).json({ error: 'Campos requeridos: titulo, fecha_inicio, tipo' });
        }

        const { data, error } = await supabaseAdmin
            .from('eventos_calendario')
            .insert({
                titulo,
                descripcion,
                fecha_inicio,
                fecha_fin: fecha_fin || null,
                tipo,
                color: color || '#0ea5e9',
                todo_el_dia: todo_el_dia !== undefined ? todo_el_dia : true,
                hora_inicio: hora_inicio || null,
                hora_fin: hora_fin || null,
                visible_para: visible_para || ['admin', 'docente', 'alumno', 'preceptor'],
                creado_por: userId
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({ error: 'Error al crear evento' });
    }
});

/**
 * PUT /api/calendar/events/:id
 * Update a calendar event (admin only)
 */
router.put('/events/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const {
            titulo,
            descripcion,
            fecha_inicio,
            fecha_fin,
            tipo,
            color,
            todo_el_dia,
            hora_inicio,
            hora_fin,
            visible_para
        } = req.body;

        // Verify admin role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;
        if (profile.rol !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const updateData = {};
        if (titulo !== undefined) updateData.titulo = titulo;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio;
        if (fecha_fin !== undefined) updateData.fecha_fin = fecha_fin || null;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (color !== undefined) updateData.color = color;
        if (todo_el_dia !== undefined) updateData.todo_el_dia = todo_el_dia;
        if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio || null;
        if (hora_fin !== undefined) updateData.hora_fin = hora_fin || null;
        if (visible_para !== undefined) updateData.visible_para = visible_para;

        const { data, error } = await supabaseAdmin
            .from('eventos_calendario')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({ error: 'Error al actualizar evento' });
    }
});

/**
 * DELETE /api/calendar/events/:id
 * Delete a calendar event (admin only)
 */
router.delete('/events/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify admin role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;
        if (profile.rol !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const { error } = await supabaseAdmin
            .from('eventos_calendario')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Evento eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({ error: 'Error al eliminar evento' });
    }
});

module.exports = router;
