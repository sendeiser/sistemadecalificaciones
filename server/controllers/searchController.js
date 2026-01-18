const { supabaseAdmin } = require('../config/supabaseClient');

async function globalSearch(req, res) {
    const { query } = req.query;

    if (!query || query.length < 2) {
        return res.json([]);
    }

    try {
        const searchTerm = `%${query}%`;

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
