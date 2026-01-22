const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');

/**
 * Generates a formal citation PDF for a student.
 */
async function generateCitationPDF(req, res) {
    const { studentId, studentName, studentDni, divisionName, totalAbsences } = req.body;

    if (!studentId || !studentName) {
        return res.status(400).json({ error: 'Faltan datos del alumno.' });
    }

    try {
        const doc = new jsPDF('p', 'mm', 'a4'); // Portrait

        // Fix for Node.js environment
        const applyAutoTableResult = autoTable.default || autoTable;

        // --- Header ---
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Escuela Técnico Agropecuaria', 105, 15, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('CUE: 4600328 - 00', 105, 20, { align: 'center' });
        doc.text('Chamical, La Rioja', 105, 25, { align: 'center' });

        doc.line(20, 30, 190, 30); // Horizontal line

        // --- Title ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ACTA DE CITACIÓN A PADRES/TUTORES', 105, 45, { align: 'center' });

        // --- Body ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        const today = new Date().toLocaleDateString('es-AR');
        doc.text(`Fecha: ${today}`, 20, 60);

        const text = `Por la presente se cita a los Sres. Padres y/o Tutores del alumno/a ${studentName.toUpperCase()}, DNI: ${studentDni || '.......'}, perteneciente a la división ${divisionName || '.......'}, por el siguiente motivo:`;

        const splitText = doc.splitTextToSize(text, 170);
        doc.text(splitText, 20, 75);

        // --- Reason Box ---
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(245, 245, 245);
        doc.rect(20, 95, 170, 30, 'F');
        doc.rect(20, 95, 170, 30, 'S');
        doc.text('MOTIVO: INASISTENCIAS REITERADAS', 25, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cantidad de inasistencias acumuladas a la fecha: ${totalAbsences}`, 25, 115);

        // --- Appointment ---
        doc.text('Se solicita su presencia en el establecimiento el día _____ / _____ / _____ a las ______ hs. para tratar temas relacionados con la trayectoria escolar del alumno.', 20, 140, { maxWidth: 170 });

        doc.text('Queda usted debidamente notificado.', 20, 165);

        // --- Signatures ---
        const sigY = 220;
        doc.line(30, sigY, 90, sigY);
        doc.text('Firma del Padre/Tutor', 60, sigY + 5, { align: 'center' });

        doc.line(120, sigY, 180, sigY);
        doc.text('Firma Preceptor/Director', 150, sigY + 5, { align: 'center' });

        const pdfBuffer = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=citacion_${studentName.replace(/\s+/g, '_')}.pdf`);
        res.send(Buffer.from(pdfBuffer));

    } catch (err) {
        console.error('Error generating citation PDF:', err);
        res.status(500).json({ error: 'Error al generar el PDF de citación: ' + err.message });
    }
}

module.exports = {
    generateCitationPDF
};
