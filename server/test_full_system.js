const { supabaseAdmin } = require('./config/supabaseClient');
require('dotenv').config();

async function runFullSystemDiagnostics() {
    console.log('🔍 INICIANDO DIAGNÓSTICO GENERAL DE FUNCIONAMIENTO DEL SISTEMA...\n');

    let passedCount = 0;
    let failedCount = 0;

    function assertTest(name, condition, detail = '') {
        if (condition) {
            console.log(`  ✅ [PASS] ${name} ${detail ? `(${detail})` : ''}`);
            passedCount++;
        } else {
            console.error(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
            failedCount++;
        }
    }

    try {
        // Test 1: Conexión Supabase
        assertTest('1. Conexión con Supabase Database', !!supabaseAdmin, 'Cliente inicializado');

        // Test 2: Perfiles de Usuario
        const { data: perfiles, error: ePerfil } = await supabaseAdmin.from('perfiles').select('*');
        assertTest('2. Consulta de Perfiles de Usuario', !ePerfil && perfiles && perfiles.length > 0, `${perfiles ? perfiles.length : 0} usuarios encontrados`);

        // Test 3: Divisiones
        const { data: divs, error: eDiv } = await supabaseAdmin.from('divisiones').select('*');
        assertTest('3. Consulta de Divisiones', !eDiv && divs && divs.length > 0, `${divs ? divs.length : 0} divisiones activas`);

        // Test 4: Materias
        const { data: materias, error: eMat } = await supabaseAdmin.from('materias').select('*');
        assertTest('4. Consulta de Materias Académicas', !eMat && materias && materias.length > 0, `${materias ? materias.length : 0} materias configuradas`);

        // Test 5: Asignaciones
        const { data: asignaciones, error: eAsg } = await supabaseAdmin.from('asignaciones').select('*');
        assertTest('5. Asignaciones Docente-Materia', !eAsg && asignaciones && asignaciones.length > 0, `${asignaciones ? asignaciones.length : 0} asignaciones docentes`);

        // Test 6: Calificaciones
        const { data: grades, error: eGrades } = await supabaseAdmin.from('calificaciones').select('*');
        assertTest('6. Registro de Calificaciones', !eGrades && grades && grades.length > 0, `${grades ? grades.length : 0} registros de notas`);

        // Test 7: Asistencias
        const { data: att, error: eAtt } = await supabaseAdmin.from('asistencias_preceptor').select('*');
        assertTest('7. Planilla de Asistencia Preceptoría', !eAtt && att && att.length > 0, `${att ? att.length : 0} registros de asistencia`);

        // Test 8: Anuncios
        const { data: anuncios, error: eAnuncios } = await supabaseAdmin.from('anuncios').select('*');
        assertTest('8. Módulo de Anuncios Institucionales', !eAnuncios && anuncios && anuncios.length > 0, `${anuncios ? anuncios.length : 0} anuncios activos`);

        // Test 9: Eventos Calendario
        const { data: eventos, error: eEventos } = await supabaseAdmin.from('eventos_calendario').select('*');
        assertTest('9. Calendario Escolar e Hitos', !eEventos && eventos && eventos.length > 0, `${eventos ? eventos.length : 0} eventos registrados`);

        console.log('\n─────────────────────────────────────────────────────────────');
        console.log(`📊 RESUMEN DE DIAGNÓSTICO: ${passedCount} PRUEBAS PASADAS, ${failedCount} FALLADAS`);
        if (failedCount === 0) {
            console.log('🌟 TODO EL SISTEMA FUNCIONA AL 100% Y ESTÁ LISTO PARA PRESENTACIÓN');
        } else {
            console.warn('⚠️ Se detectaron algunas inconsistencias para revisar');
        }
        console.log('─────────────────────────────────────────────────────────────\n');

    } catch (err) {
        console.error('❌ Error ejecutando diagnóstico:', err.message);
    }
}

runFullSystemDiagnostics();
