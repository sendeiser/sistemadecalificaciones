const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/announcements
 * Get announcements for current user
 * Query params: tipo, limit, offset
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { tipo, limit = 20, offset = 0 } = req.query;

        // Get user's role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        let query = supabaseAdmin
            .from('anuncios')
            .select(`
                *,
                autor:perfiles!autor_id(nombre),
                anuncios_leidos!left(id, leido_at)
            `)
            .order('fecha_publicacion', { ascending: false })
            .range(offset, offset + limit - 1);

        // Visibility Filters
        if (profile.rol === 'admin' || profile.rol === 'preceptor') {
            // Admin and Preceptor see all announcements (no recipient filter)
        } else {
            // Other roles (docente, alumno) only see what is sent to them
            query = query.contains('destinatarios', [profile.rol]);
        }

        // Visibility logic: only admin/preceptor can see unpublished (drafts)
        if (!['admin', 'preceptor'].includes(profile.rol)) {
            query = query.eq('publicado', true);
        }

        // Filter by tipo if provided
        if (tipo) {
            query = query.eq('tipo', tipo);
        }

        // Only show non-expired announcements
        query = query.or('fecha_expiracion.is.null,fecha_expiracion.gt.' + new Date().toISOString());

        const { data, error } = await query;

        if (error) throw error;

        // Add read status to each announcement
        const announcements = data.map(announcement => ({
            ...announcement,
            leido: announcement.anuncios_leidos.some(read => read.id),
            anuncios_leidos: undefined // Remove the join data
        }));

        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Error al obtener anuncios' });
    }
});

/**
 * GET /api/announcements/unread-count
 * Get count of unread announcements for current user
 */
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        let query = supabaseAdmin
            .from('anuncios')
            .select('id')
            .eq('publicado', true)
            .or('fecha_expiracion.is.null,fecha_expiracion.gt.' + new Date().toISOString());

        if (profile.rol !== 'admin' && profile.rol !== 'preceptor') {
            query = query.contains('destinatarios', [profile.rol]);
        }

        const { data: announcements, error: announcementsError } = await query;

        if (announcementsError) throw announcementsError;

        const announcementIds = announcements.map(a => a.id);
        if (announcementIds.length === 0) return res.json({ count: 0 });

        // Get read announcements
        const { data: readAnnouncements, error: readError } = await supabaseAdmin
            .from('anuncios_leidos')
            .select('anuncio_id')
            .eq('usuario_id', userId)
            .in('anuncio_id', announcementIds);

        if (readError) throw readError;

        const readIds = new Set(readAnnouncements.map(r => r.anuncio_id));
        const unreadCount = announcementIds.filter(id => !readIds.has(id)).length;

        res.json({ count: unreadCount });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Error al obtener contador de no leídos' });
    }
});

/**
 * GET /api/announcements/:id
 * Get a specific announcement
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Get user's role for visibility check
        const { data: profile } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        const { data, error } = await supabaseAdmin
            .from('anuncios')
            .select(`
                *,
                autor:perfiles!autor_id(nombre),
                anuncios_leidos!left(id, leido_at)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Anuncio no encontrado' });

        // Basic visibility check
        if (!['admin', 'preceptor'].includes(profile?.rol)) {
            if (!data.publicado || !data.destinatarios.includes(profile?.rol)) {
                return res.status(403).json({ error: 'No autorizado' });
            }
        }

        // Check if user has read this announcement
        const leido = data.anuncios_leidos.some(read => read.id);

        res.json({
            ...data,
            leido,
            anuncios_leidos: undefined
        });
    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ error: 'Error al obtener anuncio' });
    }
});

/**
 * POST /api/announcements
 * Create a new announcement (admin/preceptor only)
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            titulo,
            contenido,
            prioridad,
            tipo,
            destinatarios,
            division_id,
            adjunto_url,
            publicado,
            fecha_publicacion,
            fecha_expiracion
        } = req.body;

        // Verify admin or preceptor role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;
        if (!['admin', 'preceptor'].includes(profile.rol)) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Validate required fields
        if (!titulo || !contenido) {
            return res.status(400).json({ error: 'Campos requeridos: titulo, contenido' });
        }

        const { data, error } = await supabaseAdmin
            .from('anuncios')
            .insert({
                titulo,
                contenido,
                prioridad: prioridad || 'normal',
                tipo: tipo || 'general',
                autor_id: userId,
                destinatarios: destinatarios || ['admin', 'docente', 'alumno', 'preceptor', 'tutor'],
                division_id: division_id || null,
                adjunto_url: adjunto_url || null,
                publicado: publicado || false,
                fecha_publicacion: publicado ? (fecha_publicacion || new Date().toISOString()) : null,
                fecha_expiracion: fecha_expiracion || null
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Error al crear anuncio' });
    }
});

/**
 * PUT /api/announcements/:id
 * Update an announcement (author or admin only)
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const {
            titulo,
            contenido,
            prioridad,
            tipo,
            destinatarios,
            division_id,
            adjunto_url,
            publicado,
            fecha_publicacion,
            fecha_expiracion
        } = req.body;

        // Get user's role and check if they're the author
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        // Get announcement to check author
        const { data: announcement, error: announcementError } = await supabaseAdmin
            .from('anuncios')
            .select('autor_id, fecha_publicacion')
            .eq('id', id)
            .single();

        if (announcementError) throw announcementError;

        // Check authorization
        if (announcement.autor_id !== userId && !['admin', 'preceptor'].includes(profile.rol)) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const updateData = {};
        if (titulo !== undefined) updateData.titulo = titulo;
        if (contenido !== undefined) updateData.contenido = contenido;
        if (prioridad !== undefined) updateData.prioridad = prioridad;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (destinatarios !== undefined) updateData.destinatarios = destinatarios;
        if (division_id !== undefined) updateData.division_id = division_id || null;
        if (adjunto_url !== undefined) updateData.adjunto_url = adjunto_url || null;
        if (publicado !== undefined) {
            updateData.publicado = publicado;
            if (publicado && !announcement.fecha_publicacion) {
                updateData.fecha_publicacion = fecha_publicacion || new Date().toISOString();
            }
        }
        if (fecha_expiracion !== undefined) updateData.fecha_expiracion = fecha_expiracion || null;

        const { data, error } = await supabaseAdmin
            .from('anuncios')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ error: 'Error al actualizar anuncio' });
    }
});

/**
 * DELETE /api/announcements/:id
 * Delete an announcement (author or admin only)
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Get user's role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        // Get announcement to check author
        const { data: announcement, error: announcementError } = await supabaseAdmin
            .from('anuncios')
            .select('autor_id')
            .eq('id', id)
            .single();

        if (announcementError) throw announcementError;

        // Check authorization
        if (announcement.autor_id !== userId && !['admin', 'preceptor'].includes(profile.rol)) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const { error } = await supabaseAdmin
            .from('anuncios')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Anuncio eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
});

/**
 * POST /api/announcements/:id/read
 * Mark an announcement as read
 */
router.post('/:id/read', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Insert or update read status
        const { data, error } = await supabaseAdmin
            .from('anuncios_leidos')
            .upsert({
                anuncio_id: id,
                usuario_id: userId,
                leido_at: new Date().toISOString()
            }, {
                onConflict: 'anuncio_id,usuario_id'
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Anuncio marcado como leído', data });
    } catch (error) {
        console.error('Error marking announcement as read:', error);
        res.status(500).json({ error: 'Error al marcar como leído' });
    }
});

module.exports = router;
