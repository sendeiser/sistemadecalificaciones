/**
 * Utility to clean all child table references for a user before profile/auth deletion.
 * Prevents PostgreSQL foreign key constraint violations across all modules.
 * 
 * @param {object} client - Supabase client (supabaseAdmin or regular client)
 * @param {string} userId - UUID of the user/student being deleted
 */
const cleanUserReferences = async (client, userId) => {
    if (!client || !userId) return;

    try {
        await Promise.allSettled([
            // Physical Education & Sports
            client.from('evaluaciones_fisicas').delete().eq('alumno_id', userId),
            client.from('evaluaciones_fisicas').delete().eq('docente_id', userId),
            client.from('participantes_torneo').delete().eq('alumno_id', userId),
            client.from('certificados_medicos').delete().eq('alumno_id', userId),
            client.from('asistencia_clase_deportiva').delete().eq('alumno_id', userId),
            client.from('asistencia_clase_deportiva').delete().eq('docente_id', userId),
            client.from('evaluacion_desempeno').delete().eq('alumno_id', userId),
            client.from('evaluacion_desempeno').delete().eq('docente_id', userId),
            client.from('historial_medico').delete().eq('alumno_id', userId),
            
            // Academic & Division Enrollments
            client.from('estudiantes_divisiones').delete().eq('alumno_id', userId),
            client.from('asistencias_preceptor').delete().eq('estudiante_id', userId),
            client.from('asistencias_preceptor').delete().eq('alumno_id', userId),
            client.from('inscripciones').delete().eq('estudiante_id', userId),
            client.from('asistencias').delete().eq('alumno_id', userId),
            client.from('asistencias').delete().eq('estudiante_id', userId),
            client.from('calificaciones').delete().eq('alumno_id', userId),
            client.from('auditoria_notas').delete().eq('usuario_id', userId),
            
            // Behavior, Communication & Calendar
            client.from('observaciones_convivencia').delete().eq('alumno_id', userId),
            client.from('observaciones_convivencia').delete().eq('docente_id', userId),
            client.from('mensajes').delete().eq('remitente_id', userId),
            client.from('mensajes').delete().eq('destinatario_id', userId),
            client.from('anuncios').delete().eq('autor_id', userId),
            client.from('anuncios_leidos').delete().eq('usuario_id', userId),
            client.from('eventos_calendario').delete().eq('creado_por', userId),
            
            // Invites, Tutoring, AI & Achievements
            client.from('invitaciones').delete().eq('creado_por', userId),
            client.from('tutores_alumnos').delete().eq('tutor_id', userId),
            client.from('tutores_alumnos').delete().eq('alumno_id', userId),
            client.from('perfiles_logros').delete().eq('perfil_id', userId),
            client.from('ai_diagnostics').delete().eq('alumno_id', userId),
            client.from('ai_diagnostics').delete().eq('docente_id', userId),
            client.from('document_validations').delete().eq('created_by', userId)
        ]);
    } catch (err) {
        console.warn('Warning cleaning references for user:', userId, err);
    }
};

module.exports = { cleanUserReferences };
