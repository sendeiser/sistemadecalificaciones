const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Massively justifies absences for a list of students in a date range.
 * Affects both general attendance (preceptor) and subject-specific attendance (docente).
 */
async function massJustify(req, res) {
    const { studentIds, startDate, endDate, observations } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || !startDate || !endDate) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (studentIds, startDate, endDate).' });
    }

    try {
        // 1. Update general attendance (preceptor)
        const { error: pErr } = await supabaseAdmin
            .from('asistencias_preceptor')
            .update({
                estado: 'justificado',
                observaciones: observations || 'Justificación masiva'
            })
            .in('estudiante_id', studentIds)
            .gte('fecha', startDate)
            .lte('fecha', endDate)
            .in('estado', ['ausente', 'tarde']);

        if (pErr) throw pErr;

        // 2. Update subject-specific attendance (docente)
        const { error: sErr } = await supabaseAdmin
            .from('asistencias')
            .update({
                estado: 'justificado',
                observaciones: observations || 'Justificación masiva'
            })
            .in('estudiante_id', studentIds)
            .gte('fecha', startDate)
            .lte('fecha', endDate)
            .in('estado', ['ausente', 'tarde']);

        if (sErr) throw sErr;

        res.json({ message: 'Justificación masiva completada con éxito.' });
    } catch (err) {
        console.error('Error in massJustify:', err);
        res.status(500).json({ error: 'Error al procesar la justificación masiva: ' + err.message });
    }
}

/**
 * Fetches students with high absence counts for a specific division.
 */
async function getCriticalAttendance(req, res) {
    const { divisionId } = req.params;

    try {
        let enrollmentQuery = supabaseAdmin
            .from('estudiantes_divisiones')
            .select(`
                division_id,
                alumno:perfiles!alumno_id(id, nombre, dni),
                division:divisiones!division_id(anio, seccion)
            `);

        if (divisionId && divisionId !== 'all') {
            enrollmentQuery = enrollmentQuery.eq('division_id', divisionId);
        }

        const { data: enrollment, error: eErr } = await enrollmentQuery;
        if (eErr) throw eErr;

        let absenceQuery = supabaseAdmin
            .from('asistencias_preceptor')
            .select('estudiante_id, estado, division_id')
            .eq('estado', 'ausente');

        if (divisionId && divisionId !== 'all') {
            absenceQuery = absenceQuery.eq('division_id', divisionId);
        }

        const { data: absences, error: aErr } = await absenceQuery;
        if (aErr) throw aErr;

        const absenceMap = {};
        (absences || []).forEach(a => {
            absenceMap[a.estudiante_id] = (absenceMap[a.estudiante_id] || 0) + 1;
        });

        const report = (enrollment || []).map(e => {
            const divLabel = e.division ? `${e.division.anio}° "${e.division.seccion}"` : 'Sin división';
            return {
                id: e.alumno?.id,
                nombre: e.alumno?.nombre || 'Desconocido',
                dni: e.alumno?.dni || 'N/A',
                division: divLabel,
                division_id: e.division_id,
                faltas: absenceMap[e.alumno?.id] || 0
            };
        }).sort((a, b) => b.faltas - a.faltas);

        res.json(report);
    } catch (err) {
        console.error('Error in getCriticalAttendance:', err);
        res.status(500).json({ error: err.message });
    }
}

/**
 * Compares preceptor attendance vs teacher attendance for a division and date.
 */
async function getAttendanceDiscrepancies(req, res) {
    try {
        const { divisionId } = req.params;
        const date = req.query.date || new Date().toISOString().split('T')[0];

        let preceptorQuery = supabaseAdmin
            .from('asistencias_preceptor')
            .select('estudiante_id, estado, division_id, perfiles:estudiante_id(nombre), divisiones:division_id(anio, seccion)')
            .eq('fecha', date);

        if (divisionId && divisionId !== 'all') {
            preceptorQuery = preceptorQuery.eq('division_id', divisionId);
        }

        const { data: preceptorData, error: pErr } = await preceptorQuery;
        if (pErr) throw pErr;

        if (!preceptorData || preceptorData.length === 0) {
            return res.json([]);
        }

        let assignmentQuery = supabaseAdmin.from('asignaciones').select('id, division_id, materias(nombre)');
        if (divisionId && divisionId !== 'all') {
            assignmentQuery = assignmentQuery.eq('division_id', divisionId);
        }
        const { data: assignments } = await assignmentQuery;
        const assignmentMap = {};
        (assignments || []).forEach(a => { assignmentMap[a.id] = a; });
        const assignmentIds = Object.keys(assignmentMap);

        let teacherData = [];
        if (assignmentIds.length > 0) {
            const { data: tData } = await supabaseAdmin
                .from('asistencias')
                .select('estudiante_id, asignacion_id, estado')
                .in('asignacion_id', assignmentIds)
                .eq('fecha', date);
            teacherData = tData || [];
        }

        const teacherMap = {};
        teacherData.forEach(t => {
            if (!teacherMap[t.estudiante_id]) teacherMap[t.estudiante_id] = [];
            const asig = assignmentMap[t.asignacion_id];
            if (asig && asig.materias) {
                teacherMap[t.estudiante_id].push({
                    materia: asig.materias.nombre,
                    estado: t.estado
                });
            }
        });

        const discrepancies = [];
        (preceptorData || []).forEach(p => {
            const subjects = teacherMap[p.estudiante_id] || [];
            const hasConflict = subjects.some(s => s.estado !== p.estado);
            const divName = p.divisiones ? `${p.divisiones.anio}° "${p.divisiones.seccion}"` : 'Sin división';

            if (hasConflict || (subjects.length === 0 && p.estado !== 'presente')) {
                discrepancies.push({
                    estudiante_id: p.estudiante_id,
                    nombre: p.perfiles?.nombre || 'Desconocido',
                    division: divName,
                    division_id: p.division_id,
                    preceptor: p.estado,
                    materias: subjects
                });
            }
        });

        res.json(discrepancies);
    } catch (err) {
        console.error('Error in getAttendanceDiscrepancies:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    massJustify,
    getCriticalAttendance,
    getAttendanceDiscrepancies
};
