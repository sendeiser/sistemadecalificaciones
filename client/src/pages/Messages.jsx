import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Send, User, Users, Search, Inbox, MessageSquare, 
    ShieldCheck, ArrowLeft, X as CloseIcon, MoreVertical, 
    Check, CheckCheck, Megaphone, Bell, Copy, ArrowDown, Filter
} from 'lucide-react';
import { getApiEndpoint } from '../utils/api';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

const getRoleTitle = (r) => {
    if (!r) return '';
    if (r === 'admin') return 'ADMINISTRADORES';
    if (r === 'preceptor') return 'PRECEPTORES';
    if (r === 'docente') return 'DOCENTES';
    if (r === 'alumno') return 'ALUMNOS';
    if (r.startsWith('anio_')) return `${r.replace('anio_', '')}° AÑO`;
    return r.toUpperCase();
};

const Messages = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [activeChatKey, setActiveChatKey] = useState(null); // ID del usuario o 'role_X'
    const addToast = useToast();
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [conversationsQuery, setConversationsQuery] = useState('');
    const [chatCategory, setChatCategory] = useState('todos'); // 'todos' | 'directos' | 'difusion'
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [chatSearchOpen, setChatSearchOpen] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const messagesEndRef = useRef(null);
    const messageContainerRef = useRef(null);
    const messagesRef = useRef(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchMessages();
        fetchUsers();
    }, [profile]);

    // Realtime subscription: listens to messages_broadcast channel
    useEffect(() => {
        if (!user?.id || !profile?.rol) return;

        console.log('📡 Conectando a canal de mensajes en tiempo real...');

        const channel = supabase
            .channel('messages_broadcast')
            .on('broadcast', { event: 'new_message' }, (event) => {
                const msg = event.payload?.message;
                if (!msg) return;

                console.log('📩 Mensaje recibido en tiempo real:', msg);

                const isRelevant =
                    msg.remitente_id === user.id ||
                    msg.destinatario_id === user.id ||
                    msg.rol_destinatario === profile.rol;

                if (isRelevant) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [msg, ...prev].sort((a, b) => {
                            const dateA = new Date(a.fecha_envio || a.created_at || 0);
                            const dateB = new Date(b.fecha_envio || b.created_at || 0);
                            return dateB - dateA;
                        });
                    });
                }
            })
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'mensajes' },
                (payload) => {
                    const msg = payload.new;
                    const isRelevant =
                        msg.remitente_id === user.id ||
                        msg.destinatario_id === user.id ||
                        msg.rol_destinatario === profile.rol;
                    if (isRelevant) {
                        fetchSingleMessage(msg.id);
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('📡 Estado del canal realtime:', status, err || '');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, profile?.rol]);

    const fetchSingleMessage = async (msgId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(getApiEndpoint(`/messages/${msgId}`), {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (response.ok) {
                const singleMsg = await response.json();
                setMessages(prev => {
                    if (prev.some(m => m.id === singleMsg.id)) return prev;
                    return [singleMsg, ...prev].sort((a, b) => {
                        const dateA = new Date(a.fecha_envio || a.created_at || 0);
                        const dateB = new Date(b.fecha_envio || b.created_at || 0);
                        return dateB - dateA;
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching single message:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(getApiEndpoint('/messages'), {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            } else {
                console.error('Error al cargar mensajes');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
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

            if (response.ok) {
                const data = await response.json();
                setAvailableUsers(data.filter(u => u.id !== user?.id));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Auto scroll when activeChatKey or activeChatMessages change
    useEffect(() => {
        scrollToBottom();
    }, [activeChatKey, messages.length]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight > 150) {
            setShowScrollBottom(true);
        } else {
            setShowScrollBottom(false);
        }
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (addToast) addToast('Mensaje copiado al portapapeles', 'success');
    };

    // Mark active conversation messages as read
    useEffect(() => {
        if (!activeChatKey || !user?.id) return;

        const markAsRead = async () => {
            try {
                const unreadInChat = messages.filter(m => {
                    if (m.leido) return false;
                    if (activeChatKey.startsWith('role_')) {
                        return m.rol_destinatario === activeChatKey.replace('role_', '') && m.remitente_id !== user.id;
                    }
                    return m.remitente_id === activeChatKey && m.destinatario_id === user.id;
                });

                if (unreadInChat.length === 0) return;

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                for (const msg of unreadInChat) {
                    await fetch(getApiEndpoint(`/messages/${msg.id}/read`), {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${session.access_token}` }
                    });
                }

                setMessages(prev => prev.map(m => {
                    const isTarget = unreadInChat.some(u => u.id === m.id);
                    return isTarget ? { ...m, leido: true } : m;
                }));
            } catch (err) {
                console.error('Error marking messages as read:', err);
            }
        };

        markAsRead();
    }, [activeChatKey, user?.id]);

    // Group messages into distinct conversations
    const getConversationsMap = () => {
        const map = new Map();

        messages.forEach(msg => {
            let key = null;
            let partnerUser = null;

            if (msg.rol_destinatario) {
                key = `role_${msg.rol_destinatario}`;
                partnerUser = {
                    id: key,
                    nombre: `Canal ${getRoleTitle(msg.rol_destinatario)}`,
                    rol: msg.rol_destinatario,
                    isRole: true
                };
            } else if (msg.remitente_id === user?.id) {
                key = msg.destinatario_id;
                partnerUser = msg.destinatario || availableUsers.find(u => u.id === key) || {
                    id: key,
                    nombre: 'Usuario',
                    rol: 'usuario'
                };
            } else {
                key = msg.remitente_id;
                partnerUser = msg.remitente || availableUsers.find(u => u.id === key) || {
                    id: key,
                    nombre: 'Usuario',
                    rol: 'usuario'
                };
            }

            if (!key) return;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    user: partnerUser,
                    messages: [],
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            const conv = map.get(key);
            conv.messages.push(msg);

            const msgDate = new Date(msg.fecha_envio || msg.created_at || 0);
            const lastDate = new Date(conv.lastMessage.fecha_envio || conv.lastMessage.created_at || 0);
            if (msgDate > lastDate) {
                conv.lastMessage = msg;
            }

            if (!msg.leido && msg.remitente_id !== user?.id) {
                conv.unreadCount += 1;
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            const dateA = new Date(a.lastMessage?.fecha_envio || a.lastMessage?.created_at || 0);
            const dateB = new Date(b.lastMessage?.fecha_envio || b.lastMessage?.created_at || 0);
            return dateB - dateA;
        });
    };

    const conversations = getConversationsMap();

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !activeChatKey) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const isRoleChat = activeChatKey.startsWith('role_');
            const payload = {
                contenido: newMessage.trim(),
                destinatario_id: isRoleChat ? null : activeChatKey,
                rol_destinatario: isRoleChat ? activeChatKey.replace('role_', '') : null
            };

            const response = await fetch(getApiEndpoint('/messages'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const createdMsg = await response.json();
                setNewMessage('');
                setMessages(prev => {
                    if (prev.some(m => m.id === createdMsg.id)) return prev;
                    return [createdMsg, ...prev].sort((a, b) => {
                        const dateA = new Date(a.fecha_envio || a.created_at || 0);
                        const dateB = new Date(b.fecha_envio || b.created_at || 0);
                        return dateB - dateA;
                    });
                });
                fetchMessages();
            } else {
                if (addToast) addToast('Error al enviar el mensaje', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            if (addToast) addToast('Fallo en la conexión', 'error');
        }
    };

    // Filter conversations by category tab & search query
    const filteredConversations = conversations.filter(c => {
        const matchesQuery = 
            c.user?.nombre.toLowerCase().includes(conversationsQuery.toLowerCase()) ||
            c.lastMessage?.contenido.toLowerCase().includes(conversationsQuery.toLowerCase());
        
        if (!matchesQuery) return false;

        if (chatCategory === 'directos') return !c.user.isRole;
        if (chatCategory === 'difusion') return c.user.isRole;
        return true;
    });

    const getNewChatOptions = () => {
        let options = [...availableUsers];
        
        if (profile?.rol === 'admin' || profile?.rol === 'preceptor') {
            const roles = [
                { id: 'role_docente', nombre: '📢 Todos los Docentes', rol: 'docente', isRole: true },
                { id: 'role_alumno', nombre: '📢 Todos los Alumnos', rol: 'alumno', isRole: true },
                { id: 'role_preceptor', nombre: '📢 Todos los Preceptores', rol: 'preceptor', isRole: true },
                { id: 'role_admin', nombre: '📢 Todos los Administradores', rol: 'admin', isRole: true },
                { id: 'role_anio_1', nombre: '🏫 Difusión: 1er Año', rol: 'anio_1', isRole: true },
                { id: 'role_anio_2', nombre: '🏫 Difusión: 2do Año', rol: 'anio_2', isRole: true },
                { id: 'role_anio_3', nombre: '🏫 Difusión: 3er Año', rol: 'anio_3', isRole: true },
                { id: 'role_anio_4', nombre: '🏫 Difusión: 4to Año', rol: 'anio_4', isRole: true },
                { id: 'role_anio_5', nombre: '🏫 Difusión: 5to Año', rol: 'anio_5', isRole: true },
                { id: 'role_anio_6', nombre: '🏫 Difusión: 6to Año', rol: 'anio_6', isRole: true }
            ];
            options = [...roles, ...options];
        }

        if (!searchQuery) return options;
        return options.filter(o => 
            o.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.rol.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const newChatOptions = getNewChatOptions();

    // Active Chat details
    const activeConv = conversations.find(c => c.key === activeChatKey);
    const activeUser = activeConv ? activeConv.user : (
        activeChatKey?.startsWith('role_')
            ? {
                id: activeChatKey,
                nombre: `Difusión a ${getRoleTitle(activeChatKey.replace('role_', ''))}`,
                rol: activeChatKey.replace('role_', ''),
                isRole: true
              }
            : availableUsers.find(u => u.id === activeChatKey)
    );

    const activeChatMessagesRaw = activeConv 
        ? [...activeConv.messages].sort((a, b) => new Date(a.fecha_envio || a.created_at) - new Date(b.fecha_envio || b.created_at))
        : [];

    const activeChatMessages = chatSearchQuery.trim()
        ? activeChatMessagesRaw.filter(m => 
            m.contenido.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
            (m.remitente?.nombre && m.remitente.nombre.toLowerCase().includes(chatSearchQuery.toLowerCase()))
          )
        : activeChatMessagesRaw;

    const formatMessageTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatChatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Hoy';
        if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
        return d.toLocaleDateString([], { day: 'numeric', month: 'long' });
    };

    const renderChecks = (msg) => {
        if (msg.remitente_id !== user?.id) return null;
        if (msg.leido) {
            return <CheckCheck size={14} className="text-tech-cyan inline ml-1" />;
        }
        return <Check size={14} className="text-tech-muted inline ml-1" />;
    };

    return (
        <div className="w-full h-full flex flex-col bg-tech-primary font-sans p-0 lg:p-4 overflow-hidden flex-1">
            <div className="w-full h-full lg:max-w-6xl lg:mx-auto bg-tech-secondary/40 lg:border lg:border-tech-surface lg:rounded-2xl overflow-hidden shadow-2xl flex-grow flex flex-col flex-1">
                
                {/* Main Split Layout */}
                <div className="flex flex-grow h-full overflow-hidden flex-1">
                    
                    {/* Left Pane: Conversation List */}
                    <div className={`w-full lg:w-[360px] border-r border-tech-surface flex-col h-full overflow-hidden ${isMobile && activeChatKey ? 'hidden' : 'flex'}`}>
                        {/* List Header */}
                        <div className="p-4 border-b border-tech-surface space-y-3 bg-tech-secondary/30 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="p-1.5 hover:bg-tech-surface rounded-xl text-tech-muted hover:text-tech-cyan transition-all flex items-center gap-1 font-bold text-xs"
                                        title="Volver al Panel Principal"
                                    >
                                        <ArrowLeft size={18} />
                                        <span className="hidden sm:inline">Panel</span>
                                    </button>
                                    <h2 className="text-lg font-black text-tech-text uppercase tracking-tight">Mensajería</h2>
                                </div>
                                <button
                                    onClick={() => setShowComposeModal(true)}
                                    className="px-3 py-1.5 bg-tech-cyan/15 hover:bg-tech-cyan/25 border border-tech-cyan/35 text-tech-cyan rounded-xl text-xs font-bold uppercase transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                                >
                                    <MessageSquare size={14} /> Nuevo Chat
                                </button>
                            </div>

                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-tech-muted" size={15} />
                                <input
                                    type="text"
                                    placeholder="Buscar chat o contenido..."
                                    value={conversationsQuery}
                                    onChange={(e) => setConversationsQuery(e.target.value)}
                                    className="w-full bg-tech-primary/80 border border-tech-surface rounded-xl pl-9 pr-4 py-2 text-xs text-tech-text focus:border-tech-cyan/50 focus:ring-1 focus:ring-tech-cyan/50 outline-none transition-all placeholder:text-tech-muted font-sans"
                                />
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex items-center gap-1 bg-tech-primary/60 p-1 rounded-xl border border-tech-surface/80 text-[10px] font-bold uppercase">
                                <button
                                    onClick={() => setChatCategory('todos')}
                                    className={`flex-1 py-1 px-2 rounded-lg transition-all text-center ${
                                        chatCategory === 'todos' ? 'bg-tech-cyan text-white shadow-sm' : 'text-tech-muted hover:text-tech-text'
                                    }`}
                                >
                                    Todos ({conversations.length})
                                </button>
                                <button
                                    onClick={() => setChatCategory('directos')}
                                    className={`flex-1 py-1 px-2 rounded-lg transition-all text-center ${
                                        chatCategory === 'directos' ? 'bg-tech-cyan text-white shadow-sm' : 'text-tech-muted hover:text-tech-text'
                                    }`}
                                >
                                    Directos
                                </button>
                                <button
                                    onClick={() => setChatCategory('difusion')}
                                    className={`flex-1 py-1 px-2 rounded-lg transition-all text-center ${
                                        chatCategory === 'difusion' ? 'bg-tech-cyan text-white shadow-sm' : 'text-tech-muted hover:text-tech-text'
                                    }`}
                                >
                                    Difusión
                                </button>
                            </div>
                        </div>

                        {/* Chats scroll area */}
                        <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1 bg-tech-primary/10">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={`loader-chat-${i}`} className="flex gap-3 items-center">
                                            <div className="w-10 h-10 bg-tech-surface rounded-xl animate-pulse" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-tech-surface rounded w-2/3 animate-pulse" />
                                                <div className="h-2.5 bg-tech-surface rounded w-1/2 animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-tech-muted space-y-2">
                                    <Inbox size={32} className="mx-auto opacity-50 text-tech-cyan" />
                                    <p className="text-xs uppercase font-mono tracking-wider font-bold">Sin conversaciones activas</p>
                                    <p className="text-[10px] text-tech-muted">Presiona 'Nuevo Chat' para iniciar un diálogo</p>
                                </div>
                            ) : (
                                filteredConversations.map((conv, idx) => {
                                    const isActive = conv.key === activeChatKey;
                                    const isSent = conv.lastMessage?.remitente_id === user?.id;
                                    return (
                                        <button
                                            key={`chat-conv-${conv.key || `idx-${idx}`}-${idx}`}
                                            onClick={() => setActiveChatKey(conv.key)}
                                            className={`w-full text-left flex gap-3 p-3 rounded-xl transition-all border ${
                                                isActive 
                                                    ? 'bg-tech-cyan/15 border-tech-cyan/30 shadow-sm' 
                                                    : 'hover:bg-tech-surface/40 border-transparent'
                                            }`}
                                        >
                                            {/* Avatar */}
                                            <div className="relative shrink-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase ${
                                                    conv.user.isRole 
                                                        ? 'bg-tech-accent/20 text-tech-accent border border-tech-accent/30' 
                                                        : 'bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/35'
                                                }`}>
                                                    {conv.user.isRole ? <Megaphone size={16} /> : conv.user.nombre?.[0]}
                                                </div>
                                                {conv.unreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-tech-cyan text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-tech-secondary animate-pulse shadow-sm">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="font-bold text-xs text-tech-text truncate uppercase tracking-tight">
                                                        {conv.user.nombre}
                                                    </h4>
                                                    <span className="text-[9px] text-tech-muted shrink-0 font-mono">
                                                        {formatMessageTime(conv.lastMessage?.fecha_envio || conv.lastMessage?.created_at)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <p className="text-xs text-tech-muted truncate flex-grow">
                                                        {isSent && <span className="text-[10px] uppercase font-bold text-tech-cyan mr-1 font-mono">Tú:</span>}
                                                        {conv.lastMessage?.contenido}
                                                    </p>
                                                    {conv.user.isRole && (
                                                        <span className="text-[8px] uppercase font-black tracking-widest bg-tech-accent/10 text-tech-accent px-1.5 py-0.5 rounded border border-tech-accent/20">
                                                            Canal
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Pane: Conversation Window */}
                    <div className={`flex-grow flex-col bg-tech-primary/10 overflow-hidden h-full ${isMobile && !activeChatKey ? 'hidden' : 'flex'}`}>
                        {activeUser ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                {/* Conversation Header */}
                                <div className="p-3 border-b border-tech-surface bg-tech-secondary/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {/* Prominent Back Button on Mobile and Desktop */}
                                        <button
                                            onClick={() => setActiveChatKey(null)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-tech-surface hover:bg-tech-cyan/20 border border-tech-surface hover:border-tech-cyan/30 text-tech-text hover:text-tech-cyan rounded-xl text-xs font-bold transition-all active:scale-95"
                                            title="Volver a la lista de mensajes"
                                        >
                                            <ArrowLeft size={16} />
                                            <span className="font-mono text-[10px] uppercase tracking-wider">Atrás</span>
                                        </button>

                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                                            activeUser.isRole 
                                                ? 'bg-tech-accent/20 text-tech-accent border border-tech-accent/30' 
                                                : 'bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/35'
                                        }`}>
                                            {activeUser.isRole ? <Megaphone size={16} /> : activeUser.nombre?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xs sm:text-sm text-tech-text uppercase tracking-tight leading-tight">{activeUser.nombre}</h3>
                                            <span className="text-[8px] uppercase font-black tracking-widest text-tech-cyan bg-tech-cyan/10 px-1.5 py-0.5 rounded border border-tech-cyan/20">
                                                {activeUser.isRole ? 'Difusión General' : activeUser.rol}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setChatSearchOpen(!chatSearchOpen)}
                                            className={`p-2 rounded-xl transition-all ${
                                                chatSearchOpen ? 'bg-tech-cyan text-white' : 'hover:bg-tech-surface text-tech-muted hover:text-tech-text'
                                            }`}
                                            title="Buscar en la conversación"
                                        >
                                            <Search size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* In-Chat Search Bar */}
                                {chatSearchOpen && (
                                    <div className="p-2 border-b border-tech-surface bg-tech-secondary/90 flex items-center gap-2 animate-in fade-in duration-200">
                                        <Search size={14} className="text-tech-cyan ml-2" />
                                        <input
                                            type="text"
                                            placeholder="Buscar mensaje en el chat activo..."
                                            value={chatSearchQuery}
                                            onChange={(e) => setChatSearchQuery(e.target.value)}
                                            className="flex-grow bg-transparent text-xs text-tech-text outline-none placeholder:text-tech-muted"
                                            autoFocus
                                        />
                                        {chatSearchQuery && (
                                            <button onClick={() => setChatSearchQuery('')} className="p-1 text-tech-muted hover:text-tech-text">
                                                <CloseIcon size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Message List Container - Full Vertical Expansion */}
                                <div 
                                    ref={messageContainerRef}
                                    onScroll={handleScroll}
                                    className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-tech-primary/5 relative"
                                >
                                    {activeChatMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                                            <div className="w-14 h-14 bg-tech-surface rounded-2xl flex items-center justify-center text-tech-cyan">
                                                <MessageSquare size={24} />
                                            </div>
                                            <h4 className="font-bold text-tech-text uppercase text-sm tracking-wide">Comienzo de la Conversación</h4>
                                            <p className="text-xs text-tech-muted max-w-xs leading-relaxed">
                                                {chatSearchQuery ? 'No se encontraron mensajes con la búsqueda actual' : `Envía un mensaje para iniciar el diálogo con ${activeUser.nombre}.`}
                                            </p>
                                        </div>
                                    ) : (
                                        (() => {
                                            let lastDateLabel = '';
                                            return activeChatMessages.map((msg, i) => {
                                                const isSentByMe = msg.remitente_id === user?.id;
                                                const messageDate = msg.fecha_envio || msg.created_at;
                                                const dateLabel = formatChatDate(messageDate);
                                                const showDateDivider = dateLabel !== lastDateLabel;
                                                lastDateLabel = dateLabel;

                                                return (
                                                    <div key={`msg-item-${msg.id || i}`} className="space-y-3">
                                                        {showDateDivider && (
                                                            <div className="flex justify-center my-3">
                                                                <span className="bg-tech-surface/60 border border-tech-surface px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-tech-muted shadow-sm">
                                                                    {dateLabel}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} group relative`}>
                                                            <div className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-2.5 border relative shadow-md transition-all ${
                                                                isSentByMe 
                                                                    ? 'bg-tech-cyan/15 border-tech-cyan/25 rounded-tr-none text-tech-text' 
                                                                    : 'bg-tech-secondary/70 border-tech-surface/60 rounded-tl-none text-tech-text'
                                                            }`}>
                                                                {!isSentByMe && activeUser.isRole && (
                                                                    <p className="text-[9px] font-bold text-tech-cyan uppercase tracking-tighter mb-1 font-mono">
                                                                        {msg.remitente?.nombre} ({msg.remitente?.rol})
                                                                    </p>
                                                                )}
                                                                <p className="text-xs leading-relaxed break-words whitespace-pre-wrap pb-3 pr-6">{msg.contenido}</p>
                                                                
                                                                {/* Time & Checks */}
                                                                <div className="absolute bottom-1 right-2.5 flex items-center gap-1">
                                                                    <span className="text-[8px] text-tech-muted font-mono">
                                                                        {formatMessageTime(messageDate)}
                                                                    </span>
                                                                    {isSentByMe && renderChecks(msg)}
                                                                </div>

                                                                {/* Copy Message Action Button */}
                                                                <button
                                                                    onClick={() => copyToClipboard(msg.contenido)}
                                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-tech-surface/80 text-tech-muted hover:text-tech-cyan rounded-md transition-all"
                                                                    title="Copiar texto"
                                                                >
                                                                    <Copy size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Floating Scroll To Bottom Button */}
                                {showScrollBottom && (
                                    <button
                                        onClick={scrollToBottom}
                                        className="absolute bottom-16 right-6 z-20 p-2.5 bg-tech-cyan text-white rounded-full shadow-xl hover:bg-tech-cyan/90 transition-all animate-bounce"
                                        title="Bajar al final"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                )}

                                {/* Message Input Box - Fixed at bottom */}
                                <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-tech-surface bg-tech-secondary/80 backdrop-blur-md shrink-0">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage(e);
                                            }
                                        }}
                                        placeholder={activeUser.isRole && profile?.rol !== 'admin' && profile?.rol !== 'preceptor' 
                                            ? 'No tienes permisos para escribir en este canal' 
                                            : 'Escribe un mensaje...'
                                        }
                                        disabled={activeUser.isRole && profile?.rol !== 'admin' && profile?.rol !== 'preceptor'}
                                        className="flex-grow bg-tech-primary border border-tech-surface rounded-xl px-4 py-2.5 text-xs sm:text-sm text-tech-text focus:border-tech-cyan/50 focus:ring-1 focus:ring-tech-cyan/50 outline-none transition-all placeholder:text-tech-muted disabled:opacity-50 font-sans"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || (activeUser.isRole && profile?.rol !== 'admin' && profile?.rol !== 'preceptor')}
                                        className="w-10 h-10 shrink-0 bg-tech-cyan hover:bg-tech-cyan/85 border border-tech-cyan/30 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-tech-cyan/15"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        ) : (
                            /* Empty State Chat Placeholder */
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
                                <div className="p-4 bg-tech-cyan/10 border border-tech-cyan/20 rounded-full animate-pulse">
                                    <MessageSquare className="text-tech-cyan" size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-tech-text uppercase tracking-tighter">MENSAJERÍA INSTITUCIONAL</h3>
                                <p className="text-sm text-tech-muted max-w-sm leading-relaxed">
                                    Selecciona una conversación de la izquierda o inicia una nueva con profesores, preceptores, alumnos o administradores.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Compose New Chat Modal */}
                <AnimatePresence>
                    {showComposeModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4 bg-black/75 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                                className="bg-tech-secondary border border-tech-surface w-full h-full lg:h-auto lg:max-h-[500px] lg:max-w-md lg:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                            >
                                <div className="p-4 border-b border-tech-surface flex justify-between items-center bg-tech-primary/30 shrink-0">
                                    <h3 className="font-bold text-sm text-tech-text uppercase tracking-wider flex items-center gap-2">
                                        <Users size={16} className="text-tech-cyan" />
                                        Nueva conversación
                                    </h3>
                                    <button 
                                        onClick={() => {
                                            setShowComposeModal(false);
                                            setSearchQuery('');
                                        }}
                                        className="p-2 hover:bg-tech-surface rounded-xl text-tech-muted hover:text-tech-text"
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>

                                <div className="p-4 border-b border-tech-surface bg-tech-primary/10 shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 text-tech-muted" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar usuario o grupo por nombre..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-tech-primary border border-tech-surface rounded-xl pl-9 pr-4 py-2 text-xs text-tech-text focus:border-tech-cyan/50 focus:ring-1 focus:ring-tech-cyan/50 outline-none transition-all placeholder:text-tech-muted"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {newChatOptions.length === 0 ? (
                                        <div className="p-6 text-center text-tech-muted text-xs uppercase font-mono">
                                            No se encontraron usuarios
                                        </div>
                                    ) : (
                                        newChatOptions.map(u => (
                                            <button
                                                key={`new-chat-user-${u.id}`}
                                                onClick={() => {
                                                    setActiveChatKey(u.id);
                                                    setShowComposeModal(false);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full text-left flex items-center gap-3 p-3 hover:bg-tech-surface/50 rounded-xl transition-all border border-transparent hover:border-tech-surface group"
                                            >
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                                                    u.isRole 
                                                        ? 'bg-tech-accent/20 text-tech-accent border border-tech-accent/30' 
                                                        : 'bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/35'
                                                }`}>
                                                    {u.isRole ? <Megaphone size={14} /> : u.nombre?.[0]}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h4 className="font-bold text-xs text-tech-text group-hover:text-tech-cyan transition-colors truncate uppercase">
                                                        {u.nombre}
                                                    </h4>
                                                    <p className="text-[10px] text-tech-muted uppercase font-mono">
                                                        {u.isRole ? 'Canal Institucional' : u.rol}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Messages;
