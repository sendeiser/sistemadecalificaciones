const { supabaseAdmin } = require('../config/supabaseClient');
const PDFDocument = require('pdfkit');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');
const QRCode = require('qrcode');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');

// Helper to sanitize text for PDF
const sanitize = (str) => str ? String(str).replace(/[^\x20-\x7E]/g, '') : '';

// Generate PDF report for a specific assignment (Division + Subject)
// Generate PDF report for a specific assignment (Division + Subject) - Docente View
async function generateDivisionReport(req, res) {
    const { assignmentId } = req.params;
    console.log('--- DBG: GenerateDivisionReport (Unified) ---');

    try {
        // 1. Fetch Assignment Details to get division_id and materia_id
        const { data: assignment, error: aErr } = await supabaseAdmin
            .from('asignaciones')
            .select('division_id, materia_id')
            .eq('id', assignmentId)
            .single();

        if (aErr || !assignment) {
            return res.status(404).json({ error: 'Asignación no encontrada' });
        }

        // 2. Inject params to reuse the advanced logic
        req.query.assignment_id = assignmentId;
        req.query.division_id = assignment.division_id;
        req.query.materia_id = assignment.materia_id;

        return generateGradeReport(req, res);

    } catch (e) {
        console.error('Error in unified report redirection:', e);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error generando reporte PDF' });
        }
    }
}

// Helper to calculate Logro based on numeric grade
function getLogro(grade) {
    if (!grade) return '';
    const num = parseFloat(grade);
    if (isNaN(num)) return '';
    if (num >= 9) return 'LD'; // Logro Destacado
    if (num >= 7) return 'LS'; // Logro Satisfactorio
    if (num >= 6) return 'LB'; // Logro Básico
    if (num >= 1) return 'LAA/LIE'; // Logro Inicial
    return '';
}

// Get raw grade data as JSON for the frontend table
async function getGradeJSON(req, res) {
    const { division_id, materia_id, cuatrimestre } = req.query;
    const activeSemester = cuatrimestre ? parseInt(cuatrimestre) : (new Date().getMonth() + 1 > 7 ? 2 : 1);
    try {
        const { data: asignacion } = await supabaseAdmin
            .from('asignaciones')
            .select(`
                id,
                docente:perfiles(nombre),
                materia:materias(nombre, campo_formacion, ciclo),
                division:divisiones(anio, seccion, ciclo_lectivo)
            `)
            .eq('division_id', division_id)
            .eq('materia_id', materia_id)
            .maybeSingle();

        if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });

        // 1. Fetch Grades for specific semester
        const { data: gradesData } = await supabaseAdmin
            .from('calificaciones')
            .select('*')
            .eq('asignacion_id', asignacion.id)
            .eq('cuatrimestre', activeSemester);
        const gradesMap = {};
        (gradesData || []).forEach(g => { gradesMap[g.alumno_id] = g; });

        // 2. Fetch Attendance for this assignment
        const { data: attData } = await supabaseAdmin
            .from('asistencias')
            .select('estudiante_id, estado')
            .eq('asignacion_id', asignacion.id);

        const attStats = {};
        (attData || []).forEach(a => {
            if (!attStats[a.estudiante_id]) attStats[a.estudiante_id] = { total: 0, present: 0 };
            attStats[a.estudiante_id].total++;
            if (a.estado === 'presente' || a.estado === 'tarde') {
                attStats[a.estudiante_id].present++;
            }
        });

        // 3. Fetch Enrollment
        const { data: enrollment } = await supabaseAdmin
            .from('estudiantes_divisiones')
            .select(`alumno:perfiles!alumno_id (id, nombre, dni)`)
            .eq('division_id', division_id);

        const report = (enrollment || []).map(e => {
            const s = e.alumno;
            const g = gradesMap[s.id] || {};
            const stats = attStats[s.id] || { total: 0, present: 0 };

            const assistPct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : '-';

            return {
                alumno_id: s.id,
                nombre: s.nombre,
                dni: s.dni,
                nota_intensificacion: g.nota_intensificacion,
                logro_intensificacion: getLogro(g.nota_intensificacion),
                parcial_1: g.parcial_1,
                parcial_2: g.parcial_2,
                parcial_3: g.parcial_3,
                parcial_4: g.parcial_4,
                promedio: g.promedio,
                logro_promedio: getLogro(g.promedio),
                asistencia_porc: assistPct,
                trayecto_acompanamiento: g.trayecto_acompanamiento,
                logro_trayecto: '', // Placeholder for now or logic if exists
                observaciones: '', // Placeholder
                promedio_general: g.promedio // Promedio general matches promedio parcial as requested
            };
        }).sort((a, b) => a.nombre.localeCompare(b.nombre));

        res.json({ report, asignacion });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// Generate grade report for a specific division and materia (Advanced Layout)
