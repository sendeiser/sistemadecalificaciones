import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    FileText,
    ShieldAlert,
    Search,
    Filter,
    FileSpreadsheet,
    Printer,
    RefreshCw,
    AlertCircle,
    UserX,
    CheckCircle2
} from 'lucide-react';
import { getApiEndpoint } from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceAlerts = () => {
    const navigate = useNavigate();
    const addToast = useToast();

    // Data State
    const [divisions, setDivisions] = useState([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState('all');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null); // studentId generating PDF

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'critical' | 'alert' | 'caution'

    useEffect(() => {
        fetchDivisions();
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [selectedDivisionId]);

    const fetchDivisions = async () => {
        try {
            const { data } = await supabase.from('divisiones').select('*').order('anio').order('seccion');
            if (data) setDivisions(data);
        } catch (err) {
            console.error('Error fetching divisions:', err);
        }
    };

    const fetchAlerts = async (isManual = false) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const divParam = selectedDivisionId || 'all';
            const endpoint = getApiEndpoint(`/attendance/alerts/${divParam}`);

            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setStudents(data);
                if (isManual) addToast('Alertas actualizadas con éxito', 'success');
            } else {
                throw new Error(data.error || 'Error al obtener alertas');
            }
        } catch (err) {
            console.error(err);
            addToast(err.message || 'Error al consultar alertas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCitation = async (student) => {
        setGenerating(student.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const divisionName = student.division || 'División no asignada';

            const res = await fetch(getApiEndpoint('/reports/citation'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    studentId: student.id,
                    studentName: student.nombre,
                    studentDni: student.dni,
                    divisionName: divisionName,
                    totalAbsences: student.faltas
                })
            });

            if (!res.ok) throw new Error('Error al generar PDF de citación');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Citacion_${student.nombre.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            addToast(`Citación generada para ${student.nombre}`, 'success');
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setGenerating(null);
        }
    };

    const getStatusInfo = (faltas) => {
        if (faltas >= 25) return { level: 'critical', label: 'CRÍTICO', color: 'text-tech-danger', bg: 'bg-tech-danger/15', border: 'border-tech-danger/30' };
        if (faltas >= 15) return { level: 'alert', label: 'ALERTA', color: 'text-tech-accent', bg: 'bg-tech-accent/15', border: 'border-tech-accent/30' };
        if (faltas >= 10) return { level: 'caution', label: 'PRECAUCIÓN', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' };
        return { level: 'normal', label: 'REGULAR', color: 'text-tech-cyan', bg: 'bg-tech-cyan/15', border: 'border-tech-cyan/30' };
    };

    // Filtered list
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch =
                s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.dni.includes(searchQuery) ||
                (s.division && s.division.toLowerCase().includes(searchQuery.toLowerCase()));

            const status = getStatusInfo(s.faltas);

            if (riskFilter === 'critical') return matchesSearch && status.level === 'critical';
            if (riskFilter === 'alert') return matchesSearch && status.level === 'alert';
            if (riskFilter === 'caution') return matchesSearch && status.level === 'caution';
            return matchesSearch;
        });
    }, [students, searchQuery, riskFilter]);

    // KPI Counts
    const kpis = useMemo(() => {
        const total = students.length;
        const critical = students.filter(s => s.faltas >= 25).length;
        const alert = students.filter(s => s.faltas >= 15 && s.faltas < 25).length;
        const caution = students.filter(s => s.faltas >= 10 && s.faltas < 15).length;
        return { total, critical, alert, caution };
    }, [students]);

    // CSV Export
    const exportToCSV = () => {
        if (filteredStudents.length === 0) {
            addToast('No hay alumnos para exportar', 'warning');
            return;
        }

        const headers = ['Estudiante', 'DNI', 'División', 'Total Inasistencias', 'Nivel de Riesgo'];
        const rows = filteredStudents.map(s => [
            `"${s.nombre}"`,
            `"${s.dni}"`,
            `"${s.division || 'N/A'}"`,
            s.faltas,
            `"${getStatusInfo(s.faltas).label}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Alertas_Inasistencia_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Archivo CSV descargado correctamente', 'success');
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
                            <span className="p-1.5 rounded-lg bg-tech-danger/15 text-tech-danger border border-tech-danger/25">
                                <ShieldAlert size={18} />
                            </span>
                            <h1 className="text-xl md:text-2xl font-black text-tech-text uppercase tracking-tight">
                                Monitor de Alertas de Inasistencia
                            </h1>
                        </div>
                        <p className="text-xs text-tech-muted mt-1 font-mono">
                            Seguimiento preventivo de inasistencias acumuladas y emisión de citaciones a tutores
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => fetchAlerts(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-tech-secondary border border-tech-surface/70 text-tech-text text-xs font-bold hover:bg-tech-surface/50 hover:text-tech-cyan transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                        title="Refrescar Lista de Alertas"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin text-tech-cyan' : ''} />
                        <span>Refrescar</span>
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-tech-secondary border border-tech-surface/70 text-tech-text text-xs font-bold hover:bg-tech-surface/50 hover:text-tech-cyan transition-all active:scale-95 shadow-sm"
                        title="Exportar reporte CSV"
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
                        Filtros de Búsqueda
                    </span>
                    <span className="text-[11px] text-tech-muted font-mono">
                        {filteredStudents.length} estudiantes filtrados
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
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

                    {/* Search student */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            Buscar Alumno / DNI / Curso
                        </label>
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" />
                            <input
                                type="text"
                                placeholder="Nombre, DNI o curso..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-tech-surface/30 border border-tech-surface/70 rounded-xl pl-9 pr-3 py-2 text-xs text-tech-text placeholder:text-tech-muted outline-none focus:border-tech-cyan/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Risk Level Selector */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            Nivel de Inasistencia
                        </label>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setRiskFilter('all')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase font-mono border transition-all ${riskFilter === 'all' ? 'bg-tech-cyan text-white border-tech-cyan' : 'bg-tech-surface/30 text-tech-muted border-tech-surface/60'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setRiskFilter('critical')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase font-mono border transition-all ${riskFilter === 'critical' ? 'bg-tech-danger text-white border-tech-danger' : 'bg-tech-surface/30 text-tech-muted border-tech-surface/60'}`}
                            >
                                Crítico (25+)
                            </button>
                            <button
                                onClick={() => setRiskFilter('alert')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase font-mono border transition-all ${riskFilter === 'alert' ? 'bg-tech-accent text-white border-tech-accent' : 'bg-tech-surface/30 text-tech-muted border-tech-surface/60'}`}
                            >
                                Alerta (15+)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════ KPI CARDS ════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <span className="text-xs font-bold uppercase tracking-wider text-tech-muted font-mono block mb-2">
                        Total Alumnos
                    </span>
                    <span className="text-3xl font-black text-tech-text font-mono">
                        {loading ? '--' : kpis.total}
                    </span>
                    <span className="text-[10px] text-tech-muted font-mono block mt-1">Con inasistencias registradas</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <span className="text-xs font-bold uppercase tracking-wider text-tech-danger font-mono block mb-2">
                        Estado Crítico (25+)
                    </span>
                    <span className="text-3xl font-black text-tech-danger font-mono">
                        {loading ? '--' : kpis.critical}
                    </span>
                    <span className="text-[10px] text-tech-danger font-mono block mt-1">Requiere citación urgente</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <span className="text-xs font-bold uppercase tracking-wider text-tech-accent font-mono block mb-2">
                        Alerta (15-24)
                    </span>
                    <span className="text-3xl font-black text-tech-accent font-mono">
                        {loading ? '--' : kpis.alert}
                    </span>
                    <span className="text-[10px] text-tech-accent font-mono block mt-1">En seguimiento preventivo</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 font-mono block mb-2">
                        Precaución (10-14)
                    </span>
                    <span className="text-3xl font-black text-yellow-400 font-mono">
                        {loading ? '--' : kpis.caution}
                    </span>
                    <span className="text-[10px] text-yellow-500 font-mono block mt-1">Acumulando inasistencias</span>
                </motion.div>
            </div>

            {/* ════════════════ RESULTS TABLE ════════════════ */}
            <div className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-tech-surface/40 pb-4">
                    <h3 className="text-base font-bold text-tech-text uppercase tracking-tight">
                        Listado de Alumnos y Estado de Riesgo
                    </h3>
                    <span className="text-xs text-tech-muted font-mono">
                        Ordenado por inasistencias acumuladas
                    </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs text-tech-text border-collapse">
                        <thead>
                            <tr className="border-b border-tech-surface/60 text-tech-muted uppercase font-mono tracking-wider">
                                <th className="py-3.5 px-4">Estudiante</th>
                                <th className="py-3.5 px-4">DNI</th>
                                <th className="py-3.5 px-4">División</th>
                                <th className="py-3.5 px-4 text-center">Faltas Acumuladas</th>
                                <th className="py-3.5 px-4 text-center">Nivel de Riesgo</th>
                                <th className="py-3.5 px-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-tech-surface/40">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-tech-muted font-mono uppercase tracking-widest">
                                        <div className="inline-block w-6 h-6 border-2 border-tech-cyan border-t-transparent rounded-full animate-spin mb-2" />
                                        <p>Escaneando alertas de inasistencia...</p>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-tech-muted font-mono">
                                        No se encontraron estudiantes para los filtros seleccionados
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s) => {
                                    const status = getStatusInfo(s.faltas);
                                    return (
                                        <tr key={s.id} className="hover:bg-tech-surface/30 transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-tech-text uppercase">
                                                {s.nombre}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-tech-muted">
                                                {s.dni}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-tech-cyan font-semibold">
                                                {s.division || 'N/A'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-mono font-black text-base">
                                                <span className={status.color}>{s.faltas}</span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono border ${status.bg} ${status.color} ${status.border}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    onClick={() => handleDownloadCitation(s)}
                                                    disabled={generating === s.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tech-surface/40 hover:bg-tech-cyan/20 text-tech-text hover:text-tech-cyan border border-tech-surface/60 transition-all font-mono text-[11px] font-bold disabled:opacity-50"
                                                >
                                                    {generating === s.id ? (
                                                        <div className="w-3.5 h-3.5 border-2 border-tech-cyan border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <FileText size={13} />
                                                    )}
                                                    <span>Citación PDF</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceAlerts;
