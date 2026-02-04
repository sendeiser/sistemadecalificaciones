import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, FileText, GraduationCap, BookOpen, Layers, Info, HelpCircle, ArrowRight, Clock, Settings, PieChart, BarChart3, CheckSquare, Sun, Moon, Search, X, Bell, Calendar as CalendarIcon, AlertCircle, ShieldAlert, MessageSquare, Award } from 'lucide-react';
import MedalBadge from '../components/MedalBadge';
import DashboardStats from '../components/DashboardStats';
import AnnouncementTicker from '../components/AnnouncementTicker';
import ThemeToggle from '../components/ThemeToggle';
import { supabase } from '../supabaseClient';
import { getApiEndpoint } from '../utils/api';
import CriticalStudentsWidget from '../components/CriticalStudentsWidget';
import useNotifications from '../hooks/useNotifications';

const Dashboard = () => {
    const { profile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [medals, setMedals] = useState([]);
    const { unreadMessages, unreadAnnouncements } = useNotifications();

    React.useEffect(() => {
        if (profile?.rol === 'tutor') {
            navigate('/tutor');
            return;
        }
        if (profile?.rol === 'alumno') {
            checkAchievements();
            fetchMedals();
        }
    }, [profile]);

    const checkAchievements = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(getApiEndpoint('/gamification/check-achievements'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            fetchMedals(); // Refresh after check
        } catch (error) {
            console.error('Error checking achievements:', error);
        }
    };

    const fetchMedals = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(getApiEndpoint(`/gamification/medals/${profile.id}`), {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMedals(data);
            }
        } catch (error) {
            console.error('Error fetching medals:', error);
        }
    };

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
        if (result.type === 'student') navigate(`/student/report?student_id=${result.id}`);
        if (result.type === 'division') navigate('/divisions');
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
        <div className="space-y-8 pb-10">
            {/* Top Bar for Dashboard - Search and Welcome */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-tech-text tracking-tighter uppercase leading-none">
                        PANEL DE <span className="text-tech-cyan">CONTROL</span>
                    </h1>
                    <p className="text-tech-muted text-xs font-mono uppercase tracking-[0.3em] mt-2">Visión general y métricas en tiempo real</p>
                </div>

                {(profile.rol === 'admin' || profile.rol === 'preceptor') && (
                    <div className="relative w-full lg:w-96">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tech-muted group-focus-within:text-tech-cyan transition-colors" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Búsqueda rápida..."
                                className="w-full pl-12 pr-10 py-3.5 bg-tech-secondary/50 backdrop-blur-md border border-tech-surface rounded-2xl text-sm focus:outline-none focus:border-tech-cyan/50 focus:ring-4 focus:ring-tech-cyan/5 transition-all shadow-xl"
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
                            <div className="absolute top-full mt-3 w-full bg-tech-secondary border border-tech-surface rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto border-t-4 border-t-tech-cyan animate-in fade-in slide-in-from-top-2 backdrop-blur-xl">
                                {isSearching ? (
                                    <div className="p-8 text-center text-tech-muted text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Consultando base de datos...</div>
                                ) : searchResults.length > 0 ? (
                                    <div className="p-2 space-y-1">
                                        {searchResults.map((res, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleResultClick(res)}
                                                className="w-full flex items-center gap-4 p-4 hover:bg-tech-surface/50 rounded-xl transition-all border border-transparent hover:border-tech-cyan/20 text-left group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-tech-primary flex items-center justify-center text-tech-cyan group-hover:scale-110 transition-transform">
                                                    {res.type === 'student' ? <Users size={18} /> : <BookOpen size={18} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-tech-text text-sm group-hover:text-tech-cyan transition-colors">{res.title}</span>
                                                    <span className="text-[10px] text-tech-muted uppercase font-black tracking-tighter">{res.type} {res.subtitle && `• ${res.subtitle}`}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-tech-muted text-[10px] font-black uppercase tracking-[0.2em]">No se encontraron coincidencias</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <main>
                {(profile.rol === 'admin' || profile.rol === 'docente' || profile.rol === 'alumno' || profile.rol === 'preceptor') && (
                    <AnnouncementTicker />
                )}

                <DashboardStats role={profile.rol} profileId={profile.id} />

                {(profile.rol === 'admin' || profile.rol === 'preceptor') && (
                    <div className="mb-10">
                        <CriticalStudentsWidget />
                    </div>
                )}

                {(profile.rol === 'admin' || profile.rol === 'preceptor') && (
                    <div className="space-y-12">
                        {/* Section 1: Administración Base */}
                        <section>
                            <h2 className="text-xl font-bold text-tech-text uppercase tracking-widest mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-tech-cyan rounded-full"></span>
                                Administración Base
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div onClick={() => navigate('/students')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-success transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-success">
                                        <div className="p-3 bg-tech-success/10 rounded group-hover:bg-tech-success/20 transition-colors">
                                            <Users size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Alumnos</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Administrar perfiles de estudiantes.</p>
                                </div>

                                <div onClick={() => navigate('/subjects')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <BookOpen size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Materias</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Crear y editar materias del sistema.</p>
                                </div>

                                <div onClick={() => navigate('/divisions')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <Layers size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Divisiones</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Gestionar cursos y secciones.</p>
                                </div>

                                {profile.rol === 'admin' && (
                                    <div onClick={() => navigate('/admin/users')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                            <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                                <Users size={24} />
                                            </div>
                                            <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Gestión Accesos</h3>
                                        </div>
                                        <p className="text-tech-muted text-sm font-mono">Generar invitaciones para docentes.</p>
                                    </div>
                                )}

                                {profile.rol === 'admin' && (
                                    <div onClick={() => navigate('/admin/audit')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                            <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                                <ShieldAlert size={24} />
                                            </div>
                                            <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Auditoría</h3>
                                        </div>
                                        <p className="text-tech-muted text-sm font-mono">Historial completo de acciones.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section 2: Configuración de Ciclo */}
                        <section>
                            <h2 className="text-xl font-bold text-tech-text uppercase tracking-widest mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-tech-accent rounded-full"></span>
                                Configuración de Ciclo
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div onClick={() => navigate('/assignments')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <Users size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Asignaciones</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Vincular docentes, materias y divisiones.</p>
                                </div>

                                <div onClick={() => navigate('/enrollment')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <GraduationCap size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Agrupamiento</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Asignar alumnos a sus divisiones.</p>
                                </div>

                                <div onClick={() => navigate('/periods')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
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
                                <div onClick={() => navigate('/admin/attendance-capture')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <CheckSquare size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Toma General</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Registrar asistencia por curso y fecha.</p>
                                </div>

                                <div onClick={() => navigate('/admin/mass-justification')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Justificación</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Carga masiva por rango de fechas.</p>
                                </div>

                                <div onClick={() => navigate('/admin/attendance-discrepancies')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
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
                                <div onClick={() => navigate('/admin/reports')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-success transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-success">
                                        <div className="p-3 bg-tech-success/10 rounded group-hover:bg-tech-success/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Reporte Notas</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Consolidado por curso y materia.</p>
                                </div>

                                <div onClick={() => navigate('/admin/reports/attendance')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Reporte Asist.</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Exportar PDF de asistencia general.</p>
                                </div>

                                <div onClick={() => navigate('/admin/attendance-stats')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <BarChart3 size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Estadísticas</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Gráficos de asistencia y progreso.</p>
                                </div>

                                <div onClick={() => navigate('/admin/attendance-alerts')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-danger transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-danger opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-danger">
                                        <div className="p-3 bg-tech-danger/10 rounded group-hover:bg-tech-danger/20 transition-colors">
                                            <ShieldAlert size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Alertas Asist.</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Control de abandono y citaciones.</p>
                                </div>

                                <div onClick={() => navigate('/reports')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Boletines</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Generar boletines individuales.</p>
                                </div>

                                <div onClick={() => navigate('/calendar')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors">
                                            <CalendarIcon size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Calendario</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Eventos académicos.</p>
                                </div>

                                <div onClick={() => navigate('/announcements')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-accent">
                                        <div className="p-3 bg-tech-accent/10 rounded group-hover:bg-tech-accent/20 transition-colors relative">
                                            <Bell size={24} />
                                            {unreadAnnouncements > 0 && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-tech-danger text-white text-[10px] flex items-center justify-center rounded-full border-2 border-tech-secondary font-black animate-pulse">
                                                    {unreadAnnouncements}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Anuncios</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Comunicaciones institucionales.</p>
                                </div>

                                <div onClick={() => navigate('/messages')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 mb-3 text-tech-cyan">
                                        <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors relative">
                                            <MessageSquare size={24} />
                                            {unreadMessages > 0 && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-tech-danger text-white text-[10px] flex items-center justify-center rounded-full border-2 border-tech-secondary font-black animate-pulse">
                                                    {unreadMessages}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-tech-text uppercase tracking-tight">Mensajes</h3>
                                    </div>
                                    <p className="text-tech-muted text-sm font-mono">Chat Institucional seguro.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* Vista para Docente */}
                {profile.rol === 'docente' && (
                    <div className="space-y-12">
                        <section>
                            <h2 className="text-xl font-bold text-tech-text uppercase tracking-widest mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-tech-cyan rounded-full"></span>
                                Tareas Rápidas
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {profile.rol === 'docente' && (
                                    <>
                                        <div onClick={() => navigate('/attendance')} className="p-6 bg-tech-secondary/40 border-2 border-dashed border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group rounded-xl flex items-center gap-4">
                                            <div className="p-4 bg-tech-cyan/10 rounded-lg text-tech-cyan group-hover:scale-110 transition-transform"><Clock size={32} /></div>
                                            <div><h3 className="text-lg font-bold uppercase">Asistencia</h3><p className="text-xs text-tech-muted font-mono">Registrar hoy</p></div>
                                        </div>
                                        <div onClick={() => navigate('/grades')} className="p-6 bg-tech-secondary/40 border-2 border-dashed border-tech-surface hover:border-tech-accent transition-all cursor-pointer group rounded-xl flex items-center gap-4">
                                            <div className="p-4 bg-tech-accent/10 rounded-lg text-tech-accent group-hover:scale-110 transition-transform"><GraduationCap size={32} /></div>
                                            <div><h3 className="text-lg font-bold uppercase">Cargar Notas</h3><p className="text-xs text-tech-muted font-mono">Actualizar materias</p></div>
                                        </div>
                                    </>
                                )}
                                <div onClick={() => navigate('/messages')} className="p-6 bg-tech-secondary/40 border-2 border-dashed border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group rounded-xl flex items-center gap-4">
                                    <div className="p-4 bg-tech-cyan/10 rounded-lg text-tech-cyan group-hover:scale-110 transition-transform relative">
                                        <MessageSquare size={32} />
                                        {unreadMessages > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-tech-danger text-white text-[10px] flex items-center justify-center rounded-full border-2 border-tech-secondary font-black animate-pulse shadow-lg">
                                                {unreadMessages}
                                            </span>
                                        )}
                                    </div>
                                    <div><h3 className="text-lg font-bold uppercase">Mensajes</h3><p className="text-xs text-tech-muted font-mono">Ver chat</p></div>
                                </div>
                            </div>
                        </section>
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div onClick={() => navigate('/grades')} className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all p-6 group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-cyan"><GraduationCap size={24} /><h3 className="text-xl font-bold uppercase">Mis Cursos</h3></div>
                                <p className="text-tech-muted mb-6 font-mono font-sm">Gestión de calificaciones por curso.</p>
                                <button className="px-4 py-2 bg-tech-cyan text-white rounded font-bold uppercase tracking-widest text-xs">Abrir Planilla</button>
                            </div>
                            <div onClick={() => navigate('/attendance')} className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all p-6 group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-accent"><Clock size={24} /><h3 className="text-xl font-bold uppercase">Asistencia</h3></div>
                                <p className="text-tech-muted mb-6 font-mono font-sm">Control diario de inasistencias.</p>
                                <button className="px-4 py-2 bg-tech-accent text-white rounded font-bold uppercase tracking-widest text-xs">Tomar Lista</button>
                            </div>
                            <div onClick={() => navigate('/teacher/reports')} className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-success transition-all p-6 group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-success"><FileText size={24} /><h3 className="text-xl font-bold uppercase">Reportes</h3></div>
                                <p className="text-tech-muted mb-6 font-mono font-sm">Exportar boletines y planillas.</p>
                                <button className="px-4 py-2 bg-tech-success text-white rounded font-bold uppercase tracking-widest text-xs">Ver PDF</button>
                            </div>
                            <div onClick={() => navigate('/calendar')} className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all p-6 group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-cyan"><CalendarIcon size={24} /><h3 className="text-xl font-bold uppercase">Calendario</h3></div>
                                <p className="text-tech-muted mb-6 font-mono font-sm">Cronograma del ciclo lectivo.</p>
                                <button className="px-4 py-2 bg-tech-cyan text-white rounded font-bold uppercase tracking-widest text-xs">Ver Fechas</button>
                            </div>
                            <div onClick={() => navigate('/announcements')} className="bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all p-6 group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-accent">
                                    <div className="relative">
                                        <Bell size={24} />
                                        {unreadAnnouncements > 0 && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-tech-danger text-white text-[8px] flex items-center justify-center rounded-full border border-tech-secondary font-black animate-pulse">
                                                {unreadAnnouncements}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold uppercase">Anuncios</h3>
                                </div>
                                <p className="text-tech-muted mb-6 font-mono font-sm">Novedades institucionales.</p>
                                <button className="px-4 py-2 bg-tech-accent text-white rounded font-bold uppercase tracking-widest text-xs">Ver Noticias</button>
                            </div>
                        </section>
                    </div>
                )}

                {/* Vista para Alumno */}
                {profile.rol === 'alumno' && (
                    <div className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div onClick={() => navigate('/student/report')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-success transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-success"><FileText size={40} /><h3 className="text-xl font-bold uppercase">Mi Boletín</h3></div>
                                <p className="text-tech-muted font-mono text-sm">Visualizar calificaciones y asistencia.</p>
                            </div>
                            <div onClick={() => navigate('/messages')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-cyan">
                                    <div className="relative">
                                        <MessageSquare size={40} />
                                        {unreadMessages > 0 && (
                                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-tech-danger text-white text-[12px] flex items-center justify-center rounded-full border-2 border-tech-secondary font-black animate-pulse shadow-xl">
                                                {unreadMessages}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold uppercase">Mensajes</h3>
                                </div>
                                <p className="text-tech-muted font-mono text-sm">Comunicación con docentes.</p>
                            </div>
                            <div onClick={() => navigate('/calendar')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-cyan"><CalendarIcon size={40} /><h3 className="text-xl font-bold uppercase">Calendario</h3></div>
                                <p className="text-tech-muted font-mono text-sm">Fechas de exámenes y eventos.</p>
                            </div>
                            <div onClick={() => navigate('/announcements')} className="p-6 bg-tech-secondary rounded border border-tech-surface hover:border-tech-accent transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4 text-tech-accent">
                                    <div className="relative">
                                        <Bell size={40} />
                                        {unreadAnnouncements > 0 && (
                                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-tech-danger text-white text-[12px] flex items-center justify-center rounded-full border-2 border-tech-secondary font-black animate-pulse shadow-xl">
                                                {unreadAnnouncements}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold uppercase">Anuncios</h3>
                                </div>
                                <p className="text-tech-muted font-mono text-sm">Noticias de la escuela.</p>
                            </div>
                        </div>

                        {/* Mis Logros Section */}
                        {medals.length > 0 && (
                            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold text-tech-text uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <span className="w-2 h-8 bg-tech-accent rounded-full"></span>
                                    Mis Logros y Medallas
                                </h2>
                                <div className="flex flex-wrap gap-4">
                                    {medals.map((m, i) => (
                                        <MedalBadge key={i} medalKey={m.medal_key} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Guía Común */}
                <div className="mt-16 border-t border-tech-surface pt-10">
                    <div onClick={() => navigate('/')} className="p-8 bg-tech-secondary/50 rounded-2xl border border-tech-surface hover:border-tech-cyan/40 transition-all cursor-pointer group flex items-center gap-8 shadow-2xl">
                        <div className="p-4 bg-tech-cyan/10 rounded-xl text-tech-cyan group-hover:scale-110 transition-transform"><Info size={40} /></div>
                        <div className="flex-grow">
                            <h3 className="text-2xl font-bold text-tech-text uppercase tracking-tight">Guía del Sistema</h3>
                            <p className="text-tech-muted font-mono">Información técnica y operativa sobre la plataforma Edumate.</p>
                        </div>
                        <ArrowRight size={32} className="text-tech-muted group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
