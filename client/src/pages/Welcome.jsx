import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
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
    Layers,
    Terminal,
    Zap
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text flex flex-col font-sans relative selection:bg-tech-cyan/30">
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Matrix-like Background Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            </div>

            {/* Header / Hero Section */}
            <section className="relative py-28 px-6 overflow-hidden bg-tech-primary border-b border-tech-surface">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.05, 0.1, 0.05],
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-tech-cyan/20 blur-[120px]"
                    ></motion.div>
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10"
                >
                    <motion.div
                        variants={itemVariants}
                        className="p-5 bg-tech-cyan/10 rounded-2xl border border-tech-cyan/20 mb-8 shadow-[0_0_30px_rgba(14,165,233,0.1)]"
                    >
                        <School className="text-tech-cyan" size={56} />
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-5xl md:text-7xl font-black mb-6 text-tech-text tracking-tight uppercase leading-none"
                    >
                        Gestión Técnica <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-tech-cyan via-blue-400 to-tech-accent animate-gradient-x">Digital v2.5</span>
                    </motion.h1>

                    <motion.div variants={itemVariants} className="flex items-center gap-3 text-tech-muted font-mono mb-8 bg-tech-secondary/50 px-4 py-2 rounded-full border border-tech-surface text-sm uppercase tracking-widest">
                        <Terminal size={14} className="text-tech-cyan" />
                        Acreditación de Saberes // PROTOCOLO ETTA
                    </motion.div>

                    <motion.p variants={itemVariants} className="max-w-3xl text-xl text-tech-muted leading-relaxed font-sans mb-10">
                        Bienvenidos a la plataforma de vanguardia tecnológica para la educación técnica.
                        Diseñada para maximizar la <span className="text-tech-cyan font-bold">precisión académica</span> y el <span className="text-tech-accent font-bold">seguimiento inteligente</span>.
                    </motion.p>

                    <motion.button
                        variants={itemVariants}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAccess}
                        className="flex items-center gap-3 px-10 py-5 bg-tech-cyan text-white rounded-lg font-black text-xl transition-all uppercase tracking-widest group border border-white/10"
                    >
                        {profile ? 'Entrar al Command Center' : 'Iniciar Sesión'}
                        <ArrowRight className="transition-transform duration-300" />
                    </motion.button>
                </motion.div>
            </section>

            {/* Instruction Grid */}
            <motion.main
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
                className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-10 text-tech-text"
            >
                {/* Admin Card */}
                <motion.div variants={itemVariants} className="bg-tech-secondary/40 rounded-2xl border border-tech-surface p-10 transition-all group flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-tech-cyan/5 blur-3xl -mr-10 -mt-10 group-hover:bg-tech-cyan/10 transition-colors"></div>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-tech-cyan/10 rounded-xl group-hover:bg-tech-cyan/20 transition-colors">
                            <Key className="text-tech-cyan" size={28} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Preceptoría</h2>
                    </div>
                    <div className="space-y-6 flex-grow font-mono text-sm">
                        <div className="flex gap-4 group/item">
                            <Users className="text-tech-cyan shrink-0 transition-transform group-hover/item:scale-125" size={20} />
                            <p className="text-tech-muted leading-tight"><strong className="text-tech-text uppercase">Matrícula:</strong> Importación masiva de activos institucionales.</p>
                        </div>
                        <div className="flex gap-4 group/item">
                            <Layers className="text-tech-cyan shrink-0 transition-transform group-hover/item:scale-125" size={20} />
                            <p className="text-tech-muted leading-tight"><strong className="text-tech-text uppercase">Asignaciones:</strong> Orquestación de nodos Docente-Materia.</p>
                        </div>
                        <div className="flex gap-4 group/item">
                            <FileText className="text-tech-cyan shrink-0 transition-transform group-hover/item:scale-125" size={20} />
                            <p className="text-tech-muted leading-tight"><strong className="text-tech-text uppercase">PDF Engine:</strong> Generación de reportes con validez legal.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Teacher Card */}
                <motion.div variants={itemVariants} className="bg-tech-secondary/40 rounded-2xl border border-tech-surface p-10 transition-all group flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-tech-success/5 blur-3xl -mr-10 -mt-10 group-hover:bg-tech-success/10 transition-colors"></div>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-tech-success/10 rounded-xl group-hover:bg-tech-success/20 transition-colors">
                            <ClipboardEdit className="text-tech-success" size={28} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Cátedra</h2>
                    </div>
                    <div className="space-y-6 flex-grow font-mono text-sm">
                        <div className="flex gap-4 group/item">
                            <Zap className="text-tech-success shrink-0 transition-transform group-hover/item:scale-125" size={20} />
                            <p className="text-tech-muted leading-tight"><strong className="text-tech-text uppercase">Smart Entry:</strong> Carga de notas con cálculo de Logro en tiempo real.</p>
                        </div>
                        <div className="flex gap-4 group/item">
                            <AlertCircle className="text-tech-success shrink-0 transition-transform group-hover/item:scale-125" size={20} />
                            <p className="text-tech-muted leading-tight"><strong className="text-tech-text uppercase">Vigilancia:</strong> Detección precoz de alumnos con riesgo de inasistencia.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Student Card */}
                <motion.div variants={itemVariants} className="bg-tech-secondary/40 rounded-2xl border border-tech-surface p-10 transition-all group flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-tech-accent/5 blur-3xl -mr-10 -mt-10 group-hover:bg-tech-accent/10 transition-colors"></div>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-tech-accent/10 rounded-xl group-hover:bg-tech-accent/20 transition-colors">
                            <GraduationCap className="text-tech-accent" size={28} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Estudiantes</h2>
                    </div>
                    <div className="space-y-6 flex-grow font-mono text-sm">
                        <div className="flex gap-4 group/item">
                            <Search className="text-tech-accent shrink-0 transition-transform group-hover/item:scale-125" size={20} />
                            <p className="text-tech-muted leading-tight"><strong className="text-tech-text uppercase">Insights:</strong> Visualización 360° de trayectoria académica.</p>
                        </div>
                        <div className="flex gap-4 group/item">
                            <Star className="text-tech-accent shrink-0 transition-transform group-hover/item:scale-125" size={20} />
                            <p className="text-tech-muted leading-tight"><strong className="text-tech-text uppercase">Logros:</strong> Gamificación del compromiso y el rendimiento.</p>
                        </div>
                    </div>
                </motion.div>
            </motion.main>

            {/* Support and Security Section */}
            <section className="bg-tech-secondary/20 py-16 px-6 border-t border-tech-surface mt-auto">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-lg font-black flex items-center gap-3 mb-6 text-tech-text uppercase tracking-widest">
                            <ShieldCheck className="text-tech-cyan" size={24} />
                            Nivel de Seguridad C4
                        </h3>
                        <div className="space-y-4 text-sm text-tech-muted font-mono bg-tech-primary/50 p-6 rounded-xl border border-tech-surface">
                            <p className="flex items-start gap-3">
                                <Lock className="text-tech-cyan shrink-0 mt-1" size={14} />
                                <span className="leading-tight">Cifrado de extremo a extremo en transacciones de calificaciones. Auditoría activa en cada modificación de estado.</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <Terminal size={14} className="text-tech-cyan shrink-0 mt-1" />
                                <span className="leading-tight">Acceso restringido por roles según protocolo institucional.</span>
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-lg font-black flex items-center gap-3 mb-6 text-tech-text uppercase tracking-widest">
                            <LifeBuoy className="text-tech-accent" size={24} />
                            Central de Soporte
                        </h3>
                        <div className="text-sm text-tech-muted leading-relaxed font-mono bg-tech-primary/50 p-6 rounded-xl border border-tech-surface h-full">
                            <p className="mb-4 uppercase font-black text-tech-text text-xs tracking-tighter">Protocolo de Incidencia:</p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Verificar conexión de red interna.</li>
                                <li>Contactar Jefatura de Preceptores.</li>
                                <li>Elevar a Administración de Sistemas.</li>
                            </ol>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-tech-muted text-[10px] font-mono bg-tech-primary border-t border-tech-surface uppercase tracking-[0.3em] opacity-60">
                &copy; {new Date().getFullYear()} ETTA COMMAND CENTER // DIGITAL INFRASTRUCTURE // CHAMICAL - LA RIOJA
            </footer>
        </div>
    );
};

export default Welcome;
