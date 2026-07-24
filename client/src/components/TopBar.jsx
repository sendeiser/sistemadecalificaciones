import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight, Home, Bell, User, Settings, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

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

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const breadcrumbs = location.pathname.split('/').filter(x => x);
    const totalUnread = unreadMessages + unreadAnnouncements;

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

                <button
                    onClick={() => navigate('/messages')}
                    className="relative p-2 hover:bg-tech-surface rounded-lg text-tech-muted hover:text-tech-text transition-all focus-visible:ring-2 focus-visible:ring-tech-cyan/30 focus:outline-none"
                    aria-label="Mensajes"
                >
                    <Bell size={18} />
                    {totalUnread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tech-cyan rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-tech-secondary">
                            {totalUnread}
                        </span>
                    )}
                </button>

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
