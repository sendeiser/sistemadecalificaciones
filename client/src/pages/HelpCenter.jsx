import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    HelpCircle, ArrowLeft, Book, Users, Star,
    Shield, MessageSquare, Calendar, ChevronRight,
    ChevronDown, Settings, Bell, Info
} from 'lucide-react';
import PageTransition from '../components/PageTransition';

const HelpCenter = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(null);

    const toggleSection = (id) => {
        setActiveSection(activeSection === id ? null : id);
    };

    if (!profile) return null;

    const role = profile.rol;

    // Help sections based on roles
    const sections = [
        {
            id: 'profile',
            title: 'Mi Perfil y Seguridad',
            icon: <Settings size={20} />,
            roles: ['admin', 'docente', 'alumno', 'tutor', 'preceptor'],
            content: (
                <div className="space-y-4 text-sm leading-relaxed">
                    <p>Puedes personalizar tu cuenta desde la sección de <strong>Ajustes</strong> (icono de engranaje).</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Foto de Perfil:</strong> Sube una imagen para que tus colegas y alumnos te identifiquen.</li>
                        <li><strong>Nombre:</strong> Asegúrate de que tu nombre sea el correcto para los reportes oficiales.</li>
                        <li><strong>Contraseña:</strong> Recomendamos cambiar tu clave cada 3 meses para mantener la seguridad.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'preceptor_ops',
            title: 'Gestión de Preceptoría',
            icon: <Shield size={20} />,
            roles: ['preceptor', 'admin'],
            content: (
                <div className="space-y-4 text-sm leading-relaxed">
                    <p>Módulos críticos para el seguimiento diario del estudiante:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Asistencia y Justidicación:</strong> Registro de inasistencias y carga masiva de certificados (justificaciones).</li>
                        <li><strong>Control de Discrepancias:</strong> Herramienta para validar que la asistencia tomada coincida con la del docente.</li>
                        <li><strong>Alertas y Citaciones:</strong> Sistema automático para detectar alumnos en riesgo de perder la regularidad.</li>
                        <li><strong>Reportes:</strong> Generación de boletines, sábanas de notas y listados de asistencia en PDF.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'admin_base',
            title: 'Configuración Institucional',
            icon: <Users size={20} />,
            roles: ['admin'],
            content: (
                <div className="space-y-4 text-sm leading-relaxed">
                    <p>Gestión de la infraestructura básica del sistema:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Gestión Accesos:</strong> Creación de usuarios y control de invitaciones para personal nuevo.</li>
                        <li><strong>Materias y Ciclos:</strong> Definición del plan de estudios y apertura/cierre de periodos de nota.</li>
                        <li><strong>Auditoría:</strong> Revisión forense de cada cambio realizado en el sistema por cualquier usuario.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'grades',
            title: 'Carga de Calificaciones',
            icon: <Star size={20} />,
            roles: ['admin', 'docente'],
            content: (
                <div className="space-y-4 text-sm leading-relaxed">
                    <p>El sistema calcula el promedio y el nivel de logro automáticamente.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Carga:</strong> Ingresa valores numéricos del 1 al 10 en los parciales.</li>
                        <li><strong>Logros:</strong> El sistema asigna LD (Destacado), LS (Satisfactorio), LB (Básico) o LI (Inicial).</li>
                        <li><strong>Cuatrimestres:</strong> Puedes cambiar entre periodos para ver o editar notas específicas.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'attendance',
            title: 'Control de Asistencia',
            icon: <Calendar size={20} />,
            roles: ['admin', 'docente', 'preceptor'],
            content: (
                <div className="space-y-4 text-sm leading-relaxed">
                    <p>Registra la presencialidad de tus alumnos de forma diaria:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Estados:</strong> Presente, Ausente, Tarde o Justificado.</li>
                        <li><strong>Reportes:</strong> El sistema genera porcentajes de asistencia requeridos para la acreditación.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'student_view',
            title: 'Consulta Académica',
            icon: <Book size={20} />,
            roles: ['alumno', 'tutor'],
            content: (
                <div className="space-y-4 text-sm leading-relaxed">
                    <p>Haz un seguimiento de tu progreso en tiempo real:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Boletín:</strong> Descarga tu reporte oficial en PDF con código de verificación único.</li>
                        <li><strong>Logros:</strong> Consulta tu desempeño por materia y cuatrimestre.</li>
                        <li><strong>Asistencia:</strong> Revisa tu porcentaje acumulado para evitar perder la regularidad.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'messaging',
            title: 'Sistema de Mensajería y Avisos',
            icon: <MessageSquare size={20} />,
            roles: ['admin', 'docente', 'alumno', 'tutor', 'preceptor'],
            content: (
                <div className="space-y-4 text-sm leading-relaxed">
                    <p>Mantente en contacto con la comunidad educativa:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Mensajes:</strong> Chat directo entre docentes, alumnos y familias.</li>
                        <li><strong>Anuncios:</strong> Avisos institucionales importantes visibles en el Dashboard.</li>
                        <li><strong>Notificaciones:</strong> Icono de campana para novedades sobre tus mensajes.</li>
                    </ul>
                </div>
            )
        }
    ];

    // Filter sections by role
    const filteredSections = sections.filter(s => s.roles.includes(role));

    return (
        <PageTransition>
            <div className="max-w-3xl mx-auto pb-10">
                <div className="mb-10">
                    <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                        CENTRO DE <span className="text-tech-cyan">AYUDA</span>
                    </h1>
                    <p className="text-tech-muted text-xs font-mono uppercase tracking-[0.3em] mt-2">
                        Guía de usuario para el rol <span className="text-tech-accent font-bold">{role}</span>
                    </p>
                </div>

                {/* Intro Card */}
                <div className="bg-tech-secondary border border-tech-surface rounded-2xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <HelpCircle size={120} />
                    </div>
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <Info size={20} className="text-tech-cyan" />
                        ¿Cómo funciona el sistema?
                    </h2>
                    <p className="text-tech-muted text-sm leading-relaxed">
                        Bienvenido al manual interactivo. Aquí encontrarás instrucciones detalladas sobre las herramientas que tienes permitidas según tu nivel de acceso. Haz clic en cada sección para expandirla.
                    </p>
                </div>

                {/* Accordion List */}
                <div className="space-y-4">
                    {filteredSections.map((section) => (
                        <div
                            key={section.id}
                            className={`bg-tech-secondary border rounded-2xl transition-all duration-300 ${activeSection === section.id
                                ? 'border-tech-cyan shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                                : 'border-tech-surface hover:border-tech-surface/80'
                                }`}
                        >
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl transition-colors ${activeSection === section.id ? 'bg-tech-cyan text-white' : 'bg-tech-surface text-tech-muted'
                                        }`}>
                                        {section.icon}
                                    </div>
                                    <span className={`font-bold uppercase tracking-tight ${activeSection === section.id ? 'text-tech-cyan' : 'text-tech-text'
                                        }`}>
                                        {section.title}
                                    </span>
                                </div>
                                <div className="text-tech-muted">
                                    {activeSection === section.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                            </button>

                            {activeSection === section.id && (
                                <div className="px-5 pb-6 border-t border-tech-surface/30 pt-4 animate-in fade-in slide-in-from-top-2">
                                    {section.content}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer / Support */}
                <div className="mt-12 text-center p-8 border-2 border-dashed border-tech-surface rounded-3xl">
                    <Users size={32} className="mx-auto text-tech-muted mb-4 opacity-20" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-tech-muted mb-2">¿Necesitas más soporte?</h3>
                    <p className="text-xs text-tech-muted mb-6">Si no encuentras la solución aquí, contacta al administrador de la institución.</p>
                    <button
                        onClick={() => navigate('/messages')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-tech-surface hover:bg-tech-surface/80 text-tech-text rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-tech-surface"
                    >
                        <MessageSquare size={14} /> Enviar Mensaje a Soporte
                    </button>
                </div>
            </div>
        </PageTransition>
    );
};

export default HelpCenter;
