import React, { memo } from 'react';
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
    Lock,
    LifeBuoy,
    Search,
    AlertCircle,
    Star,
    Layers,
    Terminal,
    Zap
} from 'lucide-react';

// Optimized Card Component with Memo to prevent unnecessary re-renders
const FeatureCard = memo(({ icon: Icon, title, items, colorClass, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay }}
        className="bg-tech-secondary/80 dark:bg-tech-secondary/60 backdrop-blur-md rounded-2xl border border-tech-surface p-8 transition-all hover:border-tech-cyan/50 group flex flex-col h-full relative overflow-hidden shadow-sm hover:shadow-xl"
    >
        <div className={`absolute top-0 right-0 w-24 h-24 ${colorClass}/5 blur-3xl -mr-8 -mt-8 group-hover:${colorClass}/10 transition-colors`}></div>
        <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 ${colorClass}/10 rounded-xl group-hover:${colorClass}/20 transition-all scale-100 group-hover:scale-110`}>
                <Icon className={colorClass.replace('bg-', 'text-')} size={24} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-tech-text">{title}</h2>
        </div>
        <div className="space-y-5 flex-grow font-sans text-sm">
            {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 group/item">
                    <item.icon className={`${colorClass.replace('bg-', 'text-')} shrink-0 opacity-70 group-hover/item:opacity-100 transition-opacity`} size={18} />
                    <p className="text-tech-muted leading-snug">
                        <strong className="text-tech-text uppercase font-semibold">{item.label}:</strong> {item.text}
                    </p>
                </div>
            ))}
        </div>
    </motion.div>
));

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

    // Animation variants optimized for performance (avoiding complex filters on mobile)
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, duration: 0.3 }
        }
    };

    const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text flex flex-col font-sans relative selection:bg-tech-cyan/30 overflow-x-hidden">
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Optimized High-Contrast Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/eta_background.png"
                    alt="ETA Institutional Background"
                    className="w-full h-full object-cover opacity-70 dark:opacity-40 select-none pointer-events-none"
                    loading="eager"
                    fetchpriority="high"
                />
                {/* Dynamic gradient that adjusts contrast between light/dark modes */}
                <div className="absolute inset-0 bg-gradient-to-b from-tech-primary/40 via-tech-primary/60 to-tech-primary dark:from-tech-primary/60 dark:via-tech-primary/80 dark:to-tech-primary"></div>
            </div>

            {/* Low-complexity pattern for performance */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1] hidden md:block">
                <div className="absolute inset-0 bg-[radial-gradient(var(--tech-cyan)_0.5px,transparent_0.5px)] [background-size:24px_24px]"></div>
            </div>

            {/* Header / Hero Section */}
            <section className="relative pt-24 pb-16 px-6 z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-4xl mx-auto flex flex-col items-center text-center"
                >
                    <motion.div
                        variants={itemVariants}
                        className="p-5 bg-tech-cyan/15 rounded-2xl border border-tech-cyan/20 mb-8 backdrop-blur-sm shadow-inner"
                    >
                        <School className="text-tech-cyan" size={48} />
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-5xl md:text-7xl font-extrabold mb-4 text-tech-text tracking-tighter uppercase leading-tight"
                    >
                        Escuela Técnico <br />
                        <span className="text-tech-cyan dark:text-tech-cyan drop-shadow-sm">Agropecuaria</span>
                    </motion.h1>

                    <motion.div variants={itemVariants} className="flex items-center gap-2 text-tech-cyan font-mono mb-8 bg-tech-cyan/10 px-5 py-2 rounded-full border border-tech-cyan/20 text-xs uppercase tracking-widest font-bold">
                        <Terminal size={14} />
                        portal oficial de gestión v4.1
                    </motion.div>

                    <motion.p variants={itemVariants} className="max-w-2xl text-lg md:text-xl text-tech-muted leading-relaxed mb-10 font-medium">
                        Plataforma centralizada para la <span className="text-tech-text font-bold">excelencia agro-técnica</span>.
                        Trazabilidad académica y monitoreo integral del desarrollo estudiantil.
                    </motion.p>

                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, backgroundColor: 'var(--tech-cyan)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAccess}
                        className="flex items-center gap-3 px-10 py-5 bg-tech-cyan text-white rounded-xl font-bold text-xl transition-all uppercase tracking-wide group shadow-lg shadow-tech-cyan/25"
                    >
                        {profile ? 'Acceder al Sistema' : 'Iniciar Sesión'}
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                    </motion.button>
                </motion.div>
            </section>

            {/* Feature Grid - Replaced with optimized components */}
            <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-tech-text z-10 w-full">
                <FeatureCard
                    icon={Key}
                    title="Preceptoría"
                    colorClass="bg-tech-cyan"
                    delay={0.1}
                    items={[
                        { icon: Users, label: "Activos", text: "Gestión centralizada de matrícula institucional." },
                        { icon: Layers, label: "Nodos", text: "Asignaciones dinámicas Docente-Materia." },
                        { icon: FileText, label: "Reportes", text: "Generación masiva de documentación oficial." }
                    ]}
                />
                <FeatureCard
                    icon={ClipboardEdit}
                    title="Cátedra"
                    colorClass="bg-tech-success"
                    delay={0.2}
                    items={[
                        { icon: Zap, label: "Smart", text: "Carga de notas optimizada con cálculo automático." },
                        { icon: AlertCircle, label: "Control", text: "Detección temprana de riesgo académico." }
                    ]}
                />
                <FeatureCard
                    icon={GraduationCap}
                    title="Alumnos"
                    colorClass="bg-tech-accent"
                    delay={0.3}
                    items={[
                        { icon: Search, label: "Insights", text: "Visualización de trayectoria académica 360°." },
                        { icon: Star, label: "Logros", text: "Seguimiento de competencias agro-técnicas." }
                    ]}
                />
            </main>

            {/* footer-like Security and Support info */}
            <section className="mt-auto py-12 px-6 border-t border-tech-surface bg-tech-secondary/40 backdrop-blur-sm z-10">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-12 text-sm">
                    <div className="md:w-1/2">
                        <h3 className="font-bold flex items-center gap-2 mb-4 text-tech-text uppercase tracking-wider">
                            <ShieldCheck className="text-tech-cyan" size={20} />
                            Seguridad Institucional
                        </h3>
                        <p className="text-tech-muted font-sans leading-relaxed">
                            Acceso cifrado y restringido según protocolo ETA. Todos los movimientos
                            académicos son auditados para garantizar la integridad de los datos.
                        </p>
                    </div>
                    <div className="md:w-1/2">
                        <h3 className="font-bold flex items-center gap-2 mb-4 text-tech-text uppercase tracking-wider">
                            <LifeBuoy className="text-tech-accent" size={20} />
                            Mesa de Ayuda ETA
                        </h3>
                        <p className="text-tech-muted font-sans leading-relaxed">
                            En caso de incidencias técnicas, contactar con la Jefatura de Preceptores
                            o el área de Soporte de Sistemas Regional.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-6 text-center text-tech-muted text-[10px] font-mono bg-tech-primary/80 border-t border-tech-surface uppercase tracking-[0.4em] z-10">
                &copy; {new Date().getFullYear()} ETA PORTAL // CHAMICAL - LA RIOJA // INFRAESTRUCTURA DE GESTIÓN
            </footer>
        </div>
    );
};

export default Welcome;
