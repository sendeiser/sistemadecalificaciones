import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, FileText, GraduationCap, BookOpen, Layers, Info, HelpCircle, ArrowRight, Clock, Settings, PieChart, BarChart3, CheckSquare, Sun, Moon, Search, X, Bell, Calendar as CalendarIcon, AlertCircle, ShieldAlert } from 'lucide-react';
import DashboardStats from '../components/DashboardStats';
import AnnouncementTicker from '../components/AnnouncementTicker';
import ThemeToggle from '../components/ThemeToggle';
import { supabase } from '../supabaseClient';
import { getApiEndpoint } from '../utils/api';
import CriticalStudentsWidget from '../components/CriticalStudentsWidget';

const Dashboard = () => {
    const { profile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        setShowResults(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint('/search');
            const res = await fetch(`${endpoint}?query=${query}`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleResultClick = (result) => {
        setShowResults(false);
        setSearchQuery('');
        if (result.type === 'student') navigate(`/student/report?student_id=${result.id}`); // This would need to be handled by StudentReport or a profile page
        if (result.type === 'division') navigate('/divisions'); // Simplified navigation
        if (result.type === 'subject') navigate('/subjects');
    };

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-tech-primary text-tech-text">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-cyan"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-tech-surface pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-tech-text tracking-tight">
                        <span className="text-tech-cyan">Hola,</span> {profile.nombre}
                    </h1>
                    <p className="text-tech-muted capitalize mt-1 font-medium text-lg font-mono">
                        ID: <span className="text-tech-cyan">{profile.id.slice(0, 8)}</span> | ROL: <span className="text-tech-accent">{profile.rol}</span>
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Search Bar - Only for Admin/Preceptor */}
                    {(profile.rol === 'admin' || profile.rol === 'preceptor') && (
                        <div className="relative w-full md:w-80">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    placeholder="Buscar alumno, materia o división..."
                                    className="w-full pl-10 pr-10 py-2 bg-tech-secondary border border-tech-surface rounded text-sm focus:outline-none focus:border-tech-cyan transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setShowResults(false); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-tech-muted hover:text-tech-text"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {showResults && (
                                <div className="absolute top-full mt-2 w-full bg-tech-secondary border border-tech-surface rounded shadow-2xl z-50 max-h-80 overflow-y-auto overflow-x-hidden">
                                    {isSearching ? (
                                        <div className="p-4 text-center text-tech-muted text-sm font-mono animate-pulse">Buscando...</div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="p-2 space-y-1">
                                            {searchResults.map((res, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleResultClick(res)}
                                                    className="w-full flex flex-col items-start p-3 hover:bg-tech-surface rounded transition-colors border border-transparent hover:border-tech-cyan/30 text-left"
                                                >
                                                    <span className="font-bold text-tech-text text-sm">{res.title}</span>
                                                    <span className="text-xs text-tech-muted capitalize">{res.type} {res.subtitle && `• ${res.subtitle}`}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-tech-muted text-sm">No se encontraron resultados</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-tech-muted hover:text-tech-text bg-tech-secondary hover:bg-tech-surface rounded border border-tech-surface hover:border-tech-danger/50 transition-all uppercase tracking-wider"
                        >
                            <LogOut size={16} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {/* Ticker for Teachers, Students and Preceptors */}
                {(profile.rol === 'admin' || profile.rol === 'docente' || profile.rol === 'alumno' || profile.rol === 'preceptor') && (
                    <AnnouncementTicker />
                )}

                {/* Stats Section */}
                <DashboardStats role={profile.rol} profileId={profile.id} />

                {(profile.rol === 'admin' || profile.rol === 'preceptor') && (
                    <div className="space-y-12">
                        {/* Section 1: Administración Base */}
                        <section>
                            <h2 className="text-xl font-bold text-tech-text uppercase tracking-widest mb-6 flex items-center gap-3">
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
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Alumnos</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Administrar perfiles de estudiantes.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/subjects')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <BookOpen size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Materias</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Crear y editar materias del sistema.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/divisions')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <Layers size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Divisiones</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Gestionar cursos y secciones.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/admin/users')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <Users size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Gestión Accesos</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Generar invitaciones para docentes.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Configuración de Ciclo */}
                        <section>
                            <h2 className="text-xl font-bold text-tech-text uppercase tracking-widest mb-6 flex items-center gap-3">
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
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Asignaciones</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Vincular docentes, materias y divisiones.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/enrollment')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <GraduationCap size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Agrupamiento</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Asignar alumnos a sus divisiones.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/periods')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <Settings size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Periodos</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Controlar apertura de cargas de notas.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Gestión Diaria */}
                        <section>
                            <h2 className="text-xl font-bold text-tech-text uppercase tracking-widest mb-6 flex items-center gap-3">
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
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Toma General</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Registrar asistencia por curso y fecha.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/admin/mass-justification')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Justificación</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Carga masiva por rango de fechas.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/admin/attendance-discrepancies')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <AlertCircle size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Discrepancias</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Control cruzado Preceptor/Docente.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Reportes y Seguimiento */}
                        <section>
                            <h2 className="text-xl font-bold text-tech-text uppercase tracking-widest mb-6 flex items-center gap-3">
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
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Reporte Notas</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Consolidado por curso y materia.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/admin/reports/attendance')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Reporte Asist.</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Exportar PDF de asistencia general.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/admin/attendance-stats')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <BarChart3 size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Estadísticas</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Gráficos de asistencia y progreso.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/admin/attendance-alerts')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-danger transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-danger opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-danger">
                                        <div className="p-3 bg-tech-danger/10 rounded group-hover:bg-tech-danger/20 transition-colors">
                                            <ShieldAlert size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Alertas Asist.</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Control de abandono y citaciones.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/reports')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Boletines</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Generar boletines individuales.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/calendar')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <CalendarIcon size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Calendario</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Eventos y fechas importantes.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/announcements')}
                                    className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <Bell size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Anuncios</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Comunicaciones institucionales.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {profile.rol === 'docente' && (
                    <div className="space-y-12">
                        {/* Quick Actions for Teachers */}
                        <section>
                            <h2 className="text-xl font-bold text-tech-text uppercase tracking-widest mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-tech-cyan rounded-full"></span>
                                Tareas Rápidas
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div
                                    onClick={() => navigate('/attendance')}
                                    className="p-6 bg-tech-secondary/40 border-2 border-dashed border-tech-surface hover:border-tech-cyan hover:bg-tech-secondary transition-all cursor-pointer group rounded-xl flex items-center gap-4"
                                >
                                    <div className="p-4 bg-tech-cyan/10 rounded-lg text-tech-cyan group-hover:scale-110 transition-transform">
                                        <Clock size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-tech-text uppercase">Tomar Asistencia</h3>
                                        <p className="text-xs text-tech-muted font-mono whitespace-nowrap">Registrar el día de hoy</p>
                                    </div>
                                </div>

                                <div
                                    onClick={() => navigate('/attendance')}
                                    className="p-6 bg-tech-secondary/40 border-2 border-dashed border-tech-surface hover:border-tech-cyan hover:bg-tech-secondary transition-all cursor-pointer group rounded-xl flex items-center gap-4"
                                >
                                    <div className="p-4 bg-tech-cyan/10 rounded-lg text-tech-cyan group-hover:scale-110 transition-transform">
                                        <Search size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-tech-text uppercase text-tech-cyan">Asistencia QR</h3>
                                        <p className="text-xs text-tech-muted font-mono whitespace-nowrap">Escanear credenciales</p>
                                    </div>
                                </div>

                                <div
                                    onClick={() => navigate('/grades')}
                                    className="p-6 bg-tech-secondary/40 border-2 border-dashed border-tech-surface hover:border-tech-accent hover:bg-tech-secondary transition-all cursor-pointer group rounded-xl flex items-center gap-4"
                                >
                                    <div className="p-4 bg-tech-accent/10 rounded-lg text-tech-accent group-hover:scale-110 transition-transform">
                                        <GraduationCap size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-tech-text uppercase">Cargar Notas</h3>
                                        <p className="text-xs text-tech-muted font-mono whitespace-nowrap">Actualizar calificaciones</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div
                                onClick={() => navigate('/grades')}
                                className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all p-6 group cursor-pointer hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-cyan">
                                    <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                        <GraduationCap size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Mis Cursos</h3>
                                </div>
                                <p className="text-tech-muted mb-6 font-mono">Selecciona un curso para comenzar a cargar calificaciones.</p>
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
                                    <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Asistencia</h3>
                                </div>
                                <p className="text-tech-muted mb-6 font-mono">Registrar asistencia diaria para tus cursos.</p>
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
                                    <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Mis Reportes</h3>
                                </div>
                                <p className="text-tech-muted mb-6 font-mono">Exportar PDFs de notas y asistencias de tus cursos.</p>
                                <button className="px-4 py-2 bg-tech-success hover:bg-emerald-600 text-white rounded transition-colors font-medium text-sm w-full md:w-auto uppercase tracking-wider">
                                </button>
                            </div>

                            <div
                                onClick={() => navigate('/calendar')}
                                className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all p-6 group cursor-pointer hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-cyan">
                                    <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                        <CalendarIcon size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Calendario</h3>
                                </div>
                                <p className="text-tech-muted mb-6 font-mono">Ver eventos y fechas importantes del ciclo lectivo.</p>
                                <button className="px-4 py-2 bg-tech-cyan hover:bg-sky-600 text-white rounded transition-colors font-medium text-sm w-full md:w-auto uppercase tracking-wider">
                                    Ver Calendario
                                </button>
                            </div>

                            <div
                                onClick={() => navigate('/announcements')}
                                className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all p-6 group cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-accent">
                                    <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                        <Bell size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Anuncios</h3>
                                </div>
                                <p className="text-tech-muted mb-6 font-mono">Comunicaciones y novedades institucionales.</p>
                                <button className="px-4 py-2 bg-tech-accent hover:bg-amber-600 text-white rounded transition-colors font-medium text-sm w-full md:w-auto uppercase tracking-wider">
                                    Ver Anuncios
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {profile.rol === 'alumno' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-success transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-tech-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 mb-4 text-tech-success">
                                <div className="p-3 bg-tech-success/10 rounded group-hover:bg-tech-success/20 transition-colors">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Mis Calificaciones</h3>
                            </div>
                            <p className="text-tech-muted mb-6 font-mono">Consulta tu historial académico y notas actuales.</p>
                            <button
                                onClick={() => navigate('/student/report')}
                                className="px-4 py-2 bg-tech-success hover:bg-emerald-600 text-white rounded transition-colors font-medium text-sm uppercase tracking-wider"
                            >
                                Ver Mi Boletín
                            </button>
                        </div>

                        <div
                            onClick={() => navigate('/calendar')}
                            className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all group relative overflow-hidden cursor-pointer"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 mb-4 text-tech-cyan">
                                <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                    <CalendarIcon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Calendario</h3>
                            </div>
                            <p className="text-tech-muted mb-6 font-mono">Ver eventos y fechas importantes del ciclo lectivo.</p>
                            <button className="px-4 py-2 bg-tech-cyan hover:bg-sky-600 text-white rounded transition-colors font-medium text-sm uppercase tracking-wider">
                                Ver Calendario
                            </button>
                        </div>

                        <div
                            onClick={() => navigate('/announcements')}
                            className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all group relative overflow-hidden cursor-pointer"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 mb-4 text-tech-accent">
                                <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                    <Bell size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Anuncios</h3>
                            </div>
                            <p className="text-tech-muted mb-6 font-mono">Comunicaciones y novedades institucionales.</p>
                            <button className="px-4 py-2 bg-tech-accent hover:bg-amber-600 text-white rounded transition-colors font-medium text-sm uppercase tracking-wider">
                                Ver Anuncios
                            </button>
                        </div>
                    </div>
                )}

                {/* Preceptor dedicated section removed - merged with Admin */}

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
                            <h3 className="text-xl font-bold text-tech-text flex items-center gap-2 uppercase tracking-tight">
                                Guía del Sistema
                                <HelpCircle size={18} className="text-tech-muted" />
                            </h3>
                            <p className="text-tech-muted font-mono text-sm">¿Necesitas ayuda? Revisa las instrucciones de uso, roles y tips de seguridad.</p>
                        </div>
                        <ArrowRight className="text-tech-surface group-hover:text-tech-cyan group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
