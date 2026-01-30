import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Layers, BookOpen, TrendingUp, AlertCircle, BarChart2, Calendar, Zap } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';
import { DashboardSkeleton } from './Skeleton';
import { getApiEndpoint } from '../utils/api';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const DashboardStats = ({ role, profileId }) => {
    const [stats, setStats] = useState({
        studentCount: 0,
        divisionCount: 0,
        subjectCount: 0,
        globalAttendancePct: 0,
        studentsPerDivision: [],
        atRiskStudents: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const statsEndpoint = getApiEndpoint('/reports/dashboard-stats');
                const riskEndpoint = getApiEndpoint('/reports/at-risk');

                const [res, riskRes] = await Promise.all([
                    fetch(statsEndpoint, { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
                    fetch(riskEndpoint, { headers: { 'Authorization': `Bearer ${session?.access_token}` } })
                ]);

                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => ({ ...prev, ...data }));
                }

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

    if (loading) return <DashboardSkeleton />;

    const radarData = {
        labels: ['Exactas', 'Sociales', 'Lenguas', 'Técnicas', 'Artísticas', 'Educ. Física'],
        datasets: [
            {
                label: 'Promedio Institucional',
                data: [8.5, 7.2, 7.8, 9.1, 6.5, 8.8],
                backgroundColor: 'rgba(34, 211, 238, 0.2)',
                borderColor: 'rgba(34, 211, 238, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(34, 211, 238, 1)',
            },
            {
                label: 'Meta Académica',
                data: [9, 9, 9, 9, 9, 9],
                backgroundColor: 'rgba(236, 72, 153, 0.05)',
                borderColor: 'rgba(236, 72, 153, 0.5)',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
            }
        ],
    };

    const radarOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { color: '#94a3b8', font: { size: 10, family: 'monospace' } },
                ticks: { display: false, stepSize: 2 },
                suggestedMin: 0,
                suggestedMax: 10
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    if (role === 'admin' || role === 'preceptor') {
        const maxStudents = Math.max(...stats.studentsPerDivision.map(d => d.count), 1);

        return (
            <div className="space-y-6 mb-8 animate-in fade-in duration-700">
                {/* Upper Metric Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Estudiantes', val: stats.studentCount, icon: Users, color: 'tech-cyan' },
                        { label: 'Divisiones', val: stats.divisionCount, icon: Layers, color: 'tech-accent' },
                        { label: 'Materias', val: stats.subjectCount, icon: BookOpen, color: 'tech-success' },
                        { label: 'Asistencia', val: `${stats.globalAttendancePct}%`, icon: TrendingUp, color: 'tech-cyan' }
                    ].map((m, i) => (
                        <div key={i} className="bg-tech-secondary p-5 rounded border border-tech-surface shadow-xl relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 p-3 text-${m.color} opacity-5 group-hover:opacity-20 transition-all duration-500 transform group-hover:scale-110`}>
                                <m.icon size={48} />
                            </div>
                            <p className="text-tech-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{m.label}</p>
                            <h3 className="text-3xl font-black text-tech-text font-mono tracking-tighter">{m.val}</h3>
                            <div className={`mt-3 w-12 h-1 bg-${m.color} rounded-full`}></div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance Radar */}
                    <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-2xl flex flex-col items-center">
                        <h3 className="text-xs font-bold text-tech-muted mb-6 flex items-center gap-2 uppercase tracking-widest w-full">
                            <Zap size={14} className="text-tech-accent" />
                            Performance Radar
                        </h3>
                        <div className="w-full max-w-[240px]">
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                        <div className="mt-6 flex gap-4 text-[10px] font-mono">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-tech-cyan"></div> Actual</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-tech-accent opacity-50"></div> Meta</div>
                        </div>
                    </div>

                    {/* Student Distribution */}
                    <div className="lg:col-span-2 bg-tech-secondary p-6 rounded border border-tech-surface shadow-2xl">
                        <h3 className="text-xs font-bold text-tech-muted mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <BarChart2 size={14} className="text-tech-cyan" />
                            Distribución por División
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                            {stats.studentsPerDivision.map((div, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-mono text-tech-muted leading-none">{div.name}</span>
                                        <span className="text-sm font-bold text-tech-text leading-none">{div.count}</span>
                                    </div>
                                    <div className="h-1.5 bg-tech-primary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-tech-cyan to-blue-500 transition-all duration-1000"
                                            style={{ width: `${(div.count / maxStudents) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Attendance Heatmap (Simulated Modern UI) */}
                    <div className="lg:col-span-3 bg-tech-secondary p-6 rounded border border-tech-surface shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 text-tech-cyan opacity-[0.02] pointer-events-none">
                            <Calendar size={180} />
                        </div>
                        <h3 className="text-xs font-bold text-tech-muted mb-8 flex items-center gap-2 uppercase tracking-widest">
                            <Calendar size={14} className="text-tech-cyan" />
                            Patrones de Asistencia Semanal
                        </h3>
                        <div className="grid grid-cols-5 gap-4">
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day, idx) => {
                                const val = [94, 98, 92, 88, 79][idx]; // Lower on Fridays as an example
                                const intensity = val > 90 ? 'bg-tech-success/40' : val > 85 ? 'bg-tech-cyan/40' : 'bg-tech-accent/40';
                                return (
                                    <div key={day} className="flex flex-col items-center gap-3 group">
                                        <div className={`w-full aspect-square md:aspect-[2/1] rounded-lg border border-tech-surface ${intensity} flex items-center justify-center transition-all duration-300 group-hover:scale-[1.02] relative`}>
                                            <span className="text-lg font-black text-tech-text font-mono">{val}%</span>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-tech-muted tracking-tight">{day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Alertas de Riesgo */}
                    {stats.atRiskStudents.length > 0 && (
                        <div className="lg:col-span-3 bg-tech-danger/10 border border-tech-danger/20 rounded p-6 shadow-2xl">
                            <h3 className="text-xs font-bold text-tech-danger mb-6 flex items-center gap-2 uppercase tracking-widest">
                                <AlertCircle size={14} />
                                Protocolo de Prevención: Alumnos en Riesgo
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stats.atRiskStudents.map((s, idx) => (
                                    <div key={idx} className="bg-tech-primary/40 p-4 rounded border border-tech-surface flex items-center justify-between group hover:border-tech-danger/50 transition-colors">
                                        <div>
                                            <div className="text-tech-text font-bold text-sm mb-1">{s.nombre}</div>
                                            <div className="text-[10px] text-tech-muted font-mono uppercase">{s.division}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-tech-danger font-mono">{s.pct}%</div>
                                            <div className="text-[8px] text-tech-danger uppercase font-bold">Inasistencia Crítica</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (role === 'docente') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[
                    { label: 'Mis Materias', val: stats.subjectCount, icon: BookOpen, color: 'bg-tech-cyan/20 text-tech-cyan' },
                    { label: 'Alumnos a cargo', val: stats.studentCount, icon: Users, color: 'bg-tech-accent/20 text-tech-accent' }
                ].map((m, i) => (
                    <div key={i} className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <m.icon size={64} />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`p-4 ${m.color} rounded-xl`}>
                                <m.icon size={28} />
                            </div>
                            <div>
                                <p className="text-tech-muted text-[10px] font-bold uppercase tracking-widest">{m.label}</p>
                                <h3 className="text-4xl font-black text-tech-text font-mono tracking-tighter">{m.val}</h3>
                            </div>
                        </div>
                    </div>
                ))}

                {stats.atRiskStudents.length > 0 && (
                    <div className="md:col-span-2 bg-tech-secondary border border-tech-danger/30 rounded p-6 shadow-xl">
                        <h3 className="text-[10px] font-bold text-tech-danger mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <AlertCircle size={14} />
                            Alertas de Seguimiento Académico
                        </h3>
                        <div className="space-y-3">
                            {stats.atRiskStudents.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-tech-primary/30 rounded border border-tech-surface group hover:border-tech-danger/40 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-tech-text text-sm">{s.nombre}</span>
                                        <span className="text-[10px] text-tech-muted font-mono uppercase">{s.materia} • {s.division}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <span className="block text-lg font-black text-tech-danger font-mono">{s.pct}%</span>
                                            <span className="block text-[8px] uppercase font-bold text-tech-danger">Asistencia</span>
                                        </div>
                                        <div className="hidden md:block w-32 bg-tech-secondary h-2 rounded-full overflow-hidden">
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
