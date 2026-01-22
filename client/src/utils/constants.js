export const OBSERVATION_TEMPLATES = [
    "Mantiene un excelente desempeño académico y compromiso.",
    "Muestra gran interés y participación activa en las clases.",
    "Cumple con todas las actividades propuestas en tiempo y forma.",
    "Debe reforzar los contenidos básicos desarrollados.",
    "Se sugiere mayor compromiso con las tareas extra-clase.",
    "Presenta dificultades en la interpretación de consignas.",
    "Requiere apoyo constante para completar las tareas.",
    "Su desempeño ha mejorado notablemente en este periodo.",
    "Falta de entrega de trabajos prácticos obligatorios.",
    "Muestra dificultades en la integración de contenidos."
];

export const TRAYECTO_TEMPLATES = [
    "Profundización de Saberes mediante proyectos integradores.",
    "Fortalecimiento de Saberes con guías de actividades adicionales.",
    "Recuperación de Saberes: requiere tutorías específicas.",
    "Apropiación de Saberes: instancia de intensificación necesaria.",
    "Seguimiento personalizado por dificultades de aprendizaje.",
    "Plan de continuidad pedagógica por inasistencias prolongadas."
];

export const GET_GRADE_COLOR = (grade) => {
    const val = parseFloat(grade);
    if (isNaN(val) || val === null) return 'text-tech-muted';
    if (val >= 9) return 'text-tech-cyan';      // Destacado
    if (val >= 7) return 'text-tech-success';   // Satisfactorio
    if (val >= 6) return 'text-yellow-500';     // Básico
    return 'text-tech-danger';                  // Inicial/Pendiente
};

export const GET_GRADE_BG = (grade) => {
    const val = parseFloat(grade);
    if (isNaN(val) || val === null) return '';
    if (val >= 9) return 'bg-tech-cyan/10 border-tech-cyan/50';
    if (val >= 7) return 'bg-tech-success/10 border-tech-success/50';
    if (val >= 6) return 'bg-yellow-500/10 border-yellow-500/50';
    return 'bg-tech-danger/10 border-tech-danger/50';
};
