import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Send, Search, MessageSquare, ArrowLeft, X,
    Check, CheckCheck, Megaphone, Paperclip, Smile,
    Pin, FileText, Plus, Users, ChevronLeft
} from "lucide-react";
import { getApiEndpoint } from "../utils/api";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../components/ui/Toast";

// ─── Constants ──────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ["👍", "❤️", "👏", "🔥", "🎉", "💡", "😊", "✅", "🙏", "⭐"];

// ─── Module-level helpers (no hoisting issues) ───────────────────────────────
function getRoleTitle(r) {
    if (!r) return "";
    if (r === "admin") return "Administradores";
    if (r === "preceptor") return "Preceptores";
    if (r === "docente") return "Docentes";
    if (r === "alumno") return "Alumnos";
    if (r.startsWith("anio_")) return r.replace("anio_", "") + "° Año";
    return r;
}

function fmtTime(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Hoy";
    if (d.toDateString() === yesterday.toDateString()) return "Ayer";
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

function fmtLastMsg(msg) {
    if (!msg?.contenido) return "";
    if (msg.contenido.includes("[img:")) return "📷 Imagen";
    if (msg.contenido.includes("[file:")) return "📎 Archivo";
    return msg.contenido.length > 42 ? msg.contenido.slice(0, 42) + "…" : msg.contenido;
}

// ─── Pure sub-components ────────────────────────────────────────────────────
function Avatar({ name, isRole, size = "md" }) {
    const sz = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
    return (
        <div className={`${sz[size]} rounded-2xl flex items-center justify-center font-black uppercase shrink-0 ${isRole ? "bg-tech-accent/15 text-tech-accent border border-tech-accent/25" : "bg-tech-cyan/15 text-tech-cyan border border-tech-cyan/25"}`}>
            {isRole ? <Megaphone size={size === "sm" ? 14 : 16} /> : (name?.[0] ?? "?")}
        </div>
    );
}

function ConvItem({ conv, isActive, isPinned, onSelect, onPin }) {
    const lastDate = conv.lastMessage?.fecha_envio || conv.lastMessage?.created_at;
    return (
        <button
            onClick={() => onSelect(conv.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group relative ${isActive ? "bg-tech-cyan/12 border border-tech-cyan/20" : "hover:bg-tech-surface/60 border border-transparent hover:border-tech-surface/50"}`}
        >
            <div className="relative shrink-0">
                <Avatar name={conv.user?.nombre} isRole={conv.user?.isRole} size="md" />
                {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-tech-cyan text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-bold truncate uppercase tracking-tight ${isActive ? "text-tech-cyan" : "text-tech-text"}`}>{conv.user?.nombre}</span>
                    <span className="text-[9px] text-tech-muted font-mono shrink-0">{fmtTime(lastDate)}</span>
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${conv.unreadCount > 0 ? "text-tech-text font-semibold" : "text-tech-muted"}`}>{fmtLastMsg(conv.lastMessage)}</p>
            </div>
            <button
                onClick={(e) => onPin(e, conv.key)}
                title={isPinned ? "Desfijar" : "Fijar"}
                className={`shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isPinned ? "opacity-100 text-tech-accent" : "text-tech-muted hover:text-tech-cyan"}`}
            >
                <Pin size={12} />
            </button>
        </button>
    );
}

function DateDivider({ label }) {
    return (
        <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-tech-surface/60" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-tech-muted font-mono px-2 py-1 bg-tech-surface/30 rounded-full border border-tech-surface/40">{label}</span>
            <div className="flex-1 h-px bg-tech-surface/60" />
        </div>
    );
}

function MessageBubble({ msg, isMine, showSender, renderContent }) {
    const date = msg.fecha_envio || msg.created_at;
    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1.5`}>
            <div className={`max-w-[78%] lg:max-w-[65%] rounded-2xl px-3.5 py-2.5 shadow-sm ${isMine ? "bg-tech-cyan/18 border border-tech-cyan/25 rounded-tr-sm" : "bg-tech-secondary border border-tech-surface/70 rounded-tl-sm"}`}>
                {showSender && !isMine && (
                    <p className="text-[9px] font-black text-tech-cyan uppercase tracking-widest mb-1 font-mono">{msg.remitente?.nombre}</p>
                )}
                {renderContent(msg.contenido)}
                <div className={`flex items-center gap-1 mt-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
                    <span className="text-[9px] text-tech-muted font-mono">{fmtTime(date)}</span>
                    {isMine && (msg.leido ? <CheckCheck size={12} className="text-tech-cyan" /> : <Check size={12} className="text-tech-muted" />)}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const Messages = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const addToast = useToast();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [activeChatKey, setActiveChatKey] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [convSearch, setConvSearch] = useState("");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showCompose, setShowCompose] = useState(false);
    const [composeSearch, setComposeSearch] = useState("");
    const [chatSearch, setChatSearch] = useState("");
    const [showChatSearch, setShowChatSearch] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [pinnedChats, setPinnedChats] = useState([]);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    // Resize
    useEffect(() => {
        const handle = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, []);

    // Fetch
    async function fetchMessages() {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(getApiEndpoint("/messages"), { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) setMessages(await res.json());
        } catch { addToast("Error al cargar mensajes", "error"); }
        finally { setLoading(false); }
    }

    async function fetchSingleMessage(msgId) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(getApiEndpoint(`/messages/${msgId}`), { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [msg, ...prev].sort((a, b) => new Date(b.fecha_envio || b.created_at || 0) - new Date(a.fecha_envio || a.created_at || 0));
                });
            }
        } catch { /* silent */ }
    }

    async function fetchUsers() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(getApiEndpoint("/messages/users"), { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) setAvailableUsers(await res.json());
        } catch { /* silent */ }
    }

    async function markAsRead(ids) {
        if (!ids.length) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            await Promise.all(ids.map(id =>
                fetch(getApiEndpoint(`/messages/${id}/read`), { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } })
            ));
            setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, leido: true } : m));
        } catch { /* silent */ }
    }

    useEffect(() => {
        if (profile) { fetchMessages(); fetchUsers(); }
    }, [profile]);

    // Realtime
    useEffect(() => {
        if (!user?.id || !profile?.rol) return;
        const channel = supabase.channel("msg_broadcast")
            .on("broadcast", { event: "new_message" }, ({ payload }) => {
                const msg = payload?.message;
                if (!msg) return;
                const relevant = msg.remitente_id === user.id || msg.destinatario_id === user.id || msg.rol_destinatario === profile.rol;
                if (relevant) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [msg, ...prev].sort((a, b) => new Date(b.fecha_envio || b.created_at || 0) - new Date(a.fecha_envio || a.created_at || 0));
                    });
                }
            })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, ({ new: msg }) => {
                const relevant = msg.remitente_id === user.id || msg.destinatario_id === user.id || msg.rol_destinatario === profile.rol;
                if (relevant) fetchSingleMessage(msg.id);
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user, profile]);

    // Auto-scroll
    useEffect(() => {
        if (activeChatKey) {
            const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
            return () => clearTimeout(t);
        }
    }, [activeChatKey, messages]);

    // Conversations memo
    const conversations = useMemo(() => {
        const map = new Map();
        messages.forEach(msg => {
            let key, otherUser;
            if (msg.tipo === "rol") {
                key = `role_${msg.rol_destinatario}`;
                otherUser = { id: key, nombre: `Canal ${getRoleTitle(msg.rol_destinatario)}`, rol: msg.rol_destinatario, isRole: true };
            } else {
                const mine = msg.remitente_id === user?.id;
                otherUser = mine ? msg.destinatario : msg.remitente;
                if (!otherUser && mine && msg.destinatario_id) {
                    otherUser = availableUsers.find(u => u.id === msg.destinatario_id) || { id: msg.destinatario_id, nombre: "Usuario", rol: "usuario" };
                }
                if (otherUser && otherUser.id !== user?.id) key = otherUser.id;
            }
            if (!key || !otherUser) return;
            if (!map.has(key)) {
                map.set(key, { key, user: otherUser, lastMessage: msg, messages: [msg], unreadCount: (!msg.leido && msg.remitente_id !== user?.id) ? 1 : 0 });
            } else {
                const c = map.get(key);
                c.messages.push(msg);
                if (!msg.leido && msg.remitente_id !== user?.id) c.unreadCount++;
            }
        });
        return Array.from(map.values()).sort((a, b) => {
            const ap = pinnedChats.includes(a.key), bp = pinnedChats.includes(b.key);
            if (ap && !bp) return -1;
            if (!ap && bp) return 1;
            return new Date(b.lastMessage?.fecha_envio || b.lastMessage?.created_at || 0) - new Date(a.lastMessage?.fecha_envio || a.lastMessage?.created_at || 0);
        });
    }, [messages, user, availableUsers, pinnedChats]);

    // Mark read on open
    useEffect(() => {
        if (!activeChatKey) return;
        const conv = conversations.find(c => c.key === activeChatKey);
        if (conv?.unreadCount > 0) {
            const ids = conv.messages.filter(m => !m.leido && m.remitente_id !== user?.id).map(m => m.id);
            markAsRead(ids);
        }
    }, [activeChatKey, conversations]);

    // Derived
    const filteredConvs = conversations.filter(c =>
        c.user?.nombre?.toLowerCase().includes(convSearch.toLowerCase()) ||
        fmtLastMsg(c.lastMessage).toLowerCase().includes(convSearch.toLowerCase())
    );

    const activeConv = conversations.find(c => c.key === activeChatKey);
    const activeUser = activeConv?.user ?? (
        activeChatKey?.startsWith("role_")
            ? { id: activeChatKey, nombre: `Difusión: ${getRoleTitle(activeChatKey.replace("role_", ""))}`, rol: activeChatKey.replace("role_", ""), isRole: true }
            : availableUsers.find(u => u.id === activeChatKey)
    );

    const activeMsgs = activeConv
        ? [...activeConv.messages].sort((a, b) => new Date(a.fecha_envio || a.created_at) - new Date(b.fecha_envio || b.created_at))
        : [];

    const displayMsgs = chatSearch.trim()
        ? activeMsgs.filter(m => m.contenido?.toLowerCase().includes(chatSearch.toLowerCase()))
        : activeMsgs;

    function getNewChatOptions() {
        let opts = [...availableUsers];
        if (profile?.rol === "admin" || profile?.rol === "preceptor") {
            opts = [
                { id: "role_docente", nombre: "Todos los Docentes", rol: "docente", isRole: true },
                { id: "role_alumno", nombre: "Todos los Alumnos", rol: "alumno", isRole: true },
                { id: "role_preceptor", nombre: "Todos los Preceptores", rol: "preceptor", isRole: true },
                { id: "role_admin", nombre: "Todos los Administradores", rol: "admin", isRole: true },
                { id: "role_anio_1", nombre: "Difusión: 1er Año", rol: "anio_1", isRole: true },
                { id: "role_anio_2", nombre: "Difusión: 2do Año", rol: "anio_2", isRole: true },
                { id: "role_anio_3", nombre: "Difusión: 3er Año", rol: "anio_3", isRole: true },
                { id: "role_anio_4", nombre: "Difusión: 4to Año", rol: "anio_4", isRole: true },
                { id: "role_anio_5", nombre: "Difusión: 5to Año", rol: "anio_5", isRole: true },
                { id: "role_anio_6", nombre: "Difusión: 6to Año", rol: "anio_6", isRole: true },
                ...opts
            ];
        }
        if (!composeSearch) return opts;
        return opts.filter(o => o.nombre.toLowerCase().includes(composeSearch.toLowerCase()));
    }

    function togglePin(e, key) {
        e.stopPropagation();
        setPinnedChats(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { addToast("El archivo supera los 5MB", "error"); return; }
        const isImg = file.type.startsWith("image/");
        const reader = new FileReader();
        reader.onload = () => setAttachment({ file, name: file.name, type: isImg ? "image" : "file", previewUrl: reader.result });
        reader.readAsDataURL(file);
    }

    async function sendMessage(e) {
        e?.preventDefault();
        if ((!newMessage.trim() && !attachment) || !activeChatKey) return;
        const conv = conversations.find(c => c.key === activeChatKey) || {
            user: activeChatKey.startsWith("role_")
                ? { isRole: true, rol: activeChatKey.replace("role_", "") }
                : availableUsers.find(u => u.id === activeChatKey)
        };
        let text = newMessage.trim();
        if (attachment) {
            if (attachment.type === "image") text = `${text}\n[img:${attachment.previewUrl}]`.trim();
            else text = `${text}\n[file:${attachment.name}]`.trim();
        }
        const isBroadcast = conv.user?.isRole;
        const payload = isBroadcast
            ? { rol_destinatario: conv.user.rol, contenido: text, tipo: "rol" }
            : { destinatario_id: conv.user.id, contenido: text, tipo: "privado" };
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(getApiEndpoint("/messages"), {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const msg = await res.json();
                msg.remitente = { id: user.id, nombre: profile.nombre, rol: profile.rol, email: user.email };
                if (!isBroadcast && conv.user) msg.destinatario = { id: conv.user.id, nombre: conv.user.nombre, rol: conv.user.rol, email: conv.user.email };
                setNewMessage(""); setAttachment(null); setShowEmoji(false);
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [msg, ...prev].sort((a, b) => new Date(b.fecha_envio || b.created_at || 0) - new Date(a.fecha_envio || a.created_at || 0));
                });
                fetchMessages();
            } else { addToast("Error al enviar el mensaje", "error"); }
        } catch { addToast("Fallo en la conexión", "error"); }
    }

    function renderContent(content) {
        if (!content) return null;
        const imgMatch = content.match(/\[img:(.*?)\]/);
        const fileMatch = content.match(/\[file:(.*?)\]/);
        const text = content.replace(/\[img:.*?\]/g, "").replace(/\[file:.*?\]/g, "").trim();
        return (
            <div className="space-y-1.5">
                {text && <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{text}</p>}
                {imgMatch && (
                    <div className="rounded-xl overflow-hidden border border-tech-surface/50 mt-1">
                        <img src={imgMatch[1]} alt="Adjunto" className="max-h-64 w-auto object-cover" />
                    </div>
                )}
                {fileMatch && (
                    <div className="flex items-center gap-2 p-2 bg-tech-surface/30 rounded-lg text-xs font-mono mt-1">
                        <FileText size={14} className="text-tech-cyan shrink-0" />
                        <span className="truncate">{fileMatch[1]}</span>
                    </div>
                )}
            </div>
        );
    }

    const isReadOnly = activeUser?.isRole && profile?.rol !== "admin" && profile?.rol !== "preceptor";
    const showRight = !isMobile || !!activeChatKey;
    const showLeft = !isMobile || !activeChatKey;

    return (
        <div className="w-full h-full flex flex-col font-sans overflow-hidden bg-tech-primary">
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* LEFT: conversation list */}
                {showLeft && (
                    <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col min-h-0 overflow-hidden border-r border-tech-surface/50 bg-tech-secondary/60">
                        <div className="px-3 pt-3 pb-2 shrink-0 border-b border-tech-surface/40 bg-tech-secondary/80">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate("/dashboard")}
                                        className="p-1.5 rounded-lg text-tech-muted hover:text-tech-cyan hover:bg-tech-surface/60 transition-all"
                                        title="Volver al Panel"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <h2 className="text-sm font-black uppercase tracking-tight text-tech-text">Mensajes</h2>
                                </div>
                                <button
                                    onClick={() => setShowCompose(true)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-tech-cyan text-white rounded-xl text-xs font-bold hover:bg-tech-cyan/85 transition-all shadow-sm"
                                >
                                    <Plus size={14} /> Nuevo
                                </button>
                            </div>
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" />
                                <input
                                    type="text"
                                    placeholder="Buscar conversación..."
                                    value={convSearch}
                                    onChange={e => setConvSearch(e.target.value)}
                                    className="w-full bg-tech-surface/40 border border-tech-surface/60 rounded-xl pl-8 pr-3 py-2 text-xs text-tech-text placeholder:text-tech-muted outline-none focus:border-tech-cyan/40 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto py-1.5 px-2 space-y-0.5 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-tech-cyan/30 border-t-tech-cyan animate-spin" />
                                    <p className="text-xs text-tech-muted font-mono uppercase">Cargando...</p>
                                </div>
                            ) : filteredConvs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                                    <div className="w-12 h-12 bg-tech-surface/50 rounded-2xl flex items-center justify-center text-tech-muted">
                                        <MessageSquare size={20} />
                                    </div>
                                    <p className="text-xs text-tech-muted">
                                        {convSearch ? "Sin resultados" : "No hay conversaciones aún"}
                                    </p>
                                </div>
                            ) : (
                                filteredConvs.map(conv => (
                                    <ConvItem
                                        key={conv.key}
                                        conv={conv}
                                        isActive={activeChatKey === conv.key}
                                        isPinned={pinnedChats.includes(conv.key)}
                                        onSelect={setActiveChatKey}
                                        onPin={togglePin}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* RIGHT: active chat */}
                {showRight && (
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-tech-primary/30">
                        {activeUser ? (
                            <>
                                {/* Header */}
                                <div className="px-3 py-2.5 border-b border-tech-surface/40 bg-tech-secondary/70 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => setActiveChatKey(null)}
                                            className="p-1.5 rounded-lg text-tech-muted hover:text-tech-cyan hover:bg-tech-surface/60 transition-all"
                                            title="Volver"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                        <Avatar name={activeUser.nombre} isRole={activeUser.isRole} size="sm" />
                                        <div>
                                            <h3 className="text-sm font-bold text-tech-text uppercase tracking-tight leading-tight">{activeUser.nombre}</h3>
                                            <span className="text-[9px] uppercase font-black tracking-widest text-tech-muted font-mono">
                                                {activeUser.isRole ? "Canal de difusión" : activeUser.rol}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setShowChatSearch(s => !s); setChatSearch(""); }}
                                        className={`p-2 rounded-xl transition-all ${showChatSearch ? "bg-tech-cyan/15 text-tech-cyan" : "text-tech-muted hover:bg-tech-surface/50 hover:text-tech-text"}`}
                                        title="Buscar en chat"
                                    >
                                        <Search size={15} />
                                    </button>
                                </div>

                                {/* In-chat search */}
                                <AnimatePresence>
                                    {showChatSearch && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden shrink-0 border-b border-tech-surface/30"
                                        >
                                            <div className="px-3 py-2 flex items-center gap-2 bg-tech-surface/20">
                                                <Search size={13} className="text-tech-muted shrink-0" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Buscar en esta conversación..."
                                                    value={chatSearch}
                                                    onChange={e => setChatSearch(e.target.value)}
                                                    className="flex-1 bg-transparent text-xs text-tech-text outline-none placeholder:text-tech-muted"
                                                />
                                                {chatSearch && (
                                                    <button onClick={() => setChatSearch("")} className="text-tech-muted hover:text-tech-text">
                                                        <X size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Messages scroll area — KEY: flex-1 min-h-0 overflow-y-auto */}
                                <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 custom-scrollbar">
                                    {displayMsgs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
                                            <div className="w-14 h-14 bg-tech-surface/50 rounded-2xl flex items-center justify-center text-tech-muted">
                                                <MessageSquare size={24} />
                                            </div>
                                            <p className="text-xs text-tech-muted max-w-xs">
                                                {chatSearch ? "No se encontraron mensajes" : `Iniciá la conversación con ${activeUser.nombre}`}
                                            </p>
                                        </div>
                                    ) : (
                                        (() => {
                                            let lastLabel = "";
                                            return displayMsgs.map((msg, i) => {
                                                const date = msg.fecha_envio || msg.created_at;
                                                const label = fmtDate(date);
                                                const showDivider = label !== lastLabel;
                                                lastLabel = label;
                                                const isMine = msg.remitente_id === user?.id;
                                                return (
                                                    <React.Fragment key={msg.id ?? i}>
                                                        {showDivider && <DateDivider label={label} />}
                                                        <MessageBubble
                                                            msg={msg}
                                                            isMine={isMine}
                                                            showSender={activeUser.isRole && !isMine}
                                                            renderContent={renderContent}
                                                        />
                                                    </React.Fragment>
                                                );
                                            });
                                        })()
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Attachment preview */}
                                <AnimatePresence>
                                    {attachment && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden shrink-0"
                                        >
                                            <div className="mx-3 mb-1 px-3 py-2 bg-tech-surface/40 border border-tech-surface/60 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-mono text-tech-cyan">
                                                    {attachment.type === "image" ? "📷" : <FileText size={14} />}
                                                    <span className="truncate max-w-[200px]">{attachment.name}</span>
                                                </div>
                                                <button onClick={() => setAttachment(null)} className="text-tech-muted hover:text-tech-danger p-1 rounded-lg">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Emoji picker */}
                                <AnimatePresence>
                                    {showEmoji && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden shrink-0"
                                        >
                                            <div className="mx-3 mb-1 px-2 py-2 bg-tech-secondary/80 border border-tech-surface/50 rounded-xl flex flex-wrap gap-1">
                                                {QUICK_EMOJIS.map(em => (
                                                    <button
                                                        key={em}
                                                        onClick={() => { setNewMessage(p => p + em); setShowEmoji(false); inputRef.current?.focus(); }}
                                                        className="p-1.5 hover:bg-tech-surface/60 rounded-lg text-base transition-transform active:scale-125"
                                                    >
                                                        {em}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Input bar */}
                                <form onSubmit={sendMessage} className="shrink-0 px-3 py-2.5 border-t border-tech-surface/40 bg-tech-secondary/70">
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-tech-muted hover:text-tech-cyan hover:bg-tech-surface/60 rounded-xl transition-all shrink-0" title="Adjuntar">
                                            <Paperclip size={17} />
                                        </button>
                                        <button type="button" onClick={() => setShowEmoji(s => !s)} className={`p-2 rounded-xl transition-all shrink-0 ${showEmoji ? "bg-tech-cyan/15 text-tech-cyan" : "text-tech-muted hover:bg-tech-surface/60 hover:text-tech-text"}`} title="Emoji">
                                            <Smile size={17} />
                                        </button>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); }}}
                                            disabled={isReadOnly}
                                            placeholder={isReadOnly ? "Sin permiso para escribir en este canal" : "Escribe un mensaje..."}
                                            className="flex-1 min-w-0 bg-tech-surface/30 border border-tech-surface/60 rounded-xl px-4 py-2.5 text-sm text-tech-text placeholder:text-tech-muted outline-none focus:border-tech-cyan/40 focus:bg-tech-surface/50 transition-all disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={(!newMessage.trim() && !attachment) || isReadOnly}
                                            className="w-10 h-10 shrink-0 bg-tech-cyan hover:bg-tech-cyan/85 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                                        >
                                            <Send size={15} />
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            /* Empty state */
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-20 h-20 bg-tech-surface/40 border border-tech-surface/60 rounded-3xl flex items-center justify-center text-tech-cyan mb-5 shadow-sm">
                                    <MessageSquare size={36} />
                                </div>
                                <h3 className="text-lg font-black text-tech-text uppercase tracking-tight mb-2">Mensajería Institucional</h3>
                                <p className="text-sm text-tech-muted max-w-xs leading-relaxed mb-6">
                                    Seleccioná una conversación o iniciá una nueva con cualquier miembro de la institución.
                                </p>
                                <button
                                    onClick={() => setShowCompose(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-tech-cyan text-white rounded-xl text-sm font-bold hover:bg-tech-cyan/85 transition-all shadow-sm"
                                >
                                    <Plus size={16} /> Nuevo mensaje
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Compose modal */}
            <AnimatePresence>
                {showCompose && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-tech-secondary border border-tech-surface/60 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="px-4 py-3 border-b border-tech-surface/40 flex items-center justify-between shrink-0 bg-tech-surface/20">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-tech-cyan" />
                                    <h3 className="font-bold text-sm text-tech-text uppercase tracking-wide">Nueva conversación</h3>
                                </div>
                                <button
                                    onClick={() => { setShowCompose(false); setComposeSearch(""); }}
                                    className="p-1.5 text-tech-muted hover:text-tech-text hover:bg-tech-surface/60 rounded-lg transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="px-3 py-2.5 border-b border-tech-surface/30 shrink-0">
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Buscar usuario o canal..."
                                        value={composeSearch}
                                        onChange={e => setComposeSearch(e.target.value)}
                                        className="w-full bg-tech-surface/30 border border-tech-surface/50 rounded-xl pl-8 pr-3 py-2 text-sm text-tech-text placeholder:text-tech-muted outline-none focus:border-tech-cyan/40 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                                {getNewChatOptions().length === 0 ? (
                                    <p className="p-6 text-center text-xs text-tech-muted">No se encontraron usuarios</p>
                                ) : (
                                    getNewChatOptions().map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setActiveChatKey(opt.id); setShowCompose(false); setComposeSearch(""); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-tech-surface/50 border border-transparent hover:border-tech-surface/40 transition-all text-left"
                                        >
                                            <Avatar name={opt.nombre} isRole={opt.isRole} size="sm" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-tech-text uppercase tracking-tight truncate">{opt.nombre}</p>
                                                <p className="text-[10px] text-tech-muted font-mono">{opt.isRole ? "Canal de difusión" : opt.rol}</p>
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
    );
};

export default Messages;
