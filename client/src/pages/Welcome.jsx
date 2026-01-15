import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import {
    School,
    Key,
    ClipboardEdit,
    GraduationCap,
    ShieldCheck,
    ArrowRight,
    Users,
    FileText,
    Clock,
    Lock,
    LifeBuoy,
    Search,
    Save,
    AlertCircle,
    Star,
    Layers
} from 'lucide-react';

const Welcome = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    const handleAccess = () => {
        if (profile) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text flex flex-col font-sans relative">
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>
            {/* Header / Hero Section */}
            <section className="relative py-20 px-6 overflow-hidden bg-tech-primary border-b border-tech-surface">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-tech-cyan/5 blur-[80px]"></div>
                </div>

                <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
                    <div className="p-4 bg-tech-cyan/10 rounded border border-tech-cyan/20 mb-6 animate-bounce">
                        <School className="text-tech-cyan" size={48} />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 text-tech-text tracking-tight uppercase">
                        Gestión Académica <span className="text-tech-cyan block mt-2 text-2xl md:text-5xl font-mono">Técnica Digital</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-tech-muted font-medium italic mb-8 font-mono">
                        "Eficiencia y precisión en la acreditación de saberes."
                    </p>
                    <div className="max-w-3xl text-lg text-tech-muted leading-relaxed font-sans">
                        Estimados miembros de la comunidad educativa, les damos la bienvenida al nuevo portal de calificaciones.
                        Este sistema ha sido diseñado específicamente para cumplir con los estándares de la
                        <span className="text-tech-accent font-bold px-1">Planilla de Acreditación de Saberes</span>,
                        facilitando el seguimiento pedagógico.
                    </div>

                    <button
                        onClick={handleAccess}
                        className="mt-10 flex items-center gap-2 px-8 py-4 bg-tech-cyan hover:bg-sky-600 text-white rounded font-bold text-lg transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-105 active:scale-95 group uppercase tracking-wider"
                    >
                        {profile ? 'Ir al Panel de Control' : 'Acceder al Sistema'}
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Instruction Grid */}
            <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-tech-text">

                {/* Admin Card */}
                <div className="bg-tech-secondary rounded border border-tech-surface p-8 hover:border-tech-cyan/50 transition-all group flex flex-col h-full hover:shadow-[0_0_30px_rgba(14,165,233,0.1)]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-tech-cyan/10 rounded">
                            <Key className="text-tech-cyan" size={24} />
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Preceptores</h2>
                    </div>
                    <div className="space-y-6 flex-grow">
                        <div className="flex gap-4">
                            <Users className="text-tech-cyan shrink-0" size={18} />
                            <p className="text-sm text-tech-muted"><strong className="text-tech-text">Carga de Matrícula:</strong> Importación de alumnos por división desde "Gestión de Alumnos".</p>
                        </div>
                        <div className="flex gap-4">
                            <Layers className="text-tech-cyan shrink-0" size={18} />
                            <p className="text-sm text-tech-muted"><strong className="text-tech-text">Asignaciones:</strong> Vincular cada docente con su materia y curso correspondiente.</p>
                        </div>
                        <div className="flex gap-4">
                            <Clock className="text-tech-cyan shrink-0" size={18} />
                            <p className="text-sm text-tech-muted"><strong className="text-tech-text">Control de Ciclos:</strong> Abrir o Cerrar periodos de forma segura.</p>
                        </div>
                        <div className="flex gap-4">
                            <FileText className="text-tech-cyan shrink-0" size={18} />
                            <p className="text-sm text-tech-muted"><strong className="text-tech-text">Reportes:</strong> Generación de PDFs oficiales para firmas y archivo.</p>
                        </div>
                    </div>
                </div>

                {/* Teacher Card */}
                <div className="bg-tech-secondary rounded border border-tech-surface p-8 hover:border-tech-success/50 transition-all group flex flex-col h-full hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-tech-success/10 rounded">
                            <ClipboardEdit className="text-tech-success" size={24} />
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Docentes</h2>
                    </div>
                    <div className="space-y-6 flex-grow">
                        <div className="flex gap-4">
                            <ArrowRight className="text-tech-success shrink-0" size={18} />
                            <p className="text-sm text-tech-muted"><strong className="text-tech-text">Carga Dinámica:</strong> Planillas automáticas con cálculo de Promedio y Logro.</p>
                        </div>
                        <div className="flex gap-4">
                            <AlertCircle className="text-tech-success shrink-0" size={18} />
                            <p className="text-sm text-tech-muted"><strong className="text-tech-text">Asistencia:</strong> Resaltado automático para alumnos con asistencia crítica.</p>
                        </div>
                        <div className="flex gap-4">
                            <Save className="text-tech-success shrink-0" size={18} />
                            <p className="text-sm text-tech-muted"><strong className="text-tech-text">Guardado:</strong> Edición habilitada hasta el cierre del periodo.</p>
                        </div>
                    </div>
                </div>

                {/* Student Card */}
                <div className="bg-tech-secondary rounded border border-tech-surface p-8 hover:border-purple-500/50 transition-all group flex flex-col h-full hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-purple-500/10 rounded">
                            <GraduationCap className="text-purple-400" size={24} />
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Alumnos</h2>
                    </div>
                    <div className="space-y-6 flex-grow">
                        <div className="flex gap-4">
                            <Search className="text-purple-500 shrink-0" size={18} />
                            <p className="text-sm text-tech-muted"><strong className="text-tech-text">Consulta Transparente:</strong> Notas parciales, promedios y logros en tiempo real.</p>
                        </div>
                        <div className="flex gap-4">
                            <Star className="text-purple-500 shrink-0" size={18} />
                            <p className="text-sm text-tech-muted"><strong className="text-tech-text">Seguimiento:</strong> Identificación rápida de materias para Intensificación.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Support and Security Section */}
            <section className="bg-tech-secondary/50 py-12 px-6 border-t border-tech-surface mt-auto">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-tech-text uppercase tracking-wider">
                            <ShieldCheck className="text-tech-cyan" size={22} />
                            Seguridad y Uso
                        </h3>
                        <div className="space-y-4 text-sm text-tech-muted font-mono">
                            <p>
                                <strong className="text-tech-text">Contraseñas:</strong> No compartas tu usuario. El sistema cuenta con un Registro de Auditoría.
                            </p>
                            <p className="flex items-start gap-2">
                                <Lock className="shrink-0 mt-0.5" size={14} />
                                Solo se usará la información para fines académicos.
                            </p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-tech-text uppercase tracking-wider">
                            <LifeBuoy className="text-tech-accent" size={22} />
                            Soporte Técnico
                        </h3>
                        <p className="text-sm text-tech-muted leading-relaxed font-mono">
                            Ante cualquier inconsistencia, contactar a la
                            <span className="text-tech-text font-medium"> Jefatura de Preceptores</span> o al
                            <span className="text-tech-text font-medium"> Administrador de Redes</span>.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-6 text-center text-tech-muted text-xs font-mono bg-tech-primary border-t border-tech-surface">
                &copy; {new Date().getFullYear()} Escuela Técnica - Sistema de Gestión de Calificaciones Académicas
            </footer>
        </div>
    );
};

export default Welcome;
