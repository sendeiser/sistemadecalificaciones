import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Search,
    RefreshCw,
    UserCheck,
    UserX,
    Filter,
    FileSpreadsheet,
    Printer,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Clock,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { getApiEndpoint } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceDiscrepancies = () => {
    const navigate = useNavigate();
    const addToast = useToast();

    // State
    const [divisions, setDivisions] = useState([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState('all');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [discrepancies, setDiscrepancies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'conflict' | 'missing'

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        try {
            const { data } = await supabase.from('divisiones').select('*').order('anio').order('seccion');
            if (data) setDivisions(data);
        } catch (err) {
            console.error('Error fetching divisions:', err);
        }
    };

    const fetchDiscrepancies = async (isManual = false) => {
        if (!date) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const divParam = selectedDivisionId || 'all';
            const endpoint = getApiEndpoint(`/attendance/discrepancies/${divParam}?date=${date}`);

            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setDiscrepancies(data);
                if (isManual) {
                    if (data.length === 0) {
                        addToast('Excelente: No hay discrepancias en esta fecha', 'success');
                    } else {
                        addToast(`Se detectaron ${data.length} discrepancias`, 'info');
                    }
                }
            } else {
                throw new Error(data.error || 'Error al cargar datos');
            }
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscrepancies();
    }, [selectedDivisionId, date]);

    // Quick Date Helpers
    const setQuickDate = (type) => {
        const today = new Date();
        if (type === 'today') {
            setDate(today.toISOString().split('T')[0]);
        } else if (type === 'yesterday') {
            const yest = new Date(today);
            yest.setDate(today.getDate() - 1);
            setDate(yest.toISOString().split('T')[0]);
        }
    };

    // Filtered Discrepancies
    const filteredDiscrepancies = useMemo(() => {
        return discrepancies.filter(d => {
            const matchesSearch =
                d.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.division && d.division.toLowerCase().includes(searchQuery.toLowerCase())) ||
                d.materias.some(m => m.materia.toLowerCase().includes(searchQuery.toLowerCase()));

            const isMissingTeacher = d.materias.length === 0;
            const isConflict = d.materias.some(m => m.estado !== d.preceptor);

            if (filterType === 'missing') return matchesSearch && isMissingTeacher;
            if (filterType === 'conflict') return matchesSearch && isConflict;
            return matchesSearch;
        });
    }, [discrepancies, searchQuery, filterType]);

    // KPI Metrics
    const kpis = useMemo(() => {
        const total = discrepancies.length;
        const missingCount = discrepancies.filter(d => d.materias.length === 0).length;
        const conflictCount = discrepancies.filter(d => d.materias.some(m => m.estado !== d.preceptor)).length;
        return { total, missingCount, conflictCount };
    }, [discrepancies]);

    // Export CSV
    const exportToCSV = () => {
        if (filteredDiscrepancies.length === 0) {
            addToast('No hay discrepancias para exportar', 'warning');
            return;
        }

        const headers = ['Estudiante', 'División', 'Estado Preceptor', 'Registros Docentes / Materias', 'Tipo de Conflicto'];
        const rows = filteredDiscrepancies.map(d => {
            const teacherStr = d.materias.length > 0
                ? d.materias.map(m => `${m.materia}: ${m.estado}`).join(' | ')
                : 'Sin carga docente';
            const conflictType = d.materias.length === 0 ? 'Sin Carga Docente' : 'Estado Contradictorio';

            return [
                `"${d.nombre}"`,
                `"${d.division || 'N/A'}"`,
                `"${d.preceptor}"`,
                `"${teacherStr}"`,
                `"${conflictType}"`
            ];
        });

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Discrepancias_Asistencia_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Reporte de discrepancias exportado', 'success');
    };

    const getStatusBadge = (estado) => {
        const styles = {
            presente: 'bg-tech-cyan/15 text-tech-cyan border-tech-cyan/30',
            ausente: 'bg-tech-danger/15 text-tech-danger border-tech-danger/30',
            tarde: 'bg-tech-accent/15 text-tech-accent border-tech-accent/30',
            justificado: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        };
        return (
            <span className={`px-2.5 py-1 rounded-xl border text-[11px] font-black uppercase tracking-wider font-mono ${styles[estado] || 'bg-tech-surface/40 text-tech-muted'}`}>
                {estado}
            </span>
        );
    };

    return (
        <div className="w-full min-h-full space-y-8 font-sans pb-16">
            {/* ════════════════ HEADER SECTION ════════════════ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tech-surface/60 pb-6">
                <div className="flex items-center gap-3.5">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2.5 rounded-2xl bg-tech-secondary border border-tech-surface hover:bg-tech-surface/50 text-tech-muted hover:text-tech-cyan transition-all shadow-sm active:scale-95"
                        title="Volver al Panel Principal"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-tech-accent/15 text-tech-accent border border-tech-accent/25">
                                <AlertCircle size={18} />
                            </span>
                            <h1 className="text-xl md:text-2xl font-black text-tech-text uppercase tracking-tight">
                                Auditoría de Discrepancias de Asistencia
                            </h1>
                        </div>
                        <p className="text-xs text-tech-muted mt-1 font-mono">
                            Detección de diferencias entre asistencia tomadas por Preceptoría y los docentes en materias
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => fetchDiscrepancies(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-tech-secondary border border-tech-surface/70 text-tech-text text-xs font-bold hover:bg-tech-surface/50 hover:text-tech-cyan transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                        title="Refrescar Consulta"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin text-tech-cyan' : ''} />
                        <span>Analizar</span>
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-tech-secondary border border-tech-surface/70 text-tech-text text-xs font-bold hover:bg-tech-surface/50 hover:text-tech-cyan transition-all active:scale-95 shadow-sm"
                        title="Exportar discrepancias a CSV"
                    >
                        <FileSpreadsheet size={14} className="text-tech-cyan" />
                        <span>Exportar CSV</span>
                    </button>
                </div>
            </div>

            {/* ════════════════ FILTERS BAR ════════════════ */}
            <div className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-tech-surface/40 pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-tech-text font-mono flex items-center gap-2">
                        <Filter size={14} className="text-tech-cyan" />
                        Parámetros de Auditoría
                    </span>
                    <span className="text-[11px] text-tech-muted font-mono">
                        Fecha: {date}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {/* Division selector */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            División / Curso
                        </label>
                        <select
                            className="w-full bg-tech-surface/30 border border-tech-surface/70 rounded-xl px-3.5 py-2.5 text-xs text-tech-text outline-none focus:border-tech-cyan/50 transition-all font-sans"
                            value={selectedDivisionId}
                            onChange={e => setSelectedDivisionId(e.target.value)}
                        >
                            <option value="all">Todas las Divisiones</option>
                            {divisions.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.anio}° "{d.seccion}"
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Datepicker */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            Fecha de Asistencia
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-tech-surface/30 border border-tech-surface/70 rounded-xl px-3.5 py-2 text-xs text-tech-text outline-none focus:border-tech-cyan/50 transition-all font-mono"
                        />
                    </div>

                    {/* Quick Date Pills */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            Accesos Rápido
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setQuickDate('today')}
                                className="flex-1 py-2 bg-tech-surface/40 hover:bg-tech-cyan/20 hover:text-tech-cyan border border-tech-surface/60 rounded-xl text-[10px] font-bold uppercase tracking-tight text-tech-text transition-all"
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => setQuickDate('yesterday')}
                                className="flex-1 py-2 bg-tech-surface/40 hover:bg-tech-cyan/20 hover:text-tech-cyan border border-tech-surface/60 rounded-xl text-[10px] font-bold uppercase tracking-tight text-tech-text transition-all"
                            >
                                Ayer
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            Buscar en Resultados
                        </label>
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" />
                            <input
                                type="text"
                                placeholder="Alumno, división o materia..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-tech-surface/30 border border-tech-surface/70 rounded-xl pl-9 pr-3 py-2 text-xs text-tech-text placeholder:text-tech-muted outline-none focus:border-tech-cyan/50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════ KPI CARDS ════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-tech-muted font-mono">
                            Total Discrepancias
                        </span>
                        <span className={`p-2 rounded-2xl ${kpis.total > 0 ? 'bg-tech-accent/15 text-tech-accent' : 'bg-tech-cyan/15 text-tech-cyan'}`}>
                            <AlertCircle size={18} />
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-tech-text font-mono">
                            {loading ? '--' : kpis.total}
                        </span>
                        <span className={`text-xs font-mono font-bold ${kpis.total > 0 ? 'text-tech-accent' : 'text-tech-cyan'}`}>
                            {kpis.total === 0 ? '🟢 Sin Inconsistencias' : '🔴 Revisión Sugerida'}
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-tech-muted font-mono">
                            Conflictos de Estado
                        </span>
                        <span className="p-2 rounded-2xl bg-tech-danger/15 text-tech-danger">
                            <ShieldAlert size={18} />
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-tech-danger font-mono">
                            {loading ? '--' : kpis.conflictCount}
                        </span>
                        <span className="text-xs text-tech-muted font-mono">
                            Preceptor vs Docente
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-tech-muted font-mono">
                            Sin Carga por Docente
                        </span>
                        <span className="p-2 rounded-2xl bg-blue-500/15 text-blue-400">
                            <UserX size={18} />
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-blue-400 font-mono">
                            {loading ? '--' : kpis.missingCount}
                        </span>
                        <span className="text-xs text-tech-muted font-mono">
                            Pendiente de toma por materia
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* ════════════════ RESULTS TABLE & CARDS ════════════════ */}
            <div className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tech-surface/40 pb-4">
                    <div>
                        <h3 className="text-base font-bold text-tech-text uppercase tracking-tight">
                            Resultados del Análisis
                        </h3>
                        <p className="text-xs text-tech-muted font-mono">
                            Mostrando {filteredDiscrepancies.length} registros para {date}
                        </p>
                    </div>

                    {/* Sub-filter tabs */}
                    <div className="flex items-center gap-1 bg-tech-surface/30 p-1 rounded-xl border border-tech-surface/50">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${filterType === 'all' ? 'bg-tech-cyan text-white shadow-sm' : 'text-tech-muted hover:text-tech-text'}`}
                        >
                            Todos ({discrepancies.length})
                        </button>
                        <button
                            onClick={() => setFilterType('conflict')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${filterType === 'conflict' ? 'bg-tech-danger text-white shadow-sm' : 'text-tech-muted hover:text-tech-text'}`}
                        >
                            Conflictos ({kpis.conflictCount})
                        </button>
                        <button
                            onClick={() => setFilterType('missing')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${filterType === 'missing' ? 'bg-blue-600 text-white shadow-sm' : 'text-tech-muted hover:text-tech-text'}`}
                        >
                            Sin Carga ({kpis.missingCount})
                        </button>
                    </div>
                </div>

                {/* Table View (Desktop) */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs text-tech-text border-collapse">
                        <thead>
                            <tr className="border-b border-tech-surface/60 text-tech-muted uppercase font-mono tracking-wider">
                                <th className="py-3.5 px-4">Estudiante</th>
                                <th className="py-3.5 px-4">División</th>
                                <th className="py-3.5 px-4 text-center">Estado Preceptor</th>
                                <th className="py-3.5 px-4">Registros de Docentes en Materias</th>
                                <th className="py-3.5 px-4 text-center">Tipo Conflicto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-tech-surface/40">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-tech-muted font-mono uppercase tracking-widest">
                                        <div className="inline-block w-6 h-6 border-2 border-tech-cyan border-t-transparent rounded-full animate-spin mb-2" />
                                        <p>Analizando asistencias...</p>
                                    </td>
                                </tr>
                            ) : filteredDiscrepancies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-tech-cyan/15 text-tech-cyan border border-tech-cyan/30 flex items-center justify-center mx-auto mb-3">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-tech-text mb-1">
                                            Sin discrepancias para los criterios aplicados
                                        </p>
                                        <p className="text-xs text-tech-muted font-mono">
                                            La toma general del preceptor coincide con la toma por materias de los docentes.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDiscrepancies.map((d, idx) => {
                                    const isMissing = d.materias.length === 0;
                                    return (
                                        <tr key={d.estudiante_id || idx} className="hover:bg-tech-surface/30 transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-tech-text uppercase">
                                                {d.nombre}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-tech-cyan font-semibold">
                                                {d.division || 'N/A'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {getStatusBadge(d.preceptor)}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {isMissing ? (
                                                    <span className="text-[11px] text-tech-danger italic font-mono flex items-center gap-1">
                                                        <UserX size={13} /> Sin registros tomados por docentes hoy
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {d.materias.map((m, mIdx) => (
                                                            <div key={mIdx} className="flex items-center gap-1.5 px-2.5 py-1 bg-tech-surface/40 rounded-xl border border-tech-surface/60">
                                                                <span className="text-[10px] font-mono text-tech-muted uppercase font-bold">{m.materia}:</span>
                                                                {getStatusBadge(m.estado)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono border ${
                                                    isMissing
                                                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                                        : 'bg-tech-danger/15 text-tech-danger border border-tech-danger/30'
                                                }`}>
                                                    {isMissing ? 'Sin Carga' : 'Inconsistente'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden space-y-3">
                    {loading ? (
                        <div className="py-12 text-center text-tech-muted font-mono">Cargando...</div>
                    ) : filteredDiscrepancies.length === 0 ? (
                        <div className="py-12 text-center text-tech-muted font-mono">Sin discrepancias</div>
                    ) : (
                        filteredDiscrepancies.map((d, idx) => (
                            <div key={d.estudiante_id || idx} className="p-4 bg-tech-surface/20 rounded-2xl border border-tech-surface/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-tech-text text-sm uppercase">{d.nombre}</p>
                                        <p className="text-[10px] font-mono text-tech-cyan">{d.division}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] text-tech-muted font-mono uppercase block mb-1">Preceptor</span>
                                        {getStatusBadge(d.preceptor)}
                                    </div>
                                </div>
                                <div className="border-t border-tech-surface/40 pt-2 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-tech-muted font-mono">Registros por Materia</p>
                                    {d.materias.length === 0 ? (
                                        <p className="text-xs text-tech-danger italic font-mono">Sin registros de docentes</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {d.materias.map((m, mIdx) => (
                                                <div key={mIdx} className="flex items-center justify-between bg-tech-primary/30 p-2 rounded-xl text-xs font-mono">
                                                    <span className="text-tech-muted font-bold truncate max-w-[160px]">{m.materia}</span>
                                                    {getStatusBadge(m.estado)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceDiscrepancies;
