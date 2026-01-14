import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserPlus, Mail, Lock, User, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';

const Register = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre: '',
        dni: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        try {
            // 1. Create Auth User with metadata
            // nombre, dni, and rol will be captured by the DB trigger
            const { data, error: authError } = await signUp(formData.email, formData.password, {
                nombre: formData.nombre,
                dni: formData.dni,
                rol: 'docente'
            });

            if (authError) throw authError;

            if (data.user) {
                setSuccess(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-tech-primary text-slate-100 p-6 font-sans relative">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-tech-success/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="w-full max-w-md p-8 space-y-6 bg-tech-secondary rounded border border-tech-surface shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center animate-in zoom-in duration-500 relative z-10">
                    <div className="flex justify-center">
                        <div className="p-4 bg-tech-success/10 rounded-full border border-tech-success/20">
                            <CheckCircle2 className="text-tech-success" size={64} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight uppercase">¡Registro Exitoso!</h2>
                    <p className="text-slate-400 font-mono text-sm leading-relaxed">
                        Tu cuenta de docente ha sido creada. Por favor, verifica tu correo electrónico si el sistema lo requiere.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 font-bold text-white bg-tech-cyan rounded hover:bg-sky-600 transition duration-200 shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2 uppercase tracking-wider group"
                    >
                        Ir al Inicio de Sesión
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-tech-primary text-slate-100 p-6 font-sans relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-tech-cyan/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-lg p-8 space-y-8 bg-tech-secondary rounded border border-tech-surface shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-cyan to-purple-600"></div>

                <div className="text-center">
                    <div className="inline-flex p-3 bg-tech-cyan/10 rounded mb-4 border border-tech-cyan/20">
                        <UserPlus className="text-tech-cyan" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight uppercase">
                        Registro de Docente
                    </h2>
                    <p className="text-slate-400 mt-2 font-mono text-sm">Crea tu cuenta para comenzar la gestión académica.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                                <User size={14} /> Nombre Completo
                            </label>
                            <input
                                name="nombre"
                                type="text"
                                required
                                placeholder="Ej: Juan Pérez"
                                className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-white transition-all placeholder-slate-600"
                                value={formData.nombre}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                                <CreditCard size={14} /> DNI
                            </label>
                            <input
                                name="dni"
                                type="text"
                                required
                                placeholder="Sin puntos ni espacios"
                                className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-white transition-all placeholder-slate-600"
                                value={formData.dni}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                            <Mail size={14} /> Correo Electrónico
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="docente@escuela.edu.ar"
                            className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-white transition-all placeholder-slate-600"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                                <Lock size={14} /> Contraseña
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength="6"
                                className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-white transition-all placeholder-slate-600"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                                <Lock size={14} /> Confirmar
                            </label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-white transition-all placeholder-slate-600"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-tech-danger/10 border border-tech-danger/20 rounded">
                            <p className="text-tech-danger text-sm text-center font-mono font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 font-bold text-white bg-tech-cyan rounded hover:bg-sky-600 transition duration-300 shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider group"
                    >
                        {loading ? 'Procesando...' : 'Crear Cuenta'}
                        {!loading && <UserPlus size={20} className="group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="text-center pt-2 border-t border-tech-surface mt-6">
                        <p className="text-slate-500 text-sm">
                            ¿Ya tienes una cuenta? {' '}
                            <Link to="/login" className="text-tech-cyan font-bold hover:text-white transition-colors uppercase text-xs tracking-wider">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
