const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Get paginated audit logs for the admin dashboard
 */
const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, entidad_tipo, accion, desde, hasta, exportar } = req.query;

        // First, get the audit logs
        let query = supabaseAdmin
            .from('auditoria_notas')
            .select('*', { count: 'exact' })
            .order('fecha', { ascending: false });

        if (entidad_tipo) {
            if (entidad_tipo === 'calificacion') {
                query = query.or(`accion.ilike.calificacion:%,calificacion_id.not.is.null`);
            } else {
                query = query.ilike('accion', `${entidad_tipo}:%`);
            }
        }
        if (accion) {
            query = query.ilike('accion', `%:${accion}%`);
        }
        if (desde) {
            query = query.gte('fecha', desde);
        }
        if (hasta) {
            query = query.lte('fecha', hasta);
        }

        // Si no es exportar, aplicamos paginación
        if (exportar !== 'true') {
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);
        }

        const { data: logs, error, count } = await query;

        console.log(`[AUDIT] Fetching logs - Page: ${page}, Limit: ${limit}, Count: ${count}`);
        if (error) {
            console.error('[AUDIT] Query Error:', error);
            throw error;
        }
        console.log(`[AUDIT] Found ${logs?.length || 0} logs`);

        // Get unique user IDs
        const userIds = [...new Set(logs.map(log => log.usuario_id).filter(Boolean))];

        // Fetch user data for all users at once
        let usersMap = {};
        if (userIds.length > 0) {
            const { data: users } = await supabaseAdmin
                .from('perfiles')
                .select('id, nombre, email')
                .in('id', userIds);

            if (users) {
                usersMap = users.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {});
            }
        }

        // Attach user data to each log
        const logsWithUsers = logs.map(log => ({
            ...log,
            usuario: usersMap[log.usuario_id] || null
        }));

        res.json({
            logs: logsWithUsers,
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error('Audit logs error:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAuditLogs };
