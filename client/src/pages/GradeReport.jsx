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
    const [reportData, setReportData] = useState(null);
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
            const endpoint = getApiEndpoint(`/reports/grades-json?division_id=${selectedDivision}&materia_id=${selectedSubject}`);

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
            setReportData(json);
        } catch (e) {
            console.error(e);
            alert('Error al generar el reporte');
        }
        setLoading(false);
    };

    const downloadPDF = async () => {
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

            if (!res.ok) throw new Error('Error al generar PDF');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_calificaciones.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Error al descargar el PDF');
        }
        setLoading(false);
    };

    const exportCSV = () => {
        if (report.length === 0) return alert('No hay datos para exportar');
        const headers = ['N°', 'Estudiante', 'Perio. Intif', 'Logros Intif.', 'P1', 'P2', 'P3', 'P4', 'Promedio Parcial', 'Logros Prom.', '% Asist', 'Trayecto de Acompañamiento', 'Observaciones', 'Promedio General'];
        const rows = report.map((r, index) => [
            index + 1,
            r.nombre,
            r.nota_intensificacion ?? '',
            r.logro_intensificacion ?? '',
            r.parcial_1 ?? '',
            r.parcial_2 ?? '',
            r.parcial_3 ?? '',
            r.parcial_4 ?? '',
            r.promedio ?? '',
            r.logro_promedio ?? '',
            r.asistencia_porc !== '-' ? r.asistencia_porc + '%' : '-',
            r.trayecto_acompanamiento ?? '',

            r.observaciones ?? '',
            r.promedio_general ?? ''
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
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns

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

        const tableColumn = ["Alumno", "DNI", "P1", "P2", "P3", "P4", "Prom", "Intensif.", "Trayecto"];
        const tableRows = [];

        report.forEach(r => {
            const rowData = [
                r.nombre,
                r.dni,
                r.parcial_1 || '-',
                r.parcial_2 || '-',
                r.parcial_3 || '-',
                r.parcial_4 || '-',
                r.promedio || '-',
                r.nota_intensificacion || '-',
                r.trayecto_acompanamiento || '-'
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [14, 165, 233] }, // Tech Cyan color roughly
            styles: { fontSize: 9, cellPadding: 2 }
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
                </div>
                <div className="flex flex-wrap gap-4 mt-6">
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        <Search size={20} />
                        {loading ? 'Generando...' : 'Generar Vista Previa'}
                    </button>

                    <button
                        onClick={downloadPDF}
                        disabled={loading || !selectedDivision || !selectedSubject}
                        className="flex items-center gap-2 bg-red-600 dark:bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        <FileText size={20} />
                        Descargar PDF (Oficial)
                    </button>

                    <button
                        onClick={exportCSV}
                        disabled={loading || report.length === 0}
                        className="flex items-center gap-2 bg-green-600 dark:bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                        <Download size={20} />
                        Exportar CSV
                    </button>
                </div>

                {report.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {reportData?.asignacion && (
                            <div className="bg-tech-secondary p-4 rounded border border-tech-surface mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm shadow-sm">
                                <div><span className="text-tech-muted uppercase font-bold text-[10px] block mb-1">Curso / Sección</span> <span className="text-tech-text font-bold">{reportData.asignacion.division.anio} "{reportData.asignacion.division.seccion}"</span></div>
                                <div><span className="text-tech-muted uppercase font-bold text-[10px] block mb-1">Materia</span> <span className="text-tech-text font-bold">{reportData.asignacion.materia.nombre}</span></div>
                                <div><span className="text-tech-muted uppercase font-bold text-[10px] block mb-1">Profesor</span> <span className="text-tech-text font-bold">{reportData.asignacion.docente?.nombre || '-'}</span></div>
                                <div><span className="text-tech-muted uppercase font-bold text-[10px] block mb-1">Ciclo Lectivo</span> <span className="text-tech-text font-bold">{reportData.asignacion.division.ciclo_lectivo}</span></div>
                                <div><span className="text-tech-muted uppercase font-bold text-[10px] block mb-1">Ciclo</span> <span className="text-tech-text font-bold">{reportData.asignacion.materia.ciclo || 'Básico'}</span></div>
                                <div><span className="text-tech-muted uppercase font-bold text-[10px] block mb-1">C. de Formación</span> <span className="text-tech-text font-bold">{reportData.asignacion.materia.campo_formacion || '-'}</span></div>
                                <div><span className="text-tech-muted uppercase font-bold text-[10px] block mb-1">Periodo</span> <span className="text-tech-text font-bold">{new Date().getMonth() + 1 <= 7 ? '1er Cuatrimestre' : '2do Cuatrimestre'}</span></div>
                            </div>
                        )}

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto custom-scrollbar rounded border border-tech-surface shadow-inner">
                            <table className="w-full min-w-[600px] table-auto border-collapse bg-tech-secondary">
                                <thead className="bg-tech-primary/50 text-black font-mono text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3 border border-tech-surface text-left">Alumno</th>
                                        <th className="p-3 border border-tech-surface text-center text-tech-accent text-[10px]">Intif.</th>
                                        <th className="p-3 border border-tech-surface text-center text-tech-accent text-[10px]">Logro</th>
                                        <th className="p-3 border border-tech-surface text-center">P1</th>
                                        <th className="p-3 border border-tech-surface text-center">P2</th>
                                        <th className="p-3 border border-tech-surface text-center">P3</th>
                                        <th className="p-3 border border-tech-surface text-center">P4</th>
                                        <th className="p-3 border border-tech-surface text-center text-[10px]">Prom. Parc.</th>
                                        <th className="p-3 border border-tech-surface text-center text-[10px]">Logro</th>
                                        <th className="p-3 border border-tech-surface text-center text-[10px]">% Asist</th>
                                        <th className="p-3 border border-tech-surface text-center text-tech-cyan text-[10px]">Trayecto</th>
                                        <th className="p-3 border border-tech-surface text-center text-[10px]">Observ.</th>
                                        <th className="p-3 border border-tech-surface text-center font-bold text-tech-success text-[10px]">Prom. Gral</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-tech-surface">
                                    {report.map(r => (
                                        <tr key={r.alumno_id} className="hover:bg-tech-primary/30 transition-colors text-black">
                                            <td className="p-3 border border-tech-surface font-bold text-sm">{r.nombre}</td>
                                            <td className="p-3 border border-tech-surface text-center font-mono font-bold text-tech-accent">
                                                {r.nota_intensificacion ?? '-'}
                                            </td>
                                            <td className="p-3 border border-tech-surface text-center font-mono font-bold text-tech-accent bg-tech-accent/5 text-[10px]">
                                                {r.logro_intensificacion || '-'}
                                            </td>
                                            <td className="p-3 border border-tech-surface text-center font-mono text-[11px]">{r.parcial_1 ?? '-'}</td>
                                            <td className="p-3 border border-tech-surface text-center font-mono text-[11px]">{r.parcial_2 ?? '-'}</td>
                                            <td className="p-3 border border-tech-surface text-center font-mono text-[11px]">{r.parcial_3 ?? '-'}</td>
                                            <td className="p-3 border border-tech-surface text-center font-mono text-[11px]">{r.parcial_4 ?? '-'}</td>
                                            <td className={`p-3 border border-tech-surface text-center font-bold font-mono text-sm ${r.promedio !== '-' && Number(r.promedio) < 7 ? 'text-tech-danger' : 'text-tech-success'}`}>
                                                {r.promedio ?? '-'}
                                            </td>
                                            <td className="p-3 border border-tech-surface text-center font-mono font-bold text-tech-text bg-tech-primary/20 text-[10px]">
                                                {r.logro_promedio || '-'}
                                            </td>
                                            <td className="p-3 border border-tech-surface text-center font-mono text-[10px] text-tech-muted">
                                                {r.asistencia_porc !== '-' ? `${r.asistencia_porc}%` : '-'}
                                            </td>
                                            <td className="p-3 border border-tech-surface text-center font-mono text-[10px] font-bold text-tech-cyan uppercase max-w-[120px] truncate">
                                                {r.trayecto_acompanamiento ?? '-'}
                                            </td>

                                            <td className="p-3 border border-tech-surface text-center font-mono text-[10px] text-tech-muted italic">
                                                {r.observaciones || '-'}
                                            </td>
                                            <td className="p-3 border border-tech-surface text-center font-bold font-mono text-sm text-tech-success bg-tech-success/5">
                                                {r.promedio_general ?? r.promedio ?? '-'}
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
                                            <h3 className="font-bold text-black text-lg">{r.nombre}</h3>
                                            <span className="text-xs text-tech-muted font-mono"><span className="text-tech-success">{r.asistencia_porc}% Asist</span></span>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold font-mono ${r.promedio !== '-' && Number(r.promedio) < 7 ? 'text-tech-danger' : 'text-tech-success'}`}>
                                                {r.promedio_general || r.promedio || '-'}
                                            </div>
                                            <span className="block text-[8px] text-tech-muted font-sans uppercase tracking-wider">Prom. Gral</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center text-sm font-mono mb-3">
                                        <div className="bg-tech-primary/50 p-2 rounded">
                                            <span className="text-[9px] text-tech-muted block uppercase font-bold">P1</span>
                                            <span className="text-tech-text font-bold">{r.parcial_1 ?? '-'}</span>
                                        </div>
                                        <div className="bg-tech-primary/50 p-2 rounded">
                                            <span className="text-[9px] text-tech-muted block uppercase font-bold">P2</span>
                                            <span className="text-tech-text font-bold">{r.parcial_2 ?? '-'}</span>
                                        </div>
                                        <div className="bg-tech-primary/50 p-2 rounded">
                                            <span className="text-[9px] text-tech-muted block uppercase font-bold">P3</span>
                                            <span className="text-tech-text font-bold">{r.parcial_3 ?? '-'}</span>
                                        </div>
                                        <div className="bg-tech-primary/50 p-2 rounded">
                                            <span className="text-[9px] text-tech-muted block uppercase font-bold">P4</span>
                                            <span className="text-tech-text font-bold">{r.parcial_4 ?? '-'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 border-t border-tech-surface pt-3 text-[10px]">
                                        <div className="flex flex-col items-center justify-center bg-tech-accent/10 p-2 rounded">
                                            <span className="text-[8px] text-tech-muted uppercase font-bold">Intif.</span>
                                            <span className="font-mono font-bold text-tech-accent">{r.nota_intensificacion ?? '-'} ({r.logro_intensificacion || '-'})</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center bg-tech-primary/30 p-2 rounded">
                                            <span className="text-[8px] text-tech-muted uppercase font-bold">Logro Parc</span>
                                            <span className="font-mono font-bold text-tech-text">{r.logro_promedio || '-'}</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center bg-tech-cyan/10 p-2 rounded">
                                            <span className="text-[8px] text-tech-muted uppercase font-bold">Trayecto</span>
                                            <span className="font-mono font-bold text-tech-cyan truncate w-full text-center">{r.trayecto_acompanamiento || '-'}</span>
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
