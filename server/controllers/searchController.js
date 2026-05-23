const { supabaseAdmin } = require('../config/supabaseClient');

async function globalSearch(req, res) {
    const q = req.query.query || req.query.q;
    const { type } = req.query;

    if (!q || q.length < 2) {
        return res.json([]);
    }

    try {
        const searchTerm = `%${q}%`;

        if (type === 'users') {
            const { data: users, error } = await supabaseAdmin
                .from('perfiles')
                .select('id, nombre, email, rol, dni')
                .or(`nombre.ilike.${searchTerm},email.ilike.${searchTerm},dni.ilike.${searchTerm}`)
                .limit(20);

            if (error) throw error;
            return res.json(users || []);
        }

        // 1. Search Students
        const { data: students } = await supabaseAdmin
            .from('perfiles')
            .select('id, nombre, dni')
            .eq('rol', 'alumno')
            .or(`nombre.ilike.${searchTerm},dni.ilike.${searchTerm}`)
            .limit(5);

        // 2. Search Divisions
        const { data: divisions } = await supabaseAdmin
            .from('divisiones')
            .select('id, anio, seccion')
            .or(`anio.ilike.${searchTerm},seccion.ilike.${searchTerm}`)
            .limit(3);

        // 3. Search Subjects
        const { data: subjects } = await supabaseAdmin
            .from('materias')
            .select('id, nombre')
            .ilike('nombre', searchTerm)
            .limit(3);

        const results = [
            ...(students || []).map(s => ({ type: 'student', id: s.id, title: s.nombre, subtitle: `DNI: ${s.dni}` })),
            ...(divisions || []).map(d => ({ type: 'division', id: d.id, title: `${d.anio} ${d.seccion}`, subtitle: 'División' })),
            ...(subjects || []).map(m => ({ type: 'subject', id: m.id, title: m.nombre, subtitle: 'Materia' }))
        ];

        res.json(results);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}

module.exports = { globalSearch };
