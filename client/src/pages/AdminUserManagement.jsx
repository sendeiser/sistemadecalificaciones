import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiEndpoint } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { ArrowLeft, UserPlus, Mail, Copy, CheckCircle2, Shield, Users, Clock, Trash2, RefreshCcw, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUserManagement = () => {
    const { profile, session } = useAuth();
    const navigate = useNavigate();
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [editingToken, setEditingToken] = useState(null);
    const [editEmail, setEditEmail] = useState('');

    // New Invite Form
    const [newInvite, setNewInvite] = useState({ rol: 'docente', email: '' });
    const [generatedLink, setGeneratedLink] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        if (profile?.rol !== 'admin' && profile?.rol !== 'preceptor') {
            navigate('/dashboard');
            return;
        }
        fetchInvites();
    }, [profile]);

    const fetchInvites = async () => {
        try {
            const res = await fetch(getApiEndpoint('/admin/invites'), {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInvites(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvite = async (e) => {
        e.preventDefault();
        setGenerating(true);
        setGeneratedLink(null);

        try {
            const res = await fetch(getApiEndpoint('/admin/invite'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(newInvite)
            });

            const data = await res.json();
            if (res.ok) {
                setGeneratedLink(data.link);
                setNewInvite({ rol: 'docente', email: '' }); // Reset form
                fetchInvites(); // Refresh list
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error al generar invitación');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteInvite = async (token) => {
        if (!window.confirm('¿Estás seguro de eliminar esta invitación?')) return;

        try {
            const res = await fetch(getApiEndpoint(`/admin/invite/${token}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (res.ok) {
                fetchInvites();
            } else {
                const data = await res.json();
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error al eliminar invitación');
        }
    };

    const handleUpdateInviteEmail = async (token) => {
        try {
            const res = await fetch(getApiEndpoint(`/admin/invite/${token}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ email: editEmail })
            });

            if (res.ok) {
                setEditingToken(null);
                fetchInvites();
            } else {
                const data = await res.json();
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error al actualizar invitación');
        }
    };

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const getRoleBadgeColor = (rol) => {
        switch (rol) {
            case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'tutor': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'preceptor': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            default: return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-4 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between border-b border-tech-surface pb-6 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-tech-text uppercase tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-tech-accent/10 rounded text-tech-accent">
                            <Shield size={32} />
                        </div>
                        Gestión de Usuarios
                    </h1>
                    <p className="text-tech-muted font-mono mt-2 text-sm">Generar invitaciones para nuevos docentes, tutores y preceptores.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <ThemeToggle />
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 text-tech-muted hover:text-tech-text hover:bg-tech-surface rounded transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Volver
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CREATE INVITE PANEL */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-tech-secondary p-6 rounded-2xl border border-tech-surface shadow-lg">
                        <h2 className="text-xl font-bold text-tech-text uppercase mb-6 flex items-center gap-2">
                            <UserPlus size={20} className="text-tech-cyan" />
                            Nueva Invitación
                        </h2>

                        <form onSubmit={handleCreateInvite} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-tech-muted uppercase mb-1 block">Rol a Asignar</label>
                                <select
                                    value={newInvite.rol}
                                    onChange={(e) => setNewInvite({ ...newInvite, rol: e.target.value })}
                                    className="w-full bg-tech-primary border border-tech-surface rounded-xl px-3 py-3 text-sm focus:border-tech-cyan outline-none text-tech-text transition-all"
                                >
                                    <option value="docente">Docente</option>
                                    <option value="tutor">Tutor (Padre/Madre)</option>
                                    <option value="preceptor">Preceptor (Admin)</option>
                                    <option value="admin">Administrador (Total)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-tech-muted uppercase mb-1 block">Email (Opcional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" size={16} />
                                    <input
                                        type="email"
                                        placeholder="Restringir a este correo..."
                                        value={newInvite.email}
                                        onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                                        className="w-full bg-tech-primary border border-tech-surface rounded-xl pl-10 pr-3 py-3 text-sm focus:border-tech-cyan outline-none text-tech-text transition-all"
                                    />
                                </div>
                                <p className="text-[10px] text-tech-muted mt-2 font-mono">* Si se deja vacío, cualquiera con el link puede registrarse.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={generating}
                                className="w-full py-4 bg-tech-cyan hover:bg-sky-600 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex justify-center gap-2"
                            >
                                {generating ? <RefreshCcw className="animate-spin" /> : 'Generar Link'}
                            </button>
                        </form>
                    </div>

                    {/* Generated Link Display */}
                    <AnimatePresence>
                        {generatedLink && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-tech-secondary p-6 rounded-2xl border border-tech-success shadow-[0_10px_30px_rgba(16,185,129,0.1)]"
                            >
                                <div className="flex items-center gap-2 text-tech-success mb-2 font-bold uppercase text-sm">
                                    <CheckCircle2 size={16} /> Invitación Creada
                                </div>
                                <div className="bg-tech-primary p-3 rounded-xl border border-tech-surface break-all font-mono text-xs text-tech-muted mb-4 select-all">
                                    {generatedLink}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="w-full py-3 bg-tech-surface hover:bg-tech-primary border border-tech-surface text-tech-text rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-bold uppercase tracking-widest"
                                >
                                    {copySuccess ? <CheckCircle2 size={16} className="text-tech-success" /> : <Copy size={16} />}
                                    {copySuccess ? 'Copiado' : 'Copiar Link'}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* INVITES LIST */}
                <div className="lg:col-span-2">
                    <div className="bg-tech-secondary rounded-2xl border border-tech-surface shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-tech-surface flex justify-between items-center">
                            <h2 className="text-xl font-bold text-tech-text uppercase flex items-center gap-2">
                                <Clock size={20} className="text-tech-accent" />
                                Historial de Invitaciones
                            </h2>
                            <button onClick={fetchInvites} className="p-2 hover:bg-tech-surface rounded-full transition-colors text-tech-muted">
                                <RefreshCcw size={16} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse hidden md:table">
                                <thead className="bg-tech-primary/50 text-tech-muted text-xs uppercase tracking-wider font-mono">
                                    <tr>
                                        <th className="p-4 border-b border-tech-surface">Rol</th>
                                        <th className="p-4 border-b border-tech-surface">Email</th>
                                        <th className="p-4 border-b border-tech-surface">Estado</th>
                                        <th className="p-4 border-b border-tech-surface">Creado</th>
                                        <th className="p-4 border-b border-tech-surface text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-tech-muted animate-pulse">Cargando...</td></tr>
                                    ) : invites.length === 0 ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-tech-muted font-bold">Sin invitaciones activas</td></tr>
                                    ) : invites.map((inv) => (
                                        <tr key={inv.token} className="border-b border-tech-surface hover:bg-tech-surface/30 transition-colors">
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${getRoleBadgeColor(inv.rol)}`}>
                                                    {inv.rol}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {editingToken === inv.token ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            value={editEmail}
                                                            onChange={(e) => setEditEmail(e.target.value)}
                                                            className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 text-xs w-32 outline-none"
                                                            placeholder="Email..."
                                                        />
                                                        <button onClick={() => handleUpdateInviteEmail(inv.token)} className="text-tech-success"><Save size={14} /></button>
                                                        <button onClick={() => setEditingToken(null)} className="text-tech-muted"><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <span className="text-tech-muted font-mono text-xs">
                                                        {inv.email || <span className="opacity-40 italic">Libre</span>}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {inv.usado ? (
                                                    <span className="text-tech-muted text-[10px] font-black uppercase opacity-60">Usado</span>
                                                ) : new Date(inv.expires_at) < new Date() ? (
                                                    <span className="text-tech-danger text-[10px] font-black uppercase">Expirado</span>
                                                ) : (
                                                    <span className="text-tech-success text-[10px] font-black uppercase animate-pulse">Activo</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-bold text-tech-text truncate max-w-[80px]">{inv.creador?.nombre || 'Sist.'}</p>
                                                <p className="text-[10px] font-mono text-tech-muted">{new Date(inv.created_at).toLocaleDateString()}</p>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!inv.usado && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingToken(inv.token);
                                                                setEditEmail(inv.email || '');
                                                            }}
                                                            className="p-1.5 hover:bg-tech-cyan/10 text-tech-muted hover:text-tech-cyan rounded-lg transition-all"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteInvite(inv.token)}
                                                        className="p-1.5 hover:bg-tech-danger/10 text-tech-muted hover:text-tech-danger rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile List Layout */}
                            <div className="md:hidden divide-y divide-tech-surface">
                                {loading ? (
                                    <div className="p-8 text-center text-tech-muted animate-pulse font-bold uppercase tracking-widest text-xs">Cargando...</div>
                                ) : invites.length === 0 ? (
                                    <div className="p-8 text-center text-tech-muted font-bold uppercase tracking-widest text-xs">Sin invitaciones</div>
                                ) : invites.map((inv) => (
                                    <div key={inv.token} className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${getRoleBadgeColor(inv.rol)}`}>
                                                {inv.rol}
                                            </span>
                                            <div className="flex gap-2">
                                                {!inv.usado && (
                                                    <button onClick={() => { setEditingToken(inv.token); setEditEmail(inv.email || ''); }} className="p-2 bg-tech-surface rounded-lg text-tech-cyan"><Edit2 size={14} /></button>
                                                )}
                                                <button onClick={() => handleDeleteInvite(inv.token)} className="p-2 bg-tech-surface rounded-lg text-tech-danger"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="text-[10px] text-tech-muted uppercase font-bold">Email Restringido</p>
                                                {editingToken === inv.token ? (
                                                    <div className="mt-1 flex gap-1">
                                                        <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 text-xs outline-none" placeholder="Email..." />
                                                        <button onClick={() => handleUpdateInviteEmail(inv.token)} className="text-tech-success"><Save size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <p className="font-mono mt-0.5">{inv.email || 'Libre'}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-tech-muted uppercase font-bold">Estado</p>
                                                <p className={`mt-0.5 font-bold uppercase ${inv.usado ? 'text-tech-muted' : new Date(inv.expires_at) < new Date() ? 'text-tech-danger' : 'text-tech-success'}`}>
                                                    {inv.usado ? 'Usado' : new Date(inv.expires_at) < new Date() ? 'Expirado' : 'Activo'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center bg-tech-surface/20 p-2 rounded-lg">
                                            <p className="text-[10px] text-tech-muted">Por: <span className="text-tech-text font-bold uppercase">{inv.creador?.nombre || 'Sist.'}</span></p>
                                            <p className="text-[10px] font-mono text-tech-muted">{new Date(inv.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagement;
