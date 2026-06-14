const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));

const mapping = {
    'Lengua y Literatura': { anio: '1ro', descripcion: 'Materia de Formación General', campo_formacion: 'Formación General', ciclo: 'Básico' },
    'Matemática': { anio: '1ro', descripcion: 'Materia de Formación General', campo_formacion: 'Formación General', ciclo: 'Básico' },
    'Inglés': { anio: '1ro', descripcion: 'Materia de Formación General', campo_formacion: 'Formación General', ciclo: 'Básico' },
    'Historia': { anio: '1ro', descripcion: 'Materia de Formación General', campo_formacion: 'Formación General', ciclo: 'Básico' },
    'Geografía': { anio: '1ro', descripcion: 'Materia de Formación General', campo_formacion: 'Formación General', ciclo: 'Básico' },
    'Formación Ética y Ciudadana': { anio: '1ro', descripcion: 'Materia de Formación General', campo_formacion: 'Formación General', ciclo: 'Básico' },
    'Educación Física': { anio: '1ro', descripcion: 'Educación Física General', campo_formacion: 'Educación Física', ciclo: 'Básico' },
    'Contabilidad': { anio: '1ro', descripcion: 'Materia de Contabilidad Básica', campo_formacion: 'Formación Comercial', ciclo: 'Básico' },
    'Taller de Emprendedurismo': { anio: '1ro', descripcion: 'Taller Práctico de Emprendimientos', campo_formacion: 'Taller', ciclo: 'Básico' },
    
    'Deporte y Recreación': { anio: '2do', descripcion: 'Materia de Educación Física', campo_formacion: 'Educación Física', ciclo: 'Básico' },
    'Anatomía y Fisiología': { anio: '2do', descripcion: 'Estudio de la anatomía y fisiología humana', campo_formacion: 'Formación General', ciclo: 'Básico' },
    'Primeros Auxilios': { anio: '2do', descripcion: 'Taller de Primeros Auxilios', campo_formacion: 'Taller', ciclo: 'Básico' },
    'Nutrición Deportiva': { anio: '2do', descripcion: 'Taller de Nutrición Deportiva', campo_formacion: 'Taller', ciclo: 'Básico' },
    
    'Economía': { anio: '3ro', descripcion: 'Principios de Economía', campo_formacion: 'Formación Comercial', ciclo: 'Superior' },
    'Gestión Organizacional': { anio: '3ro', descripcion: 'Administración y Gestión de Organizaciones', campo_formacion: 'Formación Comercial', ciclo: 'Superior' },
    'Práctica Impositiva': { anio: '3ro', descripcion: 'Prácticas de Liquidación de Impuestos', campo_formacion: 'Formación Comercial', ciclo: 'Superior' },
    'Sistemas de Información Contable': { anio: '3ro', descripcion: 'Sistemas Contables Avanzados', campo_formacion: 'Formación Comercial', ciclo: 'Superior' },
    'Derecho Comercial': { anio: '3ro', descripcion: 'Introducción al Derecho Comercial', campo_formacion: 'Formación Comercial', ciclo: 'Superior' },
    'Prácticas Profesionalizantes': { anio: '3ro', descripcion: 'Prácticas Profesionalizantes de Comercio', campo_formacion: 'Prácticas', ciclo: 'Superior' }
};

async function populateSubjects() {
    try {
        console.log('Fetching subjects from database...');
        const { data: subjects, error: fetchError } = await supabaseAdmin
            .from('materias')
            .select('id, nombre');

        if (fetchError) throw fetchError;

        console.log(`Found ${subjects.length} subjects. Starting population...`);

        let updatedCount = 0;

        for (const s of subjects) {
            const dataToUpdate = mapping[s.nombre];
            if (dataToUpdate) {
                console.log(`Updating "${s.nombre}" -> Year: ${dataToUpdate.anio}, Field: ${dataToUpdate.campo_formacion}`);
                const { error: updateError } = await supabaseAdmin
                    .from('materias')
                    .update(dataToUpdate)
                    .eq('id', s.id);

                if (updateError) {
                    console.error(`Error updating "${s.nombre}":`, updateError.message);
                } else {
                    updatedCount++;
                }
            } else {
                console.warn(`No mapping found for subject "${s.nombre}"`);
            }
        }

        console.log(`\nPopulation completed successfully. Updated ${updatedCount} out of ${subjects.length} subjects.`);
    } catch (err) {
        console.error('Fatal error during population:', err.message);
    }
}

populateSubjects();
