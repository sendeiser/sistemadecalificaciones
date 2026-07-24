import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { getApiEndpoint } from '../utils/api';
import { UserPlus, Mail, Lock, User, CreditCard, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

const Register = () => {
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
            setInviteState({ loading: false, valid: false, error: 'Se requiere una invitaci├│n para registrarse.' });
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
                    error: data.error || 'Invitaci├│n inv├ílida'
                });
            }
        } catch {
            setInviteState({
                loading: false,
                valid: false,
                error: 'Error al validar invitaci├│n'
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
            setError('Las contrase├▒as no coinciden');
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
                        {inviteState.error || 'El registro p├║blico est├í deshabilitado. Debes utilizar el enlace de invitaci├│n proporcionado por la administraci├│n.'}
                    </p>
                    <Button variant="ghost" onClick={() => navigate('/login')}>
                        Volver al Login
                    </Button>
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
                    <h2 className="text-3xl font-bold text-tech-text tracking-tight uppercase">┬íRegistro Exitoso!</h2>
                    <p className="text-tech-muted font-mono text-sm leading-relaxed">
                        Tu cuenta de <strong>{inviteState.rol}</strong> ha sido creada.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 font-bold text-white bg-tech-cyan rounded hover:bg-sky-600 transition duration-200 shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2 uppercase tracking-wider group"
                    >
                        Ir al Inicio de Sesi├│n
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
                <div className="absolute top-0 left-0 w-full h-1 bg-tech-cyan"></div>

                <div className="text-center">
                    <div className="inline-flex p-3 bg-tech-accent/10 rounded mb-4 border border-tech-accent/20">
                        <ShieldCheck className="text-tech-accent" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-tech-text tracking-tight uppercase">
                        Registro de {inviteState.rol}
                    </h2>
                    <p className="text-tech-muted mt-2 font-mono text-sm">Invitaci├│n verificada. Completa tus datos.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Form Fields ... similar to before but email might be locked */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            label="Nombre Completo"
                            icon={User}
                            name="nombre"
                            type="text"
                            required
                            placeholder="Ej: Juan P├⌐rez"
                            value={formData.nombre}
                            onChange={handleChange}
                        />
                        <Input
                            label="DNI"
                            icon={CreditCard}
                            name="dni"
                            type="text"
                            required
                            placeholder="Sin puntos ni espacios"
                            value={formData.dni}
                            onChange={handleChange}
                        />
                    </div>

                    <Input
                        label="Correo Electr├│nico"
                        icon={Mail}
                        name="email"
                        type="email"
                        required
                        readOnly={!!inviteState.email}
                        placeholder="docente@escuela.edu.ar"
                        value={formData.email}
                        onChange={handleChange}
                        className={inviteState.email ? 'opacity-75' : ''}
                    />
                    {inviteState.email && <span className="text-[10px] text-tech-accent block pt-1">* El correo est├í vinculado a la invitaci├│n</span>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            label="Contrase├▒a"
                            icon={Lock}
                            name="password"
                            type="password"
                            required
                            minLength="6"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <Input
                            label="Confirmar"
                            icon={Lock}
                            name="confirmPassword"
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-tech-danger/10 border border-tech-danger/20 rounded">
                            <p className="text-tech-danger text-sm text-center font-mono font-medium">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                        shine
                    >
                        {loading ? 'Procesando...' : 'Crear Cuenta'}
                        {!loading && <UserPlus size={20} />}
                    </Button>

                    <div className="text-center pt-2 border-t border-tech-surface mt-6">
                        <p className="text-tech-muted text-sm">
                            ┬┐Ya tienes una cuenta? {' '}
                            <Link to="/login" className="text-tech-cyan font-bold hover:text-tech-text transition-colors uppercase text-xs tracking-wider">
                                Iniciar Sesi├│n
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
