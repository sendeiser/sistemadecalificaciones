import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Send, User, Users, Search, Inbox, MessageSquare, 
    ShieldCheck, ArrowLeft, X as CloseIcon, MoreVertical, 
    Check, CheckCheck, Megaphone, Bell, Paperclip, Smile,
    Pin, Image as ImageIcon, FileText, ChevronLeft, Sparkles, Filter
} from 'lucide-react';
import { getApiEndpoint } from '../utils/api';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

const QUICK_EMOJIS = ['👍', '❤️', '👏', '🔥', '🎉', '💡', '📌', '😊', '✅', '🙏', '🙌', '⭐'];

function getRoleTitle(r) {
    if (!r) return '';
    if (r === 'admin') return 'ADMINISTRADORES';
    if (r === 'preceptor') return 'PRECEPTORES';
    if (r === 'docente') return 'DOCENTES';
    if (r === 'alumno') return 'ALUMNOS';
    if (r.startsWith('anio_')) return `${r.replace('anio_', '')}° AÑO`;
    return r.toUpperCase();
}

function formatMessageTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatChatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString([], { day: 'numeric', month: 'long' });
}

const Messages = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const addToast = useToast();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [activeChatKey, setActiveChatKey] = useState(null); // ID del usuario o 'role_X'
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [conversationsQuery, setConversationsQuery] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showComposeModal, setShowComposeModal] = useState(false);

    // Funcionalidades avanzadas de mensajería
    const [showChatSearch, setShowChatSearch] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [attachment, setAttachment] = useState(null); // { file, previewUrl, name, type }
    const [pinnedChats, setPinnedChats] = useState([]); // Array de keys fijados
    const fileInputRef = useRef(null);

    const messagesEndRef = useRef(null);
    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Helpers Async Fetch
    async function fetchSingleMessage(msgId) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(getApiEndpoint(`/messages/${msgId}`), {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [msg, ...prev].sort((a, b) => {
                        const dateA = new Date(a.fecha_envio || a.created_at || 0);
                        const dateB = new Date(b.fecha_envio || b.created_at || 0);
                        return dateB - dateA;
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching single message:', error);
        }
    }

    async function fetchMessages() {
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
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            addToast('Error al cargar mensajes', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function fetchUsers() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(getApiEndpoint('/messages/users'), {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setAvailableUsers(data);
            }
        } catch (error) {
            console.error('Error fetching available users:', error);
        }
    }

    async function markAsRead(ids) {
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
    }

    // Listener de tamaño de ventana
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Carga de datos inicial
    useEffect(() => {
        if (profile) {
            fetchMessages();
            fetchUsers();
        }
    }, [profile]);

    // Tiempo Real
    useEffect(() => {
        if (!user?.id || !profile?.rol) return;

        const channel = supabase
            .channel('messages_broadcast')
            .on('broadcast', { event: 'new_message' }, (event) => {
                const msg = event.payload?.message;
                if (!msg) return;

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
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, profile]);

    // Scroll automático al final del chat
    useEffect(() => {
        if (activeChatKey) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [activeChatKey, messages]);

    // Agrupar mensajes en conversaciones
    const conversations = useMemo(() => {
        const convMap = new Map();

        messages.forEach(msg => {
            let key = null;
            let otherUser = null;

            if (msg.tipo === 'rol') {
                key = `role_${msg.rol_destinatario}`;
                otherUser = {
                    id: key,
                    nombre: `Canal ${getRoleTitle(msg.rol_destinatario)}`,
                    rol: msg.rol_destinatario,
                    isRole: true
                };
            } else {
                const isSentByMe = msg.remitente_id === user?.id;
                otherUser = isSentByMe ? msg.destinatario : msg.remitente;

                if (!otherUser && isSentByMe && msg.destinatario_id) {
                    otherUser = availableUsers.find(u => u.id === msg.destinatario_id) || {
                        id: msg.destinatario_id,
                        nombre: 'Usuario',
                        rol: 'usuario'
                    };
                }

                if (otherUser && otherUser.id !== user?.id) {
                    key = otherUser.id;
                }
            }

            if (key && otherUser) {
                if (!convMap.has(key)) {
                    convMap.set(key, {
                        key,
                        user: otherUser,
                        lastMessage: msg,
                        messages: [msg],
                        unreadCount: (!msg.leido && msg.remitente_id !== user?.id) ? 1 : 0
                    });
                } else {
                    const conv = convMap.get(key);
                    conv.messages.push(msg);
                    if (!msg.leido && msg.remitente_id !== user?.id) {
                        conv.unreadCount += 1;
                    }
                }
            }
        });

        const list = Array.from(convMap.values());
        return list.sort((a, b) => {
            const aPinned = pinnedChats.includes(a.key);
            const bPinned = pinnedChats.includes(b.key);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;

            const dateA = new Date(a.lastMessage?.fecha_envio || a.lastMessage?.created_at || 0);
            const dateB = new Date(b.lastMessage?.fecha_envio || b.lastMessage?.created_at || 0);
            return dateB - dateA;
        });
    }, [messages, user, availableUsers, pinnedChats]);

    // Marcar leídos
    useEffect(() => {
        if (!activeChatKey) return;

        const activeConv = conversations.find(c => c.key === activeChatKey);
        if (activeConv && activeConv.unreadCount > 0) {
            const unreadIds = activeConv.messages
                .filter(m => !m.leido && m.remitente_id !== user?.id)
                .map(m => m.id);

            if (unreadIds.length > 0) {
                markAsRead(unreadIds);
            }
        }
    }, [activeChatKey, conversations, user]);

    function togglePinChat(e, key) {
        e.stopPropagation();
        setPinnedChats(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            addToast('El archivo supera los 5MB', 'error');
            return;
        }

        const isImage = file.type.startsWith('image/');
        const reader = new FileReader();
        reader.onload = () => {
            setAttachment({
                file,
                name: file.name,
                type: isImage ? 'image' : 'file',
                previewUrl: reader.result
            });
        };
        reader.readAsDataURL(file);
    }

    async function sendMessage(e) {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !activeChatKey) return;

        const activeConv = conversations.find(c => c.key === activeChatKey) || {
            user: activeChatKey.startsWith('role_')
                ? { isRole: true, rol: activeChatKey.replace('role_', '') }
                : availableUsers.find(u => u.id === activeChatKey)
        };

        let messageText = newMessage.trim();
        if (attachment) {
            if (attachment.type === 'image') {
                messageText = `${messageText}\n[img:${attachment.previewUrl}]`.trim();
            } else {
                messageText = `${messageText}\n[file:${attachment.name}]`.trim();
            }
        }

        const isBroadcast = activeConv.user?.isRole;
        const payload = isBroadcast ? {
            rol_destinatario: activeConv.user.rol,
            contenido: messageText,
            tipo: 'rol'
        } : {
            destinatario_id: activeConv.user.id,
            contenido: messageText,
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
                
                createdMsg.remitente = {
                    id: user.id,
                    nombre: profile.nombre,
                    rol: profile.rol,
                    email: user.email
                };
                
                if (!isBroadcast && activeConv.user) {
                    createdMsg.destinatario = {
                        id: activeConv.user.id,
                        nombre: activeConv.user.nombre,
                        rol: activeConv.user.rol,
                        email: activeConv.user.email
                    };
                }
                
                setNewMessage('');
                setAttachment(null);
                setShowEmojiPicker(false);
                
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
                addToast('Error al enviar el mensaje', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addToast('Fallo en la conexión', 'error');
        }
    }

    const filteredConversations = conversations.filter(c => 
        c.user?.nombre.toLowerCase().includes(conversationsQuery.toLowerCase()) ||
        c.lastMessage?.contenido.toLowerCase().includes(conversationsQuery.toLowerCase())
    );

    function getNewChatOptions() {
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
    }

    const newChatOptions = getNewChatOptions();

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
        ? activeChatMessagesRaw.filter(m => m.contenido.toLowerCase().includes(chatSearchQuery.toLowerCase()))
        : activeChatMessagesRaw;

    function renderChecks(msg) {
        if (msg.remitente_id !== user?.id) return null;
        if (msg.leido) {
            return <CheckCheck size={14} className="text-tech-cyan inline ml-1" />;
        }
        return <Check size={14} className="text-tech-muted inline ml-1" />;
    }

    function renderMessageContent(content) {
        if (!content) return null;

        const imgMatch = content.match(/\[img:(.*?)\]/);
        const fileMatch = content.match(/\[file:(.*?)\]/);
        const textWithoutTags = content.replace(/\[img:.*?\]/g, '').replace(/\[file:.*?\]/g, '').trim();

        return (
            <div className="space-y-2 max-w-full overflow-hidden">
                {textWithoutTags && (
                    <p className="text-xs md:text-sm leading-relaxed break-words whitespace-pre-wrap">{textWithoutTags}</p>
                )}
                {imgMatch && (
                    <div className="mt-1 rounded-xl overflow-hidden border border-tech-surface max-w-full">
                        <img src={imgMatch[1]} alt="Adjunto" className="max-h-72 w-auto object-cover rounded-xl" />
                    </div>
                )}
                {fileMatch && (
                    <div className="mt-1 flex items-center gap-2 p-2 bg-tech-primary/60 border border-tech-surface rounded-xl text-xs font-mono max-w-full">
                        <FileText size={16} className="text-tech-cyan shrink-0" />
                        <span className="truncate">{fileMatch[1]}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-0 flex-1 flex flex-col bg-tech-primary font-sans p-0 overflow-hidden">
            <div className="w-full h-full min-h-0 flex-1 bg-tech-secondary/40 border-none rounded-none overflow-hidden flex flex-col">
                
                {/* Layout Principal Flexible (100% Pantalla Completa) */}
                <div className="flex flex-1 min-h-0 h-0 w-full overflow-hidden">
                    
                    {/* Panel Izquierdo: Lista de Chats */}
                    <div className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 border-r border-tech-surface flex flex-col h-full min-h-0 bg-tech-secondary/30 ${isMobile && activeChatKey ? 'hidden' : 'flex'}`}>
                        {/* Cabecera del Panel de Chats */}
                        <div className="p-3.5 border-b border-tech-surface space-y-3 bg-tech-secondary/60 shrink-0">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-tech-surface/60 hover:bg-tech-surface rounded-xl text-tech-muted hover:text-tech-cyan transition-all text-xs font-bold font-mono border border-tech-surface"
                                        title="Volver al Panel"
                                    >
                                        <ArrowLeft size={16} />
                                        <span>VOLVER</span>
                                    </button>
                                    <h2 className="text-lg md:text-xl font-black text-tech-text uppercase tracking-tight">Chats</h2>
                                </div>
                                <button
                                    onClick={() => setShowComposeModal(true)}
                                    className="px-3 py-1.5 bg-tech-cyan/15 hover:bg-tech-cyan/20 border border-tech-cyan/35 text-tech-cyan rounded-xl text-xs font-bold uppercase transition-all active:scale-95 flex items-center gap-1"
                                >
                                    <Sparkles size={13} /> Nuevo Chat
                                </button>
                            </div>

                            {/* Barra de búsqueda de chats */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-tech-muted" size={15} />
                                <input
                                    type="text"
                                    placeholder="Buscar conversación..."
                                    value={conversationsQuery}
                                    onChange={(e) => setConversationsQuery(e.target.value)}
                                    className="w-full bg-tech-primary/60 border border-tech-surface rounded-xl pl-9 pr-4 py-2 text-xs text-tech-text focus:border-tech-cyan/50 focus:ring-1 focus:ring-tech-cyan/50 outline-none transition-all placeholder:text-tech-muted"
                                />
                            </div>
                        </div>

                        {/* Área desplazable de lista de chats */}
                        <div className="flex-1 min-h-0 h-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
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
                                    const isPinned = pinnedChats.includes(conv.key);

                                    return (
                                        <button
                                            key={`chat-conv-${conv.key || `idx-${idx}`}-${idx}`}
                                            onClick={() => setActiveChatKey(conv.key)}
                                            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all border group relative ${
                                                isActive 
                                                    ? 'bg-tech-cyan/15 border-tech-cyan/30 shadow-md' 
                                                    : 'hover:bg-tech-primary/40 border-transparent hover:border-tech-surface/40'
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

                                            {/* Info de la conversación */}
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <h4 className="font-bold text-xs text-tech-text truncate uppercase tracking-tight flex items-center gap-1">
                                                        {conv.user.nombre}
                                                        {isPinned && <Pin size={10} className="text-tech-cyan shrink-0 fill-tech-cyan" />}
                                                    </h4>
                                                    <span className="text-[9px] text-tech-muted shrink-0 font-mono">
                                                        {formatMessageTime(conv.lastMessage?.fecha_envio || conv.lastMessage?.created_at)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <p className="text-xs text-tech-muted truncate flex-grow">
                                                        {isSent && <span className="text-[10px] uppercase font-bold text-tech-cyan mr-1 font-mono">Tú:</span>}
                                                        {conv.lastMessage?.contenido?.replace(/\[img:.*?\]/g, '📷 Imagen').replace(/\[file:.*?\]/g, '📄 Archivo')}
                                                    </p>
                                                    <button
                                                        onClick={(e) => togglePinChat(e, conv.key)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-tech-surface rounded text-tech-muted hover:text-tech-cyan transition-all shrink-0"
                                                        title={isPinned ? 'Desfijar' : 'Fijar arriba'}
                                                    >
                                                        <Pin size={12} className={isPinned ? 'fill-tech-cyan text-tech-cyan' : ''} />
                                                    </button>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Panel Derecho: Ventana del Chat Activo */}
                    <div className={`flex-1 min-h-0 h-0 flex flex-col bg-tech-primary/20 p-2 md:p-3 overflow-hidden ${isMobile && !activeChatKey ? 'hidden' : 'flex'}`}>
                        {activeUser ? (
                            <>
                                {/* Cabecera de la conversación */}
                                <div className="p-3 border border-tech-surface/60 bg-tech-secondary/60 rounded-xl flex items-center justify-between shrink-0 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {/* Botón Volver a la lista de Chats en vista Mobile */}
                                        <button
                                            onClick={() => setActiveChatKey(null)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-tech-cyan/10 hover:bg-tech-cyan/20 border border-tech-cyan/30 rounded-xl text-tech-cyan transition-all text-xs font-bold font-mono"
                                            title="Volver a lista de chats"
                                        >
                                            <ArrowLeft size={16} />
                                            <span>CHATS</span>
                                        </button>

                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm uppercase ${
                                            activeUser.isRole 
                                                ? 'bg-tech-accent/20 text-tech-accent border border-tech-accent/30' 
                                                : 'bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/35'
                                        }`}>
                                            {activeUser.isRole ? <Megaphone size={16} /> : activeUser.nombre?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xs md:text-sm text-tech-text uppercase tracking-tight leading-tight truncate max-w-[160px] md:max-w-xs">{activeUser.nombre}</h3>
                                            <span className="text-[8px] uppercase font-black tracking-widest text-tech-muted bg-tech-primary px-1.5 py-0.5 rounded border border-tech-surface">
                                                {activeUser.isRole ? 'Difusión General' : activeUser.rol}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Acciones de Cabecera (Búsqueda en Chat) */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setShowChatSearch(!showChatSearch)}
                                            className={`p-2 rounded-xl transition-all ${
                                                showChatSearch ? 'bg-tech-cyan/20 text-tech-cyan' : 'hover:bg-tech-surface text-tech-muted'
                                            }`}
                                            title="Buscar en esta conversación"
                                        >
                                            <Search size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Campo de Búsqueda Desplegable en Chat */}
                                {showChatSearch && (
                                    <div className="mt-2 p-2 border border-tech-surface rounded-xl bg-tech-primary/80 flex items-center gap-2 shrink-0 animate-in fade-in slide-in-from-top-1">
                                        <Search size={14} className="text-tech-muted ml-2 shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Buscar texto en este chat..."
                                            value={chatSearchQuery}
                                            onChange={(e) => setChatSearchQuery(e.target.value)}
                                            className="w-full bg-transparent text-xs text-tech-text outline-none placeholder:text-tech-muted"
                                            autoFocus
                                        />
                                        {chatSearchQuery && (
                                            <button onClick={() => setChatSearchQuery('')} className="p-1 text-tech-muted hover:text-tech-text">
                                                <CloseIcon size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* CAJA DEL HISTORIAL DE MENSAJES: FLEX COMPRESIÓN ESTRICTA (flex-1 min-h-0 h-0) */}
                                <div className="flex-1 min-h-0 h-0 my-2 bg-tech-primary/50 border border-tech-surface/80 rounded-2xl p-3 md:p-4 overflow-y-auto custom-scrollbar shadow-inner space-y-4">
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
                                                                <span className="bg-tech-secondary/80 border border-tech-surface px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-tech-muted font-mono shadow-sm">
                                                                    {dateLabel}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[88%] lg:max-w-[75%] rounded-2xl px-4 py-2.5 border relative shadow-md ${
                                                                isSentByMe 
                                                                    ? 'bg-tech-cyan/15 border-tech-cyan/30 rounded-tr-none text-tech-text' 
                                                                    : 'bg-tech-secondary/90 border-tech-surface/70 rounded-tl-none text-tech-text'
                                                            }`}>
                                                                {!isSentByMe && activeUser.isRole && (
                                                                    <p className="text-[9px] font-bold text-tech-cyan uppercase tracking-tighter mb-1 font-mono">
                                                                        {msg.remitente?.nombre} ({msg.remitente?.rol})
                                                                    </p>
                                                                )}
                                                                {renderMessageContent(msg.contenido)}
                                                                <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-tech-muted font-mono">
                                                                    <span>{formatMessageTime(messageDate)}</span>
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

                                {/* Vista Previa de Archivo Adjunto */}
                                {attachment && (
                                    <div className="px-4 py-2 bg-tech-secondary border border-tech-surface rounded-xl mb-2 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-2 text-xs font-mono text-tech-cyan">
                                            {attachment.type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                                            <span className="truncate max-w-xs">{attachment.name}</span>
                                        </div>
                                        <button
                                            onClick={() => setAttachment(null)}
                                            className="p-1 hover:bg-tech-surface text-tech-muted hover:text-tech-danger rounded-lg"
                                        >
                                            <CloseIcon size={16} />
                                        </button>
                                    </div>
                                )}

                                {/* Selector de Emojis Rápido */}
                                {showEmojiPicker && (
                                    <div className="p-2 mb-2 border border-tech-surface rounded-xl bg-tech-secondary/90 flex flex-wrap gap-2 shrink-0 animate-in fade-in slide-in-from-bottom-2">
                                        {QUICK_EMOJIS.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => {
                                                    setNewMessage(prev => prev + emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="p-1.5 hover:bg-tech-surface rounded-lg text-base transition-transform active:scale-125"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Input de Envío de Mensajes (Fijo en la parte inferior) */}
                                <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border border-tech-surface bg-tech-secondary/60 rounded-xl shrink-0">
                                    {/* Botón Adjuntar Archivo */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        accept="image/*,.pdf,.doc,.docx"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 hover:bg-tech-surface text-tech-muted hover:text-tech-cyan rounded-xl transition-all shrink-0"
                                        title="Adjuntar imagen o documento"
                                    >
                                        <Paperclip size={18} />
                                    </button>

                                    {/* Botón Emoji */}
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={`p-2 rounded-xl transition-all shrink-0 ${
                                            showEmojiPicker ? 'bg-tech-cyan/20 text-tech-cyan' : 'hover:bg-tech-surface text-tech-muted hover:text-tech-text'
                                        }`}
                                        title="Insertar emoji"
                                    >
                                        <Smile size={18} />
                                    </button>

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
                                        className="flex-grow bg-tech-primary border border-tech-surface rounded-xl px-4 py-2.5 text-xs md:text-sm text-tech-text focus:border-tech-cyan/50 focus:ring-1 focus:ring-tech-cyan/50 outline-none transition-all placeholder:text-tech-muted disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={(!newMessage.trim() && !attachment) || (activeUser.isRole && profile?.rol !== 'admin' && profile?.rol !== 'preceptor')}
                                        className="w-10 h-10 shrink-0 bg-tech-cyan hover:bg-tech-cyan/85 border border-tech-cyan/30 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-tech-cyan/15"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* Estado vacío de selección de chat */
                            <div className="w-full h-full flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="p-8 bg-tech-secondary/60 border border-tech-surface/80 rounded-3xl shadow-xl flex flex-col items-center max-w-md w-full space-y-4">
                                    <div className="w-16 h-16 bg-tech-cyan/10 border border-tech-cyan/30 rounded-2xl flex items-center justify-center text-tech-cyan shadow-md animate-pulse">
                                        <MessageSquare size={32} />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-tech-text uppercase tracking-tighter">MENSAJERÍA INSTITUCIONAL</h3>
                                    <p className="text-xs md:text-sm text-tech-muted leading-relaxed">
                                        Selecciona una conversación del panel de la izquierda o inicia una nueva con profesores, preceptores, alumnos o administradores.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Crear Nueva Conversación */}
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
                                            placeholder="Buscar usuario o canal de difusión..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-tech-primary border border-tech-surface rounded-xl pl-9 pr-4 py-2 text-sm text-tech-text focus:border-tech-cyan/50 focus:ring-1 focus:ring-tech-cyan/50 outline-none transition-all placeholder:text-tech-muted"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {newChatOptions.length === 0 ? (
                                        <div className="p-6 text-center text-tech-muted text-xs font-mono uppercase">
                                            No se encontraron destinatarios
                                        </div>
                                    ) : (
                                        newChatOptions.map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => {
                                                    setActiveChatKey(option.id);
                                                    setShowComposeModal(false);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-tech-primary/50 rounded-xl transition-all border border-transparent hover:border-tech-surface text-left group"
                                            >
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm uppercase ${
                                                    option.isRole 
                                                        ? 'bg-tech-accent/20 text-tech-accent border border-tech-accent/30' 
                                                        : 'bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/35'
                                                }`}>
                                                    {option.isRole ? <Megaphone size={16} /> : option.nombre[0]}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h4 className="font-bold text-xs text-tech-text group-hover:text-tech-cyan transition-colors truncate uppercase tracking-tight">
                                                        {option.nombre}
                                                    </h4>
                                                    <p className="text-[10px] text-tech-muted font-mono uppercase">
                                                        {option.isRole ? 'Difusión General' : option.rol}
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
