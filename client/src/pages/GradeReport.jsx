import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { supabase } from '../supabaseClient';
import { Download, Search, ArrowLeft, FileText } from 'lucide-react';
import { getApiEndpoint } from '../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GradeReport = () => {
    const navigate = useNavigate();
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
                        'Authorization': `Bearer ${session?.access_token} `
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

    const exportPDF = () => {
        if (report.length === 0) return alert('No hay datos para exportar');
        const doc = new jsPDF();

        const divObj = divisions.find(d => d.id === parseInt(selectedDivision));
        const divName = divObj ? `${divObj.anio} ${divObj.seccion}` : '';
        const matName = subjects.find(s => s.id === parseInt(selectedSubject))?.nombre || '';

        // Header
        doc.setFontSize(18);
        doc.text('Reporte de Calificaciones', 14, 20);

        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.text(`División: ${divName}`, 14, 34);
        doc.text(`Materia: ${matName}`, 14, 40);

        const tableColumn = ["Alumno", "DNI", "P1", "P2", "P3", "P4", "Prom"];
        const tableRows = [];

        report.forEach(r => {
            const rowData = [
                r.nombre,
                r.dni,
                r.parcial_1 || '-',
                r.parcial_2 || '-',
                r.parcial_3 || '-',
                r.parcial_4 || '-',
                r.promedio || '-'
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [14, 165, 233] }, // Tech Cyan color roughly
        });

        doc.save(`Reporte_Notas_${divName}_${matName}.pdf`);
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-tech-surface pb-6 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 bg-tech-secondary border border-tech-surface rounded-lg text-tech-muted hover:text-tech-text transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-tech-text uppercase tracking-tight">Reporte de Calificaciones</h1>
                        <p className="text-tech-muted text-xs font-mono">VISTA PRECEPTOR</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <ThemeToggle />
                </div>
            </header>

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-tech-secondary p-4 rounded border border-tech-surface shadow-sm">
                    <select
                        className="p-2 bg-tech-primary border border-tech-surface rounded text-tech-text focus:border-tech-cyan outline-none"
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
                        className="p-2 bg-tech-primary border border-tech-surface rounded text-tech-text focus:border-tech-cyan outline-none"
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
                    <button
                        onClick={generateReport}
                        className="md:col-span-2 flex items-center justify-center gap-2 px-6 py-2 bg-tech-cyan hover:bg-sky-600 rounded text-white font-bold uppercase text-sm tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all"
                        disabled={loading}
                    >
                        <Search size={18} /> Generar Reporte
                    </button>
                </div>

                {report.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={exportCSV}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-tech-secondary border border-tech-surface hover:bg-tech-surface rounded text-tech-text transition-colors"
                            >
                                <Download size={16} /> <span className="hidden md:inline">Exportar CSV</span><span className="md:hidden">CSV</span>
                            </button>
                            <button
                                onClick={exportPDF}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-tech-accent hover:bg-violet-600 rounded text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all"
                            >
                                <FileText size={16} /> <span className="hidden md:inline">Exportar PDF</span><span className="md:hidden">PDF</span>
                            </button>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto custom-scrollbar rounded border border-tech-surface shadow-inner">
                            <table className="w-full min-w-[600px] table-auto border-collapse bg-tech-secondary">
                                <thead className="bg-tech-primary/50 text-tech-muted font-mono text-xs uppercase tracking-wider">
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
                                            <td className="p-3 border border-tech-surface font-bold text-tech-text">{r.nombre}</td>
                                            <td className="p-3 border border-tech-surface text-center font-mono text-sm text-tech-muted">{r.dni}</td>
                                            <td className="p-3 border border-tech-surface text-center font-mono">{r.parcial_1 ?? '-'}</td>
                                            <td className="p-3 border border-tech-surface text-center font-mono">{r.parcial_2 ?? '-'}</td>
                                            <td className="p-3 border border-tech-surface text-center font-mono">{r.parcial_3 ?? '-'}</td>
                                            <td className="p-3 border border-tech-surface text-center font-mono">{r.parcial_4 ?? '-'}</td>
                                            <td className={`p-3 border border-tech-surface text-center font-bold font-mono ${r.promedio !== '-' && Number(r.promedio) < 7 ? 'text-tech-danger' : 'text-tech-success'}`}>
                                                {r.promedio ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {report.map(r => (
                                <div key={r.alumno_id} className="bg-tech-secondary p-4 rounded border border-tech-surface shadow-md">
                                    <div className="flex justify-between items-start mb-3 border-b border-tech-surface pb-2">
                                        <div>
                                            <h3 className="font-bold text-tech-text text-lg">{r.nombre}</h3>
                                            <span className="text-xs text-tech-muted font-mono">DNI: {r.dni}</span>
                                        </div>
                                        <div className={`text-2xl font-bold font-mono ${r.promedio !== '-' && Number(r.promedio) < 7 ? 'text-tech-danger' : 'text-tech-success'}`}>
                                            {r.promedio ?? '-'}
                                            <span className="block text-[8px] text-tech-muted font-sans text-right uppercase tracking-wider">Promedio</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center text-sm font-mono">
                                        <div className="bg-tech-primary/50 p-2 rounded">
                                            <span className="text-[9px] text-tech-muted block uppercase font-bold">Parcial 1</span>
                                            <span className="text-tech-text font-bold">{r.parcial_1 ?? '-'}</span>
                                        </div>
                                        <div className="bg-tech-primary/50 p-2 rounded">
                                            <span className="text-[9px] text-tech-muted block uppercase font-bold">Parcial 2</span>
                                            <span className="text-tech-text font-bold">{r.parcial_2 ?? '-'}</span>
                                        </div>
                                        <div className="bg-tech-primary/50 p-2 rounded">
                                            <span className="text-[9px] text-tech-muted block uppercase font-bold">Parcial 3</span>
                                            <span className="text-tech-text font-bold">{r.parcial_3 ?? '-'}</span>
                                        </div>
                                        <div className="bg-tech-primary/50 p-2 rounded">
                                            <span className="text-[9px] text-tech-muted block uppercase font-bold">Parcial 4</span>
                                            <span className="text-tech-text font-bold">{r.parcial_4 ?? '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradeReport;
