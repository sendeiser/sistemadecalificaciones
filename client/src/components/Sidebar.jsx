import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, BookOpen, Clock,
    FileText, Calendar, MessageSquare, Bell,
    ShieldCheck, Settings, HelpCircle, LogOut,
    ChevronLeft, ChevronRight, Menu, X,
    Layers, GraduationCap, CheckSquare, BarChart3,
    AlertCircle, Search, Home
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsOpen]);

    if (!profile) return null;

    const navItems = [
        {
            title: 'Principal',
            items: [
                { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'docente', 'alumno', 'preceptor', 'tutor'] },
                { path: '/calendar', label: 'Calendario', icon: <Calendar size={20} />, roles: ['admin', 'docente', 'alumno', 'preceptor', 'tutor'] },
                { path: '/messages', label: 'Mensajes', icon: <MessageSquare size={20} />, roles: ['admin', 'docente', 'alumno', 'preceptor', 'tutor'] },
                { path: '/announcements', label: 'Anuncios', icon: <Bell size={20} />, roles: ['admin', 'docente', 'alumno', 'preceptor', 'tutor'] },
            ]
        },
        {
            title: 'Académico',
            roles: ['admin', 'docente', 'preceptor', 'alumno', 'tutor'],
            items: [
                { path: '/grades', label: 'Carga de Notas', icon: <GraduationCap size={20} />, roles: ['docente'] },
                { path: '/attendance', label: 'Asistencia', icon: <Clock size={20} />, roles: ['docente'] },
                { path: '/student/report', label: 'Mi Boletín', icon: <FileText size={20} />, roles: ['alumno', 'tutor'] },
                { path: '/teacher/reports', label: 'Reportes Docente', icon: <BarChart3 size={20} />, roles: ['docente'] },
            ]
        },
        {
            title: 'Preceptoría',
            roles: ['admin', 'preceptor'],
            items: [
                { path: '/admin/attendance-capture', label: 'Toma General', icon: <CheckSquare size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/admin/mass-justification', label: 'Justificaciones', icon: <FileText size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/admin/reports/attendance', label: 'Reporte Asist.', icon: <FileText size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/admin/attendance-stats', label: 'Estadísticas', icon: <BarChart3 size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/admin/attendance-discrepancies', label: 'Discrepancias', icon: <AlertCircle size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/admin/attendance-alerts', label: 'Alertas', icon: <Bell size={20} />, roles: ['admin', 'preceptor'] },
            ]
        },
        {
            title: 'Administración',
            roles: ['admin', 'preceptor'],
            items: [
                { path: '/students', label: 'Alumnos', icon: <Users size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/subjects', label: 'Materias', icon: <BookOpen size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/divisions', label: 'Divisiones', icon: <Layers size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/assignments', label: 'Asignaciones', icon: <Users size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/enrollment', label: 'Agrupamiento', icon: <Users size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/admin/reports', label: 'Planilla Notas', icon: <FileText size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/reports', label: 'Boletines', icon: <GraduationCap size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/periods', label: 'Periodos', icon: <Settings size={20} />, roles: ['admin', 'preceptor'] },
                { path: '/admin/users', label: 'Usuarios/Invit.', icon: <ShieldCheck size={20} />, roles: ['admin'] },
                { path: '/admin/audit', label: 'Auditoría', icon: <ShieldCheck size={20} />, roles: ['admin'] },
            ]
        }
    ];

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`fixed top-0 left-0 h-full bg-tech-secondary border-r border-tech-surface z-50 transition-all duration-300 ease-in-out flex flex-col
                ${isOpen ? 'w-64' : 'w-20'} 
                ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
            `}>
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-between border-b border-tech-surface/50">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => navigate('/dashboard')}
                    >
                        <div className="w-10 h-10 bg-tech-cyan rounded-xl flex items-center justify-center text-white shadow-lg shadow-tech-cyan/20 group-hover:scale-105 transition-transform">
                            <GraduationCap size={24} />
                        </div>
                        {isOpen && (
                            <div className="flex flex-col">
                                <span className="font-black text-2xl tracking-tighter text-tech-text">ETA</span>
                                <span className="text-[10px] font-mono text-tech-cyan uppercase tracking-widest leading-none">Gestión Agropecuaria</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-grow overflow-y-auto overflow-x-hidden py-6 custom-scrollbar px-3">
                    {navItems.map((section, idx) => {
                        const filteredItems = section.items.filter(item => item.roles.includes(profile.rol));
                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={idx} className="mb-8 last:mb-0">
                                {isOpen && (
                                    <h4 className="px-4 text-[10px] font-black text-tech-muted uppercase tracking-[0.2em] mb-4 opacity-50">
                                        {section.title}
                                    </h4>
                                )}
                                <div className="space-y-1">
                                    {filteredItems.map((item) => (
                                        <button
                                            key={item.path}
                                            onClick={() => {
                                                navigate(item.path);
                                                if (isMobile) setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative
                                                ${isActive(item.path)
                                                    ? 'bg-tech-cyan/10 text-tech-cyan'
                                                    : 'text-tech-muted hover:bg-tech-surface hover:text-tech-text'
                                                }
                                            `}
                                            title={!isOpen ? item.label : ''}
                                        >
                                            <div className={`transition-transform group-hover:scale-110 ${isActive(item.path) ? 'text-tech-cyan' : ''}`}>
                                                {item.icon}
                                            </div>
                                            {isOpen && (
                                                <span className="text-sm font-bold tracking-tight">{item.label}</span>
                                            )}
                                            {isActive(item.path) && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-tech-cyan rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-tech-surface/50 space-y-2">
                    <button
                        onClick={() => navigate('/help')}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-tech-muted hover:bg-tech-surface hover:text-tech-cyan transition-all
                            ${isActive('/help') ? 'bg-tech-cyan/10 text-tech-cyan' : ''}
                        `}
                    >
                        <HelpCircle size={20} />
                        {isOpen && <span className="text-sm font-bold italic opacity-60">Ayuda</span>}
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-tech-muted hover:bg-tech-surface hover:text-tech-cyan transition-all
                            ${isActive('/settings') ? 'bg-tech-cyan/10 text-tech-cyan' : ''}
                        `}
                    >
                        <Settings size={20} />
                        {isOpen && <span className="text-sm font-bold">Ajustes</span>}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-tech-muted hover:bg-tech-danger/10 hover:text-tech-danger transition-all group"
                    >
                        <div className="group-hover:rotate-12 transition-transform">
                            <LogOut size={20} />
                        </div>
                        {isOpen && <span className="text-sm font-bold">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
