import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Send, User, Users, Search, Inbox, MessageSquare, 
    ShieldCheck, ArrowLeft, X as CloseIcon, MoreVertical, 
    Check, CheckCheck, Megaphone, Bell
} from 'lucide-react';
import { getApiEndpoint } from '../utils/api';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showComposeModal, setShowComposeModal] = useState(false);

    const messagesEndRef = useRef(null);
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
    // The server explicitly broadcasts each new message after INSERT
    // This is reliable regardless of RLS or service-role key complications
    useEffect(() => {
        if (!user?.id || !profile?.rol) return;

        console.log('🔌 Conectando a canal de mensajes en tiempo real...');

        const channel = supabase
            .channel('messages_broadcast')
            // Broadcast: server sends new messages explicitly after insert
            .on('broadcast', { event: 'new_message' }, (event) => {
                const msg = event.payload?.message;
                if (!msg) return;

                console.log('📨 Mensaje recibido en tiempo real:', msg);

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
            // postgres_changes as fallback (works if REPLICA IDENTITY FULL is set)
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
        // Avoid duplicate fetch
        if (messagesRef.current.some(m => m.id === msgId)) return;

        try {
            const { data, error } = await supabase
                .from('mensajes')
                .select(`
                    *,
                    remitente:perfiles!remitente_id(id, nombre, rol, email),
                    destinatario:perfiles!destinatario_id(id, nombre, rol, email)
                `)
                .eq('id', msgId)
                .single();

            if (data && !error) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msgId)) return prev;
                    return [data, ...prev].sort((a, b) => {
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


    // Group messages into conversations
    const getConversations = () => {
        const conversationsMap = {};

        if (!Array.isArray(messages)) return [];

        messages.forEach(m => {
            let key = '';
            let chatUser = null;
            let isRole = false;

            if (m.tipo === 'rol' || m.rol_destinatario) {
                isRole = true;
                key = `role_${m.rol_destinatario}`;
                let groupLabel = 'Grupo';
                if (m.rol_destinatario === 'admin') groupLabel = 'Administradores';
                else if (m.rol_destinatario === 'preceptor') groupLabel = 'Preceptores';
                else if (m.rol_destinatario === 'docente') groupLabel = 'Docentes';
                else if (m.rol_destinatario === 'alumno') groupLabel = 'Alumnos';
                else if (m.rol_destinatario?.startsWith('anio_')) groupLabel = `${m.rol_destinatario.replace('anio_', '')}° Año`;

                chatUser = {
                    id: key,
                    nombre: `Difusión a ${groupLabel}`,
                    rol: m.rol_destinatario,
                    isRole: true
                };
            } else {
                const isSent = m.remitente_id === user?.id;
                chatUser = isSent ? m.destinatario : m.remitente;
                if (!chatUser) return;
                key = chatUser.id;
            }

            if (!conversationsMap[key]) {
                conversationsMap[key] = {
                    key,
                    user: chatUser,
                    messages: [],
                    lastMessage: m,
                    unreadCount: 0
                };
            }

            conversationsMap[key].messages.push(m);

            const currentLastDate = new Date(conversationsMap[key].lastMessage.fecha_envio || conversationsMap[key].lastMessage.created_at || 0);
            const mDate = new Date(m.fecha_envio || m.created_at || 0);
            if (mDate > currentLastDate) {
                conversationsMap[key].lastMessage = m;
            }

            // Unread count (only for private received messages)
            if (!m.leido && !isRole && m.destinatario_id === user?.id) {
                conversationsMap[key].unreadCount++;
            }
        });

        // Sort by last message date desc
        return Object.values(conversationsMap).sort((a, b) => {
            const dateA = new Date(a.lastMessage.fecha_envio || a.lastMessage.created_at || 0);
            const dateB = new Date(b.lastMessage.fecha_envio || b.lastMessage.created_at || 0);
            return dateB - dateA;
        });
    };

    const conversations = getConversations();

    // Mark messages as read when active chat changes
    useEffect(() => {
        if (activeChatKey) {
            const activeConv = conversations.find(c => c.key === activeChatKey);
            if (activeConv && activeConv.unreadCount > 0) {
                const unreadIds = activeConv.messages
                    .filter(m => !m.leido && m.destinatario_id === user?.id)
                    .map(m => m.id);
                if (unreadIds.length > 0) {
                    markAllAsRead(unreadIds);
                }
            }
        }
    }, [activeChatKey, messages]);

    // Scroll to bottom on message updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChatKey, messages]);

    const fetchMessages = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(getApiEndpoint('/messages'), {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await response.json();

            if (Array.isArray(data)) {
                // Deduplicate by ID
                const uniqueData = [];
                const seen = new Set();
                data.forEach(m => {
                    if (!seen.has(m.id)) {
                        seen.add(m.id);
                        uniqueData.push(m);
                    }
                });
                setMessages(uniqueData);
            } else {
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

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activeChatKey) return;

        const activeConv = conversations.find(c => c.key === activeChatKey) || {
            user: activeChatKey.startsWith('role_')
                ? { isRole: true, rol: activeChatKey.replace('role_', '') }
                : availableUsers.find(u => u.id === activeChatKey)
        };

        const isBroadcast = activeConv.user?.isRole;
        const payload = isBroadcast ? {
            rol_destinatario: activeConv.user.rol,
            cuerpo: newMessage,
            tipo: 'rol'
        } : {
            destinatario_id: activeConv.user.id,
            cuerpo: newMessage,
            tipo: 'privado'
        };

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

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
                
                // Pre-populate sender profile info
                createdMsg.remitente = {
                    id: user.id,
                    nombre: profile.nombre,
                    rol: profile.rol,
                    email: user.email
                };
                
                // Pre-populate receiver profile info if private
                if (!isBroadcast && activeConv.user) {
                    createdMsg.destinatario = {
                        id: activeConv.user.id,
                        nombre: activeConv.user.nombre,
                        rol: activeConv.user.rol,
                        email: activeConv.user.email
                    };
                }
                
                setNewMessage('');
                
                // Add to messages state immediately to show it in the chat box at once
                setMessages(prev => {
                    if (prev.some(m => m.id === createdMsg.id)) return prev;
                    return [createdMsg, ...prev].sort((a, b) => {
                        const dateA = new Date(a.fecha_envio || a.created_at || 0);
                        const dateB = new Date(b.fecha_envio || b.created_at || 0);
                        return dateB - dateA;
                    });
                });

                // Fetch in background for eventual consistency
                fetchMessages();
            } else {
                addToast('Error al enviar el mensaje', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addToast('Fallo en la conexión', 'error');
        }
    };

    // Filter active chats by search
    const filteredConversations = conversations.filter(c => 
        c.user?.nombre.toLowerCase().includes(conversationsQuery.toLowerCase()) ||
        c.lastMessage?.cuerpo.toLowerCase().includes(conversationsQuery.toLowerCase())
    );

    // Get list of targets for starting new conversation (including roles and course years for admin/preceptors)
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

    const getRoleTitle = (r) => {
        if (!r) return '';
        if (r === 'admin') return 'ADMINISTRADORES';
        if (r === 'preceptor') return 'PRECEPTORES';
        if (r === 'docente') return 'DOCENTES';
        if (r === 'alumno') return 'ALUMNOS';
        if (r.startsWith('anio_')) return `${r.replace('anio_', '')}° AÑO`;
        return r.toUpperCase();
    };

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

    const activeChatMessages = activeConv 
        ? [...activeConv.messages].sort((a, b) => new Date(a.fecha_envio || a.created_at) - new Date(b.fecha_envio || b.created_at))
        : [];

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
        <div className="w-full h-full flex flex-col bg-tech-primary font-sans p-0 lg:p-4 justify-center">
            <div className="w-full h-full lg:max-w-6xl lg:mx-auto bg-tech-secondary/40 lg:border lg:border-tech-surface lg:rounded-2xl overflow-hidden shadow-2xl flex-grow flex flex-col lg:h-[calc(100vh-120px)] lg:max-h-[780px]">
                
                {/* Main Split Layout */}
                <div className="flex flex-grow h-full overflow-hidden">
                    
                    {/* Left Pane: Conversation List */}
                    <div className={`w-full lg:w-[350px] border-r border-tech-surface flex-col ${isMobile && activeChatKey ? 'hidden' : 'flex'}`}>
                        {/* List Header */}
                        <div className="p-4 border-b border-tech-surface space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="p-1.5 hover:bg-tech-surface rounded-lg text-tech-muted hover:text-tech-cyan transition-all"
                                        title="Volver"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <h2 className="text-xl font-black text-tech-text uppercase tracking-tight">Chats</h2>
                                </div>
                                <button
                                    onClick={() => setShowComposeModal(true)}
                                    className="px-3 py-1.5 bg-tech-cyan/15 hover:bg-tech-cyan/20 border border-tech-cyan/35 text-tech-cyan rounded-xl text-xs font-bold uppercase transition-all active:scale-95"
                                >
                                    Nuevo Chat
                                </button>
                            </div>

                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-tech-muted" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar chat o mensaje..."
                                    value={conversationsQuery}
                                    onChange={(e) => setConversationsQuery(e.target.value)}
                                    className="w-full bg-tech-primary/60 border border-tech-surface rounded-xl pl-9 pr-4 py-2 text-sm text-tech-text focus:border-tech-cyan/50 focus:ring-1 focus:ring-tech-cyan/50 outline-none transition-all placeholder:text-tech-muted"
                                />
                            </div>
                        </div>

                        {/* Chats scroll area */}
                        <div className="flex-grow overflow-y-auto custom-scrollbar divide-y divide-tech-surface/40 p-2 space-y-1">
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
                                    <Inbox size={32} className="mx-auto opacity-50" />
                                    <p className="text-xs uppercase font-mono tracking-wider">Sin conversaciones activas</p>
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
                                                    ? 'bg-tech-cyan/10 border-tech-cyan/20' 
                                                    : 'hover:bg-tech-primary/30 border-transparent'
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
                                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-tech-cyan text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-tech-secondary animate-pulse">
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
                                                        {conv.lastMessage?.cuerpo}
                                                    </p>
                                                    {conv.user.isRole && (
                                                        <span className="text-[8px] uppercase font-black tracking-widest bg-tech-accent/10 text-tech-accent px-1.5 py-0.5 rounded border border-tech-accent/20">
                                                            Rol
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
                    <div className={`flex-grow flex-col bg-tech-primary/10 overflow-hidden ${isMobile && !activeChatKey ? 'hidden' : 'flex'}`}>
                        {activeUser ? (
                            <>
                                {/* Conversation Header */}
                                <div className="p-3 border-b border-tech-surface bg-tech-secondary/30 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        {isMobile && (
                                            <button
                                                onClick={() => setActiveChatKey(null)}
                                                className="p-1.5 hover:bg-tech-surface rounded-lg text-tech-muted hover:text-tech-cyan mr-1"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                        )}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase ${
                                            activeUser.isRole 
                                                ? 'bg-tech-accent/20 text-tech-accent border border-tech-accent/30' 
                                                : 'bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/35'
                                        }`}>
                                            {activeUser.isRole ? <Megaphone size={16} /> : activeUser.nombre?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-tech-text uppercase tracking-tight leading-tight">{activeUser.nombre}</h3>
                                            <span className="text-[9px] uppercase font-black tracking-widest text-tech-muted bg-tech-primary px-1.5 py-0.5 rounded border border-tech-surface">
                                                {activeUser.isRole ? 'Difusión General' : activeUser.rol}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="p-1.5 hover:bg-tech-surface rounded-lg text-tech-muted">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>

                                {/* Message List */}
                                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-tech-primary/5">
                                    {activeChatMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                                            <div className="w-14 h-14 bg-tech-surface rounded-2xl flex items-center justify-center text-tech-cyan">
                                                <MessageSquare size={24} />
                                            </div>
                                            <h4 className="font-bold text-tech-text uppercase text-sm tracking-wide">Comienzo de la Conversación</h4>
                                            <p className="text-xs text-tech-muted max-w-xs leading-relaxed">
                                                Envía un mensaje privado para iniciar el diálogo directo con {activeUser.nombre}.
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
                                                                <span className="bg-tech-surface/50 border border-tech-surface px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-tech-muted">
                                                                    {dateLabel}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-2 border relative shadow-md ${
                                                                isSentByMe 
                                                                    ? 'bg-tech-cyan/15 border-tech-cyan/25 rounded-tr-none text-tech-text' 
                                                                    : 'bg-tech-secondary/60 border-tech-surface/40 rounded-tl-none text-tech-text'
                                                            }`}>
                                                                {!isSentByMe && activeUser.isRole && (
                                                                    <p className="text-[9px] font-bold text-tech-cyan uppercase tracking-tighter mb-1 font-mono">
                                                                        {msg.remitente?.nombre} ({msg.remitente?.rol})
                                                                    </p>
                                                                )}
                                                                <p className="text-xs leading-relaxed break-words whitespace-pre-wrap pb-2 pr-8">{msg.cuerpo}</p>
                                                                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                                                    <span className="text-[8px] text-tech-muted font-mono">
                                                                        {formatMessageTime(messageDate)}
                                                                    </span>
                                                                    {isSentByMe && renderChecks(msg)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-tech-surface bg-tech-secondary/20 shrink-0">
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
                                        className="flex-grow bg-tech-primary border border-tech-surface rounded-xl px-4 py-2.5 text-sm text-tech-text focus:border-tech-cyan/50 focus:ring-1 focus:ring-tech-cyan/50 outline-none transition-all placeholder:text-tech-muted disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || (activeUser.isRole && profile?.rol !== 'admin' && profile?.rol !== 'preceptor')}
                                        className="w-10 h-10 shrink-0 bg-tech-cyan hover:bg-tech-cyan/85 border border-tech-cyan/30 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-tech-cyan/15"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* Empty State Chat Placeholder */
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
                                <div className="p-4 bg-tech-cyan/10 border border-tech-cyan/20 rounded-full animate-pulse">
                                    <MessageSquare className="text-tech-cyan" size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-tech-text uppercase tracking-tighter">MENSAJERÍA BELGRANO</h3>
                                <p className="text-sm text-tech-muted max-w-sm leading-relaxed">
                                    Selecciona una conversación del panel de la izquierda o inicia una nueva con profesores, preceptores, alumnos o administradores.
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
                                            placeholder="Buscar usuario o grupo..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-tech-primary border border-tech-surface rounded-xl pl-9 pr-4 py-2 text-sm text-tech-text focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan/50 outline-none transition-all placeholder:text-tech-muted"
                                        />
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {newChatOptions.length === 0 ? (
                                        <p className="p-6 text-center text-xs text-tech-muted uppercase font-mono tracking-wider">No se encontraron usuarios</p>
                                    ) : (
                                        newChatOptions.map((opt, optIdx) => (
                                            <button
                                                key={`new-chat-opt-${opt.id || `idx-${optIdx}`}-${optIdx}`}
                                                onClick={() => {
                                                    setActiveChatKey(opt.id);
                                                    setShowComposeModal(false);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-tech-primary/50 rounded-xl transition-all border border-transparent hover:border-tech-surface/40"
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                                                    opt.isRole 
                                                        ? 'bg-tech-accent/20 text-tech-accent border border-tech-accent/30' 
                                                        : 'bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/35'
                                                }`}>
                                                    {opt.isRole ? <Megaphone size={14} /> : opt.nombre?.[0]}
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <p className="text-xs font-bold text-tech-text truncate">{opt.nombre}</p>
                                                    <p className="text-[9px] text-tech-muted uppercase font-bold tracking-wider font-mono">
                                                        {opt.isRole ? 'Canal de Difusión' : opt.rol}
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
