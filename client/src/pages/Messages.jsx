import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, User, Users, Search, Inbox, MessageSquare, ShieldCheck, Zap, ArrowLeft, CheckCircle2, X as CloseIcon } from 'lucide-react';
import { getApiEndpoint } from '../utils/api';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const Messages = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // ID del mensaje que se está respondiendo
    const [statusMessage, setStatusMessage] = useState(null); // { type, text }
    const [selectedRecipient, setSelectedRecipient] = useState(null); // { id, nombre, rol }
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('received'); // 'received', 'sent'
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showCompose, setShowCompose] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setShowCompose(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchMessages();
        fetchUsers();
    }, [profile]);

    useEffect(() => {
        if (activeTab === 'received' && messages.length > 0) {
            const unreadIds = messages
                .filter(m => !m.leido && (m.destinatario_id === user?.id || m.rol_destinatario === profile?.rol))
                .map(m => m.id);

            if (unreadIds.length > 0) {
                markAllAsRead(unreadIds);
            }
        }
    }, [activeTab, messages, user, profile]);

    const fetchMessages = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(getApiEndpoint('/messages'), {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await response.json();

            if (Array.isArray(data)) {
                setMessages(data);
            } else {
                console.error('Expected array of messages, got:', data);
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(getApiEndpoint('/messages/users'), {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setAvailableUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const markAllAsRead = async (ids) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            await Promise.all(ids.map(id =>
                fetch(getApiEndpoint(`/messages/${id}/read`), {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                })
            ));

            setMessages(prev => prev.map(m =>
                ids.includes(m.id) ? { ...m, leido: true } : m
            ));
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const sendMessage = async (e, customData = null) => {
        if (e) e.preventDefault();

        const content = customData ? customData.contenido : newMessage;
        const recipient = customData ? customData.destinatario_id : selectedRecipient?.id;

        if (!content.trim() || !recipient) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(getApiEndpoint('/messages'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    destinatario_id: recipient,
                    contenido: content,
                    tipo: 'privado'
                })
            });

            if (response.ok) {
                if (!customData) {
                    setNewMessage('');
                    setSelectedRecipient(null);
                } else {
                    setReplyText('');
                    setReplyingTo(null);
                }
                showStatus('Mensaje enviado correctamente');
                fetchMessages();
            } else {
                showStatus('Error al enviar el mensaje', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showStatus('Fallo en la conexión', 'error');
        }
    };

    const showStatus = (text, type = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const filteredMessages = Array.isArray(messages) ? messages.filter(m => {
        if (activeTab === 'received') return m.destinatario_id === user?.id || m.rol_destinatario === profile?.rol;
        if (activeTab === 'sent') return m.remitente_id === user?.id;
        return true;
    }) : [];

    return (
        <div className="min-h-screen bg-tech-primary pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 mr-2 hover:bg-tech-surface rounded-xl text-tech-muted hover:text-tech-cyan transition-all"
                                title="Volver al Dashboard"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div className="p-3 bg-tech-cyan/20 rounded-2xl">
                                <MessageSquare className="text-tech-cyan" size={32} />
                            </div>
                            <h1 className="text-4xl font-black text-tech-text uppercase tracking-tighter">Mensajería Interna</h1>
                        </div>
                        <p className="text-tech-muted font-mono text-sm tracking-widest uppercase ml-14">Canal de Comunicación Institucional</p>
                    </div>

                    <div className="flex p-1 bg-tech-secondary rounded-xl border border-tech-surface shadow-inner">
                        {[
                            { id: 'received', label: 'Recibidos', icon: Inbox },
                            { id: 'sent', label: 'Enviados', icon: Send }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-tech-cyan text-white shadow-lg' : 'text-tech-muted hover:text-tech-text'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </header>

                <AnimatePresence>
                    {statusMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`fixed top-24 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${statusMessage.type === 'error'
                                ? 'bg-tech-danger/10 border-tech-danger text-tech-danger'
                                : 'bg-tech-success/10 border-tech-success text-tech-success'
                                }`}
                        >
                            {statusMessage.type === 'error' ? <Zap size={20} /> : <CheckCircle2 size={20} />}
                            <span className="font-bold tracking-tight">{statusMessage.text}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                    {/* Lista de Mensajes */}
                    <div className={`lg:col-span-2 space-y-6 ${isMobile && showCompose ? 'hidden' : 'block'}`}>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-tech-secondary rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="bg-tech-secondary rounded-3xl p-12 text-center border border-dashed border-tech-surface">
                                <div className="mx-auto w-20 h-20 bg-tech-surface rounded-full flex items-center justify-center mb-6">
                                    <Inbox className="text-tech-muted" size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-tech-text mb-2">No hay mensajes</h3>
                                <p className="text-tech-muted">Inicia una conversación buscando a un usuario.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredMessages.map((m, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={m.id}
                                        className={`glass-panel p-6 rounded-3xl border border-tech-surface/30 hover:shadow-2xl transition-all ${!m.leido && m.destinatario_id === user.id ? 'border-l-4 border-l-tech-cyan' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-tech-surface rounded-2xl flex items-center justify-center font-bold text-tech-cyan text-xl">
                                                    {(activeTab === 'sent' ? m.destinatario?.nombre : m.remitente?.nombre)?.[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-tech-text leading-tight">
                                                        {activeTab === 'sent' ? m.destinatario?.nombre || m.rol_destinatario : m.remitente?.nombre}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] uppercase font-bold text-tech-muted bg-tech-primary px-2 py-0.5 rounded border border-tech-surface">
                                                            {activeTab === 'sent' ? (m.destinatario?.rol || m.rol_destinatario) : m.remitente?.rol}
                                                        </span>
                                                        <span className="text-xs text-tech-muted">• {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {m.tipo === 'rol' && (
                                                    <div className="flex items-center gap-2 text-tech-accent text-[10px] font-black uppercase tracking-widest bg-tech-accent/10 px-3 py-1 rounded-full border border-tech-accent/20">
                                                        <Users size={12} />
                                                        Difusión
                                                    </div>
                                                )}
                                                {activeTab === 'received' && (
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(replyingTo === m.id ? null : m.id);
                                                            setReplyText('');
                                                        }}
                                                        className={`p-2 rounded-xl transition-all ${replyingTo === m.id ? 'bg-tech-cyan text-white shadow-lg' : 'text-tech-cyan hover:bg-tech-cyan/10'}`}
                                                        title="Responder"
                                                    >
                                                        <MessageSquare size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-tech-text leading-relaxed pl-16 mb-4">{m.contenido}</p>

                                        <AnimatePresence>
                                            {replyingTo === m.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-tech-primary/50 rounded-2xl p-4 border border-tech-surface mt-2 ml-16"
                                                >
                                                    <textarea
                                                        autoFocus
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Escribe tu respuesta..."
                                                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-tech-text placeholder:text-tech-muted min-h-[80px] resize-none"
                                                    />
                                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-tech-surface">
                                                        <button
                                                            onClick={() => setReplyingTo(null)}
                                                            className="px-4 py-2 text-xs font-bold text-tech-muted hover:text-tech-text uppercase transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => sendMessage(null, {
                                                                destinatario_id: m.remitente_id,
                                                                contenido: replyText
                                                            })}
                                                            disabled={!replyText.trim()}
                                                            className="px-6 py-2 bg-tech-cyan text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-tech-cyan/80"
                                                        >
                                                            Enviar Respuesta
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Nueva Conversación */}
                    <div className={`space-y-8 ${isMobile && !showCompose ? 'hidden' : 'block'}`}>
                        <section className="bg-tech-secondary rounded-[2rem] p-8 border border-tech-surface shadow-xl sticky top-28">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-tech-text uppercase tracking-tighter flex items-center gap-2">
                                    <Send className="text-tech-cyan" size={20} />
                                    Nuevo Mensaje
                                </h3>
                                {isMobile && (
                                    <button
                                        onClick={() => setShowCompose(false)}
                                        className="p-2 hover:bg-tech-surface rounded-xl text-tech-muted"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {/* Selector de Destinatario */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-tech-muted uppercase tracking-widest pl-1">Destinatario</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-4 flex items-center text-tech-muted">
                                            <Search size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Buscar usuario..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-tech-primary rounded-2xl border border-tech-surface focus:border-tech-cyan focus:ring-4 focus:ring-tech-cyan/10 outline-none font-bold text-tech-text transition-all"
                                        />

                                        {searchQuery && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-tech-secondary border border-tech-surface rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-50 p-2 space-y-1">
                                                {availableUsers
                                                    .filter(u => u.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .map(u => (
                                                        <button
                                                            key={u.id}
                                                            onClick={() => {
                                                                setSelectedRecipient(u);
                                                                setSearchQuery('');
                                                            }}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-tech-primary rounded-xl transition-all"
                                                        >
                                                            <div className="w-8 h-8 bg-tech-surface rounded-lg flex items-center justify-center text-tech-cyan">
                                                                <User size={16} />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-tech-text">{u.nombre}</p>
                                                                <p className="text-[10px] text-tech-muted uppercase font-bold">{u.rol}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedRecipient && (
                                        <div className="flex items-center justify-between p-4 bg-tech-cyan/5 rounded-2xl border border-tech-cyan/20">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-tech-cyan rounded-xl text-white">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-tech-text">{selectedRecipient.nombre}</p>
                                                    <p className="text-xs text-tech-muted uppercase font-bold">{selectedRecipient.rol}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedRecipient(null)}
                                                className="text-tech-muted hover:text-tech-danger p-1"
                                            >
                                                <CloseIcon size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-tech-muted uppercase tracking-widest pl-1">Mensaje</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Escribe algo importante..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="w-full p-6 bg-tech-primary rounded-3xl border border-tech-surface focus:border-tech-cyan focus:ring-4 focus:ring-tech-cyan/10 outline-none font-medium text-tech-text transition-all resize-none"
                                    />
                                </div>

                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || !selectedRecipient}
                                    className="w-full py-5 bg-tech-cyan text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-tech-cyan/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3"
                                >
                                    <Send size={20} />
                                    Enviar Mensaje
                                </button>
                            </div>
                        </section>

                        <div className="p-8 bg-tech-surface/20 rounded-3xl border border-dashed border-tech-surface">
                            <h4 className="flex items-center gap-2 text-tech-text font-bold mb-3">
                                <ShieldCheck className="text-tech-success" size={18} />
                                Comunicación Segura
                            </h4>
                            <p className="text-xs text-tech-muted leading-relaxed font-medium">
                                Los mensajes son privados y registrados para auditoría. Mantén un lenguaje profesional acorde a la institución.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAB for Mobile */}
                {isMobile && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowCompose(!showCompose)}
                        className="fixed bottom-8 right-8 z-[60] w-16 h-16 bg-tech-cyan text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-tech-cyan/80 transition-all border-4 border-tech-primary"
                    >
                        {showCompose ? <CloseIcon size={32} /> : <MessageSquare size={32} />}
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default Messages;
