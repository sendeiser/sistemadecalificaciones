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
        // 1. Fetch Students in Division
        const { data: enrollment, error: eErr } = await supabaseAdmin
            .from('estudiantes_divisiones')
            .select(`
                alumno:perfiles!alumno_id(id, nombre, dni)
            `)
            .eq('division_id', divisionId);

        if (eErr) throw eErr;

        // 2. Fetch all absences for these students in this division
        const { data: absences, error: aErr } = await supabaseAdmin
            .from('asistencias_preceptor')
            .select('estudiante_id, estado')
            .eq('division_id', divisionId)
            .eq('estado', 'ausente');

        if (aErr) throw aErr;

        // 3. Count absences per student
        const absenceMap = {};
        absences.forEach(a => {
            absenceMap[a.estudiante_id] = (absenceMap[a.estudiante_id] || 0) + 1;
        });

        const report = enrollment.map(e => ({
            id: e.alumno.id,
            nombre: e.alumno.nombre,
            dni: e.alumno.dni,
            faltas: absenceMap[e.alumno.id] || 0
        })).sort((a, b) => b.faltas - a.faltas);

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
    const { divisionId } = req.params;
    const { date } = req.query;

    if (!divisionId || !date) {
        return res.status(400).json({ error: 'Faltan parámetros: divisionId y date.' });
    }

    try {
        // 1. Fetch preceptor attendance
        const { data: preceptorData } = await supabaseAdmin
            .from('asistencias_preceptor')
            .select('estudiante_id, estado, perfiles(nombre)')
            .eq('division_id', divisionId)
            .eq('fecha', date);

        // 2. Fetch all subject assignments for this division
        const { data: assignments } = await supabaseAdmin
            .from('asignaciones')
            .select('id, materias(nombre)')
            .eq('division_id', divisionId);

        const assignmentIds = assignments.map(a => a.id);

        // 3. Fetch all teacher attendance for these assignments
        const { data: teacherData } = await supabaseAdmin
            .from('asistencias')
            .select('estudiante_id, asignacion_id, estado')
            .in('asignacion_id', assignmentIds)
            .eq('fecha', date);

        // 4. Group teacher data by student
        const teacherMap = {};
        teacherData.forEach(t => {
            if (!teacherMap[t.estudiante_id]) teacherMap[t.estudiante_id] = [];
            const asig = assignments.find(a => a.id === t.asignacion_id);
            teacherMap[t.estudiante_id].push({
                materia: asig.materias.nombre,
                estado: t.estado
            });
        });

        // 5. Compare
        const discrepancies = [];
        preceptorData.forEach(p => {
            const subjects = teacherMap[p.estudiante_id] || [];
            const hasConflict = subjects.some(s => s.estado !== p.estado);

            if (hasConflict || (subjects.length === 0 && p.estado !== 'presente')) {
                discrepancies.push({
                    estudiante_id: p.estudiante_id,
                    nombre: p.perfiles.nombre,
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
