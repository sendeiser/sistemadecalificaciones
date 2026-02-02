import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Clock, ArrowLeft, ChevronLeft, ChevronRight, Database, User,
    Activity, ChevronDown, ChevronUp, Trash2, Edit3, PlusCircle,
    Shield, Filter, X, Calendar, RefreshCcw
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getApiEndpoint } from '../utils/api';
import PageTransition from '../components/PageTransition';
import DiffViewer from '../components/DiffViewer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download, FileDown, Table } from 'lucide-react';

const AuditLogs = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        entidad_tipo: '',
        accion: '',
        desde: '',
        hasta: ''
    });
    const [expandedLog, setExpandedLog] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (profile?.rol !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchLogs();
    }, [page, filters]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let url = `${getApiEndpoint('/audit')}?page=${page}&limit=20`;

            if (filters.entidad_tipo) url += `&entidad_tipo=${filters.entidad_tipo}`;
            if (filters.accion) url += `&accion=${filters.accion}`;
            if (filters.desde) url += `&desde=${filters.desde}`;
            if (filters.hasta) url += `&hasta=${filters.hasta}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    const exportData = async (format) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let url = `${getApiEndpoint('/audit')}?exportar=true`;
            if (filters.entidad_tipo) url += `&entidad_tipo=${filters.entidad_tipo}`;
            if (filters.accion) url += `&accion=${filters.accion}`;
            if (filters.desde) url += `&desde=${filters.desde}`;
            if (filters.hasta) url += `&hasta=${filters.hasta}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (!res.ok) throw new Error('Error al obtener datos para exportar');
            const data = await res.json();
            const exportLogs = data.logs;

            if (format === 'pdf') {
                const doc = new jsPDF('l', 'mm', 'a4');
                const title = 'Reporte de Auditoría de Sistema';
                const timestamp = `Generado: ${new Date().toLocaleString('es-AR')}`;

                doc.setFontSize(18);
                doc.setTextColor(40);
                doc.text(title, 14, 20);

                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(timestamp, 14, 28);

                const tableData = exportLogs.map(log => [
                    new Date(log.fecha).toLocaleString('es-AR'),
                    log.usuario?.nombre || 'SISTEMA',
                    log.accion,
                    log.datos_anteriores ? JSON.stringify(log.datos_anteriores, null, 2) : '-',
                    log.datos_nuevos ? JSON.stringify(log.datos_nuevos, null, 2) : '-'
                ]);

                autoTable(doc, {
                    head: [['Fecha', 'Usuario', 'Acción', 'Estado Anterior', 'Estado Nuevo']],
                    body: tableData,
                    startY: 35,
                    theme: 'grid',
                    styles: {
                        fontSize: 7,
                        cellPadding: 2,
                        valign: 'top',
                        overflow: 'linebreak'
                    },
                    headStyles: {
                        fillColor: [6, 182, 212], // Cyan Institucional
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    columnStyles: {
                        0: { cellWidth: 30 }, // Fecha
                        1: { cellWidth: 40 }, // Usuario
                        2: { cellWidth: 35 }, // Accion
                        3: { cellWidth: 75 }, // Datos Anteriores
                        4: { cellWidth: 75 }  // Datos Nuevos
                    },
                    didDrawPage: (data) => {
                        const pageSize = doc.internal.pageSize;
                        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                        doc.setFontSize(8);
                        doc.text(`Página ${data.pageNumber}`, data.settings.margin.left, pageHeight - 10);
                    }
                });
                doc.save(`Auditoria_Reporte_${new Date().getTime()}.pdf`);
            } else {
                const formattedData = exportLogs.map(log => ({
                    'Fecha y Hora': new Date(log.fecha).toLocaleString('es-AR'),
                    'Usuario Actor': log.usuario?.nombre || 'SISTEMA',
                    'Email/ID': log.usuario?.email || log.usuario_id || '-',
                    'Acción Técnica': log.accion,
                    'Estado Anterior': log.datos_anteriores ? JSON.stringify(log.datos_anteriores, null, 2) : '-',
                    'Estado Nuevo': log.datos_nuevos ? JSON.stringify(log.datos_nuevos, null, 2) : '-'
                }));

                const ws = XLSX.utils.json_to_sheet(formattedData);

                // Definir anchos de columna (en caracteres aproximados)
                const wscols = [
                    { wch: 20 }, // Fecha
                    { wch: 25 }, // Usuario
                    { wch: 30 }, // Email
                    { wch: 25 }, // Accion
                    { wch: 50 }, // Anterior
                    { wch: 50 }  // Nuevo
                ];
                ws['!cols'] = wscols;

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Sistema");
                XLSX.writeFile(wb, `Auditoria_Format_${new Date().getTime()}.xlsx`);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Error al exportar registros');
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = useCallback((accion) => {
        if (accion.includes('INSERT') || accion.includes('CREATE'))
            return <PlusCircle size={16} className="text-tech-success" />;
        if (accion.includes('UPDATE'))
            return <Edit3 size={16} className="text-tech-cyan" />;
        if (accion.includes('DELETE'))
            return <Trash2 size={16} className="text-tech-danger" />;
        return <Activity size={16} className="text-tech-muted" />;
    }, []);

    const getEntityColor = useCallback((type) => {
        const colors = {
            calificacion: 'text-tech-cyan bg-tech-cyan/10 border-tech-cyan/30',
            asistencia: 'text-tech-accent bg-tech-accent/10 border-tech-accent/30',
            perfil: 'text-tech-success bg-tech-success/10 border-tech-success/30',
            invitacion: 'text-tech-warning bg-tech-warning/10 border-tech-warning/30',
            materia: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
            asignacion: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
            anuncio: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
            evento_calendario: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
            logro: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
            mensaje: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
            mensaje_send: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30'
        };
        return colors[type] || 'text-tech-muted bg-tech-surface border-tech-surface';
    }, []);

    const formatDate = useCallback((dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
            time: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        };
    }, []);

    const formatDiff = useCallback((data) => {
        if (!data) return 'N/A';
        return JSON.stringify(data, null, 2);
    }, []);

    const hasActiveFilters = useMemo(() => {
        return filters.entidad_tipo || filters.accion || filters.desde || filters.hasta;
    }, [filters]);

    const clearFilters = useCallback(() => {
        setFilters({ entidad_tipo: '', accion: '', desde: '', hasta: '' });
        setPage(1);
    }, []);

    return (
        <PageTransition>
            <div className="min-h-screen bg-tech-primary text-tech-text p-4 md:p-10 font-sans">
                {/* Header */}
                <header className="mb-6 md:mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-tech-secondary rounded-full transition-colors text-tech-muted hover:text-tech-cyan"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-grow">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                                <Shield className="text-tech-cyan" size={24} />
                                <span>Auditoría</span>
                                <span className="text-tech-muted hidden sm:inline">de Sistema</span>
                            </h1>
                            <p className="text-tech-muted font-mono text-xs mt-1 hidden md:block">
                                REGISTRO CENTRALIZADO DE ACCIONES CRÍTICAS
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchLogs()}
                                disabled={loading}
                                className={`p-2 rounded-lg border transition-all ${loading
                                    ? 'bg-tech-surface opacity-50'
                                    : 'bg-tech-secondary border-tech-surface text-tech-muted hover:text-tech-cyan'
                                    }`}
                                title="Actualizar"
                            >
                                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`md:hidden p-2 rounded-lg border transition-all ${showFilters || hasActiveFilters
                                    ? 'bg-tech-cyan/20 border-tech-cyan text-tech-cyan'
                                    : 'bg-tech-secondary border-tech-surface text-tech-muted'
                                    }`}
                            >
                                <Filter size={20} />
                            </button>
                            <div className="hidden md:flex items-center gap-2 border-l border-tech-surface pl-2 ml-2">
                                <button
                                    onClick={() => exportData('pdf')}
                                    disabled={loading || logs.length === 0}
                                    className="p-2 bg-tech-danger/10 text-tech-danger rounded-lg border border-tech-danger/20 hover:bg-tech-danger/20 transition-all disabled:opacity-50"
                                    title="Exportar PDF"
                                >
                                    <FileDown size={20} />
                                </button>
                                <button
                                    onClick={() => exportData('excel')}
                                    disabled={loading || logs.length === 0}
                                    className="p-2 bg-tech-success/10 text-tech-success rounded-lg border border-tech-success/20 hover:bg-tech-success/20 transition-all disabled:opacity-50"
                                    title="Exportar Excel"
                                >
                                    <Table size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Filters */}
                <div className={`mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden md:block'}`}>
                    <div className="bg-tech-secondary/50 p-4 md:p-6 rounded-xl border border-tech-surface shadow-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-black text-tech-muted mb-1.5 tracking-widest">
                                    Entidad
                                </label>
                                <select
                                    value={filters.entidad_tipo}
                                    onChange={(e) => setFilters({ ...filters, entidad_tipo: e.target.value })}
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm focus:border-tech-cyan outline-none transition-colors"
                                >
                                    <option value="">Todas</option>
                                    <option value="calificacion">Calificaciones</option>
                                    <option value="asistencia">Asistencia</option>
                                    <option value="perfil">Usuarios/Alumnos</option>
                                    <option value="invitacion">Invitaciones</option>
                                    <option value="materia">Materias</option>
                                    <option value="asignacion">Asignaciones</option>
                                    <option value="anuncio">Anuncios</option>
                                    <option value="evento_calendario">Calendario</option>
                                    <option value="logro">Logros/Medallas</option>
                                    <option value="mensaje">Mensajería</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-black text-tech-muted mb-1.5 tracking-widest">
                                    Acción
                                </label>
                                <select
                                    value={filters.accion}
                                    onChange={(e) => setFilters({ ...filters, accion: e.target.value })}
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm focus:border-tech-cyan outline-none transition-colors"
                                >
                                    <option value="">Todas</option>
                                    <option value="INSERT">Creaciones</option>
                                    <option value="UPDATE">Modificaciones</option>
                                    <option value="DELETE">Eliminaciones</option>
                                    <option value="SEND">Envíos (Mensajes)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-black text-tech-muted mb-1.5 tracking-widest">
                                    Desde
                                </label>
                                <input
                                    type="date"
                                    value={filters.desde}
                                    onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm focus:border-tech-cyan outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-black text-tech-muted mb-1.5 tracking-widest">
                                    Hasta
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={filters.hasta}
                                        onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
                                        className="flex-grow bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm focus:border-tech-cyan outline-none"
                                    />
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="p-2 bg-tech-danger/20 text-tech-danger rounded hover:bg-tech-danger/30 transition-all"
                                            title="Limpiar filtros"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Logs - Mobile Cards & Desktop Table */}
                < div className="bg-tech-secondary border border-tech-surface rounded-xl overflow-hidden shadow-2xl mb-6" >
                    {
                        loading ? (
                            <div className="p-12 md:p-20 flex flex-col items-center justify-center gap-4" >
                                <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-tech-cyan border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-tech-muted font-mono animate-pulse uppercase tracking-widest text-[10px] md:text-xs">
                                    Desencriptando registros...
                                </p>
                            </div>
                        ) : logs.length > 0 ? (
                            <>
                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-tech-surface">
                                    {logs.map((log) => {
                                        const [type, action] = log.accion.split(':');
                                        const isExpanded = expandedLog === log.id;
                                        const { date, time } = formatDate(log.fecha);

                                        return (
                                            <div key={log.id} className="p-4">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-start gap-3 flex-grow min-w-0">
                                                        <div className="w-10 h-10 rounded bg-tech-surface flex items-center justify-center text-tech-cyan flex-shrink-0">
                                                            <User size={18} />
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <p className="text-sm font-bold text-tech-text truncate">
                                                                {log.usuario?.nombre || 'SISTEMA'}
                                                            </p>
                                                            <p className="text-[10px] text-tech-muted font-mono truncate">
                                                                {log.usuario?.email || 'automated@system'}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getEntityColor(type)}`}>
                                                                    {type}
                                                                </span>
                                                                <div className="flex items-center gap-1 text-tech-muted">
                                                                    {getActionIcon(action || type)}
                                                                    <span className="text-[10px] font-mono uppercase font-bold">
                                                                        {action || type}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[10px] font-mono text-tech-muted uppercase">{date}</p>
                                                        <p className="text-[10px] font-mono text-tech-cyan">{time}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-tech-cyan hover:bg-tech-surface/30 rounded transition-colors"
                                                >
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    {isExpanded ? 'Ocultar Detalles' : 'Ver Detalles'}
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-3">
                                                        <DiffViewer
                                                            before={log.datos_anteriores}
                                                            after={log.datos_nuevos}
                                                            isMobile={true}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-tech-surface/50 border-b border-tech-surface">
                                                <th className="px-6 py-4 text-xs uppercase font-black text-tech-muted tracking-widest font-mono">
                                                    Timestamp
                                                </th>
                                                <th className="px-6 py-4 text-xs uppercase font-black text-tech-muted tracking-widest font-mono">
                                                    Usuario
                                                </th>
                                                <th className="px-6 py-4 text-xs uppercase font-black text-tech-muted tracking-widest font-mono">
                                                    Acción
                                                </th>
                                                <th className="px-6 py-4 text-xs uppercase font-black text-tech-muted tracking-widest font-mono">
                                                    Entidad
                                                </th>
                                                <th className="px-6 py-4 text-xs uppercase font-black text-tech-muted tracking-widest font-mono">
                                                    Detalles
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map((log) => {
                                                const [type, action] = log.accion.split(':');
                                                const isExpanded = expandedLog === log.id;

                                                return (
                                                    <React.Fragment key={log.id}>
                                                        <tr className={`border-b border-tech-surface hover:bg-tech-surface/30 transition-colors ${isExpanded ? 'bg-tech-surface/20' : ''
                                                            }`}>
                                                            <td className="px-6 py-4 font-mono text-[10px] text-tech-muted whitespace-nowrap">
                                                                {new Date(log.fecha).toLocaleString('es-AR')}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded bg-tech-surface flex items-center justify-center text-tech-cyan flex-shrink-0">
                                                                        <User size={16} />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-sm font-bold text-tech-text leading-tight truncate">
                                                                            {log.usuario?.nombre || 'SISTEMA'}
                                                                        </span>
                                                                        <span className="text-[10px] text-tech-muted font-mono truncate">
                                                                            {log.usuario?.email || 'automated@system'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    {getActionIcon(action || type)}
                                                                    <span className="text-xs font-mono uppercase font-bold tracking-tighter">
                                                                        {action || type}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getEntityColor(type)}`}>
                                                                    {type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                                                    className="flex items-center gap-1 text-xs font-bold text-tech-cyan hover:underline"
                                                                >
                                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                    {isExpanded ? 'Ocultar' : 'Ver Data'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr className="bg-tech-primary/50">
                                                                <td colSpan="5" className="p-6 border-b border-tech-surface">
                                                                    <DiffViewer
                                                                        before={log.datos_anteriores}
                                                                        after={log.datos_nuevos}
                                                                        isMobile={false}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="p-12 md:p-20 text-center text-tech-muted font-mono">
                                <Database size={40} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm">No se encontraron registros que coincidan con los filtros.</p>
                            </div>
                        )}
                </div >

                {/* Pagination */}
                {
                    totalPages > 1 && (
                        <div className="flex justify-between items-center bg-tech-secondary p-3 md:p-4 rounded-xl border border-tech-surface font-mono text-xs">
                            <div className="text-tech-muted uppercase tracking-widest text-[10px] md:text-xs">
                                Pág. <span className="text-tech-cyan">{page}</span>/<span className="text-tech-cyan">{totalPages}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="p-2 bg-tech-surface rounded disabled:opacity-30 hover:text-tech-cyan transition-colors disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="p-2 bg-tech-surface rounded disabled:opacity-30 hover:text-tech-cyan transition-colors disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >

            <style jsx>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 2px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #06b6d4;
                }
            `}</style>
        </PageTransition >
    );
};

export default AuditLogs;
