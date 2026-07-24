import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

const Login = () => {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text flex flex-col font-sans relative selection:bg-tech-cyan/30 overflow-x-hidden">
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Premium Institutional Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/eta_background_v2.png"
                    alt="ETA Institutional Background"
                    className="w-full h-full object-cover opacity-60 dark:opacity-40 select-none pointer-events-none"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-tech-primary/40 via-tech-primary/70 to-tech-primary dark:from-tech-primary/60 dark:via-tech-primary/80 dark:to-tech-primary"></div>
            </div>

            <div className="relative z-10 flex-grow flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[420px] bg-tech-secondary/90 dark:bg-tech-secondary/80 backdrop-blur-xl rounded-2xl border border-tech-surface p-8 md:p-10 shadow-2xl relative overflow-hidden"
                >
                    {/* Decorative Top Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-cyan via-tech-success to-tech-cyan"></div>

                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex p-4 bg-tech-cyan/10 rounded-2xl mb-6 border border-tech-cyan/20"
                        >
                            <ShieldCheck className="text-tech-cyan" size={40} />
                        </motion.div>
                        <h2 className="text-3xl font-black text-tech-text tracking-tighter uppercase mb-2">
                            ETA <span className="text-tech-cyan">Terminal</span>
                        </h2>
                        <div className="flex items-center justify-center gap-2 text-tech-muted font-mono text-[10px] uppercase tracking-widest">
                            <Terminal size={12} />
                            Ingreso Seguro // Protocolo v4.1
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Institucional"
                            icon={Mail}
                            type="email"
                            required
                            placeholder="usuario@escuela.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Input
                            label="Contraseña"
                            icon={Lock}
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-tech-danger/10 border border-tech-danger/20 rounded-xl"
                            >
                                <p className="text-tech-danger text-xs text-center font-bold uppercase tracking-tight leading-tight">{error}</p>
                            </motion.div>
                        )}

                        <div className="flex items-center justify-end mb-6">
                            <Link to="/forgot-password" className="text-xs font-bold text-tech-muted hover:text-tech-accent transition-colors uppercase tracking-wider">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                            shine
                        >
                            {loading ? 'Verificando Nodo...' : 'Iniciar Protocolo'}
                            <ArrowRight size={20} />
                        </Button>

                        <div className="text-center pt-8 border-t border-tech-surface/50">
                            <p className="text-tech-muted text-xs font-medium">
                                ¿No posees credenciales? {' '}
                                <Link to="/register" className="text-tech-cyan font-black hover:underline transition-all uppercase tracking-tighter">
                                    Solicitar Acceso
                                </Link>
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Technical Footer */}
            <footer className="relative z-10 py-6 text-center text-tech-muted text-[8px] font-mono uppercase tracking-[0.5em] opacity-40">
                ETA INFRASTRUCTURE // SECURE ACCESS PORTAL // 2026
            </footer>
        </div>
    );
};

export default Login;
