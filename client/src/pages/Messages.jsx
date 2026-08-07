import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Send, Search, MessageSquare, ArrowLeft, X,
    Check, CheckCheck, Megaphone, Paperclip, Smile,
    Pin, PinOff, FileText, Plus, Users, ChevronLeft,
    Inbox
} from "lucide-react";
import { getApiEndpoint } from "../utils/api";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../components/ui/Toast";

// ─── Constants ───────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ["👍","❤️","👏","🔥","🎉","💡","😊","✅","🙏","⭐","😂","🤝"];

// ─── Pure helpers — module scope to avoid hoisting issues ────────────────────
function getRoleTitle(r) {
    if (!r) return "";
    const map = {
        admin: "Administradores", preceptor: "Preceptores",
        docente: "Docentes", alumno: "Alumnos",
    };
    if (map[r]) return map[r];
    if (r.startsWith("anio_")) return `${r.replace("anio_", "")}° Año`;
    return r;
}

function fmtTime(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Hoy";
    if (d.toDateString() === yesterday.toDateString()) return "Ayer";
    return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

function fmtPreview(msg) {
    if (!msg?.contenido) return "Sin mensajes aún";
    if (msg.contenido.includes("[img:")) return "📷 Imagen";
    if (msg.contenido.includes("[file:")) return "📎 Archivo";
    const text = msg.contenido.replace(/\[img:.*?\]/g, "").replace(/\[file:.*?\]/g, "").trim();
    return text.length > 45 ? text.slice(0, 45) + "…" : text;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ name, isRole, size = "md", online = false }) {
    const sizes = {
        xs: "w-7 h-7 text-[10px]",
        sm: "w-9 h-9 text-xs",
        md: "w-11 h-11 text-sm",
        lg: "w-14 h-14 text-base"
    };
    return (
        <div className="relative shrink-0">
            <div className={`
                ${sizes[size]} rounded-2xl flex items-center justify-center
                font-black uppercase select-none
                ${isRole
                    ? "bg-tech-accent/20 text-tech-accent border border-tech-accent/30"
                    : "bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/30"
                }
            `}>
                {isRole
                    ? <Megaphone size={size === "xs" ? 12 : size === "sm" ? 14 : 16} />
                    : (name?.[0]?.toUpperCase() ?? "?")}
            </div>
            {online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-tech-success rounded-full border-2 border-tech-secondary" />
            )}
        </div>
    );
}

