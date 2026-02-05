import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { getApiEndpoint } from '../utils/api';
import { UserPlus, Mail, Lock, User, CreditCard, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

const Register = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        nombre: '',
        dni: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Invitation State
    const [inviteState, setInviteState] = useState({
        loading: true,
        valid: false,
        rol: null,
        email: null,
        error: null
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setInviteState({ loading: false, valid: false, error: 'Se requiere una invitación para registrarse.' });
            return;
        }
        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const res = await fetch(getApiEndpoint(`/invite/${token}`));
            const data = await res.json();

            if (data.valid) {
                setInviteState({
                    loading: false,
                    valid: true,
                    rol: data.rol,
                    email: data.email,
                    error: null
                });
                if (data.email) {
                    setFormData(prev => ({ ...prev, email: data.email }));
                }
            } else {
                setInviteState({
                    loading: false,
                    valid: false,
                    error: data.error || 'Invitación inválida'
                });
            }
        } catch (err) {
            setInviteState({
                loading: false,
                valid: false,
                error: 'Error al validar invitación'
            });
        }
    };

    const handleChange = (e) => {
        // If email is locked by invitation, prevent change
        if (e.target.name === 'email' && inviteState.email) return;
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
            // Strategy: Use Backend Admin Registration to bypass public signup issues (400)
            const res = await fetch(getApiEndpoint('/register-invite'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    nombre: formData.nombre,
                    dni: formData.dni,
                    token: token
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
            } else {
                throw new Error(data.error || 'Error al registrar usuario');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Render Logic based on Invitation State
    if (!token || (!inviteState.loading && !inviteState.valid)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-tech-primary text-tech-text p-6 font-sans relative">
                <div className="w-full max-w-md p-8 bg-tech-secondary rounded border border-tech-surface shadow-2xl text-center">
                    <div className="p-4 bg-tech-danger/10 rounded-full inline-flex mb-4">
                        <Lock className="text-tech-danger" size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-tech-text uppercase mb-2">Registro Cerrado</h2>
                    <p className="text-tech-muted font-mono text-sm mb-6">
                        {inviteState.error || 'El registro público está deshabilitado. Debes utilizar el enlace de invitación proporcionado por la administración.'}
                    </p>
                    <Link to="/login" className="px-6 py-3 bg-tech-surface hover:bg-tech-primary rounded text-sm font-bold uppercase tracking-wider transition-colors inline-block">
                        Volver al Login
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-tech-primary text-tech-text p-6 font-sans relative">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-tech-success/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="w-full max-w-md p-8 space-y-6 bg-tech-secondary rounded border border-tech-surface shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center animate-in zoom-in duration-500 relative z-10">
                    <div className="flex justify-center">
                        <div className="p-4 bg-tech-success/10 rounded-full border border-tech-success/20">
                            <CheckCircle2 className="text-tech-success" size={64} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-tech-text tracking-tight uppercase">¡Registro Exitoso!</h2>
                    <p className="text-tech-muted font-mono text-sm leading-relaxed">
                        Tu cuenta de <strong>{inviteState.rol}</strong> ha sido creada.
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
        <div className="flex items-center justify-center min-h-screen bg-tech-primary text-tech-text p-6 font-sans relative overflow-hidden">
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-lg p-8 space-y-8 bg-tech-secondary rounded border border-tech-surface shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-cyan to-purple-600"></div>

                <div className="text-center">
                    <div className="inline-flex p-3 bg-tech-accent/10 rounded mb-4 border border-tech-accent/20">
                        <ShieldCheck className="text-tech-accent" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-tech-text tracking-tight uppercase">
                        Registro de {inviteState.rol}
                    </h2>
                    <p className="text-tech-muted mt-2 font-mono text-sm">Invitación verificada. Completa tus datos.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Form Fields ... similar to before but email might be locked */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-tech-muted uppercase flex items-center gap-2 tracking-wider">
                                <User size={14} /> Nombre Completo
                            </label>
                            <input
                                name="nombre"
                                type="text"
                                required
                                placeholder="Ej: Juan Pérez"
                                className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-tech-text transition-all placeholder-tech-muted/50"
                                value={formData.nombre}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-tech-muted uppercase flex items-center gap-2 tracking-wider">
                                <CreditCard size={14} /> DNI
                            </label>
                            <input
                                name="dni"
                                type="text"
                                required
                                placeholder="Sin puntos ni espacios"
                                className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-tech-text transition-all placeholder-tech-muted/50"
                                value={formData.dni}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-tech-muted uppercase flex items-center gap-2 tracking-wider">
                            <Mail size={14} /> Correo Electrónico
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            readOnly={!!inviteState.email}
                            placeholder="docente@escuela.edu.ar"
                            className={`w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:outline-none text-tech-text transition-all placeholder-tech-muted/50 ${inviteState.email ? 'opacity-75 cursor-not-allowed' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {inviteState.email && <span className="text-[10px] text-tech-accent block pt-1">* El correo está vinculado a la invitación</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-tech-muted uppercase flex items-center gap-2 tracking-wider">
                                <Lock size={14} /> Contraseña
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength="6"
                                className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-tech-text transition-all placeholder-tech-muted/50"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-tech-muted uppercase flex items-center gap-2 tracking-wider">
                                <Lock size={14} /> Confirmar
                            </label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-tech-text transition-all placeholder-tech-muted/50"
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
                        <p className="text-tech-muted text-sm">
                            ¿Ya tienes una cuenta? {' '}
                            <Link to="/login" className="text-tech-cyan font-bold hover:text-tech-text transition-colors uppercase text-xs tracking-wider">
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
