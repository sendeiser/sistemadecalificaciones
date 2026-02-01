import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, ArrowLeft, Edit, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { getApiEndpoint } from '../utils/api';

const Announcements = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [message, setMessage] = useState(null);
    const [filterTipo, setFilterTipo] = useState('all');

    // Form state
    const [formData, setFormData] = useState({
        titulo: '',
        contenido: '',
        prioridad: 'normal',
        tipo: 'general',
        destinatarios: ['admin', 'docente', 'alumno', 'preceptor', 'tutor'],
        publicado: false,
        fecha_expiracion: ''
    });

    const prioridades = [
        { value: 'baja', label: 'Baja', color: 'text-gray-400' },
        { value: 'normal', label: 'Normal', color: 'text-tech-cyan' },
        { value: 'alta', label: 'Alta', color: 'text-tech-accent' },
        { value: 'urgente', label: 'Urgente', color: 'text-tech-danger' }
    ];

    const tipos = [
        { value: 'general', label: 'General' },
        { value: 'academico', label: 'Académico' },
        { value: 'administrativo', label: 'Administrativo' },
        { value: 'evento', label: 'Evento' }
    ];

    useEffect(() => {
        fetchAnnouncements();
    }, [filterTipo]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint('/announcements');
            const url = filterTipo !== 'all' ? `${endpoint}?tipo=${filterTipo}` : endpoint;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Error al cargar anuncios');

            const data = await response.json();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            setMessage({ type: 'error', text: 'Error al cargar anuncios' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint('/announcements');
            const method = editingAnnouncement ? 'PUT' : 'POST';
            const url = editingAnnouncement ? `${endpoint}/${editingAnnouncement.id}` : endpoint;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Error al guardar anuncio');

            setMessage({ type: 'success', text: editingAnnouncement ? 'Anuncio actualizado' : 'Anuncio creado' });
            setShowModal(false);
            resetForm();
            fetchAnnouncements();
        } catch (error) {
            console.error('Error saving announcement:', error);
            setMessage({ type: 'error', text: 'Error al guardar anuncio' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este anuncio?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint(`/announcements/${id}`);

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Error al eliminar anuncio');

            setMessage({ type: 'success', text: 'Anuncio eliminado' });
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            setMessage({ type: 'error', text: 'Error al eliminar anuncio' });
        }
    };

    const markAsRead = async (id) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint(`/announcements/${id}/read`);

            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            // Update local state
            setAnnouncements(prev => prev.map(a =>
                a.id === id ? { ...a, leido: true } : a
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const openEditModal = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            titulo: announcement.titulo,
            contenido: announcement.contenido,
            prioridad: announcement.prioridad,
            tipo: announcement.tipo,
            destinatarios: announcement.destinatarios,
            publicado: announcement.publicado,
            fecha_expiracion: announcement.fecha_expiracion?.split('T')[0] || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingAnnouncement(null);
        setFormData({
            titulo: '',
            contenido: '',
            prioridad: 'normal',
            tipo: 'general',
            destinatarios: ['admin', 'docente', 'alumno', 'preceptor', 'tutor'],
            publicado: false,
            fecha_expiracion: ''
        });
    };

    const getPriorityBadge = (prioridad) => {
        const priority = prioridades.find(p => p.value === prioridad);
        return (
            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${priority?.color} bg-tech-surface`}>
                {priority?.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-tech-primary text-tech-text">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-cyan"></div>
            </div>
        );
    }

    const canCreateAnnouncement = ['admin', 'preceptor'].includes(profile?.rol);

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            {/* Header */}
            <header className="max-w-5xl mx-auto mb-6 md:mb-10 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-tech-surface pb-6 gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-secondary rounded-lg transition-colors text-tech-muted hover:text-tech-text"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-grow">
                        <h1 className="text-2xl md:text-3xl font-bold text-tech-text uppercase tracking-tight flex items-center gap-3">
                            <div className="p-1.5 md:p-2 bg-tech-accent/20 rounded text-tech-accent">
                                <Bell className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            Anuncios
                        </h1>
                        <p className="text-tech-muted font-mono mt-1 text-xs md:text-sm">
                            Comunicaciones institucionales
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <ThemeToggle />
                    {canCreateAnnouncement && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-tech-accent hover:bg-amber-600 text-white rounded font-bold transition-all uppercase tracking-wider text-xs md:text-sm shadow-lg shadow-tech-accent/20"
                        >
                            <Plus size={18} />
                            <span className="hidden xs:inline">Nuevo Anuncio</span>
                            <span className="xs:hidden">Nuevo</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto">
                {message && (
                    <div className={`mb-6 p-4 rounded border flex items-center justify-between ${message.type === 'error'
                        ? 'bg-tech-danger/10 border-tech-danger text-tech-danger'
                        : 'bg-tech-success/10 border-tech-success text-tech-success'
                        }`}>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} className="text-current opacity-50 hover:opacity-100">×</button>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                    <button
                        onClick={() => setFilterTipo('all')}
                        className={`px-4 py-2 rounded text-xs md:text-sm uppercase font-bold whitespace-nowrap transition-colors border ${filterTipo === 'all'
                            ? 'bg-tech-cyan text-white border-tech-cyan'
                            : 'bg-tech-secondary hover:bg-tech-surface text-tech-muted border-tech-surface'
                            }`}
                    >
                        Todos
                    </button>
                    {tipos.map(tipo => (
                        <button
                            key={tipo.value}
                            onClick={() => setFilterTipo(tipo.value)}
                            className={`px-4 py-2 rounded text-xs md:text-sm uppercase font-bold whitespace-nowrap transition-colors border ${filterTipo === tipo.value
                                ? 'bg-tech-cyan text-white border-tech-cyan'
                                : 'bg-tech-secondary hover:bg-tech-surface text-tech-muted border-tech-surface'
                                }`}
                        >
                            {tipo.label}
                        </button>
                    ))}
                </div>

                {/* Announcements List */}
                <div className="space-y-4">
                    {announcements.length === 0 ? (
                        <div className="text-center py-12 text-tech-muted font-mono">
                            No hay anuncios disponibles
                        </div>
                    ) : (
                        announcements.map(announcement => (
                            <div
                                key={announcement.id}
                                className={`bg-tech-secondary p-6 rounded border transition-all ${announcement.leido
                                    ? 'border-tech-surface'
                                    : 'border-tech-cyan/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                                    }`}
                                onClick={() => !announcement.leido && markAsRead(announcement.id)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            {!announcement.leido && (
                                                <div className="w-2 h-2 bg-tech-cyan rounded-full animate-pulse flex-shrink-0"></div>
                                            )}
                                            <h3 className="text-lg md:text-xl font-bold text-tech-text break-words">
                                                {announcement.titulo}
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {getPriorityBadge(announcement.prioridad)}
                                            <span className="text-[10px] md:text-xs px-2 py-1 bg-tech-surface rounded text-tech-muted uppercase font-bold">
                                                {tipos.find(t => t.value === announcement.tipo)?.label}
                                            </span>
                                        </div>
                                        <div className="text-xs text-tech-muted font-mono">
                                            Por {announcement.autor?.nombre} • {new Date(announcement.fecha_publicacion).toLocaleDateString('es-AR')}
                                        </div>
                                    </div>

                                    {canCreateAnnouncement && (
                                        <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-start">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditModal(announcement); }}
                                                className="p-2 hover:bg-tech-surface rounded transition-colors text-tech-cyan"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(announcement.id); }}
                                                className="p-2 hover:bg-tech-surface rounded transition-colors text-tech-danger"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm md:text-base text-tech-text whitespace-pre-wrap leading-relaxed">
                                    {announcement.contenido}
                                </p>

                                {announcement.leido && (
                                    <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-tech-success font-bold uppercase tracking-wider">
                                        <CheckCircle size={14} />
                                        Leído
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Announcement Modal */}
            {showModal && canCreateAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                    <div className="bg-tech-secondary border border-tech-surface rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-tech-text uppercase">
                                {editingAnnouncement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
                            </h2>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="text-tech-muted hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Título *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Contenido *</label>
                                <textarea
                                    required
                                    value={formData.contenido}
                                    onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                    rows="6"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Prioridad</label>
                                    <select
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                                        className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                    >
                                        {prioridades.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Tipo</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                    >
                                        {tipos.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Destinatarios</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['admin', 'docente', 'alumno', 'preceptor', 'tutor'].map(rol => (
                                        <label key={rol} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.destinatarios.includes(rol)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, destinatarios: [...formData.destinatarios, rol] });
                                                    } else {
                                                        setFormData({ ...formData, destinatarios: formData.destinatarios.filter(r => r !== rol) });
                                                    }
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span className="capitalize">{rol}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Fecha de Expiración</label>
                                <input
                                    type="date"
                                    value={formData.fecha_expiracion}
                                    onChange={(e) => setFormData({ ...formData, fecha_expiracion: e.target.value })}
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="publicado"
                                    checked={formData.publicado}
                                    onChange={(e) => setFormData({ ...formData, publicado: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="publicado" className="text-sm text-tech-text">
                                    Publicar inmediatamente
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="px-6 py-2 bg-tech-surface hover:bg-tech-primary text-tech-text rounded transition-colors uppercase font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-tech-accent hover:bg-amber-600 text-white rounded transition-colors uppercase font-bold"
                                >
                                    {editingAnnouncement ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
