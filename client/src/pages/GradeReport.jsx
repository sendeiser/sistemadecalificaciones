// client/src/pages/GradeReport.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Download, Search } from 'lucide-react';
import { getApiEndpoint } from '../utils/api';

const GradeReport = () => {
    const [divisions, setDivisions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load divisions and subjects on mount
    useEffect(() => {
        const fetchData = async () => {
            const { data: divs, error: dErr } = await supabase.from('divisiones').select('*');
            if (!dErr) setDivisions(divs);
            const { data: mats, error: mErr } = await supabase.from('materias').select('*');
            if (!mErr) setSubjects(mats);
        };
        fetchData();
    }, []);

    const generateReport = async () => {
        if (!selectedDivision || !selectedSubject) return alert('Seleccione división y materia');
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint(`/reports/grades?division_id=${selectedDivision}&materia_id=${selectedSubject}`);

            const res = await fetch(
                endpoint,
                {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                }
            );
            const json = await res.json();
            if (json.message) alert(json.message);
            setReport(json.report || []);
        } catch (e) {
            console.error(e);
            alert('Error al generar el reporte');
        }
        setLoading(false);
    };

    const exportCSV = () => {
        if (report.length === 0) return alert('No hay datos para exportar');
        const headers = ['Alumno ID', 'Nombre', 'DNI', 'Parcial 1', 'Parcial 2', 'Parcial 3', 'Parcial 4', 'Promedio'];
        const rows = report.map(r => [
            r.alumno_id,
            r.nombre,
            r.dni,
            r.parcial_1 ?? '',
            r.parcial_2 ?? '',
            r.parcial_3 ?? '',
            r.parcial_4 ?? '',
            r.promedio ?? ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_${selectedDivision}_${selectedSubject}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            <h1 className="text-3xl font-bold mb-6">Reporte de Calificaciones</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <select
                    className="p-2 bg-tech-secondary border border-tech-surface rounded text-white"
                    value={selectedDivision}
                    onChange={e => setSelectedDivision(e.target.value)}
                >
                    <option value="">Seleccionar División</option>
                    {divisions.map(d => (
                        <option key={d.id} value={d.id}>
                            {d.anio} {d.seccion}
                        </option>
                    ))}
                </select>
                <select
                    className="p-2 bg-tech-secondary border border-tech-surface rounded text-white"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                >
                    <option value="">Seleccionar Materia</option>
                    {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.nombre}
                        </option>
                    ))}
                </select>
            </div>
            <button
                onClick={generateReport}
                className="flex items-center gap-2 px-6 py-2 bg-tech-cyan hover:bg-sky-600 rounded text-white mb-4"
                disabled={loading}
            >
                <Search size={18} /> Generar Reporte
            </button>
            {report.length > 0 && (
                <>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-tech-secondary hover:bg-tech-surface rounded text-white mb-4"
                    >
                        <Download size={16} /> Exportar CSV
                    </button>
                    <div className="overflow-x-auto custom-scrollbar rounded border border-tech-surface shadow-inner">
                        <table className="w-full min-w-[600px] table-auto border-collapse bg-tech-secondary">
                            <thead className="bg-tech-primary/50 text-slate-300 font-mono text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-3 border border-tech-surface text-left">Alumno</th>
                                    <th className="p-3 border border-tech-surface text-center">DNI</th>
                                    <th className="p-3 border border-tech-surface text-center">P1</th>
                                    <th className="p-3 border border-tech-surface text-center">P2</th>
                                    <th className="p-3 border border-tech-surface text-center">P3</th>
                                    <th className="p-3 border border-tech-surface text-center">P4</th>
                                    <th className="p-3 border border-tech-surface text-center">Prom</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tech-surface">
                                {report.map(r => (
                                    <tr key={r.alumno_id} className="hover:bg-tech-primary/30 transition-colors">
                                        <td className="p-3 border border-tech-surface font-bold text-white">{r.nombre}</td>
                                        <td className="p-3 border border-tech-surface text-center font-mono text-sm">{r.dni}</td>
                                        <td className="p-3 border border-tech-surface text-center font-mono">{r.parcial_1 ?? '-'}</td>
                                        <td className="p-3 border border-tech-surface text-center font-mono">{r.parcial_2 ?? '-'}</td>
                                        <td className="p-3 border border-tech-surface text-center font-mono">{r.parcial_3 ?? '-'}</td>
                                        <td className="p-3 border border-tech-surface text-center font-mono">{r.parcial_4 ?? '-'}</td>
                                        <td className={`p-3 border border-tech-surface text-center font-bold font-mono ${r.promedio !== '-' && Number(r.promedio) < 7 ? 'text-tech-danger' : 'text-tech-success'}`}>
                                            {r.promedio ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                                {report.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-12 text-center text-slate-500 font-mono uppercase tracking-widest text-xs">
                                            No hay registros para mostrar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default GradeReport;
