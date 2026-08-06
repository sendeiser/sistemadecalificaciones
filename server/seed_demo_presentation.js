const { supabaseAdmin } = require('./config/supabaseClient');
require('dotenv').config();

async function seedDemoPresentation() {
    console.log('🚀 INICIANDO GENERACIÓN DE DATOS INSTITUCIONALES PARA PRESENTACIÓN...\n');

    if (!supabaseAdmin) {
        console.error('❌ Error: supabaseAdmin no está configurado. Revisa SUPABASE_SERVICE_ROLE_KEY en server/.env');
        process.exit(1);
    }

    try {
        // 1. DIVISIONES
        console.log('📌 1. Verificando/Creando Divisiones...');
        let { data: divisionsList } = await supabaseAdmin.from('divisiones').select('*');
        if (!divisionsList || divisionsList.length === 0) {
            const divisionsData = [
                { anio: 1, seccion: '1ra', ciclo: 'Ciclo Básico', orientacion: 'Técnico Agropecuario' },
                { anio: 2, seccion: 'Unica', ciclo: 'Ciclo Básico', orientacion: 'Técnico Agropecuario' },
                { anio: 3, seccion: 'Unica', ciclo: 'Ciclo Básico', orientacion: 'Técnico Agropecuario' },
                { anio: 4, seccion: 'Unica', ciclo: 'Ciclo Superior', orientacion: 'Técnico Agropecuario' },
                { anio: 5, seccion: 'Unica', ciclo: 'Ciclo Superior', orientacion: 'Técnico Agropecuario' },
                { anio: 6, seccion: 'Unica', ciclo: 'Ciclo Superior', orientacion: 'Técnico Agropecuario' }
            ];
            const { data: inserted, error } = await supabaseAdmin.from('divisiones').insert(divisionsData).select();
            if (!error && inserted) divisionsList = inserted;
        }
        console.log(`✅ Divisiones activas: ${divisionsList ? divisionsList.length : 0}`);

        // 2. MATERIAS
        console.log('\n📌 2. Verificando/Creando Materias Académicas...');
        let { data: subjectsList } = await supabaseAdmin.from('materias').select('*');
        if (!subjectsList || subjectsList.length === 0) {
            const subjectsData = [
                { nombre: 'Matemática I', descripcion: 'Matemática orientada a cálculos agropecuarios', anio: 1, campo_formacion: 'General', ciclo: 'Ciclo Básico' },
                { nombre: 'Física y Química I', descripcion: 'Principios físico-químicos fundamentales', anio: 1, campo_formacion: 'General', ciclo: 'Ciclo Básico' },
                { nombre: 'Biología I', descripcion: 'Biología vegetal y animal básica', anio: 1, campo_formacion: 'Científico Tecnológico', ciclo: 'Ciclo Básico' },
                { nombre: 'Producción Vegetal I', descripcion: 'Manejo de suelo y cultivos de la región', anio: 1, campo_formacion: 'Técnico Específico', ciclo: 'Ciclo Básico' },
                { nombre: 'Educación Tecnológica', descripcion: 'Sistemas tecnológicos y automatización', anio: 1, campo_formacion: 'Científico Tecnológico', ciclo: 'Ciclo Básico' },
                { nombre: 'Maquinaria Agrícola', descripcion: 'Mantenimiento y operación de maquinaria', anio: 4, campo_formacion: 'Técnico Específico', ciclo: 'Ciclo Superior' },
                { nombre: 'Biotecnología Agropecuaria', descripcion: 'Mejoramiento genético y bioprocesos', anio: 5, campo_formacion: 'Técnico Específico', ciclo: 'Ciclo Superior' }
            ];
            const { data: inserted } = await supabaseAdmin.from('materias').insert(subjectsData).select();
            if (inserted) subjectsList = inserted;
        }
        console.log(`✅ Materias disponibles: ${subjectsList ? subjectsList.length : 0}`);

        // 3. PERFILES DE USUARIOS
        console.log('\n📌 3. Verificando Perfiles de Usuario...');
        const { data: profiles } = await supabaseAdmin.from('perfiles').select('*');
        const profilesList = profiles || [];

        const adminProfile = profilesList.find(p => p.rol === 'admin') || profilesList[0];
        const teacherProfiles = profilesList.filter(p => p.rol === 'docente');
        const studentProfiles = profilesList.filter(p => p.rol === 'alumno');
        const preceptorProfiles = profilesList.filter(p => p.rol === 'preceptor');

        console.log(`ℹ️ Perfiles encontrados: ${studentProfiles.length} alumnos, ${teacherProfiles.length} docentes, ${preceptorProfiles.length} preceptores.`);

        // 4. ASIGNACIONES DE DOCENTES
        console.log('\n📌 4. Generando Asignaciones Docente-Materia-División...');
        let mainTeacher = teacherProfiles[0] || adminProfile;
        let mainDiv = divisionsList[0];

        let { data: assignmentsList } = await supabaseAdmin.from('asignaciones').select('*');
        if ((!assignmentsList || assignmentsList.length === 0) && mainTeacher && mainDiv && subjectsList.length > 0) {
            const asgsToInsert = subjectsList.map(subj => ({
                docente_id: mainTeacher.id,
                materia_id: subj.id,
                division_id: mainDiv.id
            }));
            const { data: insertedAsgs } = await supabaseAdmin.from('asignaciones').insert(asgsToInsert).select();
            if (insertedAsgs) assignmentsList = insertedAsgs;
        }
        console.log(`✅ Asignaciones de clase activas: ${assignmentsList ? assignmentsList.length : 0}`);

        // 5. VINCULACIÓN DE ESTUDIANTES EN DIVISIONES
        console.log('\n📌 5. Inscribiendo Estudiantes en Divisiones...');
        if (mainDiv && studentProfiles.length > 0) {
            for (const st of studentProfiles) {
                const { data: existing } = await supabaseAdmin
                    .from('estudiantes_divisiones')
                    .select('*')
                    .eq('estudiante_id', st.id)
                    .eq('division_id', mainDiv.id)
                    .maybeSingle();

                if (!existing) {
                    await supabaseAdmin
                        .from('estudiantes_divisiones')
                        .insert({
                            estudiante_id: st.id,
                            division_id: mainDiv.id
                        });
                }
            }
        }
        console.log(`✅ ${studentProfiles.length} estudiantes vinculados a la división.`);

        // 6. CALIFICACIONES REALISTAS
        console.log('\n📌 6. Registrando Calificaciones y Notas en la Base de Datos...');
        let gradesCount = 0;

        if (assignmentsList && assignmentsList.length > 0 && studentProfiles.length > 0) {
            for (let i = 0; i < studentProfiles.length; i++) {
                const student = studentProfiles[i];
                const isTopStudent = (i % 3 === 0);
                const isCriticalStudent = (i === studentProfiles.length - 1);

                for (const asg of assignmentsList) {
                    let p1 = isCriticalStudent ? 4.0 : (isTopStudent ? 9.5 : 7.5);
                    let p2 = isCriticalStudent ? 5.0 : (isTopStudent ? 9.0 : 8.0);
                    let p3 = isCriticalStudent ? 4.5 : (isTopStudent ? 10.0 : 7.0);

                    const { data: existing } = await supabaseAdmin
                        .from('calificaciones')
                        .select('*')
                        .eq('alumno_id', student.id)
                        .eq('asignacion_id', asg.id)
                        .eq('cuatrimestre', 1)
                        .maybeSingle();

                    if (existing) {
                        await supabaseAdmin
                            .from('calificaciones')
                            .update({
                                parcial_1: p1,
                                parcial_2: p2,
                                parcial_3: p3,
                                asistencia: isCriticalStudent ? 72 : 95,
                                observaciones: isCriticalStudent ? 'Requiere seguimiento en tutoría y recuperatorio.' : 'Excelente desempeño académico y participación activa en trabajos de campo.'
                            })
                            .eq('id', existing.id);
                    } else {
                        await supabaseAdmin
                            .from('calificaciones')
                            .insert({
                                alumno_id: student.id,
                                asignacion_id: asg.id,
                                cuatrimestre: 1,
                                parcial_1: p1,
                                parcial_2: p2,
                                parcial_3: p3,
                                asistencia: isCriticalStudent ? 72 : 95,
                                observaciones: isCriticalStudent ? 'Requiere seguimiento en tutoría y recuperatorio.' : 'Excelente desempeño académico y participación activa en trabajos de campo.'
                            });
                    }
                    gradesCount++;
                }
            }
        }
        console.log(`✅ ${gradesCount} registros de calificaciones cargados/actualizados.`);

        // 7. ASISTENCIAS DIARIAS PRECEPTORÍA
        console.log('\n📌 7. Generando Registros de Asistencia Diaria (Preceptoría)...');
        let attendanceCount = 0;
        if (mainDiv && studentProfiles.length > 0) {
            const today = new Date();
            for (let d = 1; d <= 15; d++) {
                const dateObj = new Date(today);
                dateObj.setDate(dateObj.getDate() - d);
                if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;

                const dateStr = dateObj.toISOString().split('T')[0];

                for (let i = 0; i < studentProfiles.length; i++) {
                    const student = studentProfiles[i];
                    const { data: existing } = await supabaseAdmin
                        .from('asistencias_preceptor')
                        .select('*')
                        .eq('estudiante_id', student.id)
                        .eq('fecha', dateStr)
                        .maybeSingle();

                    if (!existing) {
                        let estado = 'presente';
                        if (i === studentProfiles.length - 1 && d % 4 === 0) estado = 'ausente';
                        else if (d % 5 === 0 && i % 3 === 0) estado = 'tarde';

                        await supabaseAdmin
                            .from('asistencias_preceptor')
                            .insert({
                                estudiante_id: student.id,
                                division_id: mainDiv.id,
                                fecha: dateStr,
                                estado: estado,
                                observaciones: estado === 'ausente' ? 'Inasistencia notificada a la familia' : (estado === 'tarde' ? 'Llegada tarde 15m' : 'Presente')
                            });
                        attendanceCount++;
                    }
                }
            }
        }
        console.log(`✅ ${attendanceCount} planillas diarias de asistencia registradas.`);

        // 8. ANUNCIOS INSTITUCIONALES
        console.log('\n📌 8. Publicando Anuncios Institucionales...');
        const sampleAnnouncements = [
            {
                titulo: '🌾 Exposición Anual AgroTécnica ETA 2026',
                contenido: 'Con orgullo anunciamos la fecha de la muestra anual de proyectos tecnológicos e innovación agropecuaria. Toda la comunidad educativa invitada.',
                categoria: 'Institucional',
                autor_id: adminProfile?.id || null
            },
            {
                titulo: '📊 Cierre de Planillas 1° Cuatrimestre',
                contenido: 'Estimados docentes: la carga de evaluaciones y promedios parciales finalizará el próximo viernes. Por favor verificar planillas.',
                categoria: 'Académico',
                autor_id: adminProfile?.id || null
            },
            {
                titulo: '📢 Capacitación sobre Bioseguridad y Maquinaria',
                contenido: 'Taller obligatorio para alumnos del ciclo superior en el galpón de herramientas agrícolas este jueves a las 14:00 hs.',
                categoria: 'Urgente',
                autor_id: adminProfile?.id || null
            }
        ];

        for (const ann of sampleAnnouncements) {
            const { data: existing } = await supabaseAdmin
                .from('anuncios')
                .select('*')
                .eq('titulo', ann.titulo)
                .maybeSingle();

            if (!existing) {
                await supabaseAdmin
                    .from('anuncios')
                    .insert({
                        ...ann,
                        fecha_publicacion: new Date().toISOString()
                    });
            }
        }
        console.log('✅ Anuncios institucionales activos.');

        // 9. EVENTOS DE CALENDARIO
        console.log('\n📌 9. Programando Eventos del Calendario Escolar...');
        const sampleEvents = [
            {
                titulo: 'Jornada de Integración Agropecuaria',
                descripcion: 'Actividades prácticas en el predio escolar con participación de todos los cursos.',
                fecha_inicio: new Date(Date.now() + 86400000 * 3).toISOString(),
                fecha_fin: new Date(Date.now() + 86400000 * 3 + 14400000).toISOString(),
                tipo: 'institucional'
            },
            {
                titulo: 'Evaluación Trimestral de Biología I',
                descripcion: 'Examen escrito y teórico en aula magna.',
                fecha_inicio: new Date(Date.now() + 86400000 * 6).toISOString(),
                fecha_fin: new Date(Date.now() + 86400000 * 6 + 7200000).toISOString(),
                tipo: 'evaluacion'
            }
        ];

        for (const ev of sampleEvents) {
            const { data: existing } = await supabaseAdmin
                .from('eventos_calendario')
                .select('*')
                .eq('titulo', ev.titulo)
                .maybeSingle();

            if (!existing) {
                await supabaseAdmin.from('eventos_calendario').insert(ev);
            }
        }
        console.log('✅ Eventos de calendario cargados.');

        console.log('\n═════════════════════════════════════════════════════════════════');
        console.log('🎉 DATOS DEMO CREADOS Y ACTUALIZADOS CON ÉXITO');
        console.log('✨ La base de datos cuenta ahora con registros completos para');
        console.log('   demostraciones institucionales en vivo.');
        console.log('═════════════════════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('❌ Error ejecutando el seed:', err);
    }
}

seedDemoPresentation();
