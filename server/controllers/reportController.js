const { supabaseAdmin } = require('../config/supabaseClient');
const PDFDocument = require('pdfkit');

// Helper to sanitize text for PDF
const sanitize = (str) => str ? String(str).replace(/[^\x20-\x7E]/g, '') : '';

// Generate PDF report for a specific assignment (Division + Subject)
async function generateDivisionReport(req, res) {
    const { assignmentId } = req.params;
    console.log('--- DBG: GenerateDivisionReport ---');
    console.log('Assignment ID:', assignmentId);

    try {
        // 1. Fetch Assignment Details (Subject, Division, Teacher)
        const { data: assignment, error: aErr } = await supabaseAdmin
            .from('asignaciones')
            .select(`
                id,
                division_id,
                materia:materias(nombre),
                division:divisiones(id, anio, seccion, ciclo_lectivo),
                docente:perfiles(nombre)
            `)
            .eq('id', assignmentId)
            .single();

        if (aErr || !assignment) {
            console.error('Assignment error:', aErr);
            return res.status(404).json({ error: 'Asignación no encontrada' });
        }

        // 2. Fetch Students and Grades
        // We first get all students in the division to ensure inclusive list
        const { data: students, error: sErr } = await supabaseAdmin
            .from('estudiantes_divisiones')
            .select(`
                alumno:perfiles!alumno_id (id, nombre, dni)
            `)
            .eq('division_id', assignment.division_id);

        if (sErr) throw sErr;

        // Fetch grades for this assignment
        const { data: gradesData, error: gErr } = await supabaseAdmin
            .from('calificaciones')
            .select('*')
            .eq('asignacion_id', assignmentId);

        if (gErr) throw gErr;

        // Merge data
        const reportData = students.map(s => {
            const grade = gradesData.find(g => g.alumno_id === s.alumno.id) || {};
            return {
                nombre: s.alumno.nombre, // Using nombre as full name based on typical profile structure
                dni: s.alumno.dni,
                parcial_1: grade.parcial_1,
                parcial_2: grade.parcial_2,
                parcial_3: grade.parcial_3,
                parcial_4: grade.parcial_4,
                promedio: grade.promedio,
                logro: grade.logro_parcial,
                intensificacion: grade.nota_intensificacion,
                trayecto: grade.trayecto_acompanamiento
            };
        }).sort((a, b) => a.nombre.localeCompare(b.nombre));

        // 3. Generate PDF
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_${sanitize(assignment.materia.nombre)}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(18).text('Planilla de Calificaciones', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10);
        doc.text(`Materia: ${sanitize(assignment.materia.nombre)}`, { continued: true });
        doc.text(`   División: ${assignment.division.anio} ${assignment.division.seccion}`, { align: 'right' });
        doc.text(`Docente: ${sanitize(assignment.docente?.nombre)}`);

        doc.moveDown();

        // Table Constants
        const startX = 30;
        let currentY = doc.y;
        const colWidths = {
            name: 180,
            dni: 60,
            grade: 35,
            prom: 40,
            trayecto: 100
        };

        // Table Header
        doc.font('Helvetica-Bold');
        doc.text('Estudiante', startX, currentY);
        doc.text('DNI', startX + 180, currentY);
        doc.text('P1', startX + 240, currentY);
        doc.text('P2', startX + 275, currentY);
        doc.text('P3', startX + 310, currentY);
        doc.text('P4', startX + 345, currentY);
        doc.text('Prom', startX + 380, currentY);
        doc.text('Trayecto', startX + 420, currentY);

        currentY += 20;
        doc.font('Helvetica');

        // Draw lines
        doc.moveTo(startX, currentY - 5).lineTo(565, currentY - 5).stroke();

        // Rows
        reportData.forEach((row, i) => {
            if (currentY > 750) { // New Page
                doc.addPage();
                currentY = 30;
                doc.font('Helvetica-Bold');
                doc.text('Estudiante', startX, currentY);
                // ... (simplified header for next pages)
                currentY += 20;
                doc.font('Helvetica');
            }

            // Alternating background
            if (i % 2 === 0) {
                doc.save();
                doc.fillColor('#f5f5f5');
                doc.rect(startX, currentY - 5, 535, 20).fill();
                doc.restore();
            }

            doc.text(sanitize(row.nombre).substring(0, 30), startX + 2, currentY);
            doc.text(sanitize(row.dni), startX + 180, currentY);
            doc.text(row.parcial_1 || '-', startX + 240, currentY);
            doc.text(row.parcial_2 || '-', startX + 275, currentY);
            doc.text(row.parcial_3 || '-', startX + 310, currentY);
            doc.text(row.parcial_4 || '-', startX + 345, currentY);
            doc.text(row.promedio || '-', startX + 380, currentY);
            doc.text(sanitize(row.trayecto).substring(0, 20), startX + 420, currentY);

            currentY += 20;
        });

        doc.end();

    } catch (e) {
        console.error('Error generating PDF:', e);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error generando reporte PDF' });
        }
    }
}

