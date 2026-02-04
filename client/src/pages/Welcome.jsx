import React from 'react';
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
        <div className="min-h-screen bg-tech-primary text-tech-text flex flex-col font-sans relative selection:bg-tech-cyan/30 overflow-x-hidden">
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Premium Background with School Image */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/eta_background.png"
                    alt="ETA Background"
                    className="w-full h-full object-cover opacity-80 select-none pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-tech-primary/40 via-transparent to-tech-primary"></div>
            </div>

            {/* Matrix-like Background Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.05] overflow-hidden z-[1]">
                <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:32px_32px]"></div>
            </div>

            {/* Header / Hero Section */}
            <section className="relative py-32 px-6 overflow-hidden z-10">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-tech-cyan/20 blur-[150px]"
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
                        className="p-6 bg-tech-cyan/10 rounded-3xl border border-tech-cyan/30 mb-10 shadow-[0_0_50px_rgba(14,165,233,0.2)] backdrop-blur-md"
                    >
                        <School className="text-tech-cyan" size={64} />
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-6xl md:text-8xl font-black mb-6 text-tech-text tracking-tight uppercase leading-none"
                    >
                        Escuela Técnico <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-tech-cyan via-green-400 to-tech-accent animate-gradient-x">Agropecuaria</span>
                    </motion.h1>

                    <motion.div variants={itemVariants} className="flex items-center gap-3 text-tech-cyan font-mono mb-8 bg-tech-cyan/10 px-6 py-2.5 rounded-full border border-tech-cyan/20 text-sm uppercase tracking-[0.3em] font-black shadow-lg shadow-tech-cyan/5">
                        <Terminal size={16} />
                        ETA // PORTAL INSTITUCIONAL v3.0
                    </motion.div>

                    <motion.p variants={itemVariants} className="max-w-3xl text-xl md:text-2xl text-tech-muted leading-relaxed font-sans mb-12">
                        Infraestructura digital para la <span className="text-tech-text font-bold">excelencia agro-técnica</span>.
                        Optimizando la trazabilidad educativa y el desarrollo profesional de nuestros estudiantes.
                    </motion.p>

                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(14,165,233,0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAccess}
                        className="flex items-center gap-4 px-12 py-6 bg-tech-cyan text-white rounded-2xl font-black text-2xl transition-all uppercase tracking-widest group border-t border-white/20 shadow-2xl"
                    >
                        {profile ? 'Acceder al Sistema' : 'Entrar a la Terminal'}
                        <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={28} />
                    </motion.button>
                </motion.div>
            </section>

            {/* Instruction Grid */}
            <motion.main
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
                className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-10 text-tech-text z-10"
            >
                {/* Admin Card */}
                <motion.div variants={itemVariants} className="bg-tech-secondary/60 backdrop-blur-xl rounded-2xl border border-tech-surface p-10 transition-all group flex flex-col h-full relative overflow-hidden">
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
                <motion.div variants={itemVariants} className="bg-tech-secondary/60 backdrop-blur-xl rounded-2xl border border-tech-surface p-10 transition-all group flex flex-col h-full relative overflow-hidden">
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
                <motion.div variants={itemVariants} className="bg-tech-secondary/60 backdrop-blur-xl rounded-2xl border border-tech-surface p-10 transition-all group flex flex-col h-full relative overflow-hidden">
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
            <section className="bg-tech-secondary/40 backdrop-blur-md py-16 px-6 border-t border-tech-surface mt-auto z-10">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-lg font-black flex items-center gap-3 mb-6 text-tech-text uppercase tracking-widest">
                            <ShieldCheck className="text-tech-cyan" size={24} />
                            Nivel de Seguridad Agro-Tech
                        </h3>
                        <div className="space-y-4 text-sm text-tech-muted font-mono bg-tech-primary/50 p-6 rounded-xl border border-tech-surface">
                            <p className="flex items-start gap-3">
                                <Lock className="text-tech-cyan shrink-0 mt-1" size={14} />
                                <span className="leading-tight">Cifrado de extremo a extremo en transacciones académicas. Auditoría activa en cada modificación de estado.</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <Terminal size={14} className="text-tech-cyan shrink-0 mt-1" />
                                <span className="leading-tight">Acceso restringido por roles según protocolo institucional ETA.</span>
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
                            Soporte Técnico ETA
                        </h3>
                        <div className="text-sm text-tech-muted leading-relaxed font-mono bg-tech-primary/50 p-6 rounded-xl border border-tech-surface h-full">
                            <p className="mb-4 uppercase font-black text-tech-text text-xs tracking-tighter">Protocolo de Incidencia:</p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Verificar conexión de red interna.</li>
                                <li>Contactar Jefatura de Preceptores ETA.</li>
                                <li>Elevar a Soporte de Sistemas Regional.</li>
                            </ol>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-tech-muted text-[10px] font-mono bg-tech-primary border-t border-tech-surface uppercase tracking-[0.3em] opacity-60 z-10">
                &copy; {new Date().getFullYear()} ETA COMMAND CENTER // INFRAESTRUCTURA AGRO-TECH // CHAMICAL - LA RIOJA
            </footer>
        </div>
    );
};

export default Welcome;
