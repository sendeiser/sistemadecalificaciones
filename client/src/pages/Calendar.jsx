import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, ArrowLeft, Edit, Trash2, X, Clock } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { getApiEndpoint } from '../utils/api';

const Calendar = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [message, setMessage] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        tipo: 'otro',
        color: '#0ea5e9',
        todo_el_dia: true,
        hora_inicio: '',
        hora_fin: '',
        visible_para: ['admin', 'docente', 'alumno', 'preceptor']
    });

    const eventTypes = [
        { value: 'feriado', label: 'Feriado', color: '#ef4444' },
        { value: 'cierre_notas', label: 'Cierre de Notas', color: '#f59e0b' },
        { value: 'acto', label: 'Acto Escolar', color: '#0ea5e9' },
        { value: 'examen', label: 'Examen', color: '#a855f7' },
        { value: 'reunion', label: 'Reunión', color: '#10b981' },
        { value: 'otro', label: 'Otro', color: '#6b7280' }
    ];

    useEffect(() => {
        // Switch to list view on small screens by default
        if (window.innerWidth < 768) {
            setViewMode('list');
        }
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint('/calendar/events');

            // Get first and last day of current month
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const response = await fetch(
                `${endpoint}?start_date=${firstDay.toISOString().split('T')[0]}&end_date=${lastDay.toISOString().split('T')[0]}`,
                {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                }
            );

            if (!response.ok) throw new Error('Error al cargar eventos');

            const data = await response.json();
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
            setMessage({ type: 'error', text: 'Error al cargar eventos' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint('/calendar/events');
            const method = editingEvent ? 'PUT' : 'POST';
            const url = editingEvent ? `${endpoint}/${editingEvent.id}` : endpoint;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Error al guardar evento');

            setMessage({ type: 'success', text: editingEvent ? 'Evento actualizado' : 'Evento creado' });
            setShowModal(false);
            resetForm();
            fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            setMessage({ type: 'error', text: 'Error al guardar evento' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este evento?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint(`/calendar/events/${id}`);

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Error al eliminar evento');

            setMessage({ type: 'success', text: 'Evento eliminado' });
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            setMessage({ type: 'error', text: 'Error al eliminar evento' });
        }
    };

    const openEditModal = (event) => {
        setEditingEvent(event);
        setFormData({
            titulo: event.titulo,
            descripcion: event.descripcion || '',
            fecha_inicio: event.fecha_inicio,
            fecha_fin: event.fecha_fin || '',
            tipo: event.tipo,
            color: event.color,
            todo_el_dia: event.todo_el_dia,
            hora_inicio: event.hora_inicio || '',
            hora_fin: event.hora_fin || '',
            visible_para: event.visible_para
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingEvent(null);
        setFormData({
            titulo: '',
            descripcion: '',
            fecha_inicio: '',
            fecha_fin: '',
            tipo: 'otro',
            color: '#0ea5e9',
            todo_el_dia: true,
            hora_inicio: '',
            hora_fin: '',
            visible_para: ['admin', 'docente', 'alumno', 'preceptor']
        });
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getEventsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(event => {
            const start = event.fecha_inicio;
            const end = event.fecha_fin || event.fecha_inicio;
            return dateStr >= start && dateStr <= end;
        });
    };

    const changeMonth = (delta) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-tech-primary text-tech-text">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-cyan"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-6 md:mb-10 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-tech-surface pb-6 gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-secondary rounded-lg transition-colors text-tech-muted hover:text-tech-text"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-grow">
                        <h1 className="text-2xl md:text-3xl font-bold text-tech-text uppercase tracking-tight flex items-center gap-3">
                            <div className="p-1.5 md:p-2 bg-tech-cyan/20 rounded text-tech-cyan">
                                <CalendarIcon className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            Calendario
                        </h1>
                        <p className="text-tech-muted font-mono mt-1 text-xs md:text-sm capitalize">
                            {currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <ThemeToggle />
                    {profile?.rol === 'admin' && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-tech-cyan hover:bg-sky-600 text-white rounded font-bold transition-all uppercase tracking-wider text-xs md:text-sm shadow-lg shadow-tech-cyan/20"
                        >
                            <Plus size={18} />
                            <span className="hidden xs:inline">Nuevo Evento</span>
                            <span className="xs:hidden">Nuevo</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {message && (
                    <div className={`mb-6 p-4 rounded border flex items-center justify-between ${message.type === 'error'
                        ? 'bg-tech-danger/10 border-tech-danger text-tech-danger'
                        : 'bg-tech-success/10 border-tech-success text-tech-success'
                        }`}>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} className="text-current opacity-50 hover:opacity-100">×</button>
                    </div>
                )}

                {/* Calendar Controls */}
                <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="px-4 py-2 bg-tech-secondary hover:bg-tech-surface rounded border border-tech-surface transition-colors"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-4 py-2 bg-tech-secondary hover:bg-tech-surface rounded border border-tech-surface transition-colors text-sm uppercase font-bold"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => changeMonth(1)}
                            className="px-4 py-2 bg-tech-secondary hover:bg-tech-surface rounded border border-tech-surface transition-colors"
                        >
                            →
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 rounded text-sm uppercase font-bold transition-colors ${viewMode === 'month'
                                ? 'bg-tech-cyan text-white'
                                : 'bg-tech-secondary hover:bg-tech-surface text-tech-muted'
                                }`}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded text-sm uppercase font-bold transition-colors ${viewMode === 'list'
                                ? 'bg-tech-cyan text-white'
                                : 'bg-tech-secondary hover:bg-tech-surface text-tech-muted'
                                }`}
                        >
                            Lista
                        </button>
                    </div>
                </div>

                {/* Calendar View */}
                {viewMode === 'month' ? (
                    <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden">
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 bg-tech-primary border-b border-tech-surface">
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                                <div key={day} className="p-3 text-center text-xs font-bold text-tech-muted uppercase">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7">
                            {getDaysInMonth().map((date, index) => {
                                const dayEvents = date ? getEventsForDate(date) : [];
                                const isToday = date && date.toDateString() === new Date().toDateString();

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[80px] md:min-h-[120px] p-1 md:p-2 border-r border-b border-tech-surface ${!date ? 'bg-tech-primary/30' : 'hover:bg-tech-surface/30 transition-colors'
                                            }`}
                                    >
                                        {date && (
                                            <>
                                                <div className={`text-xs md:text-sm font-bold mb-1 flex justify-center md:justify-start ${isToday
                                                    ? 'bg-tech-cyan text-white w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full'
                                                    : 'text-tech-text'
                                                    }`}>
                                                    {date.getDate()}
                                                </div>
                                                <div className="hidden md:block space-y-1">
                                                    {dayEvents.slice(0, 3).map(event => (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => profile?.rol === 'admin' ? openEditModal(event) : null}
                                                            className="text-[10px] p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity font-medium border border-transparent hover:border-current"
                                                            style={{ backgroundColor: event.color + '20', color: event.color }}
                                                            title={event.titulo}
                                                        >
                                                            {event.titulo}
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 3 && (
                                                        <div className="text-[10px] text-tech-muted font-bold px-1">
                                                            +{dayEvents.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Mobile dot indicator */}
                                                <div className="md:hidden flex flex-wrap justify-center gap-0.5 mt-1">
                                                    {dayEvents.slice(0, 3).map(event => (
                                                        <div
                                                            key={event.id}
                                                            className="w-1 h-1 rounded-full"
                                                            style={{ backgroundColor: event.color }}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-4">
                        {events.length === 0 ? (
                            <div className="text-center py-12 text-tech-muted font-mono">
                                No hay eventos este mes
                            </div>
                        ) : (
                            events.map(event => (
                                <div
                                    key={event.id}
                                    className="bg-tech-secondary p-6 rounded border border-tech-surface hover:border-tech-cyan/30 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div
                                                    className="w-4 h-4 rounded"
                                                    style={{ backgroundColor: event.color }}
                                                ></div>
                                                <h3 className="text-xl font-bold text-tech-text">{event.titulo}</h3>
                                                <span className="text-xs px-2 py-1 bg-tech-surface rounded text-tech-muted uppercase font-bold">
                                                    {eventTypes.find(t => t.value === event.tipo)?.label}
                                                </span>
                                            </div>
                                            {event.descripcion && (
                                                <p className="text-tech-muted mb-3">{event.descripcion}</p>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-tech-muted font-mono">
                                                <Clock size={14} />
                                                {new Date(event.fecha_inicio).toLocaleDateString('es-AR')}
                                                {event.fecha_fin && event.fecha_fin !== event.fecha_inicio && (
                                                    <> - {new Date(event.fecha_fin).toLocaleDateString('es-AR')}</>
                                                )}
                                                {!event.todo_el_dia && event.hora_inicio && (
                                                    <> • {event.hora_inicio}</>
                                                )}
                                            </div>
                                        </div>

                                        {profile?.rol === 'admin' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(event)}
                                                    className="p-2 hover:bg-tech-surface rounded transition-colors text-tech-cyan"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    className="p-2 hover:bg-tech-surface rounded transition-colors text-tech-danger"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Event Modal */}
            {showModal && profile?.rol === 'admin' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-tech-secondary border border-tech-surface rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-tech-text uppercase">
                                {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
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
                                <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                    rows="3"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Fecha Inicio *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha_inicio}
                                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                        className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Fecha Fin</label>
                                    <input
                                        type="date"
                                        value={formData.fecha_fin}
                                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                        className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Tipo *</label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => {
                                        const selectedType = eventTypes.find(t => t.value === e.target.value);
                                        setFormData({
                                            ...formData,
                                            tipo: e.target.value,
                                            color: selectedType?.color || '#0ea5e9'
                                        });
                                    }}
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                >
                                    {eventTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="todo_el_dia"
                                    checked={formData.todo_el_dia}
                                    onChange={(e) => setFormData({ ...formData, todo_el_dia: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="todo_el_dia" className="text-sm text-tech-text">
                                    Todo el día
                                </label>
                            </div>

                            {!formData.todo_el_dia && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Hora Inicio</label>
                                        <input
                                            type="time"
                                            value={formData.hora_inicio}
                                            onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                            className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-tech-muted uppercase mb-2">Hora Fin</label>
                                        <input
                                            type="time"
                                            value={formData.hora_fin}
                                            onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                                            className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none"
                                        />
                                    </div>
                                </div>
                            )}

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
                                    className="px-6 py-2 bg-tech-cyan hover:bg-sky-600 text-white rounded transition-colors uppercase font-bold"
                                >
                                    {editingEvent ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
