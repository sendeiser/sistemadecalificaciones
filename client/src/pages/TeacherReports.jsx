import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Calendar, Download, FileText, ArrowLeft, BarChart3, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { getApiEndpoint } from '../utils/api';

const TeacherReports = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSecondSemester, setIsSecondSemester] = useState(new Date().getMonth() + 1 > 7);
    const [message, setMessage] = useState(null);
    const [isExportingAll, setIsExportingAll] = useState(false);

    useEffect(() => {
        if (profile) fetchAssignments();
    }, [profile]);

    const fetchAssignments = async () => {
        try {
            const { data, error } = await supabase
                .from('asignaciones')
                .select(`
                    id,
                    materia_id,
                    division_id,
                    materia: materias(nombre),
                    division: divisiones(id, anio, seccion)
                `)
                .eq('docente_id', profile.id);

            if (error) throw error;
            setAssignments(data || []);

            // Proactively fetch stats for each assignment
            if (data) {
                data.forEach(asig => fetchStats(asig.id));
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (assignmentId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            let url = getApiEndpoint(`/reports/attendance-teacher?assignment_id=${assignmentId}`);
            if (startDate) url += `&start_date=${startDate}`;
            if (endDate) url += `&end_date=${endDate}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(prev => ({ ...prev, [assignmentId]: data }));
        } catch (e) {
            console.error(`Error fetching stats for ${assignmentId}:`, e);
        }
    };

    const downloadPDF = async (assignment, type) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
            setMessage({ type: 'error', text: 'No hay sesión activa' });
            return;
        }

        let url = '';
        if (type === 'asistencia') {
            url = getApiEndpoint(`/reports/attendance/assignment/${assignment.id}?token=${token}`);
            if (startDate) url += `&start_date=${startDate}`;
            if (endDate) url += `&end_date=${endDate}`;
        } else {
            // Point to the advanced grade report used by preceptors
            url = getApiEndpoint(`/reports/grades?division_id=${assignment.division_id}&materia_id=${assignment.materia_id}&cuatrimestre=${isSecondSemester ? 2 : 1}&token=${token}`);
        }

        window.open(url, '_blank');
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                        MIS <span className="text-tech-cyan">REPORTES</span>
                    </h1>
                    <p className="text-tech-muted text-xs font-mono uppercase tracking-[0.3em] mt-2">
                        Generación de planillas y reportes estadísticos
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={async () => {
                            if (!confirm('¿Deseas descargar todas las planillas? Esto puede tomar unos momentos.')) return;
                            const { data: { session } } = await supabase.auth.getSession();
                            const token = session?.access_token;
                            if (!token) {
                                setMessage({ type: 'error', text: 'No hay sesión activa' });
                                return;
                            }

                            setIsExportingAll(true);
                            setMessage({ type: 'info', text: 'Iniciando descarga masiva...' });
                            let count = 0;
                            let errors = 0;

                            for (const assign of assignments) {
                                try {
                                    const url = getApiEndpoint(`/reports/grades?division_id=${assign.division_id}&materia_id=${assign.materia_id}&cuatrimestre=${isSecondSemester ? 2 : 1}&token=${token}`);
                                    const res = await fetch(url);
                                    if (!res.ok) throw new Error('Error en descarga');
                                    const blob = await res.blob();
                                    const link = document.createElement('a');
                                    link.href = window.URL.createObjectURL(blob);
                                    link.download = `Planilla_${assign.materia.nombre}_${assign.division.anio}${assign.division.seccion}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    count++;
                                    await new Promise(r => setTimeout(r, 800));
                                } catch (e) {
                                    console.error('Error downloading:', assign.materia.nombre, e);
                                    errors++;
                                }
                            }
                            setIsExportingAll(false);
                            if (errors > 0) {
                                setMessage({ type: 'error', text: `Descarga finalizada. ${count} completados, ${errors} errores.` });
                            } else {
                                setMessage({ type: 'success', text: `Se descargaron ${count} planillas correctamente.` });
                            }
                            setTimeout(() => setMessage(null), 5000);
                        }}
                        disabled={isExportingAll || assignments.length === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-tech-cyan hover:bg-tech-cyan/80 disabled:bg-tech-surface rounded-xl text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-tech-cyan/20 active:scale-95"
                    >
                        <Download size={18} />
                        <span>{isExportingAll ? 'Procesando...' : 'Exportar Todo'}</span>
                    </button>
                    <ThemeToggle />
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                {message && (
                    <div className={`p-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
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
                {/* Date Filters */}
                <div className="bg-tech-secondary p-4 md:p-6 rounded border border-tech-surface flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 size={20} className="text-tech-cyan" />
                        <span className="text-sm font-bold uppercase tracking-wider text-tech-muted whitespace-nowrap">Periodo:</span>
                    </div>
                    <div className="flex bg-tech-primary/50 p-1 rounded-lg border border-tech-surface w-fit">
                        <button
                            onClick={() => setIsSecondSemester(false)}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${!isSecondSemester ? 'bg-tech-cyan text-white shadow-lg shadow-cyan-500/20' : 'text-tech-muted hover:text-tech-text'}`}
                        >
                            1° Cuatrimestre
                        </button>
                        <button
                            onClick={() => setIsSecondSemester(true)}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${isSecondSemester ? 'bg-tech-cyan text-white shadow-lg shadow-cyan-500/20' : 'text-tech-muted hover:text-tech-text'}`}
                        >
                            2° Cuatrimestre
                        </button>
                    </div>

                    <div className="h-8 w-px bg-tech-surface hidden md:block mx-2"></div>

                    <div className="flex items-center gap-3 mb-2 md:mb-0">
                        <Calendar size={20} className="text-tech-accent" />
                        <span className="text-sm font-bold uppercase tracking-wider text-tech-muted whitespace-nowrap">Asistencia:</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                            <label className="text-xs text-tech-muted font-mono uppercase">Desde:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full sm:w-auto bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm text-tech-text focus:border-tech-cyan outline-none font-mono"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                            <label className="text-xs text-tech-muted font-mono uppercase">Hasta:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full sm:w-auto bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm text-tech-text focus:border-tech-cyan outline-none font-mono"
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-tech-muted font-mono italic md:ml-auto mt-2 md:mt-0">
                        * Calificaciones por cuatrimestre, asistencia por rango.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20 animate-pulse text-tech-muted font-mono">Cargando tus materias...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.map(assign => (
                            <div key={assign.id} className="bg-tech-secondary p-6 rounded border border-tech-surface hover:border-tech-cyan transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-tech-cyan/10 rounded text-tech-cyan">
                                        <Users size={24} />
                                    </div>
                                    <span className="text-[10px] font-mono text-tech-muted uppercase">Asignación: {assign.id.slice(0, 6)}</span>
                                </div>
                                <h3 className="text-xl font-bold text-tech-text mb-1 uppercase tracking-tight">{assign.materia.nombre}</h3>
                                <p className="text-tech-accent font-mono text-sm mb-4 pb-4 border-b border-tech-surface/50">
                                    {assign.division.anio} "{assign.division.seccion}"
                                </p>

                                {stats[assign.id] && (
                                    <div className="grid grid-cols-2 gap-2 mb-6">
                                        <div className="bg-tech-primary/50 p-2 rounded border border-tech-surface">
                                            <p className="text-[10px] text-tech-muted uppercase font-mono">Presentismo</p>
                                            <p className="text-lg font-bold text-tech-cyan">
                                                {stats[assign.id].total > 0
                                                    ? Math.round(((stats[assign.id].present + stats[assign.id].late) / stats[assign.id].total) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                        <div className="bg-tech-primary/50 p-2 rounded border border-tech-surface">
                                            <p className="text-[10px] text-tech-muted uppercase font-mono">Ausentes</p>
                                            <p className="text-lg font-bold text-red-500">{stats[assign.id].absent || 0}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <button
                                        onClick={() => downloadPDF(assign, 'notas')}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-tech-surface hover:bg-tech-secondary text-tech-text rounded transition-all text-xs font-bold uppercase tracking-widest border border-tech-surface hover:border-tech-cyan"
                                    >
                                        <FileText size={16} className="text-tech-cyan" />
                                        Planilla de Notas
                                    </button>
                                    <button
                                        onClick={() => downloadPDF(assign, 'asistencia')}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-tech-surface hover:bg-tech-secondary text-tech-text rounded transition-all text-xs font-bold uppercase tracking-widest border border-tech-surface hover:border-tech-accent"
                                    >
                                        <Clock size={16} className="text-tech-accent" />
                                        Registro Asistencia
                                    </button>
                                </div>
                            </div>
                        ))}
                        {assignments.length === 0 && (
                            <div className="col-span-full text-center py-20 bg-tech-secondary/30 rounded border border-dashed border-tech-surface">
                                <p className="text-tech-muted font-mono">No tienes cursos asignados para generar reportes.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherReports;
