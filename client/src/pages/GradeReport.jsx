import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { supabase } from '../supabaseClient';
import { Download, Search, ArrowLeft, FileText, ClipboardList, AlertCircle, CheckCircle } from 'lucide-react';
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
    const [isSecondSemester, setIsSecondSemester] = useState(new Date().getMonth() + 1 > 7);
    const [message, setMessage] = useState(null);

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

    // Auto-refresh when semester changes if report already generated
    useEffect(() => {
        if (report.length > 0) {
            generateReport();
        }
    }, [isSecondSemester]);


    const generateReport = async () => {
        if (!selectedDivision || !selectedSubject) {
            setMessage({ type: 'error', text: 'Seleccione división y materia' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint(`/reports/json?division_id=${selectedDivision}&materia_id=${selectedSubject}&cuatrimestre=${isSecondSemester ? 2 : 1}`);

            const res = await fetch(
                endpoint,
                {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                }
            );
            const json = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: json.error || 'Error al generar el reporte' });
                return;
            }

            if (!json.report || json.report.length === 0) {
                setMessage({ type: 'info', text: 'No se encontraron calificaciones cargadas para este periodo' });
                setReport([]);
            } else {
                setReport(json.report);
                setReportData(json);
                setMessage({ type: 'success', text: 'Reporte generado correctamente' });
            }
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: 'Error de conexión con el servidor' });
        }
        setLoading(false);
        setTimeout(() => setMessage(null), 5000);
    };

    const downloadPDF = async () => {
        if (!selectedDivision || !selectedSubject) {
            setMessage({ type: 'error', text: 'Seleccione división y materia' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint(`/reports/grades?division_id=${selectedDivision}&materia_id=${selectedSubject}&cuatrimestre=${isSecondSemester ? 2 : 1}`);

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
            const cuatrimestreStr = isSecondSemester ? '2do_Cuatri' : '1er_Cuatri';
            a.download = `Reporte_${cuatrimestreStr}_${selectedDivision}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            setMessage({ type: 'success', text: 'PDF descargado correctamente' });
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: 'Error al descargar el PDF' });
        }
        setLoading(false);
        setTimeout(() => setMessage(null), 5000);
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

        const cuatrimestreStr = isSecondSemester ? 'Segundo Cuatrimestre' : 'Primer Cuatrimestre';

        // Header
        doc.setFontSize(18);
        doc.text(`Reporte de Calificaciones (${cuatrimestreStr})`, 14, 20);

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

        const cuatrimestreFile = isSecondSemester ? '2do_Cuatri' : '1er_Cuatri';
        doc.save(`Reporte_Notas_${cuatrimestreFile}_${divName}_${matName}.pdf`);
        setMessage({ type: 'success', text: 'PDF exportado correctamente' });
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 border-b border-tech-surface pb-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-tech-text flex items-center gap-3">
                        <FileText className="text-tech-cyan" size={32} />
                        Planilla de Calificaciones
                    </h1>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 text-tech-muted hover:text-tech-text transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    </div>
                </div>
                <p className="text-tech-muted font-mono text-sm uppercase tracking-widest">Generación y exportación de reportes académicos</p>
            </header>

            <div className="max-w-7xl mx-auto">
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                        message.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                        <div className="flex items-center gap-3">
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <p className="font-mono text-sm uppercase tracking-wider font-bold">{message.text}</p>
                        </div>
                        <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100 transition-opacity">✕</button>
                    </div>
                )}

                <div className="bg-tech-secondary p-6 rounded-xl border border-tech-surface shadow-lg mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-tech-muted uppercase tracking-wider">División</label>
                            <select
                                className="w-full p-3 bg-tech-primary border border-tech-surface rounded-lg text-tech-text focus:border-tech-cyan outline-none transition-all"
                                value={selectedDivision}
                                onChange={e => setSelectedDivision(e.target.value)}
                            >
                                <option value="">Seleccionar División</option>
                                {divisions.map(d => (
                                    <option key={d.id} value={d.id}>{d.anio} {d.seccion}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-tech-muted uppercase tracking-wider">Materia</label>
                            <select
                                className="w-full p-3 bg-tech-primary border border-tech-surface rounded-lg text-tech-text focus:border-tech-cyan outline-none transition-all"
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                            >
                                <option value="">Seleccionar Materia</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-tech-muted uppercase tracking-wider">Periodo</label>
                            <div className="flex bg-tech-primary p-1 rounded-lg border border-tech-surface">
                                <button
                                    onClick={() => setIsSecondSemester(false)}
                                    className={`flex-1 px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all ${!isSecondSemester ? 'bg-tech-cyan text-white shadow-lg shadow-cyan-500/20' : 'text-tech-muted hover:text-tech-text'}`}
                                >
                                    1er Cuatri
                                </button>
                                <button
                                    onClick={() => setIsSecondSemester(true)}
                                    className={`flex-1 px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all ${isSecondSemester ? 'bg-tech-cyan text-white shadow-lg shadow-cyan-500/20' : 'text-tech-muted hover:text-tech-text'}`}
                                >
                                    2do Cuatri
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-tech-surface/50">
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="flex items-center gap-2 bg-tech-cyan/10 hover:bg-tech-cyan/20 text-tech-cyan px-6 py-3 rounded-xl border border-tech-cyan/20 transition-all font-bold uppercase text-xs tracking-widest disabled:opacity-50"
                        >
                            <Search size={18} />
                            {loading ? 'Procesando...' : 'Vista Previa'}
                        </button>

                        <button
                            onClick={downloadPDF}
                            disabled={loading || !report.length}
                            className="flex items-center gap-2 bg-tech-accent/10 hover:bg-tech-accent/20 text-tech-accent px-6 py-3 rounded-xl border border-tech-accent/20 transition-all font-bold uppercase text-xs tracking-widest disabled:opacity-50"
                        >
                            <Download size={18} />
                            Descargar PDF
                        </button>

                        <button
                            onClick={exportCSV}
                            disabled={loading || !report.length}
                            className="flex items-center gap-2 bg-tech-success/10 hover:bg-tech-success/20 text-tech-success px-6 py-3 rounded-xl border border-tech-success/20 transition-all font-bold uppercase text-xs tracking-widest disabled:opacity-50 ml-auto"
                        >
                            <ClipboardList size={18} />
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {report.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        {reportData?.asignacion && (
                            <div className="bg-tech-secondary/50 p-6 rounded-xl border border-tech-surface grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                                <div>
                                    <span className="text-tech-muted uppercase font-bold text-[10px] block mb-1 tracking-tighter">Curso / Sección</span>
                                    <span className="text-tech-text font-bold">{reportData.asignacion.division.anio} "{reportData.asignacion.division.seccion}"</span>
                                </div>
                                <div>
                                    <span className="text-tech-muted uppercase font-bold text-[10px] block mb-1 tracking-tighter">Materia</span>
                                    <span className="text-tech-text font-bold">{reportData.asignacion.materia.nombre}</span>
                                </div>
                                <div>
                                    <span className="text-tech-muted uppercase font-bold text-[10px] block mb-1 tracking-tighter">Docente</span>
                                    <span className="text-tech-text font-bold">{reportData.asignacion.docente?.nombre || 'No asignado'}</span>
                                </div>
                                <div>
                                    <span className="text-tech-muted uppercase font-bold text-[10px] block mb-1 tracking-tighter">Ciclo Lectivo</span>
                                    <span className="text-tech-text font-bold">{reportData.asignacion.division.ciclo_lectivo}</span>
                                </div>
                            </div>
                        )}

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-hidden rounded-xl border border-tech-surface shadow-inner bg-tech-secondary">
                            <table className="w-full table-auto border-collapse">
                                <thead className="bg-tech-primary/50 text-tech-muted font-mono text-[10px] uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4 text-left border-b border-tech-surface">Alumno</th>
                                        {!isSecondSemester && (
                                            <>
                                                <th className="p-4 text-center border-b border-tech-surface text-tech-accent">Intif.</th>
                                                <th className="p-4 text-center border-b border-tech-surface text-tech-accent">Logro</th>
                                            </>
                                        )}
                                        <th className="p-4 text-center border-b border-tech-surface">P1</th>
                                        <th className="p-4 text-center border-b border-tech-surface">P2</th>
                                        <th className="p-4 text-center border-b border-tech-surface">P3</th>
                                        <th className="p-4 text-center border-b border-tech-surface">P4</th>
                                        <th className="p-4 text-center border-b border-tech-surface">Prom</th>
                                        <th className="p-4 text-center border-b border-tech-surface text-tech-cyan">Trayecto</th>
                                        <th className="p-4 text-center border-b border-tech-surface text-tech-success">Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-tech-surface">
                                    {report.map(r => (
                                        <tr key={r.alumno_id} className="hover:bg-tech-primary/30 transition-colors">
                                            <td className="p-4 font-bold text-sm text-tech-text">{r.nombre}</td>
                                            {!isSecondSemester && (
                                                <>
                                                    <td className="p-4 text-center font-mono font-bold text-tech-accent">{r.nota_intensificacion ?? '-'}</td>
                                                    <td className="p-4 text-center text-[10px] text-tech-accent">{r.logro_intensificacion || '-'}</td>
                                                </>
                                            )}
                                            <td className="p-4 text-center font-mono text-xs">{r.parcial_1 ?? '-'}</td>
                                            <td className="p-4 text-center font-mono text-xs">{r.parcial_2 ?? '-'}</td>
                                            <td className="p-4 text-center font-mono text-xs">{r.parcial_3 ?? '-'}</td>
                                            <td className="p-4 text-center font-mono text-xs">{r.parcial_4 ?? '-'}</td>
                                            <td className={`p-4 text-center font-bold font-mono text-sm ${parseFloat(r.promedio) < 7 ? 'text-tech-danger' : 'text-tech-success'}`}>
                                                {r.promedio ?? '-'}
                                            </td>
                                            <td className="p-4 text-center font-mono text-[10px] font-bold text-tech-cyan uppercase truncate max-w-[120px]">
                                                {r.trayecto_acompanamiento ?? '-'}
                                            </td>
                                            <td className="p-4 text-center font-bold font-mono text-sm text-tech-success bg-tech-success/5">
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
                                <div key={r.alumno_id} className="bg-tech-secondary p-4 rounded-xl border border-tech-surface shadow-md">
                                    <div className="flex justify-between items-start mb-4 border-b border-tech-surface pb-3">
                                        <div>
                                            <h3 className="font-bold text-tech-text text-base">{r.nombre}</h3>
                                            <span className="text-xs text-tech-muted font-mono">{r.asistencia_porc}% Asit.</span>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xl font-bold font-mono ${parseFloat(r.promedio) < 7 ? 'text-tech-danger' : 'text-tech-success'}`}>
                                                {r.promedio_general || r.promedio || '-'}
                                            </div>
                                            <span className="block text-[8px] text-tech-muted font-sans uppercase tracking-wider">Final</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center text-sm font-mono mb-4">
                                        {[1, 2, 3, 4].map(p => (
                                            <div key={p} className="bg-tech-primary/50 p-2 rounded-lg">
                                                <span className="text-[8px] text-tech-muted block uppercase font-bold mb-1">P{p}</span>
                                                <span className="text-tech-text font-bold text-xs">{r[`parcial_${p}`] ?? '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between border-t border-tech-surface pt-3">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-tech-muted uppercase font-bold tracking-tighter">Trayecto</span>
                                            <span className="font-mono font-bold text-tech-cyan text-[10px] uppercase truncate max-w-[150px]">{r.trayecto_acompanamiento || '-'}</span>
                                        </div>
                                        {!isSecondSemester && (
                                            <div className="text-right">
                                                <span className="text-[8px] text-tech-muted uppercase font-bold block">Intif.</span>
                                                <span className="font-mono font-bold text-tech-accent text-sm">{r.nota_intensificacion ?? '-'}</span>
                                            </div>
                                        )}
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
