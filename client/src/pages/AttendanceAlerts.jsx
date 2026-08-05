import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { AlertTriangle, ArrowLeft, FileText, ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { getApiEndpoint } from '../utils/api';

const AttendanceAlerts = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(null); // studentId of currently generating PDF

    useEffect(() => {
        fetchDivisions();
    }, []);

    useEffect(() => {
        if (selectedDivisionId) {
            fetchAlerts();
        }
    }, [selectedDivisionId]);

    const fetchDivisions = async () => {
        const { data } = await supabase.from('divisiones').select('*').order('anio');
        if (data) setDivisions(data);
    };

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint(`/attendance/alerts/${selectedDivisionId}`);

            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await res.json();
            if (res.ok) setStudents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCitation = async (student) => {
        setGenerating(student.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const division = divisions.find(d => d.id === selectedDivisionId);
            const divisionName = `${division.anio} "${division.seccion}"`;

            const res = await fetch(getApiEndpoint('/reports/citation'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    studentId: student.id,
                    studentName: student.nombre,
                    studentDni: student.dni,
                    divisionName: divisionName,
                    totalAbsences: student.faltas
                })
            });

            if (!res.ok) throw new Error('Error al generar PDF');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Citacion_${student.nombre.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            alert(err.message);
        } finally {
            setGenerating(null);
        }
    };

    const getStatusInfo = (faltas) => {
        if (faltas >= 25) return { label: 'CRÍTICO', color: 'text-tech-danger', bg: 'bg-tech-danger/10', border: 'border-tech-danger' };
        if (faltas >= 15) return { label: 'ALERTA', color: 'text-tech-accent', bg: 'bg-tech-accent/10', border: 'border-tech-accent' };
        if (faltas >= 10) return { label: 'PRECAUCIÓN', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50' };
        return { label: 'NORMAL', color: 'text-tech-success', bg: 'bg-tech-success/10', border: 'border-tech-success' };
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 border-b border-tech-surface pb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-tech-surface rounded transition-colors text-tech-muted">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-tech-text tracking-tight uppercase flex items-center gap-3">
                            <div className="p-2 bg-tech-danger/20 rounded text-tech-danger">
                                <ShieldAlert size={24} />
                            </div>
                            Alertas de Inasistencia
                        </h1>
                        <p className="text-tech-muted text-sm font-mono mt-1">SEGUIMIENTO DE ABANDONO Y RIESGO ESCOLAR</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>

            <main className="max-w-7xl mx-auto space-y-8">
                <section className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="w-full md:w-auto flex items-center gap-4">
                            <label className="text-xs font-bold text-tech-muted uppercase whitespace-nowrap">Division:</label>
                            <select
                                className="w-full md:w-64 bg-tech-primary border border-tech-surface rounded px-4 py-2 outline-none focus:border-tech-cyan transition-colors"
                                value={selectedDivisionId}
                                onChange={e => setSelectedDivisionId(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {divisions.map(d => (
                                    <option key={d.id} value={d.id}>{d.anio} "{d.seccion}"</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-6 text-xs font-mono uppercase">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tech-success"></span> Normal (0-9)</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Precaución (10-14)</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tech-accent"></span> Alerta (15-24)</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tech-danger"></span> Crítico (25+)</div>
                        </div>
                    </div>
                </section>

                <div className="bg-tech-secondary rounded border border-tech-surface shadow-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center animate-pulse text-tech-muted font-mono tracking-widest uppercase">Escaneando inasistencias...</div>
                    ) : !selectedDivisionId ? (
                        <div className="p-20 text-center text-tech-muted italic flex flex-col items-center gap-4">
                            <AlertTriangle size={48} className="opacity-20" />
                            <p className="uppercase tracking-widest text-xs">Seleccione una división para procesar alertas.</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="p-20 text-center text-tech-muted italic font-mono">No se encontraron alumnos registrados.</div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block">
                                {(() => {
                                    const columns = [
                                        {
                                            key: 'nombre',
                                            label: 'Alumno',
                                            render: (_, row) => (
                                                <div>
                                                    <div className="font-bold text-tech-text uppercase text-sm">{row.nombre}</div>
                                                    <div className="text-[10px] text-tech-muted font-mono">{row.dni}</div>
                                                </div>
                                            )
                                        },
                                        {
                                            key: 'faltas',
                                            label: 'Inasistencias',
                                            align: 'center',
                                            render: (val) => (
                                                <span className={`font-bold text-xl ${getStatusInfo(val).color}`}>{val}</span>
                                            )
                                        },
                                        {
                                            key: 'riesgo',
                                            label: 'Estado de Riesgo',
                                            align: 'center',
                                            render: (_, row) => {
                                                const status = getStatusInfo(row.faltas);
                                                return (
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${status.bg} ${status.color} ${status.border} shadow-sm`}>
                                                        {status.label}
                                                    </span>
                                                );
                                            }
                                        },
                                        {
                                            key: 'acciones',
                                            label: 'Acciones',
                                            align: 'center',
                                            render: (_, row) => (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownloadCitation(row)}
                                                    disabled={generating === row.id}
                                                >
                                                    {generating === row.id ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-current/30 border-t-current"></div>
                                                    ) : (
                                                        <FileText size={14} />
                                                    )}
                                                    Generar Citación
                                                </Button>
                                            )
                                        }
                                    ];
                                    return <Table columns={columns} data={students} />;
                                })()}
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-tech-surface">
                                {students.map(s => {
                                    const status = getStatusInfo(s.faltas);
                                    return (
                                        <div key={s.id} className="p-4 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-tech-text uppercase text-sm">{s.nombre}</div>
                                                    <div className="text-[10px] text-tech-muted font-mono">{s.dni}</div>
                                                </div>
                                                <div className={`text-2xl font-black ${status.color}`}>
                                                    {s.faltas}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center bg-tech-primary/30 p-3 rounded-xl border border-tech-surface">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${status.bg} ${status.color} ${status.border}`}>
                                                    {status.label}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownloadCitation(s)}
                                                    disabled={generating === s.id}
                                                >
                                                    {generating === s.id ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-current/30 border-t-current"></div>
                                                    ) : (
                                                        <FileText size={12} />
                                                    )}
                                                    Citación
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AttendanceAlerts;
