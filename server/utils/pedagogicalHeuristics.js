/**
 * Engine for pedagogical heuristics.
 * Analyzes grades and attendance locally to provide free, immediate insights.
 */

const analyzeStudentData = (student, grades, attendance) => {
    const summary = {
        analisis: "",
        recomendaciones: [],
        riesgo: "bajo"
    };

    // 1. Attendance Analysis
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.estado === 'presente' || a.estado === 'tarde').length;
    const attendancePct = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

    // 2. Academic Analysis
    const validGrades = grades.filter(g => g.promedio && !isNaN(parseFloat(g.promedio)));
    const avgGrade = validGrades.length > 0
        ? validGrades.reduce((acc, curr) => acc + parseFloat(curr.promedio), 0) / validGrades.length
        : 0;

    const failingSubjects = validGrades.filter(g => parseFloat(g.promedio) < 6).length;

    // --- Logic Construction ---

    // Risk Categorization
    if (attendancePct < 75 || failingSubjects >= 3 || (avgGrade < 5 && avgGrade > 0)) {
        summary.riesgo = "alto";
    } else if (attendancePct < 85 || failingSubjects > 0 || avgGrade < 7) {
        summary.riesgo = "medio";
    } else {
        summary.riesgo = "bajo";
    }

    // Analysis Generation
    if (summary.riesgo === "bajo") {
        summary.analisis = `${student.nombre} presenta un desempeño sólido. Con un promedio general de ${avgGrade.toFixed(2)} y ${attendancePct.toFixed(0)}% de asistencia, demuestra compromiso y regularidad en el proceso de aprendizaje técnico.`;
        summary.recomendaciones = [
            "Participar en proyectos de tutoría para fortalecer el liderazgo.",
            "Mantener el nivel de organización actual para el próximo cuatrimestre.",
            "Explorar áreas de profundización en las materias de mayor interés."
        ];
    } else if (summary.riesgo === "medio") {
        summary.analisis = `Se observa una situación de alerta moderada. ${student.nombre} tiene ${failingSubjects} materia(s) por debajo del objetivo y un promedio de ${avgGrade.toFixed(2)}. La asistencia del ${attendancePct.toFixed(0)}% es aceptable pero requiere monitoreo.`;
        summary.recomendaciones = [
            "Reforzar el estudio en las áreas con calificaciones menores a 6.",
            "Asegurar la entrega a tiempo de todos los trabajos prácticos pendientes.",
            "Coordinar una entrevista con los docentes de las materias críticas."
        ];
    } else {
        summary.analisis = `Situación crítica que requiere intervención inmediata. El rendimiento académico (${avgGrade.toFixed(2)}) y/o el presentismo (${attendancePct.toFixed(0)}%) están por debajo de los estándares institucionales, dificultando la acreditación de saberes.`;
        summary.recomendaciones = [
            "Establecer un plan de recuperación de saberes obligatorio.",
            "Citar a los tutores para coordinar una estrategia de apoyo en el hogar.",
            "Realizar un seguimiento diario de la asistencia y participación en clase."
        ];
    }

    return summary;
};

module.exports = { analyzeStudentData };
