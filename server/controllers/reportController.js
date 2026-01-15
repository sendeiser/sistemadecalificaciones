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

    if (!division_id) {
        return res.status(400).json({ error: 'division_id required' });
    }
    try {
        let query = supabaseAdmin
            .from('asistencias_preceptor')
            .select('estado')
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
            return acc;
        }, { total: 0, present: 0, absent: 0, late: 0 });

        res.json(totals);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

// Global Dashboard Stats for Admin and Teacher
async function getGeneralDashboardStats(req, res) {
    try {
        // Fetch profile to get real role
        const { data: profile, error: pErr } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', req.user.id)
            .single();

        if (pErr || !profile) return res.status(404).json({ error: 'Perfil no encontrado' });

        const { rol: role } = profile;
        const id = req.user.id;

        if (role === 'admin') {
            // 1. Basic Counts
            const { count: studentCount } = await supabaseAdmin.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'alumno');
            const { count: divisionCount } = await supabaseAdmin.from('divisiones').select('*', { count: 'exact', head: true });
            const { count: subjectCount } = await supabaseAdmin.from('materias').select('*', { count: 'exact', head: true });

            // 2. Global Attendance % (from asistencias_preceptor)
            const { data: attData, error: attErr } = await supabaseAdmin
                .from('asistencias_preceptor')
                .select('estado');

            let globalAttendancePct = 0;
            if (!attErr && attData && attData.length > 0) {
                const presentCount = attData.filter(a => a.estado === 'presente' || a.estado === 'tarde').length;
                globalAttendancePct = Math.round((presentCount / attData.length) * 100);
            }

            // 3. Students per division
            const { data: divisions } = await supabaseAdmin.from('divisiones').select('id, anio, seccion');
            const studentsPerDiv = [];

            if (divisions) {
                for (const div of divisions) {
                    const { count } = await supabaseAdmin
                        .from('estudiantes_divisiones')
                        .select('*', { count: 'exact', head: true })
                        .eq('division_id', div.id);

                    studentsPerDiv.push({
                        name: `${div.anio} ${div.seccion}`,
                        count: count || 0
                    });
                }
            }

            res.json({
                studentCount: studentCount || 0,
                divisionCount: divisionCount || 0,
                subjectCount: subjectCount || 0,
                globalAttendancePct,
                studentsPerDivision: studentsPerDiv
            });

        } else if (role === 'docente') {
            // For teachers
            const { count: subjectCount } = await supabaseAdmin
                .from('asignaciones')
                .select('*', { count: 'exact', head: true })
                .eq('docente_id', id);

            const { data: assignments } = await supabaseAdmin
                .from('asignaciones')
                .select('id')
                .eq('docente_id', id);

            let totalStudentsSeen = 0;
            if (assignments && assignments.length > 0) {
                const { data: students } = await supabaseAdmin
                    .from('asistencias')
                    .select('estudiante_id')
                    .in('asignacion_id', assignments.map(a => a.id));

                if (students) {
                    const uniqueStudents = new Set(students.map(s => s.estudiante_id));
                    totalStudentsSeen = uniqueStudents.size;
                }
            }

            res.json({
                subjectCount: subjectCount || 0,
                studentCount: totalStudentsSeen
            });
        } else {
            res.json({});
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

// Generate PDF for Assignment Attendance (Teacher View)
async function generateAssignmentAttendancePDF(req, res) {
    const { assignmentId } = req.params;
    const { start_date, end_date } = req.query;

    try {
        // 1. Fetch Assignment Info
        const { data: assignment, error: aErr } = await supabaseAdmin
            .from('asignaciones')
            .select(`
                id,
                materia:materias(nombre),
                division:divisiones(anio, seccion),
                docente:perfiles(nombre)
            `)
            .eq('id', assignmentId)
            .single();

        if (aErr || !assignment) throw new Error('Asignación no encontrada');

        // 2. Fetch Records
        let query = supabaseAdmin
            .from('asistencias')
            .select(`
                fecha,
                estado,
                estudiante:perfiles!estudiante_id(nombre, dni)
            `)
            .eq('asignacion_id', assignmentId)
            .order('fecha', { ascending: true });

        if (start_date) query = query.gte('fecha', start_date);
        if (end_date) query = query.lte('fecha', end_date);

        const { data: records, error: rErr } = await query;
        if (rErr) throw rErr;

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Asistencia_${sanitize(assignment.materia.nombre)}.pdf`);
        doc.pipe(res);

        doc.fontSize(16).text('Reporte de Asistencia por Materia', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Materia: ${sanitize(assignment.materia.nombre)}`);
        doc.text(`División: ${assignment.division.anio} ${assignment.division.seccion}`);
        doc.text(`Docente: ${sanitize(assignment.docente?.nombre)}`);
        if (start_date || end_date) {
            doc.text(`Periodo: ${start_date || 'Inicio'} al ${end_date || 'Fin'}`);
        }
        doc.moveDown();

        const startX = 40;
        let currentY = doc.y;

        doc.font('Helvetica-Bold');
        doc.text('Fecha', startX, currentY);
        doc.text('Estudiante', startX + 80, currentY);
        doc.text('Estado', startX + 350, currentY);
        doc.moveTo(startX, currentY + 12).lineTo(555, currentY + 12).stroke();
        currentY += 20;
        doc.font('Helvetica');

        records.forEach((rec, i) => {
            if (currentY > 750) {
                doc.addPage();
                currentY = 40;
            }
            if (i % 2 === 0) {
                doc.save().fillColor('#f9f9f9').rect(startX, currentY - 2, 515, 14).fill().restore();
            }
            doc.text(rec.fecha, startX, currentY);
            doc.text(sanitize(rec.estudiante?.nombre).substring(0, 40), startX + 80, currentY);
            doc.text(rec.estado, startX + 350, currentY);
            currentY += 15;
        });

        doc.end();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

// Generate consolidated PDF Bulletin for a student
async function generateStudentBulletinPDF(req, res) {
    const studentId = req.params.studentId || req.user.id;
    const { role } = req.user;

    // Security check: Student can only see their own, Admin can see any
    if (role === 'alumno' && studentId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver este boletín.' });
    }

    try {
        // 1. Fetch Student Profile and Division
        const { data: student, error: sErr } = await supabaseAdmin
            .from('perfiles')
            .select(`
                id, nombre, dni,
                divisiones:estudiantes_divisiones(
                    division:divisiones(id, anio, seccion, ciclo_lectivo)
                )
            `)
            .eq('id', studentId)
            .single();

        if (sErr || !student) throw new Error('Alumno no encontrado');

        const division = student.divisiones?.[0]?.division;
        if (!division) throw new Error('Alumno no está asignado a ninguna división.');

        // 2. Fetch all subjects/assignments for this division
        const { data: assignments, error: aErr } = await supabaseAdmin
            .from('asignaciones')
            .select(`
                id,
                materia:materias(nombre),
                docente:perfiles(nombre)
            `)
            .eq('division_id', division.id);

        if (aErr) throw aErr;

        // 3. Fetch grades for this student in all assignments
        const { data: grades, error: gErr } = await supabaseAdmin
            .from('calificaciones')
            .select('*')
            .eq('alumno_id', studentId)
            .in('asignacion_id', assignments.map(a => a.id));

        if (gErr) throw gErr;

        // Merge Data
        const reportData = assignments.map(asig => {
            const g = grades.find(grade => grade.asignacion_id === asig.id) || {};
            return {
                materia: asig.materia.nombre,
                docente: asig.docente?.nombre || 'No asignado',
                parcial_1: g.parcial_1 || '-',
                parcial_2: g.parcial_2 || '-',
                parcial_3: g.parcial_3 || '-',
                parcial_4: g.parcial_4 || '-',
                promedio: g.promedio || '-',
                logro: g.logro_parcial || '-',
                intensificacion: g.nota_intensificacion || '-',
                trayecto: g.trayecto_acompanamiento || '-'
            };
        }).sort((a, b) => a.materia.localeCompare(b.materia));

        // 4. Generate PDF
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Boletin_${sanitize(student.nombre)}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(18).text('Boletín de Calificaciones', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10);
        doc.text(`Alumno: ${sanitize(student.nombre)}`, { continued: true });
        doc.text(`   DNI: ${sanitize(student.dni)}`, { align: 'right' });
        doc.text(`División: ${division.anio} ${division.seccion}`, { continued: true });
        doc.text(`   Ciclo Lectivo: ${division.ciclo_lectivo}`, { align: 'right' });
        doc.moveDown();
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown();

        const tableTop = doc.y;
        const colWidths = [140, 35, 35, 35, 35, 45, 100];
        const colX = [40, 180, 215, 250, 285, 320, 365];

        // Headers
        doc.font('Helvetica-Bold');
        doc.text('Materia', colX[0], tableTop);
        doc.text('P1', colX[1], tableTop);
        doc.text('P2', colX[2], tableTop);
        doc.text('P3', colX[3], tableTop);
        doc.text('P4', colX[4], tableTop);
        doc.text('Prom', colX[5], tableTop);
        doc.text('Trayecto', colX[6], tableTop);
        doc.moveDown();
        doc.font('Helvetica');

        let currentY = tableTop + 20;

        reportData.forEach((row, i) => {
            if (currentY > 750) {
                doc.addPage();
                currentY = 40;
            }
            if (i % 2 === 0) {
                doc.save().fillColor('#f9f9f9').rect(40, currentY - 2, 515, 14).fill().restore();
            }

            doc.text(sanitize(row.materia).substring(0, 30), colX[0], currentY);
            doc.text(row.parcial_1, colX[1], currentY);
            doc.text(row.parcial_2, colX[2], currentY);
            doc.text(row.parcial_3, colX[3], currentY);
            doc.text(row.parcial_4, colX[4], currentY);
            doc.text(row.promedio, colX[5], currentY);
            doc.text(sanitize(row.trayecto).substring(0, 20), colX[6], currentY);

            currentY += 15;
        });

        doc.end();

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

// Generate PDF for Division General Attendance (Admin/Preceptor View)
async function generateDivisionAttendancePDF(req, res) {
    const { divisionId } = req.params;
    const { start_date, end_date } = req.query;

    try {
        // 1. Fetch Division Info
        const { data: division, error: dErr } = await supabaseAdmin
            .from('divisiones')
            .select('*')
            .eq('id', divisionId)
            .single();

        if (dErr || !division) throw new Error('División no encontrada');

        // 2. Fetch Records from asistencias_preceptor
        let query = supabaseAdmin
            .from('asistencias_preceptor')
            .select(`
                fecha,
                estado,
                estudiante:perfiles!estudiante_id(nombre, dni)
            `)
            .eq('division_id', divisionId)
            .order('fecha', { ascending: true });

        if (start_date) query = query.gte('fecha', start_date);
        if (end_date) query = query.lte('fecha', end_date);

        const { data: records, error: rErr } = await query;
        if (rErr) throw rErr;

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Asistencia_General_${division.anio}_${division.seccion}.pdf`);
        doc.pipe(res);

        doc.fontSize(16).text('Reporte de Asistencia General (Preceptoria)', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`División: ${division.anio} ${division.seccion}`);
        doc.text(`Ciclo Lectivo: ${division.ciclo_lectivo}`);
        if (start_date || end_date) {
            doc.text(`Periodo: ${start_date || 'Inicio'} al ${end_date || 'Fin'}`);
        }
        doc.moveDown();

        const startX = 40;
        let currentY = doc.y;

        doc.font('Helvetica-Bold');
        doc.text('Fecha', startX, currentY);
        doc.text('Estudiante', startX + 80, currentY);
        doc.text('Estado', startX + 350, currentY);
        doc.moveTo(startX, currentY + 12).lineTo(555, currentY + 12).stroke();
        currentY += 20;
        doc.font('Helvetica');

        records.forEach((rec, i) => {
            if (currentY > 750) {
                doc.addPage();
                currentY = 40;
            }
            if (i % 2 === 0) {
                doc.save().fillColor('#f9f9f9').rect(startX, currentY - 2, 515, 14).fill().restore();
            }
            doc.text(rec.fecha, startX, currentY);
            doc.text(sanitize(rec.estudiante?.nombre).substring(0, 40), startX + 80, currentY);
            doc.text(rec.estado, startX + 350, currentY);
            currentY += 15;
        });

        doc.end();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

module.exports = {
    generateGradeReport,
    getAttendanceStats,
    getGeneralDashboardStats,
    generateStudentBulletinPDF,
    generateDivisionReport,
    generateAssignmentAttendancePDF,
    generateDivisionAttendancePDF
};

