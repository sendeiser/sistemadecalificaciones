const { supabaseAdmin } = require('./config/supabaseClient');
const { logAudit } = require('./utils/auditLogger');
require('dotenv').config();

async function simulateGradeChange() {
    try {
        // 1. Get a valid assignment
        const { data: assignments } = await supabaseAdmin.from('asignaciones').select('id').limit(1);
        if (!assignments || assignments.length === 0) throw new Error('No assignments found');
        const asignacion_id = assignments[0].id;

        // 2. Get a valid student
        const { data: students } = await supabaseAdmin.from('perfiles').select('id').eq('rol', 'alumno').limit(1);
        const alumno_id = students[0].id;

        // 3. Get a valid teacher (user performing the action)
        const { data: teachers } = await supabaseAdmin.from('perfiles').select('id').eq('rol', 'docente').limit(1);
        const usuario_id = teachers[0].id;

        // 4. Get a real calificacion ID if possible
        const { data: grades } = await supabaseAdmin.from('calificaciones').select('id').limit(1);
        const calificacion_id = grades && grades.length > 0 ? grades[0].id : null;

        console.log('Simulating action by:', usuario_id);
        console.log('Target Student:', alumno_id);
        console.log('Assignment:', asignacion_id);
        console.log('Calificacion ID:', calificacion_id);

        const oldData = { nota: 7, cuatrimestre: 1 };
        const newData = { nota: 9, cuatrimestre: 1 };

        // 5. Log the audit event
        await logAudit(
            usuario_id,
            'calificacion',
            calificacion_id, // Use real ID
            'UPDATE',
            oldData,
            newData
        );

        console.log('--- AUDIT LOG GENERATED SUCCESSFULLY ---');

    } catch (err) {
        console.error('Error:', err.message);
    }
}

simulateGradeChange();