function ConvItem({ conv, isActive, isPinned, onSelect, onPin }) {
    const lastDate = conv.lastMessage?.fecha_envio || conv.lastMessage?.created_at;
    const hasUnread = conv.unreadCount > 0;
    return (
        <button
            onClick={() => onSelect(conv.key)}
            className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left
                transition-all duration-200 group relative
                ${isActive
                    ? "bg-tech-cyan/15 border border-tech-cyan/25 shadow-sm"
                    : "hover:bg-tech-surface/50 border border-transparent"
                }
            `}
        >
            <Avatar name={conv.user?.nombre} isRole={conv.user?.isRole} size="md" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`
                        text-[13px] truncate leading-tight
                        ${isActive ? "text-tech-cyan font-bold" : hasUnread ? "text-tech-text font-bold" : "text-tech-text font-semibold"}
                    `}>
                        {conv.user?.nombre}
                    </span>
                    <span className="text-[10px] text-tech-muted font-mono shrink-0 tabular-nums">
                        {fmtTime(lastDate)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${hasUnread ? "text-tech-text font-medium" : "text-tech-muted"}`}>
                        {fmtPreview(conv.lastMessage)}
                    </p>
                    {hasUnread && (
                        <span className="shrink-0 min-w-[20px] h-5 bg-tech-cyan text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5 tabular-nums">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Pin button — visible on hover */}
            <button
                onClick={(e) => { e.stopPropagation(); onPin(conv.key); }}
                title={isPinned ? "Desfijar" : "Fijar conversación"}
                className={`
                    absolute top-2 right-2 p-1 rounded-lg transition-all duration-150
                    ${isPinned
                        ? "opacity-100 text-tech-accent hover:text-tech-accent/70"
                        : "opacity-0 group-hover:opacity-100 text-tech-muted hover:text-tech-cyan"
                    }
                `}
            >
                {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
            </button>
        </button>
    );
}

function DateDivider({ label }) {
    return (
        <div className="flex items-center gap-3 my-5 px-1">
            <div className="flex-1 h-px bg-tech-surface/70" />
            <span className="
                text-[10px] font-semibold uppercase tracking-[0.15em]
                text-tech-muted font-mono
                px-3 py-1 bg-tech-surface/40 rounded-full
                border border-tech-surface/60
                whitespace-nowrap
            ">
                {label}
            </span>
            <div className="flex-1 h-px bg-tech-surface/70" />
        </div>
    );
}

function MessageBubble({ msg, isMine, showSender, renderContent }) {
    const date = msg.fecha_envio || msg.created_at;
    return (
        <div className={`flex w-full ${isMine ? "justify-end" : "justify-start"} mb-2 px-1`}>
            <div className={`
                max-w-[72%] sm:max-w-[65%] lg:max-w-[58%]
                rounded-2xl px-4 py-3
                ${isMine
                    ? "bg-gradient-to-br from-tech-cyan/22 to-tech-cyan/14 border border-tech-cyan/30 rounded-tr-sm"
                    : "bg-tech-secondary/90 border border-tech-surface/60 rounded-tl-sm"
                }
                shadow-sm
            `}>
                {showSender && !isMine && (
                    <p className="text-[10px] font-black text-tech-accent uppercase tracking-widest mb-1.5 font-mono">
                        {msg.remitente?.nombre ?? "Desconocido"}
                    </p>
                )}
                {renderContent(msg.contenido)}
                <div className={`flex items-center gap-1.5 mt-2 ${isMine ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px] text-tech-muted font-mono tabular-nums">{fmtTime(date)}</span>
                    {isMine && (
                        msg.leido
                            ? <CheckCheck size={13} className="text-tech-cyan" />
                            : <Check size={13} className="text-tech-muted" />
                    )}
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

    // Core state
    const [messages, setMessages]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [newMessage, setNewMessage]         = useState("");
    const [sending, setSending]               = useState(false);
    const [activeChatKey, setActiveChatKey]   = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);

    // UI state
    const [convSearch, setConvSearch]         = useState("");
    const [chatSearch, setChatSearch]         = useState("");
    const [showChatSearch, setShowChatSearch] = useState(false);
    const [showCompose, setShowCompose]       = useState(false);
    const [composeSearch, setComposeSearch]   = useState("");
    const [showEmoji, setShowEmoji]           = useState(false);
    const [attachment, setAttachment]         = useState(null);
    const [pinnedChats, setPinnedChats]       = useState([]);
    const [isMobile, setIsMobile]             = useState(window.innerWidth < 1024);

    // Refs
    const messagesEndRef = useRef(null);
    const fileInputRef   = useRef(null);
    const inputRef       = useRef(null);

    // ── Responsive ─────────────────────────────────────────────────────────
    useEffect(() => {
        const handle = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, []);

    // ── Data fetching ───────────────────────────────────────────────────────
    async function fetchMessages() {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(getApiEndpoint("/messages"), {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (res.ok) setMessages(await res.json());
        } catch {
            addToast("Error al cargar mensajes", "error");
        } finally {
            setLoading(false);
        }
    }

    async function fetchSingleMessage(msgId) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(getApiEndpoint(`/messages/${msgId}`), {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [msg, ...prev].sort((a, b) =>
                        new Date(b.fecha_envio || b.created_at || 0) - new Date(a.fecha_envio || a.created_at || 0)
                    );
                });
            }
        } catch { /* silent */ }
    }

    async function fetchUsers() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(getApiEndpoint("/messages/users"), {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (res.ok) setAvailableUsers(await res.json());
        } catch { /* silent */ }
    }

    async function markAsRead(ids) {
        if (!ids.length) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            await Promise.all(ids.map(id =>
                fetch(getApiEndpoint(`/messages/${id}/read`), {
                    method: "POST",
                    headers: { Authorization: `Bearer ${session.access_token}` }
                })
            ));
            setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, leido: true } : m));
        } catch { /* silent */ }
    }

    useEffect(() => {
        if (profile) { fetchMessages(); fetchUsers(); }
    }, [profile]);

    // ── Realtime ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user?.id || !profile?.rol) return;
        const channel = supabase.channel("msg_rt_v2")
            .on("broadcast", { event: "new_message" }, ({ payload }) => {
                const msg = payload?.message;
                if (!msg) return;
                const relevant =
                    msg.remitente_id === user.id ||
                    msg.destinatario_id === user.id ||
                    msg.rol_destinatario === profile.rol;
                if (relevant) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [msg, ...prev].sort((a, b) =>
                            new Date(b.fecha_envio || b.created_at || 0) - new Date(a.fecha_envio || a.created_at || 0)
                        );
                    });
                }
            })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, ({ new: msg }) => {
                const relevant =
                    msg.remitente_id === user.id ||
                    msg.destinatario_id === user.id ||
                    msg.rol_destinatario === profile.rol;
                if (relevant) fetchSingleMessage(msg.id);
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user, profile]);

    // ── Auto-scroll ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!activeChatKey) return;
        const t = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 60);
        return () => clearTimeout(t);
    }, [activeChatKey, messages]);

    // ── Conversations memoized ──────────────────────────────────────────────
    const conversations = useMemo(() => {
        const map = new Map();
        messages.forEach(msg => {
            let key, otherUser;
            if (msg.tipo === "rol") {
                key = `role_${msg.rol_destinatario}`;
                otherUser = {
                    id: key,
                    nombre: `Canal ${getRoleTitle(msg.rol_destinatario)}`,
                    rol: msg.rol_destinatario,
                    isRole: true
                };
            } else {
                const mine = msg.remitente_id === user?.id;
                otherUser = mine ? msg.destinatario : msg.remitente;
                if (!otherUser && mine && msg.destinatario_id) {
                    otherUser = availableUsers.find(u => u.id === msg.destinatario_id)
                        || { id: msg.destinatario_id, nombre: "Usuario", rol: "usuario" };
                }
                if (otherUser && otherUser.id !== user?.id) key = otherUser.id;
            }
            if (!key || !otherUser) return;

            if (!map.has(key)) {
                map.set(key, {
                    key, user: otherUser, lastMessage: msg,
                    messages: [msg],
                    unreadCount: (!msg.leido && msg.remitente_id !== user?.id) ? 1 : 0
                });
            } else {
                const c = map.get(key);
                const msgDate = new Date(msg.fecha_envio || msg.created_at || 0);
                const lastDate = new Date(c.lastMessage?.fecha_envio || c.lastMessage?.created_at || 0);
                if (msgDate > lastDate) c.lastMessage = msg;
                c.messages.push(msg);
                if (!msg.leido && msg.remitente_id !== user?.id) c.unreadCount++;
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            const ap = pinnedChats.includes(a.key);
            const bp = pinnedChats.includes(b.key);
            if (ap !== bp) return ap ? -1 : 1;
            return (
                new Date(b.lastMessage?.fecha_envio || b.lastMessage?.created_at || 0) -
                new Date(a.lastMessage?.fecha_envio || a.lastMessage?.created_at || 0)
            );
        });
    }, [messages, user, availableUsers, pinnedChats]);

    // ── Mark as read when opening chat ──────────────────────────────────────
    useEffect(() => {
        if (!activeChatKey) return;
        const conv = conversations.find(c => c.key === activeChatKey);
        if (conv?.unreadCount > 0) {
            const ids = conv.messages
                .filter(m => !m.leido && m.remitente_id !== user?.id)
                .map(m => m.id);
            markAsRead(ids);
        }
    }, [activeChatKey, conversations]);

    // ── Derived state ───────────────────────────────────────────────────────
    const filteredConvs = useMemo(() =>
        conversations.filter(c => {
            const q = convSearch.toLowerCase();
            return (
                c.user?.nombre?.toLowerCase().includes(q) ||
                fmtPreview(c.lastMessage).toLowerCase().includes(q)
            );
        }),
        [conversations, convSearch]
    );

    const activeConv = conversations.find(c => c.key === activeChatKey);
    const activeUser = activeConv?.user ?? (
        activeChatKey?.startsWith("role_")
            ? {
                id: activeChatKey,
                nombre: `Difusión: ${getRoleTitle(activeChatKey.replace("role_", ""))}`,
                rol: activeChatKey.replace("role_", ""),
                isRole: true
              }
            : availableUsers.find(u => u.id === activeChatKey)
    );

    const activeMsgs = useMemo(() =>
        activeConv
            ? [...activeConv.messages].sort((a, b) =>
                new Date(a.fecha_envio || a.created_at) - new Date(b.fecha_envio || b.created_at))
            : [],
        [activeConv]
    );

    const displayMsgs = useMemo(() =>
        chatSearch.trim()
            ? activeMsgs.filter(m => m.contenido?.toLowerCase().includes(chatSearch.toLowerCase()))
            : activeMsgs,
        [activeMsgs, chatSearch]
    );

    function getNewChatOptions() {
        const base = [...availableUsers];
        const broadcastOpts = (profile?.rol === "admin" || profile?.rol === "preceptor") ? [
            { id: "role_docente",   nombre: "Todos los Docentes",        rol: "docente",   isRole: true },
            { id: "role_alumno",    nombre: "Todos los Alumnos",         rol: "alumno",    isRole: true },
            { id: "role_preceptor", nombre: "Todos los Preceptores",     rol: "preceptor", isRole: true },
            { id: "role_admin",     nombre: "Todos los Administradores", rol: "admin",     isRole: true },
            ...Array.from({ length: 6 }, (_, i) => ({
                id: `role_anio_${i + 1}`,
                nombre: `Difusión: ${i + 1}er/${i + 1}do Año`,
                rol: `anio_${i + 1}`,
                isRole: true
            }))
        ] : [];
        const all = [...broadcastOpts, ...base];
        if (!composeSearch.trim()) return all;
        const q = composeSearch.toLowerCase();
        return all.filter(o => o.nombre.toLowerCase().includes(q));
    }

    // ── Actions ─────────────────────────────────────────────────────────────
    const togglePin = useCallback((key) => {
        setPinnedChats(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }, []);

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            addToast("El archivo supera los 5 MB", "error");
            return;
        }
        const isImg = file.type.startsWith("image/");
        const reader = new FileReader();
        reader.onload = () => setAttachment({
            file, name: file.name,
            type: isImg ? "image" : "file",
            preview: reader.result
        });
        reader.readAsDataURL(file);
    }

    async function sendMessage(e) {
        e?.preventDefault();
        if ((!newMessage.trim() && !attachment) || !activeChatKey || sending) return;

        const conv = conversations.find(c => c.key === activeChatKey) || {
            user: activeChatKey.startsWith("role_")
                ? { isRole: true, rol: activeChatKey.replace("role_", "") }
                : availableUsers.find(u => u.id === activeChatKey)
        };

        let text = newMessage.trim();
        if (attachment) {
            text = attachment.type === "image"
                ? `${text}\n[img:${attachment.preview}]`.trim()
                : `${text}\n[file:${attachment.name}]`.trim();
        }

        const isBroadcast = conv.user?.isRole;
        const payload = isBroadcast
            ? { rol_destinatario: conv.user.rol, contenido: text, tipo: "rol" }
            : { destinatario_id: conv.user.id, contenido: text, tipo: "privado" };

        try {
            setSending(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(getApiEndpoint("/messages"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const msg = await res.json();
                msg.remitente = { id: user.id, nombre: profile.nombre, rol: profile.rol, email: user.email };
                if (!isBroadcast && conv.user) {
                    msg.destinatario = {
                        id: conv.user.id, nombre: conv.user.nombre,
                        rol: conv.user.rol, email: conv.user.email
                    };
                }
                setNewMessage("");
                setAttachment(null);
                setShowEmoji(false);
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [msg, ...prev].sort((a, b) =>
                        new Date(b.fecha_envio || b.created_at || 0) - new Date(a.fecha_envio || a.created_at || 0)
                    );
                });
                fetchMessages();
            } else {
                addToast("No se pudo enviar el mensaje", "error");
            }
        } catch {
            addToast("Error de conexión", "error");
        } finally {
            setSending(false);
        }
    }

    // ── Content renderer ────────────────────────────────────────────────────
    function renderContent(content) {
        if (!content) return null;
        const imgMatch  = content.match(/\[img:(data:[^)]+)\]/);
        const fileMatch = content.match(/\[file:([^\]]+)\]/);
        const text = content
            .replace(/\[img:data:[^\]]+\]/g, "")
            .replace(/\[file:[^\]]+\]/g, "")
            .trim();
        return (
            <div className="space-y-2">
                {text && (
                    <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap text-tech-text">
                        {text}
                    </p>
                )}
                {imgMatch?.[1] && (
                    <div className="rounded-xl overflow-hidden border border-tech-surface/50">
                        <img
                            src={imgMatch[1]}
                            alt="Imagen adjunta"
                            className="max-h-60 w-auto max-w-full object-cover"
                            loading="lazy"
                        />
                    </div>
                )}
                {fileMatch?.[1] && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-tech-surface/30 rounded-xl border border-tech-surface/50">
                        <FileText size={14} className="text-tech-cyan shrink-0" />
                        <span className="text-xs font-mono text-tech-muted truncate">{fileMatch[1]}</span>
                    </div>
                )}
            </div>
        );
    }

    // ── Computed layout flags ────────────────────────────────────────────────
    const isReadOnly = activeUser?.isRole && profile?.rol !== "admin" && profile?.rol !== "preceptor";
    const showLeft   = !isMobile || !activeChatKey;
    const showRight  = !isMobile || !!activeChatKey;

    // ════════════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="w-full h-full flex overflow-hidden bg-tech-primary">

            {/* ═══════ LEFT PANEL: Conversation list ═══════ */}
            {showLeft && (
                <aside className="
                    w-full lg:w-[300px] xl:w-[340px] shrink-0
                    flex flex-col min-h-0 overflow-hidden
                    border-r border-tech-surface/50
                    bg-tech-secondary/70 backdrop-blur-md
                ">
                    {/* Header */}
                    <div className="shrink-0 px-4 pt-4 pb-3 border-b border-tech-surface/40">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate("/dashboard")}
                                    title="Volver al panel"
                                    className="p-1.5 rounded-xl text-tech-muted hover:text-tech-cyan hover:bg-tech-surface/60 transition-all duration-150"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <h1 className="text-[15px] font-black text-tech-text uppercase tracking-tight">
                                    Mensajes
                                </h1>
                            </div>
                            <button
                                onClick={() => setShowCompose(true)}
                                className="
                                    flex items-center gap-1.5 px-3 py-1.5
                                    bg-tech-cyan text-white rounded-xl
                                    text-xs font-bold
                                    hover:bg-tech-cyan/85 active:scale-95
                                    transition-all duration-150 shadow-sm
                                "
                            >
                                <Plus size={13} />
                                Nuevo
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted pointer-events-none" />
                            <input
                                type="search"
                                placeholder="Buscar conversación..."
                                value={convSearch}
                                onChange={e => setConvSearch(e.target.value)}
                                className="
                                    w-full bg-tech-surface/40 border border-tech-surface/60
                                    rounded-xl pl-9 pr-3 py-2
                                    text-xs text-tech-text placeholder:text-tech-muted
                                    outline-none focus:border-tech-cyan/50 focus:bg-tech-surface/60
                                    transition-all duration-150
                                "
                            />
                        </div>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                                <div className="w-8 h-8 rounded-full border-2 border-tech-surface border-t-tech-cyan animate-spin" />
                                <p className="text-xs text-tech-muted font-mono uppercase tracking-wider">Cargando...</p>
                            </div>
                        ) : filteredConvs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 py-12 px-4 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-tech-surface/50 border border-tech-surface/60 flex items-center justify-center">
                                    <Inbox size={22} className="text-tech-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-tech-text mb-1">
                                        {convSearch ? "Sin resultados" : "Sin conversaciones"}
                                    </p>
                                    <p className="text-xs text-tech-muted">
                                        {convSearch ? "Intenta con otro término" : "Iniciá una nueva conversación"}
                                    </p>
                                </div>
                                {!convSearch && (
                                    <button
                                        onClick={() => setShowCompose(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-tech-cyan/15 border border-tech-cyan/30 text-tech-cyan rounded-xl text-xs font-bold hover:bg-tech-cyan/25 transition-all"
                                    >
                                        <Plus size={13} /> Nuevo mensaje
                                    </button>
                                )}
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
                </aside>
            )}

            {/* ═══════ RIGHT PANEL: Active chat ═══════ */}
            {showRight && (
                <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                    {activeUser ? (
                        <>
                            {/* Chat header */}
                            <header className="
                                shrink-0 flex items-center justify-between
                                px-4 py-3
                                border-b border-tech-surface/40
                                bg-tech-secondary/70 backdrop-blur-md
                            ">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        onClick={() => setActiveChatKey(null)}
                                        title="Volver"
                                        className="shrink-0 p-1.5 rounded-xl text-tech-muted hover:text-tech-cyan hover:bg-tech-surface/60 transition-all duration-150"
                                    >
                                        <ArrowLeft size={17} />
                                    </button>
                                    <Avatar name={activeUser.nombre} isRole={activeUser.isRole} size="sm" />
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-bold text-tech-text uppercase tracking-tight truncate leading-tight">
                                            {activeUser.nombre}
                                        </h2>
                                        <p className="text-[10px] text-tech-muted font-mono uppercase tracking-widest">
                                            {activeUser.isRole ? "Canal de difusión" : activeUser.rol}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowChatSearch(s => !s); setChatSearch(""); }}
                                    title="Buscar en este chat"
                                    className={`
                                        shrink-0 p-2 rounded-xl transition-all duration-150
                                        ${showChatSearch
                                            ? "bg-tech-cyan/15 text-tech-cyan"
                                            : "text-tech-muted hover:bg-tech-surface/50 hover:text-tech-text"
                                        }
                                    `}
                                >
                                    <Search size={16} />
                                </button>
                            </header>

                            {/* Animated in-chat search bar */}
                            <AnimatePresence>
                                {showChatSearch && (
                                    <motion.div
                                        key="chat-search"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className="shrink-0 overflow-hidden border-b border-tech-surface/30"
                                    >
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-tech-surface/15">
                                            <Search size={13} className="text-tech-muted shrink-0" />
                                            <input
                                                autoFocus
                                                type="search"
                                                placeholder="Buscar en esta conversación..."
                                                value={chatSearch}
                                                onChange={e => setChatSearch(e.target.value)}
                                                className="flex-1 min-w-0 bg-transparent text-xs text-tech-text outline-none placeholder:text-tech-muted"
                                            />
                                            {chatSearch && (
                                                <button onClick={() => setChatSearch("")} className="text-tech-muted hover:text-tech-text transition-colors">
                                                    <X size={13} />
                                                </button>
                                            )}
                                            {chatSearch && (
                                                <span className="text-[10px] text-tech-muted font-mono shrink-0">
                                                    {displayMsgs.length} resultado{displayMsgs.length !== 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ── Messages area ── KEY: flex-1 min-h-0 overflow-y-auto */}
                            <div
                                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-5 custom-scrollbar"
                                style={{ overscrollBehaviorY: "contain" }}
                            >
                                {displayMsgs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                                        <div className="w-16 h-16 rounded-3xl bg-tech-surface/50 border border-tech-surface/60 flex items-center justify-center">
                                            <MessageSquare size={26} className="text-tech-muted" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-tech-text mb-1">
                                                {chatSearch ? "Sin resultados" : "Sin mensajes aún"}
                                            </p>
                                            <p className="text-xs text-tech-muted max-w-[220px] leading-relaxed">
                                                {chatSearch
                                                    ? `No se encontraron mensajes con "${chatSearch}"`
                                                    : `Sé el primero en escribirle a ${activeUser.nombre}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    (() => {
                                        let lastLabel = "";
                                        return displayMsgs.map((msg, i) => {
                                            const label = fmtDate(msg.fecha_envio || msg.created_at);
                                            const showDivider = label !== lastLabel;
                                            lastLabel = label;
                                            const isMine = msg.remitente_id === user?.id;
                                            return (
                                                <React.Fragment key={msg.id ?? i}>
                                                    {showDivider && <DateDivider label={label} />}
                                                    <MessageBubble
                                                        msg={msg}
                                                        isMine={isMine}
                                                        showSender={!!(activeUser.isRole && !isMine)}
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
                                        key="attachment"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="shrink-0 overflow-hidden"
                                    >
                                        <div className="mx-4 mb-2 px-3 py-2 bg-tech-surface/40 border border-tech-surface/60 rounded-xl flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-xs font-mono text-tech-cyan min-w-0">
                                                <span className="shrink-0">{attachment.type === "image" ? "📷" : "📎"}</span>
                                                <span className="truncate">{attachment.name}</span>
                                            </div>
                                            <button
                                                onClick={() => setAttachment(null)}
                                                className="shrink-0 p-1 rounded-lg text-tech-muted hover:text-tech-danger hover:bg-tech-danger/10 transition-all"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Emoji picker */}
                            <AnimatePresence>
                                {showEmoji && (
                                    <motion.div
                                        key="emoji"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="shrink-0 overflow-hidden"
                                    >
                                        <div className="mx-4 mb-2 px-3 py-2 bg-tech-secondary/90 border border-tech-surface/60 rounded-2xl flex flex-wrap gap-1">
                                            {QUICK_EMOJIS.map(em => (
                                                <button
                                                    key={em}
                                                    onClick={() => {
                                                        setNewMessage(p => p + em);
                                                        setShowEmoji(false);
                                                        inputRef.current?.focus();
                                                    }}
                                                    className="p-1.5 text-lg rounded-xl hover:bg-tech-surface/60 transition-all active:scale-110"
                                                >
                                                    {em}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Input bar */}
                            <form
                                onSubmit={sendMessage}
                                className="shrink-0 px-4 py-3 border-t border-tech-surface/40 bg-tech-secondary/70 backdrop-blur-md"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Adjuntar archivo"
                                        className="shrink-0 p-2.5 text-tech-muted hover:text-tech-cyan hover:bg-tech-surface/60 rounded-xl transition-all duration-150"
                                    >
                                        <Paperclip size={17} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowEmoji(s => !s)}
                                        title="Emojis"
                                        className={`shrink-0 p-2.5 rounded-xl transition-all duration-150 ${
                                            showEmoji
                                                ? "bg-tech-cyan/15 text-tech-cyan"
                                                : "text-tech-muted hover:bg-tech-surface/60 hover:text-tech-text"
                                        }`}
                                    >
                                        <Smile size={17} />
                                    </button>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage(e);
                                            }
                                        }}
                                        disabled={isReadOnly}
                                        placeholder={
                                            isReadOnly
                                                ? "No tenés permiso para escribir en este canal"
                                                : "Escribe un mensaje... (Enter para enviar)"
                                        }
                                        className="
                                            flex-1 min-w-0
                                            bg-tech-surface/30 border border-tech-surface/60
                                            rounded-2xl px-4 py-2.5
                                            text-[13px] text-tech-text placeholder:text-tech-muted
                                            outline-none focus:border-tech-cyan/50 focus:bg-tech-surface/50
                                            transition-all duration-150
                                            disabled:opacity-40 disabled:cursor-not-allowed
                                        "
                                    />
                                    <button
                                        type="submit"
                                        disabled={(!newMessage.trim() && !attachment) || isReadOnly || sending}
                                        className="
                                            shrink-0 w-10 h-10
                                            bg-tech-cyan hover:bg-tech-cyan/85
                                            text-white rounded-2xl
                                            flex items-center justify-center
                                            transition-all duration-150
                                            disabled:opacity-35 disabled:cursor-not-allowed
                                            active:scale-95 shadow-sm
                                        "
                                    >
                                        {sending
                                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <Send size={16} />
                                        }
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        /* Empty state — no chat selected */
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="
                                w-24 h-24 rounded-3xl mb-6
                                bg-tech-surface/40 border border-tech-surface/60
                                flex items-center justify-center
                                text-tech-cyan
                                shadow-sm
                            ">
                                <MessageSquare size={40} />
                            </div>
                            <h2 className="text-xl font-black text-tech-text uppercase tracking-tight mb-2">
                                Mensajería Institucional
                            </h2>
                            <p className="text-sm text-tech-muted max-w-xs leading-relaxed mb-8">
                                Seleccioná una conversación de la lista o iniciá un nuevo chat con cualquier miembro de la institución.
                            </p>
                            <button
                                onClick={() => setShowCompose(true)}
                                className="
                                    flex items-center gap-2 px-5 py-2.5
                                    bg-tech-cyan text-white rounded-2xl
                                    text-sm font-bold
                                    hover:bg-tech-cyan/85 active:scale-95
                                    transition-all duration-150 shadow-sm
                                "
                            >
                                <Plus size={16} />
                                Nuevo mensaje
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ COMPOSE MODAL ═══════ */}
            <AnimatePresence>
                {showCompose && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
                    >
                        <motion.div
                            key="compose-modal"
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 16 }}
                            transition={{ type: "spring", damping: 26, stiffness: 320 }}
                            className="
                                bg-tech-secondary border border-tech-surface/60
                                rounded-3xl shadow-2xl
                                w-full max-w-md
                                flex flex-col overflow-hidden
                                max-h-[85vh]
                            "
                        >
                            {/* Modal header */}
                            <div className="shrink-0 px-5 py-4 border-b border-tech-surface/40 flex items-center justify-between bg-tech-surface/20">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-tech-cyan/15 border border-tech-cyan/25 flex items-center justify-center">
                                        <Users size={15} className="text-tech-cyan" />
                                    </div>
                                    <h3 className="text-sm font-black text-tech-text uppercase tracking-tight">
                                        Nueva conversación
                                    </h3>
                                </div>
                                <button
                                    onClick={() => { setShowCompose(false); setComposeSearch(""); }}
                                    className="p-1.5 text-tech-muted hover:text-tech-text hover:bg-tech-surface/60 rounded-xl transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="shrink-0 px-4 py-3 border-b border-tech-surface/30">
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted pointer-events-none" />
                                    <input
                                        autoFocus
                                        type="search"
                                        placeholder="Buscar usuario o canal de difusión..."
                                        value={composeSearch}
                                        onChange={e => setComposeSearch(e.target.value)}
                                        className="
                                            w-full bg-tech-surface/30 border border-tech-surface/50
                                            rounded-xl pl-9 pr-3 py-2.5
                                            text-sm text-tech-text placeholder:text-tech-muted
                                            outline-none focus:border-tech-cyan/50
                                            transition-all duration-150
                                        "
                                    />
                                </div>
                            </div>

                            {/* Results list */}
                            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                                {getNewChatOptions().length === 0 ? (
                                    <div className="py-10 text-center">
                                        <p className="text-sm text-tech-muted">No se encontraron resultados</p>
                                    </div>
                                ) : (
                                    getNewChatOptions().map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setActiveChatKey(opt.id);
                                                setShowCompose(false);
                                                setComposeSearch("");
                                            }}
                                            className="
                                                w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left
                                                hover:bg-tech-surface/50 border border-transparent
                                                hover:border-tech-surface/40 transition-all duration-150
                                            "
                                        >
                                            <Avatar name={opt.nombre} isRole={opt.isRole} size="sm" />
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-bold text-tech-text uppercase tracking-tight truncate leading-tight">
                                                    {opt.nombre}
                                                </p>
                                                <p className="text-[10px] text-tech-muted font-mono mt-0.5">
                                                    {opt.isRole ? "Canal de difusión" : opt.rol}
                                                </p>
                                            </div>
                                            {opt.isRole && (
                                                <Megaphone size={13} className="shrink-0 text-tech-accent ml-auto" />
                                            )}
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
