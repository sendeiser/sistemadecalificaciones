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
    const { profile, user, signOut, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile State
    const [name, setName] = useState(profile?.nombre || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    const [uploading, setUploading] = useState(false);

    // Password State
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!profile) {
            navigate('/dashboard');
        } else {
            setName(profile.nombre || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile, navigate]);

    const handleAvatarUpload = async (e) => {
        try {
            setUploading(true);
            setMessage({ type: '', text: '' });

            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('Debes seleccionar una imagen para subir.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update Database
            const { error: updateError } = await supabase
                .from('perfiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();
            setAvatarUrl(publicUrl);
            setMessage({ type: 'success', text: 'Foto de perfil actualizada correctamente.' });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            setMessage({ type: 'error', text: 'Error al subir la imagen: ' + error.message });
        } finally {
            setUploading(false);
        }
    };

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

            await refreshProfile();
            setMessage({ type: 'success', text: 'Datos actualizados correctamente.' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Error al actualizar: ' + error.message });
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
                    {/* Header - Fixed on mobile for better accessibility */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-tech-secondary md:bg-transparent p-4 md:p-0 rounded-2xl border border-tech-surface md:border-0">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2.5 bg-tech-surface hover:bg-tech-surface/80 rounded-xl transition-all text-tech-muted hover:text-tech-cyan shadow-lg"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                                    <span className="hidden md:inline">Configuración de</span> <span className="text-tech-cyan">Perfil</span>
                                </h1>
                                <p className="text-tech-muted font-mono text-[9px] md:text-xs uppercase tracking-widest">
                                    Seguridad y Datos
                                </p>
                            </div>
                        </div>

                        {/* Mobile Quick Signout */}
                        <button
                            onClick={signOut}
                            className="md:hidden flex items-center justify-center gap-2 px-4 py-2 border border-tech-danger/30 text-tech-danger bg-tech-danger/5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                            <LogOut size={14} /> Salir
                        </button>
                    </div>

                    {/* Notification Banner */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-2 shadow-xl ${message.type === 'success'
                            ? 'bg-tech-success/10 border-tech-success/30 text-tech-success'
                            : 'bg-tech-danger/10 border-tech-danger/30 text-tech-danger'
                            }`}>
                            {message.type === 'success' ? <CheckCircle className="shrink-0" size={18} /> : <AlertCircle className="shrink-0" size={18} />}
                            <span className="text-xs md:text-sm font-bold tracking-tight">{message.text}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                        {/* Sidebar: Profile Summary */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-tech-secondary border border-tech-surface rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tech-cyan to-tech-accent opacity-50"></div>

                                <div className="relative inline-block mb-4 group">
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-tech-surface rounded-full flex items-center justify-center border-4 border-tech-surface/50 group-hover:border-tech-cyan transition-all duration-500 overflow-hidden shadow-2xl relative">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Avatar"
                                                className={`w-full h-full object-cover transition-opacity duration-300 ${uploading ? 'opacity-30' : 'opacity-100'}`}
                                            />
                                        ) : (
                                            <User size={60} className="text-tech-muted opacity-20" />
                                        )}

                                        {uploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-tech-primary/50">
                                                <Loader2 className="animate-spin text-tech-cyan" size={32} />
                                            </div>
                                        )}
                                    </div>

                                    <label className="absolute bottom-0 right-0 p-2.5 bg-tech-cyan text-white rounded-full border-4 border-tech-secondary cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xl hover:shadow-tech-cyan/40">
                                        <Camera size={16} />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>

                                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{profile.nombre}</h2>
                                <p className="inline-block px-3 py-1 bg-tech-accent/10 text-tech-accent border border-tech-accent/20 rounded-full text-[10px] font-black uppercase tracking-widest mt-2">{profile.rol}</p>

                                <div className="mt-8 pt-6 border-t border-tech-surface/50 space-y-4">
                                    <div className="flex items-center gap-3 text-left p-3 bg-tech-primary/30 rounded-xl border border-tech-surface/30">
                                        <div className="p-2 bg-tech-cyan/10 rounded-lg text-tech-cyan"><Mail size={16} /></div>
                                        <div className="overflow-hidden">
                                            <p className="text-[9px] text-tech-muted uppercase font-black tracking-widest">ID de Sistema</p>
                                            <p className="text-xs font-mono text-tech-cyan truncate">{profile.id.slice(0, 13)}...</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-left p-3 bg-tech-primary/30 rounded-xl border border-tech-surface/30">
                                        <div className="p-2 bg-tech-accent/10 rounded-lg text-tech-accent"><Shield size={16} /></div>
                                        <div>
                                            <p className="text-[9px] text-tech-muted uppercase font-black tracking-widest">Estado de Cuenta</p>
                                            <p className="text-xs font-bold text-tech-success flex items-center gap-1.5 uppercase tracking-tighter">
                                                <ShieldCheck size={12} /> Verificado
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={signOut}
                                className="hidden md:flex w-full items-center justify-center gap-2 p-4 border-2 border-tech-danger/20 text-tech-danger hover:bg-tech-danger/10 hover:border-tech-danger/40 rounded-2xl transition-all font-black uppercase text-[11px] tracking-widest shadow-lg shadow-tech-danger/5"
                            >
                                <LogOut size={16} />
                                Terminar Sesión Segura
                            </button>
                        </div>

                        {/* Main Content: Forms */}
                        <div className="lg:col-span-8 space-y-6 md:space-y-8">
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
