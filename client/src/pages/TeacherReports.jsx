import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Calendar, Download, FileText, ArrowLeft, BarChart3, Users, Clock } from 'lucide-react';
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
        if (!token) return alert('No hay sesión activa');

        let url = '';
        if (type === 'asistencia') {
            url = getApiEndpoint(`/reports/attendance/assignment/${assignment.id}?token=${token}`);
            if (startDate) url += `&start_date=${startDate}`;
            if (endDate) url += `&end_date=${endDate}`;
        } else {
            // Point to the advanced grade report used by preceptors
            url = getApiEndpoint(`/reports/grades?division_id=${assignment.division_id}&materia_id=${assignment.materia_id}&token=${token}`);
        }

        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between border-b border-tech-surface pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-tech-text uppercase tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-tech-cyan/20 rounded text-tech-cyan">
                            <FileText size={32} />
                        </div>
                        Mis Reportes
                    </h1>
                    <p className="text-tech-muted font-mono mt-2">Exportación de planillas de calificaciones y asistencia.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 text-tech-muted hover:text-tech-text hover:bg-tech-surface rounded transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Volver
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Date Filters */}
                <div className="bg-tech-secondary p-6 rounded border border-tech-surface flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-tech-cyan" />
                        <span className="text-sm font-bold uppercase tracking-wider text-tech-muted">Rango de Fechas:</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-tech-muted font-mono">DESDE:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm text-white focus:border-tech-cyan outline-none font-mono"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-tech-muted font-mono">HASTA:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm text-white focus:border-tech-cyan outline-none font-mono"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-tech-muted font-mono italic md:ml-auto">
                        * Los filtros afectan solo al reporte de asistencia.
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
