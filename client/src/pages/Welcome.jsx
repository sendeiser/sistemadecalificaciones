import { useNavigate } from 'react-router-dom';
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
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
            {/* Header / Hero Section */}
            <section className="relative py-20 px-6 overflow-hidden bg-gradient-to-b from-blue-600/20 to-transparent border-b border-slate-800">
                <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-6 animate-bounce">
                        <School className="text-blue-400" size={48} />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Bienvenida al Sistema de Gestión Académica
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-300 font-medium italic mb-8">
                        "Transformando la educación técnica a través de la eficiencia digital."
                    </p>
                    <div className="max-w-3xl text-lg text-slate-400 leading-relaxed">
                        Estimados miembros de la comunidad educativa, les damos la bienvenida al nuevo portal de calificaciones.
                        Este sistema ha sido diseñado específicamente para cumplir con los estándares de la
                        <span className="text-white font-bold px-1">Planilla de Acreditación de Saberes</span>,
                        facilitando el seguimiento pedagógico de nuestros alumnos.
                    </div>

                    <button
                        onClick={handleAccess}
                        className="mt-10 flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-900/40 hover:scale-105 active:scale-95 group"
                    >
                        {profile ? 'Ir al Panel de Control' : 'Acceder al Sistema'}
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            </section>

            {/* Instruction Grid */}
            <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Admin Card */}
                <div className="bg-slate-800/40 rounded-3xl border border-slate-700 p-8 hover:border-blue-500/30 transition-all group flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Key className="text-blue-400" size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Para Preceptores</h2>
                    </div>
                    <div className="space-y-6 flex-grow">
                        <div className="flex gap-4">
                            <Users className="text-blue-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-400"><strong className="text-slate-200">Carga de Matrícula:</strong> Importación de alumnos por división desde "Gestión de Alumnos".</p>
                        </div>
                        <div className="flex gap-4">
                            <Layers className="text-blue-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-400"><strong className="text-slate-200">Asignaciones:</strong> Vincular cada docente con su materia y curso correspondiente.</p>
                        </div>
                        <div className="flex gap-4">
                            <Clock className="text-blue-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-400"><strong className="text-slate-200">Control de Ciclos:</strong> Abrir o Cerrar periodos. Al cerrar, las notas quedan protegidas.</p>
                        </div>
                        <div className="flex gap-4">
                            <FileText className="text-blue-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-400"><strong className="text-slate-200">Reportes:</strong> Generación de PDFs oficiales para firmas y archivo institucional.</p>
                        </div>
                    </div>
                </div>

                {/* Teacher Card */}
                <div className="bg-slate-800/40 rounded-3xl border border-slate-700 p-8 hover:border-green-500/30 transition-all group flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                            <ClipboardEdit className="text-green-400" size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Para Docentes</h2>
                    </div>
                    <div className="space-y-6 flex-grow">
                        <div className="flex gap-4">
                            <ArrowRight className="text-green-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-400"><strong className="text-slate-200">Carga Dinámica:</strong> Planillas automáticas con cálculo de Promedio y Logro (LD, LS, LB, LI).</p>
                        </div>
                        <div className="flex gap-4">
                            <AlertCircle className="text-green-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-400"><strong className="text-slate-200">Asistencia:</strong> Resaltado automático para alumnos con asistencia menor al 80%.</p>
                        </div>
                        <div className="flex gap-4">
                            <Save className="text-green-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-400"><strong className="text-slate-200">Guardado:</strong> Edición habilitada hasta que el Preceptor realice el cierre del periodo.</p>
                        </div>
                    </div>
                </div>

                {/* Student Card */}
                <div className="bg-slate-800/40 rounded-3xl border border-slate-700 p-8 hover:border-purple-500/30 transition-all group flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <GraduationCap className="text-purple-400" size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Para Alumnos</h2>
                    </div>
                    <div className="space-y-6 flex-grow">
                        <div className="flex gap-4">
                            <Search className="text-purple-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-400"><strong className="text-slate-200">Consulta Transparente:</strong> Notas parciales, promedios y logros en tiempo real.</p>
                        </div>
                        <div className="flex gap-4">
                            <Star className="text-purple-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-400"><strong className="text-slate-200">Seguimiento:</strong> Identificación rápida de materias para Intensificación de Saberes.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Support and Security Section */}
            <section className="bg-slate-950/50 py-12 px-6 border-t border-slate-800">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <ShieldCheck className="text-blue-400" size={22} />
                            Seguridad y Uso
                        </h3>
                        <div className="space-y-4 text-sm text-slate-400">
                            <p>
                                <strong className="text-slate-200">Contraseñas:</strong> No compartas tu usuario. El sistema cuenta con un Registro de Auditoría que vincula cada cambio con el usuario responsable.
                            </p>
                            <p className="flex items-start gap-2">
                                <Lock className="shrink-0 mt-0.5" size={14} />
                                Solo se usará la información para fines académicos institucionales.
                            </p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <LifeBuoy className="text-orange-400" size={22} />
                            Soporte Técnico
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Ante cualquier inconsistencia en la asignación de materias o lista de alumnos, por favor contactar a la
                            <span className="text-slate-200 font-medium"> Jefatura de Preceptores</span> o al
                            <span className="text-slate-200 font-medium"> Administrador de Redes</span>.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-slate-600 text-xs mt-auto">
                &copy; {new Date().getFullYear()} Escuela Técnica - Sistema de Gestión de Calificaciones Académicas
            </footer>
        </div>
    );
};

export default Welcome;
