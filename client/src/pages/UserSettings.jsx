import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, Save, ArrowLeft, Key, AlertCircle,
    CheckCircle, Camera, Loader2, LogOut, ShieldCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import PageTransition from '../components/PageTransition';

const UserSettings = () => {
    const { profile, user, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile State
    const [name, setName] = useState(profile?.nombre || '');

    // Password State
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!profile) {
            navigate('/dashboard');
        }
    }, [profile, navigate]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { error } = await supabase
                .from('perfiles')
                .update({ nombre: name })
                .eq('id', user.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente. Actualiza la página para ver los cambios.' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Error al actualizar el perfil: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Contraseña actualizada con éxito.' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({ type: 'error', text: 'Error al cambiar la contraseña: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return null;

    return (
        <PageTransition>
            <div className="min-h-screen bg-tech-primary text-tech-text p-4 md:p-10">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-tech-surface rounded-full transition-colors text-tech-muted hover:text-tech-cyan"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                                    Configuración de <span className="text-tech-cyan">Perfil</span>
                                </h1>
                                <p className="text-tech-muted font-mono text-xs uppercase tracking-widest mt-1">
                                    Seguridad y Datos Personales
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notification Banner */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                                ? 'bg-tech-success/10 border-tech-success/30 text-tech-success'
                                : 'bg-tech-danger/10 border-tech-danger/30 text-tech-danger'
                            }`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar: Profile Summary */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-tech-secondary border border-tech-surface rounded-2xl p-6 text-center shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-cyan to-tech-accent"></div>

                                <div className="relative inline-block mb-4">
                                    <div className="w-24 h-24 bg-tech-surface rounded-full flex items-center justify-center border-2 border-tech-cyan/20 group-hover:border-tech-cyan transition-colors overflow-hidden">
                                        <User size={48} className="text-tech-muted" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 p-1.5 bg-tech-cyan text-white rounded-full border-2 border-tech-secondary cursor-pointer hover:scale-110 transition-transform">
                                        <Camera size={14} />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold">{profile.nombre}</h2>
                                <p className="text-tech-muted text-xs font-mono uppercase tracking-widest mt-1">{profile.rol}</p>

                                <div className="mt-6 pt-6 border-t border-tech-surface space-y-3">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="p-2 bg-tech-surface rounded text-tech-cyan"><Mail size={16} /></div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] text-tech-muted uppercase font-black tracking-tighter">Email</p>
                                            <p className="text-sm truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="p-2 bg-tech-surface rounded text-tech-accent"><ShieldCheck size={16} /></div>
                                        <div>
                                            <p className="text-[10px] text-tech-muted uppercase font-black tracking-tighter">Nivel de Acceso</p>
                                            <p className="text-sm capitalize">{profile.rol}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={signOut}
                                className="w-full flex items-center justify-center gap-2 p-4 border border-tech-danger/30 text-tech-danger hover:bg-tech-danger/10 rounded-xl transition-all font-bold uppercase text-xs tracking-widest"
                            >
                                <LogOut size={16} />
                                Cerrar Sesión Segura
                            </button>
                        </div>

                        {/* Main Content: Forms */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Personal Info Form */}
                            <div className="bg-tech-secondary border border-tech-surface rounded-2xl p-6 md:p-8 shadow-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-tech-cyan/20 rounded-lg text-tech-cyan"><User size={20} /></div>
                                    <h3 className="text-lg font-bold uppercase tracking-tight">Información Personal</h3>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-tech-muted tracking-widest ml-1">
                                            Nombre Completo
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-tech-surface border border-tech-surface focus:border-tech-cyan rounded-xl p-4 transition-all focus:outline-none"
                                            placeholder="Tu nombre completo"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2 opacity-60">
                                        <label className="text-[10px] uppercase font-black text-tech-muted tracking-widest ml-1">
                                            Correo Electrónico (Solo Lectura)
                                        </label>
                                        <div className="w-full bg-tech-primary border border-tech-surface rounded-xl p-4 cursor-not-allowed flex items-center gap-3">
                                            <Mail size={18} className="text-tech-muted" />
                                            <span className="text-sm">{user?.email}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-tech-cyan text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-tech-cyan/80 transition-all shadow-lg shadow-tech-cyan/20 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Guardar Cambios
                                    </button>
                                </form>
                            </div>

                            {/* Security Form */}
                            <div className="bg-tech-secondary border border-tech-surface rounded-2xl p-6 md:p-8 shadow-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-tech-accent/20 rounded-lg text-tech-accent"><Shield size={20} /></div>
                                    <h3 className="text-lg font-bold uppercase tracking-tight">Seguridad</h3>
                                </div>

                                <form onSubmit={handlePasswordChange} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-tech-muted tracking-widest ml-1">
                                                Nueva Contraseña
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-tech-muted" size={18} />
                                                <input
                                                    type="password"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="w-full bg-tech-surface border border-tech-surface focus:border-tech-accent rounded-xl p-4 pl-12 transition-all focus:outline-none"
                                                    placeholder="••••••••"
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-tech-muted tracking-widest ml-1">
                                                Confirmar Contraseña
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-tech-muted" size={18} />
                                                <input
                                                    type="password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="w-full bg-tech-surface border border-tech-surface focus:border-tech-accent rounded-xl p-4 pl-12 transition-all focus:outline-none"
                                                    placeholder="••••••••"
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-tech-primary/50 border border-tech-surface rounded-xl flex gap-3">
                                        <AlertCircle className="text-tech-accent shrink-0" size={18} />
                                        <p className="text-xs text-tech-muted leading-relaxed">
                                            Al cambiar tu contraseña deberás usar la nueva credencial en tu próximo inicio de sesión. Asegúrate de que tenga al menos 6 caracteres.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-tech-accent text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-tech-accent/80 transition-all shadow-lg shadow-tech-accent/20 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Key size={16} />}
                                        Actualizar Contraseña
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default UserSettings;
