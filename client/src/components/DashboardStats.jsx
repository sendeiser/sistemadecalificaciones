import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Layers, BookOpen, TrendingUp, AlertCircle, BarChart2 } from 'lucide-react';

import { getApiEndpoint } from '../utils/api';

const DashboardStats = ({ role, profileId }) => {
    const [stats, setStats] = useState({
        studentCount: 0,
        divisionCount: 0,
        subjectCount: 0,
        globalAttendancePct: 0,
        studentsPerDivision: [],
        teacherSubjectCount: 0,
        teacherStudentCount: 0,
        atRiskStudents: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                const statsEndpoint = getApiEndpoint('/reports/dashboard-stats');
                const riskEndpoint = getApiEndpoint('/reports/at-risk');

                const res = await fetch(statsEndpoint, {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => ({ ...prev, ...data }));
                }

                // Fetch At Risk Students
                const riskRes = await fetch(riskEndpoint, {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                });

                if (riskRes.ok) {
                    const riskData = await riskRes.json();
                    setStats(prev => ({ ...prev, atRiskStudents: riskData }));
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, [role, profileId]);

    if (loading) return <div className="p-4 text-center text-tech-muted font-mono animate-pulse">Cargando estadísticas...</div>;

    if (role === 'admin') {
        const maxStudents = Math.max(...stats.studentsPerDivision.map(d => d.count), 1);

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* Metric Cards */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users size={64} />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-tech-cyan/20 text-tech-cyan rounded-lg">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-tech-muted text-xs font-bold uppercase tracking-wider">Total Alumnos</p>
                                <h3 className="text-3xl font-bold text-tech-text font-mono">{stats.studentCount}</h3>
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-tech-primary h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-tech-cyan w-3/4 animate-pulse"></div>
                        </div>
                    </div>

                    <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Layers size={64} />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-tech-accent/20 text-tech-accent rounded-lg">
                                <Layers size={24} />
                            </div>
                            <div>
                                <p className="text-tech-muted text-xs font-bold uppercase tracking-wider">Divisiones</p>
                                <h3 className="text-3xl font-bold text-tech-text font-mono">{stats.divisionCount}</h3>
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-tech-primary h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-tech-accent w-1/2"></div>
                        </div>
                    </div>

                    <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BookOpen size={64} />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-tech-success/20 text-tech-success rounded-lg">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <p className="text-tech-muted text-xs font-bold uppercase tracking-wider">Materias</p>
                                <h3 className="text-3xl font-bold text-tech-text font-mono">{stats.subjectCount}</h3>
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-tech-primary h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-tech-success w-2/3"></div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="lg:col-span-2 bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg">
                    <h3 className="text-lg font-bold text-tech-text mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <BarChart2 size={20} className="text-tech-cyan" />
                        Distribución de Alumnos
                    </h3>
                    <div className="space-y-4">
                        {stats.studentsPerDivision.map((div, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-16 text-xs font-bold text-tech-muted font-mono text-right">{div.name}</div>
                                <div className="flex-grow bg-tech-primary h-3 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-tech-cyan relative group"
                                        style={{ width: `${(div.count / maxStudents) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/50 opacity-0 group-hover:opacity-100"></div>
                                    </div>
                                </div>
                                <div className="w-8 text-xs font-bold text-tech-text font-mono text-right">{div.count}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg flex flex-col justify-center items-center text-center">
                    <div className="p-4 bg-tech-primary rounded-full mb-4 border border-tech-surface">
                        <TrendingUp size={32} className="text-tech-success" />
                    </div>
                    <h3 className="text-xl font-bold text-tech-text uppercase mb-2">Rendimiento Global</h3>
                    <p className="text-tech-muted text-sm mb-6">El promedio general de asistencia de la institución.</p>
                    <div className="text-4xl font-bold text-tech-success font-mono mb-2">{stats.globalAttendancePct}%</div>
                    <p className="text-xs text-tech-muted/80 uppercase tracking-widest font-bold">ASISTENCIA PROMEDIO</p>
                </div>

                {/* At Risk Students Alerts - Admin View */}
                {stats.atRiskStudents.length > 0 && (
                    <div className="lg:col-span-3 bg-tech-secondary border border-tech-danger/30 rounded p-6 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 text-tech-danger opacity-10">
                            <AlertCircle size={48} />
                        </div>
                        <h3 className="text-lg font-bold text-tech-danger mb-4 flex items-center gap-2 uppercase tracking-tight">
                            <AlertCircle size={20} />
                            Alumnos en Riesgo (Baja Asistencia)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.atRiskStudents.map((s, idx) => (
                                <div key={idx} className="bg-tech-primary/50 p-4 rounded border border-tech-surface flex flex-col gap-1">
                                    <span className="font-bold text-tech-text truncate">{s.nombre}</span>
                                    <div className="flex justify-between items-center text-xs font-mono">
                                        <span className="text-tech-muted">{s.division} {s.materia ? `| ${s.materia}` : ''}</span>
                                        <span className="text-tech-danger font-bold">{s.pct}%</span>
                                    </div>
                                    <div className="w-full bg-tech-secondary h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-tech-danger" style={{ width: `${s.pct}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (role === 'docente') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BookOpen size={64} />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-tech-cyan/20 text-tech-cyan rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-tech-muted text-xs font-bold uppercase tracking-wider">Mis Materias</p>
                            <h3 className="text-3xl font-bold text-tech-text font-mono">{stats.subjectCount}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users size={64} />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-tech-accent/20 text-tech-accent rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-tech-muted text-xs font-bold uppercase tracking-wider">Alumnos a cargo</p>
                            <h3 className="text-3xl font-bold text-tech-text font-mono">{stats.studentCount}</h3>
                        </div>
                    </div>
                </div>

                {/* Teacher At Risk Alerts */}
                {stats.atRiskStudents.length > 0 && (
                    <div className="bg-tech-secondary border border-tech-danger/30 rounded p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-tech-danger mb-4 flex items-center gap-2 uppercase tracking-tight">
                            <AlertCircle size={20} />
                            Alertas de Inasistencia en mis Materias
                        </h3>
                        <div className="space-y-3">
                            {stats.atRiskStudents.map((s, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-tech-primary/30 rounded border border-tech-surface gap-2">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-tech-text">{s.nombre}</span>
                                        <span className="text-xs text-tech-muted font-mono">{s.materia} - {s.division}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold text-tech-danger font-mono">{s.pct}% Asist.</span>
                                        <div className="w-24 bg-tech-secondary h-2 rounded-full overflow-hidden">
                                            <div className="h-full bg-tech-danger" style={{ width: `${s.pct}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default DashboardStats;
