import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, FileText, GraduationCap, BookOpen, Layers, Info, HelpCircle, ArrowRight, Clock, Settings, PieChart, BarChart3, CheckSquare } from 'lucide-react';
import DashboardStats from '../components/DashboardStats';

const Dashboard = () => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-tech-surface pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        <span className="text-tech-cyan">Hola,</span> {profile.nombre}
                    </h1>
                    <p className="text-slate-400 capitalize mt-1 font-medium text-lg font-mono">
                        ID: <span className="text-tech-cyan">{profile.id.slice(0, 8)}</span> | ROL: <span className="text-tech-accent">{profile.rol}</span>
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-tech-secondary hover:bg-tech-surface rounded border border-tech-surface hover:border-tech-danger/50 transition-all uppercase tracking-wider"
                >
                    <LogOut size={16} />
                    Cerrar Sesión
                </button>
            </header>

            <main>
                {/* Stats Section */}
                <DashboardStats role={profile.rol} profileId={profile.id} />

                {profile.rol === 'admin' && (
                    <div className="space-y-12">
                        {/* Section 1: Administración Base */}
                        <section>
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-tech-cyan rounded-full"></span>
                                Administración Base
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div
                                    onClick={() => navigate('/students')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-success transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-success">
                                        <div className="p-3 bg-tech-success/10 rounded group-hover:bg-tech-success/20 transition-colors">
                                            <Users size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Alumnos</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Administrar perfiles de estudiantes.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/subjects')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <BookOpen size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Materias</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Crear y editar materias del sistema.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/divisions')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <Layers size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Divisiones</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Gestionar cursos y secciones.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Configuración de Ciclo */}
                        <section>
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-tech-accent rounded-full"></span>
                                Configuración de Ciclo
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div
                                    onClick={() => navigate('/assignments')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <Users size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Asignaciones</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Vincular docentes, materias y divisiones.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/enrollment')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <GraduationCap size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Agrupamiento</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Asignar alumnos a sus divisiones.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/periods')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <Settings size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Periodos</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Controlar apertura de cargas de notas.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Gestión Diaria */}
                        <section>
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-tech-cyan rounded-full"></span>
                                Control Diario
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div
                                    onClick={() => navigate('/admin/attendance-capture')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <CheckSquare size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Toma General</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Registrar asistencia por curso y fecha.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Reportes y Seguimiento */}
                        <section>
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-tech-success rounded-full"></span>
                                Reportes y Análisis
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div
                                    onClick={() => navigate('/admin/reports')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-success transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-success">
                                        <div className="p-3 bg-tech-success/10 rounded group-hover:bg-tech-success/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Reporte Notas</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Consolidado por curso y materia.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/admin/reports/attendance')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Reporte Asist.</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Exportar PDF de asistencia general.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/admin/attendance-stats')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <BarChart3 size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Estadísticas</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Gráficos de asistencia y progreso.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/reports')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Boletines</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">Generar boletines individuales.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {profile.rol === 'docente' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div
                            onClick={() => navigate('/grades')}
                            className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all p-6 group cursor-pointer hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 mb-4 text-tech-cyan">
                                <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                    <GraduationCap size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Mis Cursos</h3>
                            </div>
                            <p className="text-slate-400 mb-6 font-mono">Selecciona un curso para comenzar a cargar calificaciones.</p>
                            <button className="px-4 py-2 bg-tech-cyan hover:bg-sky-600 text-white rounded transition-colors font-medium text-sm w-full md:w-auto uppercase tracking-wider">
                                Ver Cursos Asignados
                            </button>
                        </div>

                        <div
                            onClick={() => navigate('/attendance')}
                            className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all p-6 group cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 mb-4 text-tech-accent">
                                <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                    <Clock size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Asistencia</h3>
                            </div>
                            <p className="text-slate-400 mb-6 font-mono">Registrar asistencia diaria para tus cursos.</p>
                            <button className="px-4 py-2 bg-tech-accent hover:bg-amber-600 text-white rounded transition-colors font-medium text-sm w-full md:w-auto uppercase tracking-wider">
                                Tomar Asistencia
                            </button>
                        </div>

                        <div
                            onClick={() => navigate('/teacher/reports')}
                            className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-success transition-all p-6 group cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-tech-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 mb-4 text-tech-success">
                                <div className="p-3 bg-tech-success/10 rounded group-hover:bg-tech-success/20 transition-colors">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Mis Reportes</h3>
                            </div>
                            <p className="text-slate-400 mb-6 font-mono">Exportar PDFs de notas y asistencias de tus cursos.</p>
                            <button className="px-4 py-2 bg-tech-success hover:bg-emerald-600 text-white rounded transition-colors font-medium text-sm w-full md:w-auto uppercase tracking-wider">
                                Generar PDFs
                            </button>
                        </div>
                    </div>
                )}

                {profile.rol === 'alumno' && (
                    <div className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-success transition-all group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-tech-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 mb-4 text-tech-success">
                            <div className="p-3 bg-tech-success/10 rounded group-hover:bg-tech-success/20 transition-colors">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Mis Calificaciones</h3>
                        </div>
                        <p className="text-slate-400 mb-6 font-mono">Consulta tu historial académico y notas actuales.</p>
                        <button
                            onClick={() => navigate('/student/report')}
                            className="px-4 py-2 bg-tech-success hover:bg-emerald-600 text-white rounded transition-colors font-medium text-sm uppercase tracking-wider"
                        >
                            Ver Mi Boletín
                        </button>
                    </div>
                )}

                {/* Common Section: Welcome & Info Guide */}
                <div className="mt-10 border-t border-tech-surface pt-10">
                    <div
                        onClick={() => navigate('/')}
                        className="p-6 bg-tech-secondary/50 rounded border border-tech-surface hover:border-tech-cyan/40 hover:bg-tech-secondary transition-all cursor-pointer group flex items-center gap-6"
                    >
                        <div className="p-4 bg-tech-cyan/10 rounded text-tech-cyan group-hover:scale-110 transition-transform">
                            <Info size={32} />
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                                Guía del Sistema
                                <HelpCircle size={18} className="text-slate-500" />
                            </h3>
                            <p className="text-slate-400 font-mono text-sm">¿Necesitas ayuda? Revisa las instrucciones de uso, roles y tips de seguridad.</p>
                        </div>
                        <ArrowRight className="text-slate-600 group-hover:text-tech-cyan group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