// Generate grade report for a specific division and materia
async function generateGradeReport(req, res) {
    const { division_id, materia_id } = req.query;
    console.log('--- DBG: GenerateGradeReport ---');
    console.log('Query Params:', { division_id, materia_id });
    console.log('supabaseAdmin available:', !!supabaseAdmin);

    // Security Check: Only admins should access these reports
    const { data: profile } = await req.supabase
        .from('perfiles')
        .select('rol')
        .eq('id', req.user.id)
        .single();

    if (!profile || profile.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: Se requiere rol de administrador.' });
    }

    if (!division_id || !materia_id) {
        return res.status(400).json({ error: 'division_id and materia_id required' });
    }
    try {
        // Find the assignment id linking division and materia
        const { data: asignacion, error: asigErr } = await supabaseAdmin
            .from('asignaciones')
            .select('id, docente_id, materia_id, division_id')
            .eq('division_id', division_id)
            .eq('materia_id', materia_id)
            .maybeSingle();

        console.log('Assignment lookup result:', { asignacion, asigErr });

        if (asigErr) throw asigErr;

        let grades = [];
        if (asignacion) {
            const { data: gradesData, error: gradesErr } = await supabaseAdmin
                .from('calificaciones')
                .select('alumno_id, parcial_1, parcial_2, parcial_3, parcial_4, promedio')
                .eq('asignacion_id', asignacion.id);
            if (gradesErr) throw gradesErr;
            grades = gradesData || [];
        }

        // Get all students enrolled in the division to ensure we show everyone
        const { data: enrollment, error: enrollErr } = await supabaseAdmin
            .from('estudiantes_divisiones')
            .select(`
        alumno:perfiles!alumno_id (id, nombre, dni)
      `)
            .eq('division_id', division_id);

        if (enrollErr) throw enrollErr;

        const studentList = enrollment.map(e => e.alumno);
        const gradesMap = {};
        grades.forEach(g => { gradesMap[g.alumno_id] = g; });

        const report = studentList.map(s => {
            const g = gradesMap[s.id] || {};
            return {
                alumno_id: s.id,
                nombre: s.nombre,
                dni: s.dni,
                parcial_1: g.parcial_1,
                parcial_2: g.parcial_2,
                parcial_3: g.parcial_3,
                parcial_4: g.parcial_4,
                promedio: g.promedio,
            };
        });

        res.json({
            report,
            message: !asignacion ? 'Nota: No se encontró una asignación de docente para esta materia en la división seleccionada. Se muestra la lista de alumnos sin notas.' : null
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

// Attendance statistics for visualization
async function getAttendanceStats(req, res) {
    const { division_id, start_date, end_date } = req.query;

    // Security Check: Only admins should access these reports
    const { data: profile } = await req.supabase
        .from('perfiles')
        .select('rol')
        .eq('id', req.user.id)
        .single();

    if (!profile || profile.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: Se requiere rol de administrador.' });
    }

    if (!division_id) {
        return res.status(400).json({ error: 'division_id required' });
    }
    try {
        let query = supabaseAdmin
            .from('asistencias')
            .select('estado, asistencia')
            .eq('division_id', division_id);
        if (start_date) query = query.gte('fecha', start_date);
        if (end_date) query = query.lte('fecha', end_date);
        const { data, error } = await query;
        if (error) throw error;
        const totals = data.reduce((acc, cur) => {
            acc.total++;
            if (cur.estado === 'ausente') acc.absent++;
            if (cur.estado === 'presente') acc.present++;
            if (cur.estado === 'tarde') acc.late++;
            acc.asistenciaSum += Number(cur.asistencia) || 0;
            return acc;
        }, { total: 0, present: 0, absent: 0, late: 0, asistenciaSum: 0 });
        const avgAsistencia = totals.total ? (totals.asistenciaSum / totals.total).toFixed(2) : 0;
        res.json({ ...totals, avgAsistencia });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

module.exports = { generateGradeReport, getAttendanceStats, generateDivisionReport };

