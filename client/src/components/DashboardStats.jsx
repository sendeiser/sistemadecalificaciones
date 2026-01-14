import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Layers, BookOpen, TrendingUp, AlertCircle, BarChart2 } from 'lucide-react';

const DashboardStats = ({ role, profileId }) => {
    const [stats, setStats] = useState({
        studentCount: 0,
        divisionCount: 0,
        subjectCount: 0,
        studentsPerDivision: [],
        subjectAverages: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (role === 'admin') {
                    // Fetch counts
                    const { count: studentCount } = await supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'alumno');
                    const { count: divisionCount } = await supabase.from('divisiones').select('*', { count: 'exact', head: true });
                    const { count: subjectCount } = await supabase.from('materias').select('*', { count: 'exact', head: true });

                    // Distribution of students per division
                    const { data: divisions } = await supabase.from('divisiones').select('id, anio, seccion');

                    const studentsPerDiv = [];
                    if (divisions) {
                        for (const div of divisions) {
                            const { count } = await supabase
                                .from('inscripciones_division')
                                .select('*', { count: 'exact', head: true })
                                .eq('division_id', div.id);

                            studentsPerDiv.push({
                                name: `${div.anio} ${div.seccion}`,
                                count: count || 0
                            });
                        }
                    }

                    setStats({
                        studentCount: studentCount || 0,
                        divisionCount: divisionCount || 0,
                        subjectCount: subjectCount || 0,
                        studentsPerDivision: studentsPerDiv,
                        subjectAverages: []
                    });
                } else if (role === 'docente') {
                    // For teachers: Count their subjects and students in those subjects
                    // Note: This requires complex joins, for now we will show generic stats or just return
                    // A real implementation would query 'asignaciones_profesor'
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, [role, profileId]);

    if (loading) return <div className="p-4 text-center text-slate-500 font-mono animate-pulse">Cargando estadísticas...</div>;

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
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Alumnos</p>
                                <h3 className="text-3xl font-bold text-white font-mono">{stats.studentCount}</h3>
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
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Divisiones</p>
                                <h3 className="text-3xl font-bold text-white font-mono">{stats.divisionCount}</h3>
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
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Materias</p>
                                <h3 className="text-3xl font-bold text-white font-mono">{stats.subjectCount}</h3>
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-tech-primary h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-tech-success w-2/3"></div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="lg:col-span-2 bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <BarChart2 size={20} className="text-tech-cyan" />
                        Distribución de Alumnos
                    </h3>
                    <div className="space-y-4">
                        {stats.studentsPerDivision.map((div, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-16 text-xs font-bold text-slate-400 font-mono text-right">{div.name}</div>
                                <div className="flex-grow bg-tech-primary h-3 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-tech-cyan relative group"
                                        style={{ width: `${(div.count / maxStudents) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/50 opacity-0 group-hover:opacity-100"></div>
                                    </div>
                                </div>
                                <div className="w-8 text-xs font-bold text-white font-mono text-right">{div.count}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg flex flex-col justify-center items-center text-center">
                    <div className="p-4 bg-tech-primary rounded-full mb-4 border border-tech-surface">
                        <TrendingUp size={32} className="text-tech-success" />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase mb-2">Rendimiento Global</h3>
                    <p className="text-slate-400 text-sm mb-6">El promedio general de la institución se mantiene estable.</p>
                    <div className="text-4xl font-bold text-tech-success font-mono mb-2">96%</div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">ASISTENCIA PROMEDIO</p>
                </div>
            </div>
        );
    }

    return null;
};

export default DashboardStats;
