import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if we have a session (link clicked)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, the link might be invalid or expired
                // However, standard flow is: user clicks link -> magic link logs them in -> redirects here.
                // So if no session, redirect to login.
                // But let's give a moment or show error.
            }
        });
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setMessage('Contraseña actualizada correctamente. Redirigiendo...');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.message);
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
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-success via-tech-cyan to-tech-success"></div>

                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-black text-tech-text uppercase tracking-tighter mb-2">Nueva Contraseña</h2>
                    <p className="text-tech-muted text-sm">Establece tu nueva clave de acceso seguro.</p>
                </div>

                {message ? (
                    <div className="bg-tech-success/10 border border-tech-success/20 p-6 rounded-xl text-center">
                        <CheckCircle2 className="mx-auto text-tech-success mb-4" size={40} />
                        <h3 className="text-tech-success font-bold uppercase mb-2">¡Todo Listo!</h3>
                        <p className="text-tech-text text-sm">{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-tech-muted uppercase tracking-widest mb-2 block">Nueva Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-tech-muted" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-tech-primary border border-tech-surface rounded-xl focus:border-tech-cyan outline-none text-tech-text transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-tech-danger/10 border border-tech-danger/20 rounded-xl flex items-center gap-3">
                                <AlertTriangle className="text-tech-danger min-w-[20px]" size={20} />
                                <p className="text-tech-danger text-xs font-bold uppercase">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-tech-cyan hover:bg-sky-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-tech-cyan/20 disabled:opacity-50"
                        >
                            {loading ? 'Actualizando...' : 'Confirmar Cambio'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
