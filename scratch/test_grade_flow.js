const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));

function pass(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.log(`  ❌ ${msg}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }
function section(title) { console.log(`\n══ ${title.toUpperCase()} ══`); }

async function runTest() {
    console.log('\n🔬 TEST: FLUJO COMPLETO DE NOTAS Y PLANILLA PDF\n');
    let errors = [];

    // ─── PASO 1: Asignaciones ─────────────────────────────────────────
    section('Paso 1: Asignaciones');
    const { data: asignaciones, error: aErr } = await supabaseAdmin
        .from('asignaciones')
        .select(`
            id, division_id,
            docente:perfiles!docente_id(id, nombre),
            materia:materias(id, nombre, campo_formacion, ciclo),
            division:divisiones(id, anio, seccion)
        `)
        .limit(3);

    if (aErr) { fail(`Error: ${aErr.message}`); errors.push('asignaciones'); return; }
    if (!asignaciones?.length) { fail('No hay asignaciones.'); errors.push('sin-asignaciones'); return; }

    pass(`${asignaciones.length} asignaciones encontradas.`);
    asignaciones.forEach(a => info(`${a.materia?.nombre} → ${a.division?.anio}°${a.division?.seccion} | Docente: ${a.docente?.nombre}`));

    const asig = asignaciones[0];

    // ─── PASO 2: Alumnos en la división ───────────────────────────────
    section('Paso 2: Alumnos en división');
    const { data: inscriptos, error: iErr } = await supabaseAdmin
        .from('estudiantes_divisiones')
        .select('alumno:perfiles!alumno_id(id, nombre, dni)')
        .eq('division_id', asig.division_id)
        .limit(5);

    if (iErr) { fail(`Error: ${iErr.message}`); errors.push('inscriptos'); }
    else if (!inscriptos?.length) {
        fail(`Sin alumnos en ${asig.division?.anio}° ${asig.division?.seccion}.`);
        errors.push('sin-alumnos');
    } else {
        pass(`${inscriptos.length} alumnos inscriptos.`);
        inscriptos.forEach(e => info(`${e.alumno?.nombre} (DNI: ${e.alumno?.dni})`));
    }

    const alumno = inscriptos?.[0]?.alumno;
    if (!alumno) { console.log('\n⛔ Sin alumnos para probar.'); return; }

    // ─── PASO 3: Verificar columnas nuevas en calificaciones ──────────
    section('Paso 3: Columnas en calificaciones');
    const { data: colSample, error: colErr } = await supabaseAdmin
        .from('calificaciones').select('cuatrimestre, logro_parcial, promedio_cuatrimestre').limit(1);

    if (colErr) { fail(`Columnas faltantes: ${colErr.message}`); errors.push('columnas'); }
    else pass('Columnas cuatrimestre + logro_parcial + promedio_cuatrimestre: OK');

    // Detectar si la tabla usa parcial_N o trimestre_N
    const { data: colFull } = await supabaseAdmin.from('calificaciones').select('*').limit(1);
    const sampleKeys = colFull?.[0] ? Object.keys(colFull[0]) : [];
    const usesTrimestre = sampleKeys.includes('trimestre_1');
    const usesParcial = sampleKeys.includes('parcial_1');
    info(`Estructura detectada: ${usesTrimestre ? 'trimestre_1/2/3' : usesParcial ? 'parcial_1/2/3/4' : 'desconocida'}`);

    // ─── PASO 4: Guardar nota de prueba ───────────────────────────────
    section('Paso 4: Guardar nota (upsert)');
    const testGrade = usesTrimestre ? {
        alumno_id: alumno.id,
        asignacion_id: asig.id,
        trimestre_1: 7.5,
        trimestre_2: 8,
        trimestre_3: null,
        asistencia: 90,
        observaciones: 'TEST AUTOMATIZADO',
        cuatrimestre: 1
    } : {
        alumno_id: alumno.id,
        asignacion_id: asig.id,
        parcial_1: 7.5,
        parcial_2: 8,
        parcial_3: null,
        parcial_4: null,
        asistencia: 90,
        observaciones: 'TEST AUTOMATIZADO',
        cuatrimestre: 1
    };

    const { data: savedGrade, error: saveErr } = await supabaseAdmin
        .from('calificaciones')
        .upsert(testGrade, { onConflict: 'alumno_id, asignacion_id, cuatrimestre' })
        .select().single();

    if (saveErr) {
        fail(`Error al guardar: ${saveErr.message} [${saveErr.code}]`);
        errors.push('upsert');
    } else {
        pass(`Nota guardada. ID: ${savedGrade.id}`);
        if (usesTrimestre)
            info(`T1:${savedGrade.trimestre_1} T2:${savedGrade.trimestre_2} | Promedio DB: ${savedGrade.promedio_anual} | Cuatrim: ${savedGrade.cuatrimestre}`);
        else
            info(`P1:${savedGrade.parcial_1} P2:${savedGrade.parcial_2} | Promedio DB: ${savedGrade.promedio} | Cuatrim: ${savedGrade.cuatrimestre}`);
    }

    // ─── PASO 5: Consulta completa para PDF ───────────────────────────
    section('Paso 5: Datos disponibles para planilla PDF');
    const gradeFields = usesTrimestre
        ? 'alumno_id, trimestre_1, trimestre_2, trimestre_3, promedio_anual, cuatrimestre, alumno:perfiles!alumno_id(nombre, dni)'
        : 'alumno_id, parcial_1, parcial_2, parcial_3, parcial_4, promedio, cuatrimestre, alumno:perfiles!alumno_id(nombre, dni)';

    const { data: pdfData, error: pdfErr } = await supabaseAdmin
        .from('calificaciones')
        .select(gradeFields)
        .eq('asignacion_id', asig.id)
        .eq('cuatrimestre', 1);

    if (pdfErr) fail(`Error consultando datos PDF: ${pdfErr.message}`);
    else {
        pass(`${pdfData.length} fila(s) para la planilla.`);
        pdfData.forEach((g, i) => {
            const p = usesTrimestre ? `T1=${g.trimestre_1} T2=${g.trimestre_2} T3=${g.trimestre_3} → Prom=${g.promedio_anual}` : `P1=${g.parcial_1} P2=${g.parcial_2} → Prom=${g.promedio}`;
            info(`${i+1}. ${g.alumno?.nombre}: ${p}`);
        });
    }

    // ─── PASO 6: Dependencias del servidor de PDF ─────────────────────
    section('Paso 6: Dependencias del servidor PDF');
    ['jspdf', 'jspdf-autotable', 'qrcode', 'crypto-js'].forEach(pkg => {
        try { require(path.join(serverDir, 'node_modules', pkg)); pass(`${pkg}: OK`); }
        catch { fail(`${pkg}: FALTA → cd server && npm install ${pkg}`); errors.push(pkg); }
    });

    // ─── LIMPIEZA ─────────────────────────────────────────────────────
    if (savedGrade) {
        await supabaseAdmin.from('calificaciones').delete().eq('id', savedGrade.id);
        info('\nNota de prueba eliminada.');
    }

    // ─── RESUMEN ──────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    if (errors.length === 0) {
        console.log('🎉 FLUJO COMPLETO: OPERATIVO');
        console.log(`   Materia:    ${asig.materia?.nombre}`);
        console.log(`   División:   ${asig.division?.anio}° ${asig.division?.seccion}`);
        console.log(`   Estructura: ${usesTrimestre ? 'trimestral (T1/T2/T3)' : 'cuatrimestral (P1/P2/P3/P4)'}`);
        console.log(`   PDF endpoint: GET /api/reports/division/${asig.id}`);
    } else {
        console.log(`⚠️  FLUJO CON ${errors.length} PROBLEMA(S): ${errors.join(', ')}`);
    }
    console.log('══════════════════════════════════════════════\n');
}

runTest().catch(e => console.error('\n💥 Error inesperado:', e.message));
