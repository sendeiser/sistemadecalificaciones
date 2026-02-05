import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            // Check if FRONTEND_URL is available for redirect
            const redirectUrl = window.location.origin + '/reset-password';

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });

            if (error) throw error;

            setMessage('Se ha enviado un enlace de recuperación a tu correo. Revisa tu bandeja de entrada (y spam).');
        } catch (err) {
            setError(err.message || 'Error al enviar el correo de recuperación.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text flex flex-col items-center justify-center p-6 relative">
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md bg-tech-secondary p-8 rounded-2xl border border-tech-surface shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-accent via-tech-purple to-tech-accent"></div>

                <div className="mb-8">
                    <Link to="/login" className="inline-flex items-center text-tech-muted hover:text-tech-text text-xs uppercase font-bold tracking-widest mb-6 transition-colors">
                        <ArrowLeft size={14} className="mr-2" /> Volver al Login
                    </Link>
                    <h2 className="text-2xl font-black text-tech-text uppercase tracking-tighter mb-2">Recuperar Acceso</h2>
                    <p className="text-tech-muted text-sm border-l-2 border-tech-accent pl-4">Ingresa tu email institucional para restablecer tu contraseña.</p>
                </div>

                {message ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-tech-success/10 border border-tech-success/20 p-6 rounded-xl text-center"
                    >
                        <CheckCircle2 className="mx-auto text-tech-success mb-4" size={40} />
                        <h3 className="text-tech-success font-bold uppercase mb-2">¡Correo Enviado!</h3>
                        <p className="text-tech-text text-sm mb-4">{message}</p>
                        <Link to="/login" className="block w-full py-3 bg-tech-surface hover:bg-tech-primary text-tech-text text-xs font-bold uppercase tracking-widest rounded-lg transition-colors">
                            Ir al Login
                        </Link>
                    </motion.div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-tech-muted uppercase tracking-widest mb-2 block">Email Registrado</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-tech-muted" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-tech-primary border border-tech-surface rounded-xl focus:border-tech-accent outline-none text-tech-text transition-all"
                                    placeholder="usuario@escuela.edu.ar"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-tech-danger/10 border border-tech-danger/20 rounded-xl">
                                <p className="text-tech-danger text-xs text-center font-bold uppercase">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-tech-accent hover:bg-orange-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-tech-accent/20 disabled:opacity-50"
                        >
                            {loading ? 'Enviando...' : 'Enviar Link de Recuperación'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
