import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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
        <div className="flex items-center justify-center min-h-screen bg-tech-primary text-slate-100 font-sans relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-tech-cyan/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md p-8 space-y-6 bg-tech-secondary rounded border border-tech-surface shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-center text-white tracking-tight uppercase">
                        Sistema de <span className="text-tech-cyan">Calificaciones</span>
                    </h2>
                    <p className="text-slate-400 text-sm font-mono tracking-wide">INGRESO AL PORTAL ACADÉMICO</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Email Institucional</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-white transition-all placeholder-slate-600"
                            placeholder="usuario@escuela.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-white transition-all placeholder-slate-600"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && (
                        <div className="p-3 bg-tech-danger/10 border border-tech-danger/20 rounded">
                            <p className="text-tech-danger text-sm text-center font-mono">{error}</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-bold text-white bg-tech-cyan hover:bg-sky-600 rounded transition-all shadow-[0_0_20px_rgba(14,165,233,0.2)] hover:shadow-[0_0_25px_rgba(14,165,233,0.4)] disabled:opacity-50 disabled:shadow-none uppercase tracking-wider relative overflow-hidden group"
                    >
                        <span className="relative z-10">{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                    </button>

                    <div className="text-center mt-6 pt-6 border-t border-tech-surface">
                        <p className="text-slate-400 text-sm">
                            ¿No tienes cuenta? {' '}
                            <Link to="/register" className="text-tech-cyan font-bold hover:text-white transition-colors uppercase text-xs tracking-wider">
                                Regístrate como Docente
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
