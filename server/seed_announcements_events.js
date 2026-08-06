const { supabaseAdmin } = require('./config/supabaseClient');
require('dotenv').config();

async function seedAnnouncementsAndEvents() {
    console.log('🚀 CARGANDO ANUNCIOS Y EVENTOS DE DEMOSTRACIÓN EN LA BASE DE DATOS...\n');

    if (!supabaseAdmin) {
        console.error('❌ Error: supabaseAdmin no está configurado.');
        process.exit(1);
    }

    try {
        const { data: profiles } = await supabaseAdmin.from('perfiles').select('id, rol').eq('rol', 'admin').limit(1);
        const adminId = profiles && profiles.length > 0 ? profiles[0].id : null;
        const allRoles = ['admin', 'docente', 'alumno', 'preceptor', 'tutor'];

        // 1. ANUNCIOS INSTITUCIONALES Y ACADÉMICOS
        console.log('📌 1. Sembrando Anuncios Institucionales...');
        const announcementsData = [
            {
                titulo: '🌾 Expo AgroTécnica ETA 2026 - Muestra Anual de Proyectos',
                contenido: 'Invitamos formalmente a toda la comunidad educativa, familias y autoridades a participar de la Expo AgroTécnica 2026. Se expondrán proyectos de innovación en biotecnología, hidroponía, maquinaria agrícola y producción vegetal sostenible.',
                prioridad: 'alta',
                tipo: 'general',
                autor_id: adminId,
                destinatarios: allRoles,
                publicado: true,
                fecha_publicacion: new Date().toISOString()
            },
            {
                titulo: '📊 Cierre de Carga de Calificaciones - 1° Cuatrimestre',
                contenido: 'Estimados docentes: se recuerda que la plataforma permanecerá abierta para la carga de calificaciones parciales y promedios hasta el viernes a las 18:00 hs. Por favor verificar que todos los estudiantes tengan sus notas completas.',
                prioridad: 'urgente',
                tipo: 'academico',
                autor_id: adminId,
                destinatarios: ['admin', 'docente', 'preceptor'],
                publicado: true,
                fecha_publicacion: new Date(Date.now() - 3600000 * 5).toISOString()
            },
            {
                titulo: '🌱 Taller Práctico de Bioseguridad y Operación de Maquinaria',
                contenido: 'Capacitación técnica obligatoria para alumnos de 4to, 5to y 6to año sobre normas de seguridad, mantenimiento preventivo y uso eficiente de maquinaria en el galpón agro-técnico.',
                prioridad: 'normal',
                tipo: 'academico',
                autor_id: adminId,
                destinatarios: ['docente', 'alumno', 'preceptor'],
                publicado: true,
                fecha_publicacion: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
                titulo: '👨‍👩‍👧 Reunión General con Familias y Tutores',
                contenido: 'Se convoca a las familias a la reunión informativa sobre los viajes de estudio y talleres de campo de la segunda mitad del año. La misma se llevará a cabo en el Salón de Actos de la institución.',
                prioridad: 'normal',
                tipo: 'general',
                autor_id: adminId,
                destinatarios: ['admin', 'preceptor', 'tutor'],
                publicado: true,
                fecha_publicacion: new Date(Date.now() - 3600000 * 48).toISOString()
            },
            {
                titulo: '🏆 Reconocimiento a la Excelencia e Investigación Agropecuaria',
                contenido: 'Felicitaciones a los estudiantes y docentes tutores de 5to año por obtener la Mención de Honor en la Olimpiada Nacional de Biotecnología y Suelos.',
                prioridad: 'normal',
                tipo: 'general',
                autor_id: adminId,
                destinatarios: allRoles,
                publicado: true,
                fecha_publicacion: new Date(Date.now() - 3600000 * 72).toISOString()
            },
            {
                titulo: '⚠️ Recordatorio sobre Justificación de Inasistencias',
                contenido: 'Recordamos a los padres y preceptores que las faltas deben justificarse formalmente a través del módulo de asistencia dentro de las 48 hs posteriores a la inasistencia.',
                prioridad: 'urgente',
                tipo: 'general',
                autor_id: adminId,
                destinatarios: ['admin', 'preceptor', 'tutor', 'alumno'],
                publicado: true,
                fecha_publicacion: new Date(Date.now() - 3600000 * 96).toISOString()
            }
        ];

        let insertedAnnouncements = 0;
        for (const ann of announcementsData) {
            const { data: existing } = await supabaseAdmin
                .from('anuncios')
                .select('id')
                .eq('titulo', ann.titulo)
                .maybeSingle();

            if (!existing) {
                const { error } = await supabaseAdmin.from('anuncios').insert(ann);
                if (!error) insertedAnnouncements++;
                else console.warn('Aviso anuncio:', error.message);
            }
        }
        console.log(`✅ ${insertedAnnouncements} anuncios de demostración cargados.`);

        // 2. EVENTOS DEL CALENDARIO ESCOLAR
        console.log('\n📌 2. Sembrando Eventos en el Calendario Escolar...');
        const today = new Date();
        const formatDate = (daysOffset) => {
            const d = new Date(today);
            d.setDate(d.getDate() + daysOffset);
            return d.toISOString().split('T')[0];
        };

        const eventsData = [
            {
                titulo: '🌾 Jornada de Campo: Siembra y Monitoreo de Suelos',
                descripcion: 'Prácticas operativas en el predio escolar con alumnos de ciclo básico y superior.',
                fecha_inicio: formatDate(2),
                fecha_fin: formatDate(2),
                tipo: 'otro',
                color: '#10b981',
                todo_el_dia: true,
                visible_para: allRoles,
                creado_por: adminId
            },
            {
                titulo: '📝 Evaluación Trimestral Integradora de Biología I',
                descripcion: 'Examen teórico y evaluación de carpetas técnicas de laboratorio.',
                fecha_inicio: formatDate(4),
                fecha_fin: formatDate(4),
                tipo: 'otro',
                color: '#ef4444',
                todo_el_dia: true,
                visible_para: allRoles,
                creado_por: adminId
            },
            {
                titulo: '🚜 Exposición de Maquinaria e Hidroponía ETA',
                descripcion: 'Muestra anual abierta al público de proyectos tecnológicos y robótica agrícola.',
                fecha_inicio: formatDate(7),
                fecha_fin: formatDate(7),
                tipo: 'acto',
                color: '#0ea5e9',
                todo_el_dia: true,
                visible_para: allRoles,
                creado_por: adminId
            },
            {
                titulo: '👨‍👩‍👧 Reunión Informativa con Tutores',
                descripcion: 'Encuentro con familias sobre rendimiento académico y asistencia.',
                fecha_inicio: formatDate(10),
                fecha_fin: formatDate(10),
                tipo: 'reunion',
                color: '#f59e0b',
                todo_el_dia: true,
                visible_para: allRoles,
                creado_por: adminId
            },
            {
                titulo: '🧪 Taller de Biotecnología Aplicada en Cultivos',
                descripcion: 'Experiencia práctica en el laboratorio de análisis vegetal.',
                fecha_inicio: formatDate(13),
                fecha_fin: formatDate(13),
                tipo: 'otro',
                color: '#8b5cf6',
                todo_el_dia: true,
                visible_para: allRoles,
                creado_por: adminId
            },
            {
                titulo: '📅 Cierre de Periodo Lectivo 1° Cuatrimestre',
                descripcion: 'Fecha límite de entrega de boletines e informes pedagógicos.',
                fecha_inicio: formatDate(16),
                fecha_fin: formatDate(16),
                tipo: 'acto',
                color: '#ec4899',
                todo_el_dia: true,
                visible_para: allRoles,
                creado_por: adminId
            }
        ];

        let insertedEvents = 0;
        for (const ev of eventsData) {
            const { data: existing } = await supabaseAdmin
                .from('eventos_calendario')
                .select('id')
                .eq('titulo', ev.titulo)
                .maybeSingle();

            if (!existing) {
                const { error } = await supabaseAdmin.from('eventos_calendario').insert(ev);
                if (!error) insertedEvents++;
                else console.warn('Aviso evento:', error.message);
            }
        }
        console.log(`✅ ${insertedEvents} eventos de demostración agregados al calendario.`);

        console.log('\n═════════════════════════════════════════════════════════════════');
        console.log('🎉 ANUNCIOS Y EVENTOS CARGADOS CON ÉXITO');
        console.log('✨ La plataforma cuenta con anuncios interactivos y calendario completo.');
        console.log('═════════════════════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('❌ Error sembrando anuncios/eventos:', err);
    }
}

seedAnnouncementsAndEvents();
