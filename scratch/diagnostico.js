const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));

async function check() {
    console.log('\n=== DIAGNÓSTICO COMPLETO DEL SISTEMA ===\n');

    // 1. Docentes
    const { data: docentes } = await supabaseAdmin.from('perfiles').select('id, nombre').eq('rol', 'docente');
    console.log(`👨‍🏫 Docentes: ${docentes?.length || 0}`);
    docentes?.forEach(d => console.log(`   - ${d.nombre}`));

    // 2. Materias
    const { data: materias } = await supabaseAdmin.from('materias').select('id, nombre, anio').limit(5);
    console.log(`\n📚 Materias (primeras 5): ${materias?.length || 0}`);
    materias?.forEach(m => console.log(`   - ${m.nombre} (año: ${m.anio || 'N/D'})`));

    // 3. Divisiones
    const { data: divisiones } = await supabaseAdmin.from('divisiones').select('id, anio, seccion, ciclo_lectivo');
    console.log(`\n🏫 Divisiones: ${divisiones?.length || 0}`);
    divisiones?.forEach(d => console.log(`   - ${d.anio} ${d.seccion} (${d.ciclo_lectivo})`));

    // 4. Asignaciones
    const { data: asignaciones } = await supabaseAdmin
        .from('asignaciones')
        .select(`
            id,
            docente:perfiles!docente_id(nombre),
            materia:materias(nombre),
            division:divisiones(anio, seccion)
        `);
    console.log(`\n🔗 Asignaciones docente→materia→división: ${asignaciones?.length || 0}`);
    asignaciones?.forEach(a => console.log(`   - ${a.docente?.nombre} | ${a.materia?.nombre} | ${a.division?.anio} ${a.division?.seccion}`));

    // 5. Alumnos en divisiones
    const { data: inscriptos } = await supabaseAdmin
        .from('estudiantes_divisiones')
        .select(`
            alumno:perfiles!alumno_id(nombre),
            division:divisiones(anio, seccion)
        `)
        .limit(5);
    console.log(`\n🎓 Alumnos inscriptos en divisiones: ${inscriptos?.length || 0} (mostrando máx 5)`);
    inscriptos?.forEach(e => console.log(`   - ${e.alumno?.nombre} → ${e.division?.anio} ${e.division?.seccion}`));

    // 6. Calificaciones
    const { data: califs, error: califErr } = await supabaseAdmin
        .from('calificaciones')
        .select('id, cuatrimestre, parcial_1, promedio')
        .limit(3);
    
    if (califErr?.message?.includes('cuatrimestre')) {
        console.log(`\n⚠️  Calificaciones: La columna 'cuatrimestre' NO EXISTE (error crítico)`);
    } else {
        console.log(`\n📊 Calificaciones existentes: ${califs?.length || 0}`);
        califs?.forEach(c => console.log(`   - P1:${c.parcial_1} | Prom:${c.promedio} | Cuatrim:${c.cuatrimestre}`));
    }

    console.log('\n=== FIN DIAGNÓSTICO ===\n');
}

check().catch(e => console.error('Error:', e.message));
