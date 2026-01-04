const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

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
        doc.fontSize(20).text('REGISTRO DE CALIFICACIONES', { align: 'center' });
        doc.fontSize(10).text('Planilla de Acreditación de Saberes', { align: 'center' });
        doc.moveDown();

        // Student Info Box
        doc.rect(50, 100, 500, 60).stroke();
        doc.fontSize(12).text(`Estudiante: ${student.nombre}`, 60, 110);
        doc.text(`DNI: ${student.dni || 'N/A'}`, 60, 125);
        if (division) {
            doc.text(`División: ${division.anio} ${division.seccion}`, 400, 110);
            doc.text(`Ciclo Lectivo: ${division.ciclo_lectivo}`, 400, 125);
        }

        doc.moveDown(4);

        // Table Header
        const startY = 180;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Materia', 50, startY);
        doc.text('P1', 200, startY);
        doc.text('P2', 230, startY);
        doc.text('P3', 260, startY);
        doc.text('P4', 290, startY);
        doc.text('Prom', 320, startY);
        doc.text('Logro', 360, startY);
        doc.text('Asist %', 410, startY);
        doc.text('Observaciones', 460, startY);

        doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();

        // Table Body
        doc.font('Helvetica');
        let currentY = startY + 25;

        grades.forEach((g) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }
            doc.text(g.asignacion?.materia?.nombre || 'N/A', 50, currentY, { width: 140 });
            doc.text(g.parcial_1?.toString() || '-', 200, currentY);
            doc.text(g.parcial_2?.toString() || '-', 230, currentY);
            doc.text(g.parcial_3?.toString() || '-', 260, currentY);
            doc.text(g.parcial_4?.toString() || '-', 290, currentY);
            doc.text(g.promedio?.toString() || '-', 320, currentY);
            doc.text(g.logro || '-', 360, currentY);
            doc.text(`${g.asistencia || 0}%`, 410, currentY);
            doc.text(g.observaciones || '', 460, currentY, { width: 90 });

            currentY += 25;
            doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).dash(2, { space: 2 }).stroke().undash();
        });

        doc.moveDown();
        doc.fontSize(8).text('Documento generado automáticamente.', { align: 'center', color: 'grey' });

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error:', err);
        // If headers already sent, we can't send JSON error, but stream will fail.
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

module.exports = router;
