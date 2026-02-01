import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Clock, FileText, ChevronRight, AlertCircle, Calendar, MessageSquare, Award, Sparkles, User, UserCheck, LogOut } from 'lucide-react';
import { getApiEndpoint } from '../utils/api';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import useNotifications from '../hooks/useNotifications';

const ParentDashboard = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const { unreadMessages, unreadAnnouncements } = useNotifications();

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(getApiEndpoint('/tutor/children'), {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setChildren(data);
            }
        } catch (error) {
            console.error('Error fetching children:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-tech-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-cyan"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10">
            <header className="mb-10 border-b border-tech-surface pb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Portal de <span className="text-tech-cyan">Tutores</span>
                        </h1>
                        <p className="text-tech-muted font-mono mt-1 uppercase text-xs tracking-widest">
                            Seguimiento Académico Institucional
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="flex items-center gap-2 px-4 py-2 bg-tech-danger/10 hover:bg-tech-danger/20 text-tech-danger rounded-xl font-bold transition-all uppercase text-xs tracking-widest border border-tech-danger/30"
                        >
                            <LogOut size={16} />
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h2 className="text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-tech-cyan rounded-full"></span>
                        Mis Hijos / Estudiantes a Cargo
                    </h2>

                    {children.length === 0 ? (
                        <div className="p-12 bg-tech-secondary/30 rounded-3xl border border-tech-surface border-dashed text-center">
                            <Users className="mx-auto text-tech-muted mb-4 opacity-50" size={48} />
                            <p className="text-tech-muted font-mono">No hay estudiantes vinculados a tu cuenta actualmente.</p>
                            <p className="text-tech-muted text-xs mt-2">Contacta a secretaría para vincular a tu hijo/a.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {children.map((child, idx) => (
                                <ChildCard
                                    key={idx}
                                    child={child.alumno}
                                    relationship={child.parentesco}
                                    onClick={() => navigate(`/student/report?student_id=${child.alumno_id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Accesos Rápidos Generales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickAccessCard
                        icon={<Calendar />}
                        title="Calendario Escolar"
                        desc="Fechas de exámenes y eventos"
                        onClick={() => navigate('/calendar')}
                    />
                    <QuickAccessCard
                        icon={<MessageSquare />}
                        title="Mensajería"
                        desc="Comunicación con la escuela"
                        onClick={() => navigate('/messages')}
                        badgeCount={unreadMessages}
                    />
                    <QuickAccessCard
                        icon={<FileText />}
                        title="Documentos"
                        desc="Informes y autorizaciones"
                        onClick={() => navigate('/announcements')}
                        badgeCount={unreadAnnouncements}
                    />
                </div>
            </main>
        </div>
    );
};

const ChildCard = ({ child, relationship, onClick }) => {
    const division = child.division?.[0]?.division;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            className="group relative bg-tech-secondary p-6 rounded-3xl border border-tech-surface hover:border-tech-cyan transition-all cursor-pointer overflow-hidden shadow-xl"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <GraduationCap size={80} />
            </div>

            <div className="flex items-start gap-4 mb-6">
                <div className="p-4 bg-tech-cyan/10 rounded-2xl text-tech-cyan">
                    <User size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-tech-text uppercase">{child.nombre}</h3>
                    <p className="text-tech-muted text-sm font-mono">{relationship} | DNI: {child.dni}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-tech-primary/50 rounded-xl border border-tech-surface">
                    <p className="text-[10px] text-tech-muted uppercase font-bold mb-1">Curso</p>
                    <p className="text-sm font-bold text-tech-text">
                        {division ? `${division.anio} "${division.seccion}"` : 'Sin Asignar'}
                    </p>
                </div>
                <div className="p-3 bg-tech-primary/50 rounded-xl border border-tech-surface">
                    <p className="text-[10px] text-tech-muted uppercase font-bold mb-1">Estado</p>
                    <p className="text-sm font-bold text-tech-success">REGULAR</p>
                </div>
            </div>

            <div className="flex items-center justify-between text-tech-cyan text-sm font-bold uppercase tracking-widest mt-2 group-hover:translate-x-1 transition-transform">
                Ver Informe Detallado
                <ChevronRight size={18} />
            </div>
        </motion.div>
    );
};

const QuickAccessCard = ({ icon, title, desc, onClick, badgeCount }) => (
    <div
        onClick={onClick}
        className="p-6 bg-tech-secondary/50 rounded-2xl border border-tech-surface hover:border-tech-cyan/40 cursor-pointer transition-all group"
    >
        <div className="flex items-center gap-4">
            <div className="p-3 bg-tech-surface rounded-xl text-tech-muted group-hover:text-tech-cyan transition-colors relative">
                {icon}
                {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-tech-danger text-white text-[10px] flex items-center justify-center rounded-full border-2 border-tech-secondary font-black animate-pulse shadow-lg">
                        {badgeCount}
                    </span>
                )}
            </div>
            <div>
                <h4 className="font-bold text-tech-text">{title}</h4>
                <p className="text-xs text-tech-muted font-mono">{desc}</p>
            </div>
        </div>
    </div>
);

export default ParentDashboard;
