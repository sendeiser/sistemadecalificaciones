const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

// Validar si el usuario es Admin
const requireAdmin = async (req, res, next) => {
    try {
        const clientToUse = supabaseAdmin || supabase;
        const { data: profile, error } = await clientToUse
            .from('perfiles')
            .select('rol')
            .eq('id', req.user.id)
            .single();

        if (error || !profile) return res.status(403).json({ error: 'Acceso denegado' });

        if (profile.rol === 'admin') {
            req.userRole = profile.rol;
            next();
        } else {
            return res.status(403).json({ error: 'Se requieren permisos de administrador' });
        }
    } catch (err) {
        console.error('Admin check error:', err);
        return res.status(500).json({ error: 'Error al verificar permisos' });
    }
};

// GET /api/settings/backup - Backup all database tables
router.get('/backup', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const tables = [
            'perfiles',
            'divisiones',
            'materias',
            'asignaciones',
            'estudiantes_divisiones',
            'calificaciones',
            'periodos_calificacion',
            'asistencias',
            'asistencias_preceptor',
            'mensajes',
            'eventos_calendario',
            'anuncios',
            'anuncios_leidos',
            'perfiles_logros',
            'ai_diagnostics',
            'invitaciones',
            'tutores_alumnos',
            'auditoria_notas',
            'sistema_feedback',
            'system_settings'
        ];

        const backupData = {};
        const clientToUse = supabaseAdmin || supabase;

        // Query each table
        for (const table of tables) {
            const { data, error } = await clientToUse
                .from(table)
                .select('*');
            
            if (error) {
                console.warn(`Backup: error reading table ${table}:`, error.message);
                backupData[table] = { error: error.message };
            } else {
                backupData[table] = data || [];
            }
        }

        // Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'sistema',
            'all',
            'BACKUP_DATABASE',
            null,
            { tables: tables.length }
        );

        res.json(backupData);
    } catch (err) {
        console.error('Backup error:', err);
        res.status(500).json({ error: 'Error al generar la copia de seguridad' });
    }
});

// GET /api/settings - Read all settings
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*');

        if (error) throw error;

        // Convert array to object { key: value }
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });

        res.json(settings);
    } catch (err) {
        console.error('Fetch settings error:', err);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// POST /api/settings - Update specific settings
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
    const { key, value } = req.body;

    if (!key || !value) {
        return res.status(400).json({ error: 'Clave y valor requeridos' });
    }

    try {
        const { data, error } = await supabase
            .from('system_settings')
            .upsert({
                key,
                value,
                updated_at: new Date(),
                updated_by: req.user.id
            })
            .select();

        if (error) throw error;

        // Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'sistema',
            key,
            'UPDATE_SETTINGS',
            null,
            { key, value }
        );

        res.json({ success: true, data });
    } catch (err) {
        console.error('Update settings error:', err);
        res.status(500).json({ error: 'Error al guardar configuración' });
    }
});

module.exports = router;
