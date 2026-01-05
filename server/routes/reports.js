const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

const getCuatrimestre = () => {
    const month = new Date().getMonth() + 1; // 1-indexed
    return month < 8 ? 'Primer Cuatrimestre' : 'Segundo Cuatrimestre';
};

router.get('/:studentId', async (req, res) => {
    const { studentId } = req.params;

    try {
        // Fetch grades for the student
        // RLS will ensure that a student can only see their own grades, 
        // and teachers/admins can see what they are allowed to.
        // However, if a student requests another student's ID, RLS updates the query to return empty.

        // Detailed query to get all necessary info for report
        const { data: grades, error } = await req.supabase
            .from('calificaciones')
            .select(`
                parcial_1, parcial_2, parcial_3, parcial_4, promedio, logro, asistencia, observaciones,
                nota_intensificacion, logro_intensificacion, logro_parcial, trayecto_acompanamiento, promedio_cuatrimestre,
                asignacion:asignaciones!asignacion_id (
                    materia:materias(nombre),
                    division:divisiones(anio, seccion, ciclo_lectivo)
                ),
                student:perfiles!alumno_id (nombre, dni)
            `)
            .eq('alumno_id', studentId);

        if (error) throw error;

        if (!grades || grades.length === 0) {
            return res.status(404).json({ error: 'No grades found or unauthorized access' });
        }

        const student = grades[0].student;
        // Assuming all grades belong to the same division/cycle for the report context, 
        // or just take the first one.
        const division = grades[0].asignacion?.division;

        // Create PDF
        const doc = new PDFDocument();

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Boletin_${student.dni}.pdf`);

        doc.pipe(res);

        // Header
        const cuatrimestre = getCuatrimestre();
        doc.fontSize(20).text('REGISTRO DE CALIFICACIONES', { align: 'center' });
        doc.fontSize(12).text(cuatrimestre, { align: 'center' });
        doc.fontSize(10).text('Planilla de Acreditación de Saberes', { align: 'center' });
        doc.moveDown();

        // Student Info Box (Improved)
        doc.rect(50, 100, 500, 50).fillAndStroke('#f8fafc', '#334155');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11);
        doc.text(`ESTUDIANTE: ${student.nombre.toUpperCase()}`, 65, 110);
        doc.fontSize(10).font('Helvetica');
        doc.text(`DNI: ${student.dni || 'N/A'}`, 65, 125);
        if (division) {
            doc.text(`CURSO/ DIVISIÓN: ${division.anio} ${division.seccion}`, 350, 110);
            doc.text(`CICLO LECTIVO: ${division.ciclo_lectivo}`, 350, 125);
        }

        const drawHeaderS = (doc, y, colWidths, totalW) => {
            doc.fontSize(8).font('Helvetica-Bold');
            doc.rect(50, y, totalW, rowH).fillAndStroke('#f1f5f9', '#334155');
            doc.fillColor('#000000');
            let hX = 50;
            colWidths.forEach(col => {
                doc.text(col.label, hX + 2, y + 7, { width: col.width - 4, align: 'center' });
                doc.moveTo(hX, y).lineTo(hX, y + rowH).stroke('#334155');
                hX += col.width;
            });
            doc.moveTo(hX, y).lineTo(hX, y + rowH).stroke('#334155');
        };

        const colWidthsS = [
            { label: 'MATERIA', width: 120 },
            { label: 'P1', width: 22 },
            { label: 'P2', width: 22 },
            { label: 'P3', width: 22 },
            { label: 'P4', width: 22 },
            { label: 'PROM', width: 30 },
            { label: 'LOGRO', width: 35 },
            { label: 'TRAYECTO ACOMPAÑAMIENTO', width: 110 },
            { label: 'T.LO', width: 35 },
            { label: 'ASIST', width: 30 },
            { label: 'OBS.', width: 52 }
        ];

        const rowH = 20;
        const totalW = colWidthsS.reduce((s, c) => s + c.width, 0);
        const tableStartY = 170;

        drawHeaderS(doc, tableStartY, colWidthsS, totalW);

        // Body
        let currentY = tableStartY + rowH;
        doc.font('Helvetica').fontSize(7); // Slightly smaller for portrait grid

        grades.forEach((g, i) => {
            if (currentY > 720) {
                doc.addPage();
                currentY = 50;
                drawHeaderS(doc, currentY, colWidthsS, totalW);
                currentY += rowH;
                doc.font('Helvetica').fontSize(7);
            }

            let cellX = 50;
            doc.rect(50, currentY, totalW, rowH).stroke('#e2e8f0');

            const rowData = [
                (g.asignacion?.materia?.nombre || 'N/A').toUpperCase(),
                g.parcial_1 || '-',
                g.parcial_2 || '-',
                g.parcial_3 || '-',
                g.parcial_4 || '-',
                g.promedio || '-',
                g.logro_parcial || '-',
                g.trayecto_acompanamiento || '-',
                g.logro_trayecto || '-',
                `${g.asistencia || 0}%`,
                g.observaciones || '-'
            ];

            rowData.forEach((text, idx) => {
                const col = colWidthsS[idx];
                doc.text(text?.toString() || '-', cellX + 2, currentY + 7, {
                    width: col.width - 4,
                    ellipsis: true,
                    align: idx === 0 || idx === 7 ? 'left' : 'center'
                });
                doc.moveTo(cellX, currentY).lineTo(cellX, currentY + rowH).stroke('#e2e8f0');
                cellX += col.width;
            });
            doc.moveTo(cellX, currentY).lineTo(cellX, currentY + rowH).stroke('#e2e8f0');

            currentY += rowH;
        });

        doc.moveDown();
        doc.fontSize(8).text('Documento generado automáticamente.', { align: 'center', color: 'grey' });

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error:', err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/reports/division/:asignacionId
 * Generates a full Class Accreditation Sheet matching the physical form image.
 */
router.get('/division/:asignacionId', async (req, res) => {
    const { asignacionId } = req.params;

    try {
        const { data: grades, error } = await req.supabase
            .from('calificaciones')
            .select(`
                *,
                student:perfiles!alumno_id (nombre, dni),
                asignacion:asignaciones!asignacion_id (
                    docente:perfiles!docente_id(nombre),
                    materia:materias(nombre),
                    division:divisiones(*)
                )
            `)
            .eq('asignacion_id', asignacionId)
            .order('nombre', { referencedTable: 'student' });

        if (error) {
            console.error('Supabase error in PDF route:', error);
            throw error;
        }

        if (!grades || grades.length === 0) return res.status(404).json({ error: 'No se encontraron notas para esta asignación' });

        const info = grades[0]?.asignacion;
        if (!info || !info.division || !info.materia) {
            return res.status(400).json({ error: 'Información de asignación incompleta para generar el reporte' });
        }
        const doc = new PDFDocument({ layout: 'landscape', margin: 30 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Planilla_${info.division.anio}_${info.division.seccion}.pdf`);
        doc.pipe(res);

        // Header Structure (Simulating the image top part)
        const cuatrimestre = getCuatrimestre();
        doc.fontSize(14).font('Helvetica-Bold').text(`PLANILLA DE CALIFICACIONES - ${cuatrimestre}`, { align: 'center' });
        doc.fontSize(10).text('Acreditación de Saberes', { align: 'center' });
        doc.fontSize(8).font('Helvetica').text(`CURSO: ${info.division.anio}  SECCIÓN: ${info.division.seccion}  CICLO LECTIVO: ${info.division.ciclo_lectivo}`, { align: 'center' });
        doc.text(`MATERIA: ${info.materia.nombre}   DOCENTE: ${info.docente?.nombre || 'N/A'}`, { align: 'center' });
        doc.moveDown();

        const drawHeader = (doc, startY, colWidths, tableWidth) => {
            let currentX = 30;
            doc.fontSize(7).font('Helvetica-Bold');
            doc.rect(30, startY, tableWidth, rowHeight).fillAndStroke('#f1f5f9', '#334155');
            doc.fillColor('#000000');
            colWidths.forEach(col => {
                doc.text(col.label, currentX + 3, startY + 7, { width: col.width - 6, align: 'center' });
                doc.moveTo(currentX, startY).lineTo(currentX, startY + rowHeight).stroke('#334155');
                currentX += col.width;
            });
            doc.moveTo(currentX, startY).lineTo(currentX, startY + rowHeight).stroke('#334155');
        };

        const startY = 110;
        const colWidths = [
            { label: 'N°', width: 18 },
            { label: 'ESTUDIANTE', width: 120 },
            { label: 'DNI', width: 50 },
            { label: 'INT.N', width: 25 },
            { label: 'INT.L', width: 30 },
            { label: 'P1', width: 20 },
            { label: 'P2', width: 20 },
            { label: 'P3', width: 20 },
            { label: 'P4', width: 20 },
            { label: 'P.PR', width: 25 },
            { label: 'P.LO', width: 25 },
            { label: 'TRAYECTO ACOMPAÑAMIENTO (DESCRIPCIÓN)', width: 155 },
            { label: 'T.LO', width: 25 },
            { label: 'FIN', width: 25 },
            { label: 'ASIS', width: 25 },
            { label: 'OBSERVACIONES', width: 80 }
        ];

        const rowHeight = 20;
        const tableWidth = colWidths.reduce((sum, col) => sum + col.width, 0);

        // First page header
        drawHeader(doc, startY, colWidths, tableWidth);

        // Body
        let currentY = startY + rowHeight;
        doc.font('Helvetica').fontSize(6); // Slightly smaller for many columns

        grades.forEach((g, i) => {
            if (currentY > 520) {
                doc.addPage();
                currentY = 40;
                drawHeader(doc, currentY, colWidths, tableWidth);
                currentY += rowHeight;
                doc.font('Helvetica').fontSize(6);
            }

            let cellX = 30;
            if (i % 2 === 1) {
                doc.rect(30, currentY, tableWidth, rowHeight).fill('#f8fafc').stroke('#e2e8f0');
            } else {
                doc.rect(30, currentY, tableWidth, rowHeight).stroke('#e2e8f0');
            }
            doc.fillColor('#000000');

            const cellData = [
                i + 1,
                (g.student?.nombre || 'SIN NOMBRE').toUpperCase(),
                g.student?.dni || '-',
                g.nota_intensificacion || '-',
                g.logro_intensificacion || '-',
                g.parcial_1 || '-',
                g.parcial_2 || '-',
                g.parcial_3 || '-',
                g.parcial_4 || '-',
                g.promedio || '-',
                g.logro_parcial || '-',
                g.trayecto_acompanamiento || '-',
                g.logro_trayecto || '-',
                g.promedio_cuatrimestre || '-',
                `${g.asistencia || 0}%`,
                g.observaciones || '-'
            ];

            cellData.forEach((text, idx) => {
                const col = colWidths[idx];
                doc.text(text?.toString() || '-', cellX + 2, currentY + 7, {
                    width: col.width - 4,
                    ellipsis: true,
                    align: idx === 1 || idx === 11 ? 'left' : 'center'
                });
                doc.moveTo(cellX, currentY).lineTo(cellX, currentY + rowHeight).stroke('#e2e8f0');
                cellX += col.width;
            });
            doc.moveTo(cellX, currentY).lineTo(cellX, currentY + rowHeight).stroke('#e2e8f0');

            currentY += rowHeight;
        });

        doc.end();
    } catch (err) {
        console.error('Division Report Error:', err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

module.exports = router;
