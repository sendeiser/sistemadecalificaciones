import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiEndpoint } from '../utils/api';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import {
    Shield, Database, Save,
    Building2, Lock, UserCog,
    AlertTriangle, Download, Search, CheckCircle2, MessageCircle,
    ArrowLeft, Server, Activity, Sliders, Check
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SystemSettings = () => {
    const { profile, session } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [feedbacks, setFeedbacks] = useState([]);

    // Settings State
    const [settings, setSettings] = useState({
        school_info: { name: 'Escuela de Comercio "Gral. Belgrano"', address: 'Av. San Martín 450', phone: '03826-420123', email: 'contacto@cgb.edu.ar' },
        academic: { passing_grade: 7, critical_attendance: 85, max_unjustified: 15 },
        maintenance_mode: false
    });

    // Security Tab State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [resettingUserId, setResettingUserId] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (profile?.rol !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchSettings();
        if (activeTab === 'feedback') fetchFeedback();
    }, [profile, activeTab]);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const res = await fetch(getApiEndpoint('/feedback'), {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFeedbacks(data);
            }
        } catch (err) {
            console.error('Error fetching feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFeedbackRead = async (id, currentStatus) => {
        try {
            const res = await fetch(getApiEndpoint(`/feedback/${id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ leido: !currentStatus })
            });
            if (res.ok) {
                fetchFeedback();
            }
        } catch (err) {
            console.error('Error updating feedback:', err);
        }
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch(getApiEndpoint('/settings'), {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({
                    ...prev,
                    school_info: { ...prev.school_info, ...(data.school_info || {}) },
                    academic: { ...prev.academic, ...(data.academic || {}) },
                    maintenance_mode: data.maintenance_mode || false
                }));
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveInstitucional = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const resSchool = await fetch(getApiEndpoint('/settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ key: 'school_info', value: settings.school_info })
            });
            if (!resSchool.ok) throw new Error('Error al guardar datos institucionales');

            const resAcademic = await fetch(getApiEndpoint('/settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ key: 'academic', value: settings.academic })
            });
            if (!resAcademic.ok) throw new Error('Error al guardar parámetros académicos');

            setMessage('Configuración institucional y académica guardada correctamente.');
        } catch (err) {
            setError(err.message || 'Error al guardar la configuración.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMaintenanceMode = async () => {
        const nextMode = !settings.maintenance_mode;
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch(getApiEndpoint('/settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ key: 'maintenance_mode', value: nextMode })
            });
            if (!res.ok) throw new Error('Error al actualizar modo mantenimiento');
            setSettings(prev => ({ ...prev, maintenance_mode: nextMode }));
            setMessage(nextMode ? 'Modo Mantenimiento ACTIVADO.' : 'Modo Mantenimiento DESACTIVADO.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBackupExport = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch(getApiEndpoint('/settings/backup'), {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error al descargar el backup');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_calificaciones_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setMessage('Copia de seguridad descargada correctamente.');
        } catch (err) {
            setError(err.message || 'Error al exportar el backup.');
        } finally {
            setLoading(false);
        }
    };

    // ----- Security Functions -----

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setLoading(true);
        setError(null);
        setSearched(true);
        setSearchResults([]);

        try {
            // Direct search using Supabase profiles table
            const { data, error: searchErr } = await supabase
                .from('perfiles')
                .select('*')
                .or(`email.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,dni.ilike.%${searchTerm}%`)
                .limit(10);

            if (searchErr) throw searchErr;
            setSearchResults(data || []);
        } catch (err) {
            console.error('User search error:', err);
            setError('Error al buscar usuarios.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (userId) => {
        if (!newPassword || newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const res = await fetch(getApiEndpoint('/admin/users/reset-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ userId, newPassword })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al restablecer');

            setMessage(`Contraseña actualizada para el usuario.`);
            setResettingUserId(null);
            setNewPassword('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        setLoading(true);
        setMessage(null);
        setError(null);
        try {
            const res = await fetch(getApiEndpoint('/admin/users/change-role'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ userId, newRole })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cambiar rol');

            setMessage(`Rol actualizado a "${newRole.toUpperCase()}".`);
            setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, rol: newRole } : u));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-tech-surface pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-secondary rounded-lg transition-colors text-tech-muted hover:text-tech-text"
                        aria-label="Volver al panel"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-tech-text">
                            CONFIGURACIÓN DEL <span className="text-tech-cyan">SISTEMA</span>
                        </h1>
                        <p className="text-tech-muted text-xs font-mono tracking-[0.3em] mt-2">
                            Variables Globales y Mantenimiento
                        </p>
                    </div>
                </div>
                <ThemeToggle />
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-4 border-b border-tech-surface pb-4">
                <button
                    onClick={() => { setActiveTab('general'); setMessage(null); setError(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === 'general' ? 'bg-tech-cyan text-white shadow-lg shadow-tech-cyan/20' : 'text-tech-muted hover:bg-tech-surface'}`}
                >
                    <Building2 size={16} /> Institucional
                </button>
                <button
                    onClick={() => { setActiveTab('security'); setMessage(null); setError(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === 'security' ? 'bg-tech-accent text-white shadow-lg shadow-tech-accent/20' : 'text-tech-muted hover:bg-tech-surface'}`}
                >
                    <Shield size={16} /> Seguridad y Usuarios
                </button>
                <button
                    onClick={() => { setActiveTab('maintenance'); setMessage(null); setError(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === 'maintenance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-tech-muted hover:bg-tech-surface'}`}
                >
                    <Database size={16} /> Mantenimiento
                </button>
                <button
                    onClick={() => { setActiveTab('feedback'); setMessage(null); setError(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === 'feedback' ? 'bg-tech-cyan text-white shadow-lg shadow-tech-cyan/20' : 'text-tech-muted hover:bg-tech-surface'}`}
                >
                    <MessageCircle size={16} /> Feedback
                </button>
            </div>

            {/* Global Message/Error Banners */}
            {(message || error) && (
                <div className="max-w-7xl mb-4 animate-in fade-in duration-300">
                    {message && (
                        <div className="p-4 bg-tech-success/10 border border-tech-success/20 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="text-tech-success flex-shrink-0" size={20} />
                            <p className="text-tech-success text-xs font-bold uppercase">{message}</p>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-tech-danger/10 border border-tech-danger/20 rounded-xl flex items-center gap-3">
                            <AlertTriangle className="text-tech-danger flex-shrink-0" size={20} />
                            <p className="text-tech-danger text-xs font-bold uppercase">{error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading && !searched && (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-tech-cyan/20 border-t-tech-cyan"></div>
                    </div>
                )}

                {!loading || searched ? (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* TAB 1: INSTITUCIONAL */}
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Datos de la Escuela */}
                                <div className="bg-tech-secondary p-6 rounded-2xl border border-tech-surface shadow-lg">
                                    <h3 className="text-lg font-bold text-tech-text uppercase mb-6 flex items-center gap-2 border-b border-tech-surface pb-3">
                                        <Building2 className="text-tech-cyan" size={20} />
                                        Datos de la Institución
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <Input
                                                label="Nombre de la Institución"
                                                value={settings.school_info.name}
                                                onChange={(e) => setSettings({ ...settings, school_info: { ...settings.school_info, name: e.target.value } })}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Dirección Física"
                                                value={settings.school_info.address}
                                                onChange={(e) => setSettings({ ...settings, school_info: { ...settings.school_info, address: e.target.value } })}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Teléfono de Contacto"
                                                value={settings.school_info.phone}
                                                onChange={(e) => setSettings({ ...settings, school_info: { ...settings.school_info, phone: e.target.value } })}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Email Institucional"
                                                value={settings.school_info.email || ''}
                                                onChange={(e) => setSettings({ ...settings, school_info: { ...settings.school_info, email: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Parámetros Académicos */}
                                <div className="bg-tech-secondary p-6 rounded-2xl border border-tech-surface shadow-lg flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-tech-text uppercase mb-6 flex items-center gap-2 border-b border-tech-surface pb-3">
                                            <Sliders className="text-tech-cyan" size={20} />
                                            Parámetros Académicos
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <Input
                                                    label="Nota Mínima de Aprobación"
                                                    type="number"
                                                    value={settings.academic.passing_grade}
                                                    onChange={(e) => setSettings({ ...settings, academic: { ...settings.academic, passing_grade: Number(e.target.value) } })}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Asistencia Mínima Requerida (%)"
                                                    type="number"
                                                    value={settings.academic.critical_attendance}
                                                    onChange={(e) => setSettings({ ...settings, academic: { ...settings.academic, critical_attendance: Number(e.target.value) } })}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Máximo de Inasistencias Injustificadas"
                                                    type="number"
                                                    value={settings.academic.max_unjustified || 15}
                                                    onChange={(e) => setSettings({ ...settings, academic: { ...settings.academic, max_unjustified: Number(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-tech-surface flex justify-end">
                                        <Button onClick={handleSaveInstitucional} variant="primary" className="flex items-center gap-2">
                                            <Save size={18} />
                                            Guardar Configuración
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: SEGURIDAD Y USUARIOS */}
                        {activeTab === 'security' && (
                            <div className="bg-tech-secondary p-6 rounded-2xl border border-tech-surface shadow-lg">
                                <h3 className="text-lg font-bold text-tech-text uppercase mb-6 flex items-center gap-2 border-b border-tech-surface pb-3">
                                    <UserCog className="text-tech-accent" size={20} />
                                    Gestión de Accesos y Permisos
                                </h3>

                                <p className="text-tech-muted text-xs mb-6 font-mono">Busque un usuario por Nombre, Email o DNI para restablecer su clave o modificar su rol de acceso.</p>

                                <div className="flex gap-4 mb-8">
                                    <div className="relative flex-1">
                                        <Input
                                            icon={Search}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Buscar por Nombre, Email o DNI..."
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSearch}
                                        disabled={loading}
                                        variant="primary"
                                    >
                                        {loading && searched ? 'Buscando...' : 'Buscar'}
                                    </Button>
                                </div>

                                {searchResults.length > 0 ? (
                                    <div className="space-y-4">
                                        {searchResults.map(user => (
                                            <div key={user.id} className="bg-tech-primary p-5 rounded-xl border border-tech-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-tech-surface flex items-center justify-center text-tech-cyan font-bold uppercase text-lg border border-tech-cyan/20">
                                                        {user.nombre?.charAt(0) || user.email.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-tech-text">{user.nombre || 'Sin Nombre'}</h4>
                                                        <p className="text-xs text-tech-muted font-mono">{user.email} | DNI: {user.dni || '-'}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] font-black uppercase text-tech-muted">Rol:</span>
                                                            <select
                                                                value={user.rol}
                                                                onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                                                className="bg-tech-surface text-tech-text text-xs font-bold uppercase rounded px-2 py-1 border border-tech-surface outline-none focus:border-tech-cyan"
                                                            >
                                                                <option value="admin">Administrador</option>
                                                                <option value="docente">Docente</option>
                                                                <option value="preceptor">Preceptor</option>
                                                                <option value="alumno">Alumno</option>
                                                                <option value="tutor">Tutor</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {resettingUserId === user.id ? (
                                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                                            <Input
                                                                type="password"
                                                                placeholder="Nueva Contraseña"
                                                                value={newPassword}
                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                className="w-44"
                                                            />
                                                            <Button
                                                                onClick={() => handleResetPassword(user.id)}
                                                                disabled={!newPassword}
                                                                variant="primary"
                                                                size="sm"
                                                            >
                                                                <Check size={16} />
                                                            </Button>
                                                            <Button
                                                                onClick={() => { setResettingUserId(null); setNewPassword(''); }}
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                Cancelar
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button onClick={() => setResettingUserId(user.id)} variant="ghost" size="sm" className="border border-tech-surface">
                                                            <Lock size={14} /> Resetear Clave
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center border-2 border-dashed border-tech-surface rounded-xl text-tech-muted text-sm font-mono">
                                        {searched ? 'No se encontraron usuarios coincidentes.' : 'Ingrese un término y presione Buscar para ver resultados.'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: MANTENIMIENTO */}
                        {activeTab === 'maintenance' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Respaldo de Base de Datos */}
                                <div className="bg-tech-secondary p-6 rounded-2xl border border-tech-surface shadow-lg flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-tech-text uppercase mb-4 flex items-center gap-2 border-b border-tech-surface pb-3">
                                            <Download className="text-tech-success" size={20} />
                                            Copia de Seguridad (Backup)
                                        </h3>
                                        <p className="text-tech-muted text-xs leading-relaxed mb-6 font-mono">
                                            Exporta el estado completo de la base de datos (Calificaciones, Asistencias, Usuarios, Divisiones) en formato JSON estructurado.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleBackupExport}
                                        disabled={loading}
                                        variant="primary"
                                        className="w-full flex justify-center items-center gap-2"
                                    >
                                        <Download size={18} />
                                        {loading ? 'Generando Backup...' : 'Exportar Base de Datos'}
                                    </Button>
                                </div>

                                {/* Diagnóstico y Modo Mantenimiento */}
                                <div className="bg-tech-secondary p-6 rounded-2xl border border-tech-surface shadow-lg flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-tech-text uppercase mb-4 flex items-center gap-2 border-b border-tech-surface pb-3">
                                            <Server className="text-indigo-400" size={20} />
                                            Estado del Servidor & Mantenimiento
                                        </h3>

                                        <div className="space-y-3 mb-6 font-mono text-xs">
                                            <div className="flex justify-between items-center p-3 bg-tech-primary rounded-xl border border-tech-surface">
                                                <span className="text-tech-muted">Conexión Backend API</span>
                                                <span className="text-tech-success font-black flex items-center gap-1">
                                                    <Activity size={14} /> ONLINE (OK)
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-tech-primary rounded-xl border border-tech-surface">
                                                <span className="text-tech-muted">Base de Datos Supabase</span>
                                                <span className="text-tech-success font-black flex items-center gap-1">
                                                    <CheckCircle2 size={14} /> CONECTADO
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-tech-surface">
                                        <div className="flex items-center justify-between p-4 bg-tech-primary rounded-xl border border-tech-surface">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-tech-text">Modo Mantenimiento</p>
                                                <p className="text-[10px] text-tech-muted font-mono">Restringe el acceso mientras realiza cambios</p>
                                            </div>
                                            <Button
                                                onClick={handleToggleMaintenanceMode}
                                                disabled={loading}
                                                variant={settings.maintenance_mode ? 'danger' : 'ghost'}
                                                size="sm"
                                                className="border border-tech-surface"
                                            >
                                                {settings.maintenance_mode ? 'ACTIVADO' : 'DESACTIVADO'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: FEEDBACK */}
                        {activeTab === 'feedback' && (
                            <div className="space-y-6">
                                <div className="bg-tech-secondary p-6 rounded-2xl border border-tech-surface shadow-lg">
                                    <h3 className="text-lg font-bold text-tech-text uppercase mb-4 flex items-center gap-2 border-b border-tech-surface pb-3">
                                        <MessageCircle className="text-tech-cyan" size={20} />
                                        Sugerencias y Reportes de Usuarios
                                    </h3>
                                    <p className="text-tech-muted text-xs mb-8 font-mono">Listado de mensajes, sugerencias y reportes enviados desde el botón de feedback.</p>

                                    {feedbacks.length === 0 ? (
                                        <div className="p-12 text-center border-2 border-dashed border-tech-surface rounded-2xl text-tech-muted font-mono italic">
                                            No hay mensajes o sugerencias registradas.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {feedbacks.map(f => (
                                                <div
                                                    key={f.id}
                                                    className={`p-5 rounded-2xl border transition-all ${f.leido ? 'bg-tech-primary/30 border-tech-surface opacity-60' : 'bg-tech-primary border-tech-cyan/30 shadow-lg shadow-tech-cyan/5'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-left">
                                                                <h4 className="text-sm font-bold text-tech-text uppercase tracking-tight">{f.user?.nombre}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-tech-surface text-tech-muted uppercase">
                                                                        {f.user?.rol}
                                                                    </span>
                                                                    <span className="text-[9px] font-mono text-tech-muted">
                                                                        {new Date(f.created_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${f.prioridad === 'alta' ? 'bg-red-500/20 text-red-500' :
                                                                    f.prioridad === 'normal' ? 'bg-tech-cyan/20 text-tech-cyan' : 'bg-tech-surface text-tech-muted'
                                                                }`}>
                                                                {f.prioridad}
                                                            </span>
                                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full bg-tech-surface text-tech-text`}>
                                                                {f.tipo}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-tech-text leading-relaxed bg-tech-secondary/50 p-3 rounded-xl border border-tech-surface/50 mb-4 font-medium">
                                                        {f.contenido}
                                                    </p>
                                                    <div className="flex justify-end items-center gap-4">
                                                        <button
                                                            onClick={() => handleToggleFeedbackRead(f.id, f.leido)}
                                                            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${f.leido ? 'text-tech-muted hover:text-tech-text' : 'bg-tech-cyan text-white shadow-lg shadow-tech-cyan/20'
                                                                }`}
                                                        >
                                                            {f.leido ? 'Marcar como pendiente' : 'Marcar como leído'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : null}
            </div>
        </div>
    );
};

export default SystemSettings;
