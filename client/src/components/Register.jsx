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
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-6">
                <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 text-center animate-in zoom-in duration-500">
                    <div className="flex justify-center">
                        <div className="p-4 bg-green-500/10 rounded-full">
                            <CheckCircle2 className="text-green-500" size={64} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold">¡Registro Exitoso!</h2>
                    <p className="text-slate-400">
                        Tu cuenta de docente ha sido creada. Por favor, verifica tu correo electrónico si el sistema lo requiere.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition duration-200 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2"
                    >
                        Ir al Inicio de Sesión
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-6">
            <div className="w-full max-w-lg p-8 space-y-8 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>

                <div className="text-center">
                    <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl mb-4">
                        <UserPlus className="text-blue-400" size={32} />
                    </div>
                    <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Registro de Docente
                    </h2>
                    <p className="text-slate-400 mt-2">Crea tu cuenta para comenzar a gestionar tus calificaciones.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <User size={14} /> Nombre Completo
                            </label>
                            <input
                                name="nombre"
                                type="text"
                                required
                                placeholder="Ej: Juan Pérez"
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white transition-all"
                                value={formData.nombre}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <CreditCard size={14} /> DNI
                            </label>
                            <input
                                name="dni"
                                type="text"
                                required
                                placeholder="Sin puntos ni espacios"
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white transition-all"
                                value={formData.dni}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Mail size={14} /> Correo Electrónico
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="docente@escuela.edu.ar"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white transition-all"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Lock size={14} /> Contraseña
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength="6"
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white transition-all"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Lock size={14} /> Confirmar
                            </label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-white transition-all"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition duration-300 shadow-xl shadow-blue-900/40 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Procesando...' : 'Crear Cuenta de Docente'}
                        {!loading && <UserPlus size={20} />}
                    </button>

                    <div className="text-center pt-2">
                        <p className="text-slate-500 text-sm">
                            ¿Ya tienes una cuenta? {' '}
                            <Link to="/login" className="text-blue-400 font-bold hover:underline">
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
