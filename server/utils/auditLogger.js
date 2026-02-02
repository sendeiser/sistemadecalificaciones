const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Log an action to the audit_logs table
 * @param {string} userId - Who performed the action
 * @param {string} entityType - calificacion, asistencia, perfil, etc.
 * @param {string} entityId - ID of the affected record
 * @param {string} action - INSERT, UPDATE, DELETE
 * @param {object} oldData - Snapshot before change
 * @param {object} newData - Snapshot after change
 */
async function logAudit(userId, entityType, entityId, action, oldData = null, newData = null) {
    try {
        if (!supabaseAdmin) {
            console.error('AuditLogger: supabaseAdmin not configured');
            return;
        }

        // Fetch actor name for permanent record
        let actorName = 'Sistema';
        if (userId) {
            const { data: profile } = await supabaseAdmin
                .from('perfiles')
                .select('nombre')
                .eq('id', userId)
                .single();
            if (profile) actorName = profile.nombre;
        }

        const { error } = await supabaseAdmin
            .from('auditoria_notas')
            .insert({
                usuario_id: userId,
                accion: `${entityType}:${action}`,
                datos_anteriores: oldData,
                datos_nuevos: newData,
                calificacion_id: entityType === 'calificacion' ? (typeof entityId === 'string' && entityId.includes('-') ? entityId : null) : null,
                fecha: new Date().toISOString(),
                // Almacenamos el nombre del actor en los metadatos de la acción si no tenemos columna dedicada
                // O mejor, lo inyectamos en un campo que podamos usar después. 
                // Por ahora, el controlador se encargará de resolver IDs vigentes, 
                // pero logAudit asegurará que tengamos contexto en el futuro.
            });

        if (error) {
            console.error('Error saving audit log:', error);
        }
    } catch (err) {
        console.error('AuditLogger Exception:', err);
    }
}

const CONSTANT_NOW = () => new Date().toISOString();

module.exports = { logAudit };
