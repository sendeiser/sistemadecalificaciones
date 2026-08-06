import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight, Home, Bell, User, Settings, LogOut, Megaphone, MessageSquare, CheckCircle2, ExternalLink, X, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { getApiEndpoint } from '../utils/api';

const pathNames = {
    'dashboard': 'Panel Principal',
    'students': 'Gestión de Alumnos',
    'subjects': 'Materias',
    'divisions': 'Divisiones',
    'assignments': 'Asignaciones',
    'grades': 'Calificaciones',
    'attendance': 'Asistencia',
    'reports': 'Reportes',
    'calendar': 'Calendario escolar',
    'announcements': 'Anuncios',
    'messages': 'Mensajes',
    'settings': 'Ajustes de Perfil',
    'help': 'Centro de Ayuda',
    'admin': 'Administración',
    'users': 'Gestión de Usuarios',
    'audit': 'Registro de Auditoría',
    'enrollment': 'Inscripción de Alumnos',
    'periods': 'Periodos lectivos',
};

const TopBar = ({ onToggleSidebar, unreadMessages = 0, unreadAnnouncements = 0 }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, signOut } = useAuth();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [recentAnnouncements, setRecentAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

    const notificationRef = useRef(null);

    const totalUnread = unreadMessages + unreadAnnouncements;

    // Fetch recent announcements preview when opening notification tab
    useEffect(() => {
        if (!isNotificationOpen) return;

        const fetchAnnouncementsPreview = async () => {
            setLoadingAnnouncements(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const res = await fetch(getApiEndpoint('/announcements?limit=3'), {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRecentAnnouncements(data.announcements || []);
                }
            } catch (err) {
                console.error('Error fetching notification preview:', err);
            } finally {
                setLoadingAnnouncements(false);
            }
        };

        fetchAnnouncementsPreview();
    }, [isNotificationOpen]);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const breadcrumbs = location.pathname.split('/').filter(x => x);

    return (
        <header className="h-14 bg-tech-secondary/80 backdrop-blur-xl border-b border-tech-surface flex items-center justify-between px-4 md:px-6 gap-4 sticky top-0 z-40">
            <div className="flex items-center gap-3 overflow-hidden">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 hover:bg-tech-surface rounded-lg text-tech-muted hover:text-tech-text transition-all focus-visible:ring-2 focus-visible:ring-tech-cyan/30 focus:outline-none"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>

                <nav className="hidden md:flex items-center gap-2 text-xs font-mono uppercase tracking-widest overflow-hidden">
                    <Link to="/dashboard" className="text-tech-muted hover:text-tech-cyan transition-colors flex items-center gap-1 shrink-0">
                        <Home size={14} />
                    </Link>
                    {breadcrumbs.length > 0 && <ChevronRight size={14} className="text-tech-surface shrink-0" />}
                    {breadcrumbs.map((crumb, idx) => {
                        const path = `/${breadcrumbs.slice(0, idx + 1).join('/')}`;
                        const name = pathNames[crumb] || crumb;
                        const isLast = idx === breadcrumbs.length - 1;
                        return (
                            <span key={path} className="flex items-center gap-2 overflow-hidden">
                                {idx > 0 && <ChevronRight size={14} className="text-tech-surface shrink-0" />}
                                <Link
                                    to={path}
                                    className={`${isLast ? 'text-tech-cyan font-black' : 'text-tech-muted hover:text-tech-text'} transition-colors truncate max-w-[120px]`}
                                >
                                    {name}
                                </Link>
                            </span>
                        );
                    })}
                </nav>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <ThemeToggle />

                {/* SOLAPA DE NOTIFICACIONES */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className={`relative p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-tech-cyan/30 focus:outline-none ${
                            isNotificationOpen ? 'bg-tech-surface text-tech-cyan' : 'hover:bg-tech-surface text-tech-muted hover:text-tech-text'
                        }`}
                        aria-label="Notificaciones"
                    >
                        <Bell size={18} />
                        {totalUnread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tech-cyan rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-tech-secondary shadow-sm">
                                {totalUnread}
                            </span>
                        )}
                    </button>

                    {/* POP-OVER TAB (SOLAPA) */}
                    {isNotificationOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-tech-secondary/95 backdrop-blur-2xl border border-tech-surface rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Encabezado de la Solapa */}
                                <div className="p-4 border-b border-tech-surface bg-tech-primary/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-tech-cyan/10 rounded-lg text-tech-cyan">
                                            <Bell size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-tech-text uppercase tracking-wider">Centro de Novedades</h4>
                                            <p className="text-[9px] font-mono text-tech-muted uppercase">Notificaciones del Sistema</p>
                                        </div>
                                    </div>
                                    {totalUnread > 0 && (
                                        <span className="px-2 py-0.5 bg-tech-cyan/20 text-tech-cyan rounded-full text-[9px] font-black uppercase font-mono border border-tech-cyan/30">
                                            {totalUnread} Pendiente{totalUnread > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                {/* Acceso Rápido por Categorías */}
                                <div className="grid grid-cols-2 gap-2 p-3 bg-tech-surface/20 border-b border-tech-surface">
                                    <button
                                        onClick={() => { navigate('/announcements'); setIsNotificationOpen(false); }}
                                        className="flex items-center justify-between p-2.5 bg-tech-secondary hover:bg-tech-cyan/10 border border-tech-surface hover:border-tech-cyan/30 rounded-xl transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Megaphone size={14} className="text-tech-cyan group-hover:scale-110 transition-transform" />
                                            <div>
                                                <p className="text-[10px] font-bold text-tech-text uppercase">Anuncios</p>
                                                <p className="text-[8px] font-mono text-tech-muted">Institucionales</p>
                                            </div>
                                        </div>
                                        {unreadAnnouncements > 0 && (
                                            <span className="w-4 h-4 bg-tech-cyan text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                                {unreadAnnouncements}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => { navigate('/messages'); setIsNotificationOpen(false); }}
                                        className="flex items-center justify-between p-2.5 bg-tech-secondary hover:bg-tech-cyan/10 border border-tech-surface hover:border-tech-cyan/30 rounded-xl transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <MessageSquare size={14} className="text-tech-cyan group-hover:scale-110 transition-transform" />
                                            <div>
                                                <p className="text-[10px] font-bold text-tech-text uppercase">Mensajes</p>
                                                <p className="text-[8px] font-mono text-tech-muted">Directos</p>
                                            </div>
                                        </div>
                                        {unreadMessages > 0 && (
                                            <span className="w-4 h-4 bg-tech-cyan text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                                {unreadMessages}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Vista Previa de Anuncios Recientes */}
                                <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                                    <div className="flex items-center justify-between mb-1 px-1">
                                        <span className="text-[9px] font-mono text-tech-muted uppercase tracking-wider font-bold">Últimas Publicaciones</span>
                                        <Sparkles size={10} className="text-tech-cyan" />
                                    </div>

                                    {loadingAnnouncements ? (
                                        <div className="py-6 text-center text-tech-muted text-xs animate-pulse font-mono">
                                            Cargando novedades...
                                        </div>
                                    ) : recentAnnouncements.length === 0 ? (
                                        <div className="py-6 text-center text-tech-muted flex flex-col items-center gap-2">
                                            <CheckCircle2 size={24} className="text-tech-cyan/50" />
                                            <p className="text-xs font-medium">Sin notificaciones pendientes</p>
                                        </div>
                                    ) : (
                                        recentAnnouncements.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => { navigate('/announcements'); setIsNotificationOpen(false); }}
                                                className="p-2.5 bg-tech-primary/40 hover:bg-tech-surface/50 border border-tech-surface/60 rounded-xl transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-[8px] font-black uppercase font-mono px-1.5 py-0.5 rounded bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/20">
                                                        {item.categoria || item.tipo || 'Aviso'}
                                                    </span>
                                                    <span className="text-[8px] font-mono text-tech-muted">
                                                        {item.fecha_publicacion ? new Date(item.fecha_publicacion).toLocaleDateString() : ''}
                                                    </span>
                                                </div>
                                                <h5 className="text-xs font-bold text-tech-text group-hover:text-tech-cyan transition-colors line-clamp-1">
                                                    {item.titulo}
                                                </h5>
                                                <p className="text-[10px] text-tech-muted line-clamp-2 mt-0.5 leading-relaxed">
                                                    {item.contenido}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer de la Solapa */}
                                <div className="p-3 border-t border-tech-surface bg-tech-primary/50 flex items-center justify-between text-xs">
                                    <button
                                        onClick={() => { navigate('/announcements'); setIsNotificationOpen(false); }}
                                        className="text-[10px] font-mono text-tech-cyan hover:underline flex items-center gap-1 font-bold"
                                    >
                                        Ver todos los anuncios <ExternalLink size={10} />
                                    </button>
                                    <button
                                        onClick={() => { navigate('/messages'); setIsNotificationOpen(false); }}
                                        className="text-[10px] font-mono text-tech-muted hover:text-tech-text flex items-center gap-1 font-bold"
                                    >
                                        Ver chats <ChevronRight size={10} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="flex items-center gap-2 pl-2 pr-1.5 py-1 hover:bg-tech-surface rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-tech-cyan/30 focus:outline-none"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black text-tech-text uppercase tracking-tighter leading-none">{profile?.nombre?.split(' ')[0]}</p>
                            <p className="text-[8px] font-mono text-tech-cyan uppercase leading-none mt-0.5">{profile?.rol}</p>
                        </div>
                        <div className="w-7 h-7 bg-tech-cyan/10 rounded-lg flex items-center justify-center text-[10px] font-black text-tech-cyan uppercase">
                            {profile?.nombre?.[0] || '?'}
                        </div>
                    </button>

                    {isProfileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-tech-secondary border border-tech-surface rounded-xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-2 border-b border-tech-surface mb-1">
                                    <p className="text-xs font-bold text-tech-text truncate">{profile?.nombre}</p>
                                    <p className="text-[10px] font-mono text-tech-muted uppercase">{profile?.rol}</p>
                                </div>
                                <button
                                    onClick={() => { navigate('/settings'); setIsProfileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-tech-text hover:bg-tech-surface/50 transition-colors"
                                >
                                    <Settings size={14} /> Configuración
                                </button>
                                <hr className="border-tech-surface my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-tech-danger hover:bg-tech-danger/5 transition-colors"
                                >
                                    <LogOut size={14} /> Cerrar Sesión
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
