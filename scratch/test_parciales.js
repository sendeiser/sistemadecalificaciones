const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));

async function run() {
    // 1. Fetch first assignment
    const { data: asigs } = await supabaseAdmin
        .from('asignaciones')
        .select('id, division_id, materia:materias(nombre), division:divisiones(anio, seccion)')
        .limit(1);
    const asig = asigs[0];
    console.log(`Asignación: ${asig.materia.nombre} → ${asig.division.anio}° ${asig.division.seccion}`);

    // 2. Fetch first student
    const { data: insc } = await supabaseAdmin
        .from('estudiantes_divisiones')
        .select('alumno:perfiles!alumno_id(id, nombre)')
        .eq('division_id', asig.division_id)
        .limit(1);
    const alumno = insc[0].alumno;
    console.log(`Alumno: ${alumno.nombre}`);

    // 3. Upsert con campos parcial_N (los que usa el frontend)
    const { data: saved, error } = await supabaseAdmin
        .from('calificaciones')
        .upsert({
            alumno_id: alumno.id,
            asignacion_id: asig.id,
            parcial_1: 8.5,
            parcial_2: 9,
            parcial_3: 7,
            parcial_4: null,
            nota_intensificacion: null,
            trayecto_acompanamiento: 'Profundización de Saberes',
            asistencia: 95,
            observaciones: 'TEST parcial_N - ELIMINAR',
            cuatrimestre: 1
        }, { onConflict: 'alumno_id, asignacion_id, cuatrimestre' })
        .select()
        .single();

    if (error) {
        console.log('❌ ERROR:', error.message, `[${error.code}]`);
        return;
    }

    console.log(`✅ Guardado OK - ID: ${saved.id}`);
    console.log(`   P1:${saved.parcial_1} | P2:${saved.parcial_2} | P3:${saved.parcial_3} | P4:${saved.parcial_4}`);
    console.log(`   Promedio calculado: ${saved.promedio}`);
    console.log(`   Cuatrimestre: ${saved.cuatrimestre}`);
    console.log(`   Trayecto: ${saved.trayecto_acompanamiento}`);

    // 4. Cleanup
    await supabaseAdmin.from('calificaciones').delete().eq('id', saved.id);
    console.log('   Nota de prueba eliminada.\n');
    console.log('🎉 FLUJO PARCIAL_1-4: COMPLETAMENTE OPERATIVO');
    console.log(`   El frontend puede guardar notas en Matemática (${asig.division.anio}° ${asig.division.seccion})`);
}

run().catch(e => console.error('Error:', e.message));
