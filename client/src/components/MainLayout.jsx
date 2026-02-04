import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Menu, ChevronRight, Home, Settings, HelpCircle, User } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const MainLayout = ({ children }) => {
    const { profile, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const location = useLocation();
    const navigate = useNavigate();

    // Mapping for Breadcrumbs
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
        'enrollment': 'Agrupamiento',
        'periods': 'Periodos lectivos',
    };

    const breadcrumbs = location.pathname.split('/').filter(x => x);

    if (loading) return null;
    if (!profile) return <>{children}</>;

    return (
        <div className="min-h-screen bg-tech-primary flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Area */}
            <div className={`flex-grow flex flex-col transition-all duration-300 min-w-0 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Header */}
                <header className="h-20 bg-tech-secondary/50 backdrop-blur-xl border-b border-tech-surface px-6 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-6 overflow-hidden">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 bg-tech-surface/50 hover:bg-tech-surface text-tech-muted rounded-xl transition-all border border-tech-surface lg:hidden"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest overflow-hidden whitespace-nowrap">
                            <Link to="/dashboard" className="text-tech-muted hover:text-tech-cyan transition-colors flex items-center gap-1">
                                <Home size={14} />
                                <span className="hidden md:inline">EDUMATE</span>
                            </Link>
                            {breadcrumbs.length > 0 && <ChevronRight size={14} className="text-tech-surface" />}
                            {breadcrumbs.map((crumb, idx) => {
                                const path = `/${breadcrumbs.slice(0, idx + 1).join('/')}`;
                                const name = pathNames[crumb] || crumb;
                                const isLast = idx === breadcrumbs.length - 1;

                                return (
                                    <React.Fragment key={path}>
                                        {idx > 0 && <ChevronRight size={14} className="text-tech-surface" />}
                                        <Link
                                            to={path}
                                            className={`${isLast ? 'text-tech-cyan font-black' : 'text-tech-muted hover:text-tech-text'} transition-colors max-w-[150px] truncate`}
                                        >
                                            {name}
                                        </Link>
                                    </React.Fragment>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3">
                            <ThemeToggle />
                            <div className="w-[1px] h-6 bg-tech-surface mx-1"></div>
                        </div>

                        {/* User Profile Summary */}
                        <div
                            onClick={() => navigate('/settings')}
                            className="flex items-center gap-3 pl-2 pr-1 py-1 bg-tech-surface/30 rounded-full border border-tech-surface hover:border-tech-cyan/30 cursor-pointer transition-all group"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-tech-text uppercase tracking-tighter leading-none">{profile.nombre.split(' ')[0]}</p>
                                <p className="text-[8px] font-mono text-tech-cyan uppercase leading-none mt-1">{profile.rol}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-tech-surface overflow-hidden group-hover:border-tech-cyan transition-all">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-tech-secondary flex items-center justify-center text-tech-muted">
                                        <User size={16} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-10 relative">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
