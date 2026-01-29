import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiEndpoint } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { ArrowLeft, UserPlus, Mail, Copy, CheckCircle2, Shield, Users, Clock, Trash2, RefreshCcw } from 'lucide-react';

const AdminUserManagement = () => {
    const { profile, session } = useAuth();
    const navigate = useNavigate();
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

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

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between border-b border-tech-surface pb-6 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-tech-text uppercase tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-tech-accent/10 rounded text-tech-accent">
                            <Shield size={32} />
                        </div>
                        Gestión de Usuarios
                    </h1>
                    <p className="text-tech-muted font-mono mt-2 text-sm">Generar invitaciones para nuevos docentes y preceptores.</p>
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
                    <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg">
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
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm focus:border-tech-cyan outline-none text-tech-text"
                                >
                                    <option value="docente">Docente</option>
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
                                        className="w-full bg-tech-primary border border-tech-surface rounded pl-10 pr-3 py-2 text-sm focus:border-tech-cyan outline-none text-tech-text"
                                    />
                                </div>
                                <p className="text-[10px] text-tech-muted mt-2 font-mono">* Si se deja vacío, cualquiera con el link puede registrarse.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={generating}
                                className="w-full py-3 bg-tech-cyan hover:bg-sky-600 text-white font-bold uppercase tracking-wider rounded transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex justify-center gap-2"
                            >
                                {generating ? <RefreshCcw className="animate-spin" /> : 'Generar Link'}
                            </button>
                        </form>
                    </div>

                    {/* Generated Link Display */}
                    {generatedLink && (
                        <div className="bg-tech-secondary p-6 rounded border border-tech-success shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in slide-in-from-top-4">
                            <div className="flex items-center gap-2 text-tech-success mb-2 font-bold uppercase text-sm">
                                <CheckCircle2 size={16} /> Invitación Creada
                            </div>
                            <div className="bg-tech-primary p-3 rounded border border-tech-surface break-all font-mono text-xs text-tech-muted mb-3 select-all">
                                {generatedLink}
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="w-full py-2 bg-tech-surface hover:bg-tech-primary border border-tech-surface text-tech-text rounded flex items-center justify-center gap-2 transition-colors text-xs font-bold uppercase"
                            >
                                {copySuccess ? <CheckCircle2 size={16} className="text-tech-success" /> : <Copy size={16} />}
                                {copySuccess ? 'Copiado' : 'Copiar Link'}
                            </button>
                        </div>
                    )}
                </div>

                {/* INVITES LIST */}
                <div className="lg:col-span-2">
                    <div className="bg-tech-secondary rounded border border-tech-surface shadow-lg overflow-hidden">
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
                            <table className="w-full text-left border-collapse">                                
                                <thead className="bg-tech-primary/50 text-tech-muted text-xs uppercase tracking-wider font-mono">
                                    <tr>
                                        <th className="p-4 border-b border-tech-surface">Rol</th>
                                        <th className="p-4 border-b border-tech-surface">Email Restringido</th>
                                        <th className="p-4 border-b border-tech-surface text-center">Estado</th>
                                        <th className="p-4 border-b border-tech-surface">Creado Por</th>
                                        <th className="p-4 border-b border-tech-surface text-right">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-tech-muted animate-pulse">Cargando...</td></tr>
                                    ) : invites.length === 0 ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-tech-muted">No hay invitaciones recientes.</td></tr>
                                    ) : invites.map((inv) => (
                                        <tr key={inv.token} className="border-b border-tech-surface hover:bg-tech-surface/30 transition-colors">
                                            <td className="p-4 font-bold">
                                                <span className={`px-2 py-1 rounded text-[10px] uppercase border ${inv.rol === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        inv.rol === 'preceptor' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                            'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                                                    }`}>
                                                    {inv.rol}
                                                </span>
                                            </td>
                                            <td className="p-4 text-tech-muted font-mono text-xs">
                                                {inv.email || <span className="text-tech-muted/50 italic">Cualquiera</span>}
                                            </td>
                                            <td className="p-4 text-center">
                                                {inv.usado ? (
                                                    <span className="inline-flex items-center gap-1 text-tech-muted text-xs font-bold uppercase bg-tech-surface/50 px-2 py-1 rounded">
                                                        <CheckCircle2 size={12} /> Usado
                                                    </span>
                                                ) : new Date(inv.expires_at) < new Date() ? (
                                                    <span className="text-tech-danger text-xs font-bold uppercase">Expirado</span>
                                                ) : (
                                                    <span className="text-tech-success text-xs font-bold uppercase animate-pulse">Activo</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs">
                                                {inv.creador?.nombre || 'Admin'}
                                            </td>
                                            <td className="p-4 text-right text-xs font-mono text-tech-muted">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagement;