async function generateGradeReport(req, res) {
    const { division_id, materia_id, assignment_id, cuatrimestre } = req.query;
    const activeSemester = cuatrimestre ? parseInt(cuatrimestre) : (new Date().getMonth() + 1 > 7 ? 2 : 1);
    console.log('--- GenerateGradeReport (Advanced PDF) --- Semester:', activeSemester);

    try {
        // 1. Security Check
        const { data: profile, error: pErr } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', req.user.id)
            .single();

        if (pErr || !profile || (profile.rol !== 'admin' && profile.rol !== 'docente' && profile.rol !== 'preceptor')) {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }

        if (!assignment_id && (!division_id || !materia_id)) {
            return res.status(400).json({ error: 'assignment_id or (division_id and materia_id) required' });
        }

        // 2. Fetch detailed Assignment + Materia + Division + Docente info
        let query = supabaseAdmin
            .from('asignaciones')
            .select(`
                id,
                docente:perfiles(nombre),
                materia:materias(nombre, campo_formacion, ciclo),
                division:divisiones(id, anio, seccion, ciclo_lectivo)
            `);

        if (assignment_id) {
            query = query.eq('id', assignment_id);
        } else {
            query = query.eq('division_id', division_id).eq('materia_id', materia_id);
        }

        // Use limit(1) to avoid "multiple rows" error if data is inconsistent
        const { data: asignacion, error: asigErr } = await query.limit(1).maybeSingle();

        if (asigErr) throw asigErr;
        if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });

        // 3. Fetch Grades for specific semester
        const { data: gradesData, error: gradesErr } = await supabaseAdmin
            .from('calificaciones')
            .select('*')
            .eq('asignacion_id', asignacion.id)
            .eq('cuatrimestre', activeSemester);

        if (gradesErr) throw gradesErr;

        // 3.b Fetch Attendance for this assignment
        const { data: attData } = await supabaseAdmin
            .from('asistencias')
            .select('estudiante_id, estado')
            .eq('asignacion_id', asignacion.id);

        const attStats = {};
        (attData || []).forEach(a => {
            if (!attStats[a.estudiante_id]) attStats[a.estudiante_id] = { total: 0, present: 0 };
            attStats[a.estudiante_id].total++;
            if (a.estado === 'presente' || a.estado === 'tarde') {
                attStats[a.estudiante_id].present++;
            }
        });

        // 4. Fetch Enrollment (Students)
        const { data: enrollment, error: enrollErr } = await supabaseAdmin
            .from('estudiantes_divisiones')
            .select(`
                alumno:perfiles!alumno_id (id, nombre, dni)
            `)
            .eq('division_id', asignacion.division.id);

        if (enrollErr) throw enrollErr;

        // 5. Merge Data
        const gradesMap = {};
        (gradesData || []).forEach(g => { gradesMap[g.alumno_id] = g; });

        const studentRows = (enrollment || []).map(e => {
            const s = e.alumno;
            const g = gradesMap[s.id] || {};
            const stats = attStats[s.id] || { total: 0, present: 0 };
            const assistPct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : '-';

            return {
                estudiante: s.nombre,
                dni: s.dni,
                intensificacion: g.nota_intensificacion,
                logro_intensificacion: getLogro(g.nota_intensificacion),
                p1: g.parcial_1,
                p2: g.parcial_2,
                p3: g.parcial_3,
                p4: g.parcial_4,
                promedio: g.promedio,
                logro_promedio: getLogro(g.promedio),
                asistencia: assistPct,
                trayecto: g.trayecto_acompanamiento,
                logro_trayecto: '', // Placeholder
                observaciones: '',
                promedio_general: g.promedio
            };
        }).sort((a, b) => a.estudiante.localeCompare(b.estudiante));

        // 6. Generate PDF
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

        // Fix for Node.js environment: apply plugin manually
        const applyAutoTableResult = autoTable.default || autoTable;
        const generateAutoTable = (options) => {
            if (typeof doc.autoTable === 'function') {
                doc.autoTable(options);
            } else {
                applyAutoTableResult(doc, options);
            }
        };

        // --- Page Border ---
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 287, 200); // Frame for A4 Landscape (297x210)
        doc.setLineWidth(0.1);

        // --- Header Rendering ---
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Escuela Técnico Agropecuaria', 148.5, 10, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('CUE: 4600328 - 00', 148.5, 15, { align: 'center' });
        doc.text('Paraje San Bartolo Km 4.5; Ruta Prov. 25- Chamical - La Rioja', 148.5, 20, { align: 'center' });
        doc.setFontSize(8);
        doc.text('Tel: 03826-424074 | Email: etachamical@gmail.com', 148.5, 24, { align: 'center' });

        // Title box
        const cuatrimestreStr = activeSemester === 1 ? 'Primer Cuatrimestre' : 'Segundo Cuatrimestre';

        doc.setFillColor(230, 230, 230); // Light gray
        doc.rect(14, 25, 269, 7, 'F');
        doc.rect(14, 25, 269, 7, 'S'); // Border
        doc.setFont('helvetica', 'bold');
        doc.text(`PLANILLAS DE CALIFICACIONES - Acreditación de Saberes (${cuatrimestreStr})`, 148.5, 30, { align: 'center' });

        // Info Rows
        const startY = 32;
        const rowHeight = 7;

        // Row 1: Curso, Ciclo, Ciclo Lectivo
        doc.rect(14, startY, 269, rowHeight);
        doc.setFont('helvetica', 'normal');
        doc.text(`CURSO: ${asignacion.division.anio} "${asignacion.division.seccion}"`, 16, startY + 5);
        doc.text(`Ciclo: ${asignacion.materia.ciclo || 'Básico'}`, 100, startY + 5);
        doc.text(`Ciclo Lectivo: ${asignacion.division.ciclo_lectivo || new Date().getFullYear()}`, 200, startY + 5);

        // Row 2: Campo de Formación
        doc.rect(14, startY + rowHeight, 269, rowHeight);
        doc.text(`CAMPO DE FORMACIÓN: ${asignacion.materia.campo_formacion || '-'}`, 16, startY + rowHeight + 5);

        // Row 3: Profesor
        doc.rect(14, startY + (rowHeight * 2), 269, rowHeight);
        doc.text(`PROFESOR/S DEL C.F.: ${asignacion.docente?.nombre || '-'}`, 16, startY + (rowHeight * 2) + 5);

        // Row 4: Espacios Curriculares
        doc.rect(14, startY + (rowHeight * 3), 269, rowHeight);
        doc.text(`Espacios curriculares: ${asignacion.materia.nombre}`, 16, startY + (rowHeight * 3) + 5);

        // --- Table ---
        const tableStartY = startY + (rowHeight * 4) + 5;
        const isSecondSemester = activeSemester === 2;

        // Base headers and body mapping
        let tableHead = [
            [
                { content: 'N°', rowSpan: 2, styles: { valign: 'middle' } },
                { content: 'ESTUDIANTES', rowSpan: 2, styles: { valign: 'middle', halign: 'left' } },
                { content: 'Perio. Intif', rowSpan: 2, styles: { valign: 'middle' } },
                { content: 'Logros', rowSpan: 2, styles: { valign: 'middle' } },
                { content: 'Calificaciones Parciales', colSpan: 4, styles: { halign: 'center' } },
                { content: 'Promedio\nParcial', rowSpan: 2, styles: { valign: 'middle' } },
                { content: 'Logros', rowSpan: 2, styles: { valign: 'middle' } },
                { content: '% Asist', rowSpan: 2, styles: { valign: 'middle' } },
                { content: 'Trayecto de\nAcompañamiento', rowSpan: 2, styles: { valign: 'middle' } },
                { content: 'Observaciones', rowSpan: 2, styles: { valign: 'middle' } },
                { content: 'Promedio\nGeneral', rowSpan: 2, styles: { valign: 'middle' } },
            ],
            ['1', '2', '3', '4']
        ];

        let tableBody = studentRows.map((s, index) => [
            index + 1,
            s.estudiante,
            s.intensificacion || '',
            s.logro_intensificacion || '',
            s.p1 || '',
            s.p2 || '',
            s.p3 || '',
            s.p4 || '',
            s.promedio || '',
            s.logro_promedio || '',
            s.asistencia !== '-' ? s.asistencia + '%' : '-',
            s.trayecto || '',
            s.observaciones || '',
            s.promedio_general || ''
        ]);

        let colStyles = {
            0: { cellWidth: 7 }, // N
            1: { cellWidth: 50, halign: 'left' }, // ESTUDIANTES
            2: { cellWidth: 15 }, // Intif
            3: { cellWidth: 15 }, // Logro Intif
            4: { cellWidth: 8 }, // P1
            5: { cellWidth: 8 }, // P2
            6: { cellWidth: 8 }, // P3
            7: { cellWidth: 8 }, // P4
            8: { cellWidth: 15 }, // Prom Parcial
            9: { cellWidth: 15 }, // Logro Prom
            10: { cellWidth: 15 }, // % Asist
            11: { cellWidth: 45 }, // Trayecto
            12: { cellWidth: 35 }, // Observaciones
            13: { cellWidth: 15 }, // Prom General
        };

        if (activeSemester === 2) {
            // Header: Remove Intensification columns (Index 2, 3)
            tableHead[0].splice(2, 2);
            tableHead[0][2].colSpan = 4; // 'Calificaciones Parciales' is now at index 2

            // Body: Remove from each row (Indices 2, 3)
            tableBody = tableBody.map(row => {
                const newRow = [...row];
                newRow.splice(2, 2); // Remove intensif (2) and logro_int (3)
                // Note: s.p1, s.p2, s.p3, s.p4 are already correct for the cuatrimestre row
                return newRow;
            });

            // Adjust styles
            colStyles = {
                0: { cellWidth: 7 }, // N
                1: { cellWidth: 60, halign: 'left' }, // ESTUDIANTES
                2: { cellWidth: 8 }, // P1
                3: { cellWidth: 8 }, // P2
                4: { cellWidth: 8 }, // P3
                5: { cellWidth: 8 }, // P4
                6: { cellWidth: 15 }, // Prom Parcial
                7: { cellWidth: 15 }, // Logro Prom
                8: { cellWidth: 15 }, // % Asist
                9: { cellWidth: 50 }, // Trayecto
                10: { cellWidth: 40 }, // Observaciones
                11: { cellWidth: 15 }, // Prom General
            };
        } else {
            // First Semester: Show Intif + 4 Partial columns
            tableHead[0][4].colSpan = 4;

            // Body: Keep everything (Indices 0..13)
            // No need to splice tableBody, base map is already 14 cols

            // Adjust styles
            colStyles = {
                0: { cellWidth: 7 }, // N
                1: { cellWidth: 50, halign: 'left' }, // ESTUDIANTES
                2: { cellWidth: 15 }, // Intif
                3: { cellWidth: 15 }, // Logro Intif
                4: { cellWidth: 8 }, // P1
                5: { cellWidth: 8 }, // P2
                6: { cellWidth: 8 }, // P3
                7: { cellWidth: 8 }, // P4
                8: { cellWidth: 15 }, // Prom Parcial
                9: { cellWidth: 15 }, // Logro Prom
                10: { cellWidth: 15 }, // % Asist
                11: { cellWidth: 45 }, // Trayecto
                12: { cellWidth: 35 }, // Observaciones
                13: { cellWidth: 15 }, // Prom General
            };
        }

        generateAutoTable({
            startY: tableStartY,
            head: tableHead,
            body: tableBody,
            styles: {
                fontSize: 7,
                cellPadding: 0.8,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                textColor: [0, 0, 0],
                valign: 'middle',
                halign: 'center'
            },
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineWidth: 0.1
            },
            columnStyles: colStyles,
            theme: 'grid'
        });

        // Signatures Area - Positioned at the bottom of the page
        const sigY = 175; // Coordinate for landscape A4 bottom

        doc.line(40, sigY, 100, sigY); // Line for Preceptor
        doc.text('Firma del Preceptor', 70, sigY + 5, { align: 'center' });

        doc.line(110, sigY, 170, sigY); // Line for Teacher
        doc.text('Firma del Docente', 140, sigY + 5, { align: 'center' });

        doc.line(180, sigY, 240, sigY); // Line for Director
        doc.text('Sello y Firma Dirección', 210, sigY + 5, { align: 'center' });

        // Footer table for stats (Cant. De Est. Acreditación, etc.) - Back to original position after main table
        const statsStartY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : sigY - 20;
        generateAutoTable({
            startY: statsStartY,
            head: [['Cant. De Est. Acreditación', 'Cant. De Est. Acompañamiento']],
            body: [['', '']], // Fill with logic if needed
            theme: 'grid',
            styles: { lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
            headStyles: { fillColor: [220, 220, 220] },
            tableWidth: 120
        });

        // --- QR Validation Section ---
        try {
            const validationId = uuidv4();
            const validationHash = CryptoJS.SHA256(validationId + asignacion.id).toString().slice(0, 16);

            // Use FRONTEND_URL from env if available, otherwise fallback to current host
            const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
            const validationUrl = `${baseUrl}/verify/${validationHash}`;

            const qrDataUrl = await QRCode.toDataURL(validationUrl);

            await supabaseAdmin.from('document_validations').insert({
                validation_hash: validationHash,
                document_type: 'planilla_curso',
                metadata: { division: asignacion.division.anio, materia: asignacion.materia.nombre },
                created_by: req.user.id
            });

            doc.addImage(qrDataUrl, 'PNG', 260, 175, 25, 25);
            doc.setFontSize(6);
            doc.text(`ID: ${validationHash}`, 260, 202);
            doc.text('Verificar Online', 260, 204);
        } catch (qrErr) {
            console.error('Error adding QR to course report:', qrErr);
        }

        const pdfBuffer = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_detallado.pdf');
        res.send(Buffer.from(pdfBuffer));

    } catch (e) {
        console.error('Error generating detailed PDF:', e);
        res.status(500).json({ error: 'Error generating PDF: ' + e.message });
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
            if (cur.estado === 'justificado') acc.justified++;
            return acc;
        }, { total: 0, present: 0, absent: 0, late: 0, justified: 0 });

        // Calculate average attendance percentage
        // Consider 'presente' and 'tarde' as attendance, 'ausente' as non-attendance
        // 'justificado' can be counted as attendance for the percentage
        const attendanceCount = totals.present + totals.late + totals.justified;
        const avgAsistencia = totals.total > 0
            ? Math.round((attendanceCount / totals.total) * 100)
            : 0;

        res.json({
            ...totals,
            avgAsistencia
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

async function getTeacherAttendanceStats(req, res) {
    const { assignment_id, start_date, end_date } = req.query;

    if (!assignment_id) {
        return res.status(400).json({ error: 'assignment_id required' });
    }
    try {
        let query = supabaseAdmin
            .from('asistencias')
            .select('estado')
            .eq('asignacion_id', assignment_id);

        if (start_date) query = query.gte('fecha', start_date);
        if (end_date) query = query.lte('fecha', end_date);

        const { data, error } = await query;
        if (error) throw error;

        const totals = data.reduce((acc, cur) => {
            acc.total++;
            if (cur.estado === 'ausente') acc.absent++;
            if (cur.estado === 'presente') acc.present++;
            if (cur.estado === 'tarde') acc.late++;
            if (cur.estado === 'justificado') acc.justified++;
            return acc;
        }, { total: 0, present: 0, absent: 0, late: 0, justified: 0 });

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

        if (role === 'admin' || role === 'preceptor') {
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
                materia:materias(nombre, ciclo, campo_formacion),
                division:divisiones(anio, seccion, ciclo_lectivo),
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

        // Statistics Summary logic
        const studentStats = {};
        const globalTotals = { present: 0, absent: 0, late: 0, justified: 0, total: records.length };
        records.forEach(rec => {
            const studentId = rec.estudiante?.dni || 'unknown';
            if (!studentStats[studentId]) {
                studentStats[studentId] = { nombre: rec.estudiante?.nombre || 'Unknown', present: 0, absent: 0, late: 0, justified: 0, total: 0 };
            }
            studentStats[studentId].total++;

            const stateMap = { 'presente': 'present', 'ausente': 'absent', 'tarde': 'late', 'justificado': 'justified' };
            const engState = stateMap[rec.estado];
            if (engState) {
                studentStats[studentId][engState]++;
                globalTotals[engState]++;
            }
        });

        const doc = new jsPDF('l', 'mm', 'a4');

        const applyAutoTableResult = autoTable.default || autoTable;
        const generateAutoTable = (options) => {
            if (typeof doc.autoTable === 'function') {
                doc.autoTable(options);
            } else {
                applyAutoTableResult(doc, options);
            }
        };

        // Page Border
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 287, 200);
        doc.setLineWidth(0.1);

        // Header Rendering
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Escuela Técnico Agropecuaria', 148.5, 10, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('CUE: 4600328 - 00', 148.5, 15, { align: 'center' });
        doc.text('Paraje San Bartolo Km 4.5; Ruta Prov. 25- Chamical - La Rioja', 148.5, 20, { align: 'center' });
        doc.setFontSize(8);
        doc.text('Tel: 03826-424074 | Email: etachamical@gmail.com', 148.5, 24, { align: 'center' });

        // Title box
        doc.setFillColor(230, 230, 230);
        doc.rect(14, 25, 269, 7, 'F');
        doc.rect(14, 25, 269, 7, 'S');
        doc.setFont('helvetica', 'bold');
        doc.text(`REPORTE DE ASISTENCIA POR MATERIA (CONTROL DOCENTE)`, 148.5, 30, { align: 'center' });

        // Info Rows
        const startY = 32;
        const rowHeight = 7;

        doc.rect(14, startY, 269, rowHeight);
        doc.setFont('helvetica', 'normal');
        doc.text(`CURSO: ${assignment.division.anio} "${assignment.division.seccion}"`, 16, startY + 5);
        doc.text(`Materia: ${assignment.materia.nombre}`, 100, startY + 5);
        doc.text(`Ciclo Lectivo: ${assignment.division.ciclo_lectivo}`, 200, startY + 5);

        doc.rect(14, startY + rowHeight, 269, rowHeight);
        doc.text(`PROFESOR/S: ${assignment.docente?.nombre || '-'}`, 16, startY + rowHeight + 5);
        if (start_date || end_date) {
            doc.text(`Periodo: ${start_date || 'Inicio'} al ${end_date || 'Fin'}`, 130, startY + rowHeight + 5);
        }
        doc.text(`Ciclo: ${assignment.materia.ciclo || 'Básico'}`, 210, startY + rowHeight + 5);

        // Table 1: Records
        generateAutoTable({
            startY: startY + rowHeight * 2 + 5,
            head: [['Fecha', 'Estudiante', 'Estado']],
            body: records.map(rec => {
                const dateParts = rec.fecha.split('-'); // YYYY-MM-DD
                const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : rec.fecha;
                return [
                    formattedDate,
                    rec.estudiante?.nombre || 'Unknown',
                    rec.estado.toUpperCase()
                ];
            }),
            styles: { fontSize: 8, cellPadding: 1, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
            theme: 'grid'
        });

        // Table 2: Statistics
        generateAutoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Estudiante', 'Pres.', 'Aus.', 'Tard.', 'Just.', '% Asist.']],
            body: Object.values(studentStats).map(s => {
                const pct = s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0;
                return [s.nombre, s.present, s.absent, s.late, s.justified, `${pct}%`];
            }),
            styles: { fontSize: 8, cellPadding: 1, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
            theme: 'grid'
        });

        // Global Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        const globalPct = globalTotals.total > 0 ? Math.round(((globalTotals.present + globalTotals.late) / globalTotals.total) * 100) : 0;
        doc.setFont('helvetica', 'bold');
        doc.text(`Resumen General: Presentes: ${globalTotals.present} | Ausentes: ${globalTotals.absent} | Tardes: ${globalTotals.late} | Justificados: ${globalTotals.justified}`, 14, finalY);
        doc.text(`Porcentaje de Asistencia Real de la Materia: ${globalPct}%`, 14, finalY + 7);

        // Standard Signatures for Attendance
        const sigY = finalY + 25;
        doc.line(40, sigY, 100, sigY);
        doc.text('Firma Docente', 70, sigY + 5, { align: 'center' });
        doc.line(180, sigY, 240, sigY);
        doc.text('Firma Preceptor / Dirección', 210, sigY + 5, { align: 'center' });

        const pdfOutput = doc.output();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Asistencia_${sanitize(assignment.materia.nombre)}.pdf`);
        res.send(Buffer.from(pdfOutput, 'binary'));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

// Generate consolidated PDF Bulletin for a student
async function generateStudentBulletinPDF(req, res) {
    const studentId = req.params.studentId || req.user.id;
    const { role } = req.user;

    console.log(`[REPORT] generating bulletin for ${studentId} (Role: ${role})`);

    // Security check: Student can only see their own, Admin can see any
    if (role === 'alumno' && studentId !== req.user.id) {
        console.warn(`[REPORT] Forbidden access to bulletin for ${studentId} by student ${req.user.id}`);
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

        // Merge Data - Handle multiple semesters
        const reportData = assignments.map(asig => {
            const g1 = grades.find(g => g.asignacion_id === asig.id && g.cuatrimestre === 1) || {};
            const g2 = grades.find(g => g.asignacion_id === asig.id && g.cuatrimestre === 2) || {};

            return {
                materia: asig.materia.nombre,
                docente: asig.docente?.nombre || 'No asignado',
                // Semester 1
                c1_p1: g1.parcial_1 || '-',
                c1_p2: g1.parcial_2 || '-',
                c1_p3: g1.parcial_3 || '-',
                c1_p4: g1.parcial_4 || '-',
                c1_prom: g1.promedio || '-',
                // Semester 2
                c2_p1: g2.parcial_1 || '-',
                c2_p2: g2.parcial_2 || '-',
                c2_p3: g2.parcial_3 || '-',
                c2_p4: g2.parcial_4 || '-',
                c2_prom: g2.promedio || '-',

                intensificacion: g1.nota_intensificacion || g2.nota_intensificacion || '-',
                trayecto: g1.trayecto_acompanamiento || g2.trayecto_acompanamiento || '-'
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

        // Revised columns for dual-semester layout (wider table or multi-line)
        // Since we have many columns, let's use a very small font and a wider landscape-like layout if needed
        // but A4 vertical is chosen. We will use two headers or grouped columns.

        doc.font('Helvetica-Bold');
        doc.fontSize(8);

        // Headers - Line 1: Main Categories
        doc.text('Materia', 40, tableTop);
        doc.text('1° Cuatrimestre', 150, tableTop, { width: 150, align: 'center' });
        doc.text('2° Cuatrimestre', 310, tableTop, { width: 150, align: 'center' });
        doc.text('Final', 470, tableTop, { width: 85, align: 'center' });

        // Headers - Line 2: Specific fields
        const tableHeaderY = tableTop + 12;
        doc.fontSize(7);
        doc.text('P1', 150, tableHeaderY);
        doc.text('P2', 175, tableHeaderY);
        doc.text('P3', 200, tableHeaderY);
        doc.text('P4', 225, tableHeaderY);
        doc.text('PR1', 250, tableHeaderY);

        doc.text('P1', 310, tableHeaderY);
        doc.text('P2', 335, tableHeaderY);
        doc.text('P3', 360, tableHeaderY);
        doc.text('P4', 385, tableHeaderY);
        doc.text('PR2', 410, tableHeaderY);

        doc.text('Int.', 470, tableHeaderY);
        doc.text('Prom', 500, tableHeaderY);

        doc.moveTo(40, tableHeaderY + 10).lineTo(555, tableHeaderY + 10).stroke();
        doc.font('Helvetica');

        let currentY = tableHeaderY + 20;

        reportData.forEach((row, i) => {
            if (currentY > 750) {
                doc.addPage();
                currentY = 40;
            }
            if (i % 2 === 0) {
                doc.save().fillColor('#f9f9f9').rect(40, currentY - 2, 515, 12).fill().restore();
            }

            doc.fontSize(7);
            doc.text(sanitize(row.materia).substring(0, 30), 40, currentY);

            // C1
            doc.text(row.c1_p1, 150, currentY);
            doc.text(row.c1_p2, 175, currentY);
            doc.text(row.c1_p3, 200, currentY);
            doc.text(row.c1_p4, 225, currentY);
            doc.text(row.c1_prom, 250, currentY);

            // C2
            doc.text(row.c2_p1, 310, currentY);
            doc.text(row.c2_p2, 335, currentY);
            doc.text(row.c2_p3, 360, currentY);
            doc.text(row.c2_p4, 385, currentY);
            doc.text(row.c2_prom, 410, currentY);

            // Total/Final
            doc.text(row.intensificacion, 470, currentY);

            // General Average (Calculated on the fly or fetched)
            let finalAvg = '-';
            if (row.c1_prom !== '-' && row.c2_prom !== '-') {
                finalAvg = ((parseFloat(row.c1_prom) + parseFloat(row.c2_prom)) / 2).toFixed(2);
            } else if (row.c1_prom !== '-') finalAvg = row.c1_prom;
            else if (row.c2_prom !== '-') finalAvg = row.c2_prom;

            doc.text(finalAvg, 500, currentY);

            currentY += 12;
        });

        // --- QR Validation Section for PDFKit ---
        try {
            const validationId = uuidv4();
            const validationHash = CryptoJS.SHA256(validationId + studentId).toString().slice(0, 16);

            // Use FRONTEND_URL from env if available, otherwise fallback to current host
            const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
            const validationUrl = `${baseUrl}/verify/${validationHash}`;

            // QRCode.toDataURL returns a base64 string
            const qrDataUrl = await QRCode.toDataURL(validationUrl);
            const qrImageBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
            const qrBuffer = Buffer.from(qrImageBase64, 'base64');

            await supabaseAdmin.from('document_validations').insert({
                validation_hash: validationHash,
                document_type: 'boletin_alumno',
                student_id: studentId,
                metadata: { alumno: student.nombre, division: division.anio },
                created_by: req.user.id
            });

            const qrSize = 60;
            const bottomY = doc.page.height - 100;
            doc.image(qrBuffer, 480, bottomY, { width: qrSize });
            doc.fontSize(7).text(`ID: ${validationHash}`, 480, bottomY + qrSize + 2, { width: qrSize, align: 'center' });
            doc.text('Validar Online', 480, bottomY + qrSize + 10, { width: qrSize, align: 'center' });

        } catch (qrErr) {
            console.error('Error adding QR to Bulletin:', qrErr);
        }

        // --- Signature Section (Added to Student Bulletin) ---
        const sigY = doc.page.height - 100;
        doc.fontSize(10);
        doc.moveTo(40, sigY).lineTo(200, sigY).stroke();
        doc.text('Firma del Docente', 40, sigY + 10, { width: 160, align: 'center' });

        doc.moveTo(250, sigY).lineTo(410, sigY).stroke();
        doc.text('Firma Preceptor / Dirección', 250, sigY + 10, { width: 160, align: 'center' });

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

        // Statistics Summary logic
        const studentStats = {};
        const globalTotals = { present: 0, absent: 0, late: 0, justified: 0, total: records.length };
        records.forEach(rec => {
            const studentId = rec.estudiante?.dni || 'unknown';
            if (!studentStats[studentId]) {
                studentStats[studentId] = { nombre: rec.estudiante?.nombre || 'Unknown', present: 0, absent: 0, late: 0, justified: 0, total: 0 };
            }
            studentStats[studentId].total++;

            const stateMap = { 'presente': 'present', 'ausente': 'absent', 'tarde': 'late', 'justificado': 'justified' };
            const engState = stateMap[rec.estado];
            if (engState) {
                studentStats[studentId][engState]++;
                globalTotals[engState]++;
            }
        });

        const doc = new jsPDF('l', 'mm', 'a4');

        const applyAutoTableResult = autoTable.default || autoTable;
        const generateAutoTable = (options) => {
            if (typeof doc.autoTable === 'function') {
                doc.autoTable(options);
            } else {
                applyAutoTableResult(doc, options);
            }
        };

        // Page Border
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 287, 200);
        doc.setLineWidth(0.1);

        // Header Rendering
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Escuela Técnico Agropecuaria', 148.5, 10, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('CUE: 4600328 - 00', 148.5, 15, { align: 'center' });
        doc.text('Paraje San Bartolo Km 4.5; Ruta Prov. 25- Chamical - La Rioja', 148.5, 20, { align: 'center' });
        doc.setFontSize(8);
        doc.text('Tel: 03826-424074 | Email: etachamical@gmail.com', 148.5, 24, { align: 'center' });

        // Title box
        doc.setFillColor(230, 230, 230);
        doc.rect(14, 25, 269, 7, 'F');
        doc.rect(14, 25, 269, 7, 'S');
        doc.setFont('helvetica', 'bold');
        doc.text(`REPORTE DE ASISTENCIA GENERAL (PRECEPTORIA)`, 148.5, 30, { align: 'center' });

        // Info Rows
        const startY = 32;
        const rowHeight = 7;

        doc.rect(14, startY, 269, rowHeight);
        doc.setFont('helvetica', 'normal');
        doc.text(`CURSO: ${division.anio} "${division.seccion}"`, 16, startY + 5);
        doc.text(`Ciclo Lectivo: ${division.ciclo_lectivo}`, 148.5, startY + 5, { align: 'center' });
        if (start_date || end_date) {
            doc.text(`Periodo: ${start_date || 'Inicio'} al ${end_date || 'Fin'}`, 267, startY + 5, { align: 'right' });
        }

        // Table 1: Records
        generateAutoTable({
            startY: startY + rowHeight + 5,
            head: [['Fecha', 'Estudiante', 'Estado']],
            body: records.map(rec => {
                const dateParts = rec.fecha.split('-'); // YYYY-MM-DD
                const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : rec.fecha;
                return [
                    formattedDate,
                    rec.estudiante?.nombre || 'Unknown',
                    rec.estado.toUpperCase()
                ];
            }),
            styles: { fontSize: 8, cellPadding: 1, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
            theme: 'grid'
        });

        // Table 2: Statistics
        generateAutoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Estudiante', 'Pres.', 'Aus.', 'Tard.', 'Just.', '% Asist.']],
            body: Object.values(studentStats).map(s => {
                const pct = s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0;
                return [s.nombre, s.present, s.absent, s.late, s.justified, `${pct}%`];
            }),
            styles: { fontSize: 8, cellPadding: 1, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
            theme: 'grid'
        });

        // Global Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        const globalPct = globalTotals.total > 0 ? Math.round(((globalTotals.present + globalTotals.late) / globalTotals.total) * 100) : 0;
        doc.setFont('helvetica', 'bold');
        doc.text(`Resumen General: Presentes: ${globalTotals.present} | Ausentes: ${globalTotals.absent} | Tardes: ${globalTotals.late} | Justificados: ${globalTotals.justified}`, 14, finalY);
        doc.text(`Porcentaje de Asistencia General de la División: ${globalPct}%`, 14, finalY + 7);

        // Standard Signatures for Attendance - Positioned at bottom
        const sigY = 175; // Coordinate for landscape A4 bottom
        doc.line(180, sigY, 240, sigY);
        doc.text('Firma Preceptor / Dirección', 210, sigY + 5, { align: 'center' });

        const pdfOutput = doc.output();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Asistencia_General_${division.anio}_${division.seccion}.pdf`);
        res.send(Buffer.from(pdfOutput, 'binary'));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

// Get students with low attendance (Alumnos en Riesgo)
async function getStudentsAtRisk(req, res) {
    try {
        const { data: profile } = await supabaseAdmin
            .from('perfiles')
            .select('rol')
            .eq('id', req.user.id)
            .single();

        if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

        const { rol: role } = profile;
        const id = req.user.id;
        const THRESHOLD = 0.75; // 75% attendance

        let riskList = [];

        if (role === 'admin' || role === 'preceptor') {
            const { data: allAttendance, error: attErr } = await supabaseAdmin
                .from('asistencias_preceptor')
                .select('estudiante_id, estado, estudiante:perfiles!estudiante_id(nombre, dni), division:divisiones(anio, seccion)');

            if (attErr) throw attErr;

            const studentMap = {};
            allAttendance.forEach(a => {
                if (!studentMap[a.estudiante_id]) {
                    studentMap[a.estudiante_id] = {
                        id: a.estudiante_id,
                        nombre: a.estudiante.nombre,
                        dni: a.estudiante.dni,
                        division: `${a.division.anio} ${a.division.seccion}`,
                        total: 0,
                        present: 0
                    };
                }
                studentMap[a.estudiante_id].total++;
                if (a.estado === 'presente' || a.estado === 'tarde') {
                    studentMap[a.estudiante_id].present++;
                }
            });

            riskList = Object.values(studentMap)
                .map(s => ({
                    ...s,
                    pct: Math.round((s.present / s.total) * 100)
                }))
                .filter(s => s.pct < (THRESHOLD * 100) && s.total >= 3)
                .sort((a, b) => a.pct - b.pct);

        } else if (role === 'docente') {
            const { data: assignments } = await supabaseAdmin
                .from('asignaciones')
                .select('id')
                .eq('docente_id', id);

            if (assignments && assignments.length > 0) {
                const { data: attData, error: attErr } = await supabaseAdmin
                    .from('asistencias')
                    .select('estudiante_id, estado, estudiante:perfiles!estudiante_id(nombre, dni), asignacion:asignaciones(materia:materias(nombre), division:divisiones(anio, seccion))')
                    .in('asignacion_id', assignments.map(a => a.id));

                if (attErr) throw attErr;

                const studentMap = {};
                attData.forEach(a => {
                    const key = `${a.estudiante_id}-${a.asignacion.materia.nombre}`;
                    if (!studentMap[key]) {
                        studentMap[key] = {
                            id: a.estudiante_id,
                            nombre: a.estudiante.nombre,
                            materia: a.asignacion.materia.nombre,
                            division: `${a.asignacion.division.anio} ${a.asignacion.division.seccion}`,
                            total: 0,
                            present: 0
                        };
                    }
                    studentMap[key].total++;
                    if (a.estado === 'presente' || a.estado === 'tarde') {
                        studentMap[key].present++;
                    }
                });

                riskList = Object.values(studentMap)
                    .map(s => ({
                        ...s,
                        pct: Math.round((s.present / s.total) * 100)
                    }))
                    .filter(s => s.pct < (THRESHOLD * 100) && s.total >= 2)
                    .sort((a, b) => a.pct - b.pct);
            }
        }

        res.json(riskList.slice(0, 5));
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
    generateDivisionAttendancePDF,
    getStudentsAtRisk,
    getTeacherAttendanceStats,
    getGradeJSON
};

