import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import {
    BarChart3,
    ArrowLeft,
    Search,
    Calendar,
    Users,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    FileSpreadsheet,
    Printer,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Filter,
    Award,
    Sparkles,
    ChevronRight,
    ShieldAlert
} from 'lucide-react';
import { getApiEndpoint } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';

ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AttendanceOverview = () => {
    const navigate = useNavigate();
    const addToast = useToast();

    // Data State
    const [divisions, setDivisions] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Table Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyRisk, setShowOnlyRisk] = useState(false);
    const [activeTab, setActiveTab] = useState('charts'); // 'charts' | 'table'

    // Fetch Divisions on Mount
    useEffect(() => {
        const fetchDivisions = async () => {
            try {
                const { data, error } = await supabase
                    .from('divisiones')
                    .select('*')
                    .order('anio', { ascending: true })
                    .order('seccion', { ascending: true });
                if (!error && data) setDivisions(data);
            } catch (err) {
                console.error('Error fetching divisions:', err);
            }
        };
        fetchDivisions();
    }, []);

    // Main Data Fetcher
    const fetchStats = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            let queryParams = [];
            if (selectedDivision && selectedDivision !== 'all') {
                queryParams.push(`division_id=${selectedDivision}`);
            }
            if (startDate) queryParams.push(`start_date=${startDate}`);
            if (endDate) queryParams.push(`end_date=${endDate}`);

            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const endpoint = getApiEndpoint(`/reports/attendance${queryString}`);

            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!res.ok) throw new Error('Error al obtener datos del servidor');

            const json = await res.json();
            setStats(json);
            if (isManual) addToast('Estadísticas actualizadas con éxito', 'success');
        } catch (e) {
            console.error('Error al cargar estadísticas:', e);
            addToast('Error al cargar estadísticas de asistencia', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [selectedDivision, startDate, endDate]);

    // Quick Date Range Preset Handlers
    const setDatePreset = (preset) => {
        const today = new Date();
        const yyyy = today.getFullYear();

        if (preset === 'today') {
            const dateStr = today.toISOString().split('T')[0];
            setStartDate(dateStr);
            setEndDate(dateStr);
        } else if (preset === 'week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            setStartDate(lastWeek.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        } else if (preset === 'month') {
            const lastMonth = new Date(today);
            lastMonth.setDate(today.getDate() - 30);
            setStartDate(lastMonth.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        } else if (preset === 'year') {
            setStartDate(`${yyyy}-03-01`);
            setEndDate(`${yyyy}-12-31`);
        } else if (preset === 'clear') {
            setStartDate('');
            setEndDate('');
        }
    };

    // Filtered Students List for Detailed Table
    const filteredStudents = useMemo(() => {
        if (!stats?.students) return [];
        return stats.students.filter(s => {
            const matchesSearch =
                s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.dni.includes(searchQuery) ||
                s.division.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRisk = showOnlyRisk ? s.isRisk : true;
            return matchesSearch && matchesRisk;
        });
    }, [stats, searchQuery, showOnlyRisk]);

    // CSV Export Handler
    const exportToCSV = () => {
        if (!stats?.students || stats.students.length === 0) {
            addToast('No hay datos para exportar', 'warning');
            return;
        }

        const headers = ['Estudiante', 'DNI', 'División', 'Presentes', 'Ausentes', 'Tardes', 'Justificados', 'Total Días', '% Asistencia', 'Estado'];
        const rows = stats.students.map(s => [
            `"${s.nombre}"`,
            `"${s.dni}"`,
            `"${s.division}"`,
            s.present,
            s.absent,
            s.late,
            s.justified,
            s.total,
            `${s.pct}%`,
            s.isRisk ? 'En Riesgo' : (s.pct >= 85 ? 'Regular' : 'En Observacion')
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Estadisticas_Asistencia_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Archivo CSV descargado correctamente', 'success');
    };

    // Chart 1: Time Series Line Chart (Evolución Temporal)
    const lineChartData = useMemo(() => {
        if (!stats?.byDate || stats.byDate.length === 0) return null;
        const dates = stats.byDate.map(d => {
            const parts = d.fecha.split('-');
            return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.fecha;
        });
        const pcts = stats.byDate.map(d => d.pct);

        return {
            labels: dates,
            datasets: [{
                label: '% Asistencia Diaria',
                data: pcts,
                borderColor: '#34d399',
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#34d399',
                pointBorderColor: '#ffffff',
                pointHoverRadius: 6,
                borderWidth: 3
            }]
        };
    }, [stats]);

    // Chart 2: Division Comparison Bar Chart
    const barChartData = useMemo(() => {
        if (!stats?.byDivision || stats.byDivision.length === 0) return null;
        const labels = stats.byDivision.map(d => d.name);
        const pcts = stats.byDivision.map(d => d.avgAsistencia);
        const colors = pcts.map(p => p >= 85 ? '#34d399' : (p >= 75 ? '#f59e0b' : '#fb7185'));

        return {
            labels,
            datasets: [{
                label: '% Asistencia Promedio',
                data: pcts,
                backgroundColor: colors,
                borderRadius: 8,
                borderSkipped: false
            }]
        };
    }, [stats]);

    // Chart 3: Attendance Status Doughnut Chart
    const doughnutData = useMemo(() => {
        if (!stats) return null;
        return {
            labels: ['Presentes', 'Ausentes', 'Tardanzas', 'Justificados'],
            datasets: [{
                data: [stats.present || 0, stats.absent || 0, stats.late || 0, stats.justified || 0],
                backgroundColor: ['#34d399', '#fb7185', '#f59e0b', '#3b82f6'],
                borderWidth: 2,
                borderColor: 'var(--tech-secondary)',
                hoverOffset: 6
            }]
        };
    }, [stats]);

    // Common Chart Options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'var(--tech-text-main)',
                    font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(10, 19, 15, 0.92)',
                titleColor: '#34d399',
                bodyColor: '#eefdf5',
                borderColor: 'rgba(52, 211, 153, 0.3)',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(52, 211, 153, 0.05)' },
                ticks: { color: 'var(--tech-text-muted)', font: { family: 'Plus Jakarta Sans', size: 11 } }
            },
            y: {
                min: 0,
                max: 100,
                grid: { color: 'rgba(52, 211, 153, 0.05)' },
                ticks: { color: 'var(--tech-text-muted)', font: { family: 'Plus Jakarta Sans', size: 11 } }
            }
        }
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
                            <span className="p-1.5 rounded-lg bg-tech-cyan/15 text-tech-cyan border border-tech-cyan/25">
                                <BarChart3 size={18} />
                            </span>
                            <h1 className="text-xl md:text-2xl font-black text-tech-text uppercase tracking-tight">
                                Centro de Estadísticas de Asistencia
                            </h1>
                        </div>
                        <p className="text-xs text-tech-muted mt-1 font-mono">
                            Métricas avanzadas, análisis comparativo por división e identificación de estudiantes en riesgo
                        </p>
                    </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-tech-secondary border border-tech-surface/70 text-tech-text text-xs font-bold hover:bg-tech-surface/50 hover:text-tech-cyan transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                        title="Refrescar Estadísticas"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-tech-cyan' : ''} />
                        <span className="hidden sm:inline">Refrescar</span>
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-tech-secondary border border-tech-surface/70 text-tech-text text-xs font-bold hover:bg-tech-surface/50 hover:text-tech-cyan transition-all active:scale-95 shadow-sm"
                        title="Exportar a CSV / Excel"
                    >
                        <FileSpreadsheet size={14} className="text-tech-cyan" />
                        <span>Exportar CSV</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-tech-cyan text-white text-xs font-bold hover:bg-tech-cyan/85 transition-all active:scale-95 shadow-sm"
                        title="Imprimir informe de pantalla"
                    >
                        <Printer size={14} />
                        <span>Imprimir</span>
                    </button>
                </div>
            </div>

            {/* ════════════════ FILTERS & PRESETS BAR ════════════════ */}
            <div className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-tech-surface/40 pb-3">
                    <div className="flex items-center gap-2 text-xs font-black text-tech-text uppercase tracking-wider font-mono">
                        <Filter size={14} className="text-tech-cyan" />
                        <span>Filtros y Períodos de Consulta</span>
                    </div>
                    { (startDate || endDate || selectedDivision !== 'all') && (
                        <button
                            onClick={() => { setSelectedDivision('all'); setDatePreset('clear'); }}
                            className="text-[11px] text-tech-cyan hover:underline font-mono"
                        >
                            Limpiar Filtros
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Division Selector */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            División / Curso
                        </label>
                        <select
                            className="w-full bg-tech-surface/30 border border-tech-surface/70 rounded-xl px-3.5 py-2.5 text-xs text-tech-text outline-none focus:border-tech-cyan/50 transition-all font-sans"
                            value={selectedDivision}
                            onChange={e => setSelectedDivision(e.target.value)}
                        >
                            <option value="all">Todas las Divisiones</option>
                            {divisions.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.anio}° Año "{d.seccion}" ({d.ciclo_lectivo || 'Actual'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            Desde
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-tech-surface/30 border border-tech-surface/70 rounded-xl px-3.5 py-2 text-xs text-tech-text outline-none focus:border-tech-cyan/50 transition-all font-mono"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            Hasta
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full bg-tech-surface/30 border border-tech-surface/70 rounded-xl px-3.5 py-2 text-xs text-tech-text outline-none focus:border-tech-cyan/50 transition-all font-mono"
                        />
                    </div>

                    {/* Presets Pills */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-tech-muted font-mono mb-1.5">
                            Rangos Rápidos
                        </label>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setDatePreset('today')}
                                className="flex-1 py-2 bg-tech-surface/40 hover:bg-tech-cyan/20 hover:text-tech-cyan border border-tech-surface/60 rounded-xl text-[10px] font-bold uppercase tracking-tight text-tech-text transition-all"
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => setDatePreset('week')}
                                className="flex-1 py-2 bg-tech-surface/40 hover:bg-tech-cyan/20 hover:text-tech-cyan border border-tech-surface/60 rounded-xl text-[10px] font-bold uppercase tracking-tight text-tech-text transition-all"
                            >
                                7 Días
                            </button>
                            <button
                                onClick={() => setDatePreset('month')}
                                className="flex-1 py-2 bg-tech-surface/40 hover:bg-tech-cyan/20 hover:text-tech-cyan border border-tech-surface/60 rounded-xl text-[10px] font-bold uppercase tracking-tight text-tech-text transition-all"
                            >
                                30 Días
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════ KPI METRIC CARDS ════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* KPI 1: Tasa de Asistencia General */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-tech-muted font-mono">
                            Tasa de Asistencia
                        </span>
                        <span className={`p-2 rounded-2xl ${
                            (stats?.avgAsistencia || 0) >= 85
                                ? 'bg-tech-cyan/15 text-tech-cyan border border-tech-cyan/30'
                                : ((stats?.avgAsistencia || 0) >= 75
                                    ? 'bg-tech-accent/15 text-tech-accent border border-tech-accent/30'
                                    : 'bg-tech-danger/15 text-tech-danger border border-tech-danger/30')
                        }`}>
                            <TrendingUp size={18} />
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl lg:text-4xl font-black text-tech-text tracking-tight font-mono">
                            {loading ? '--' : `${stats?.avgAsistencia || 0}%`}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                            (stats?.avgAsistencia || 0) >= 85
                                ? 'bg-tech-cyan/20 text-tech-cyan'
                                : ((stats?.avgAsistencia || 0) >= 75
                                    ? 'bg-tech-accent/20 text-tech-accent'
                                    : 'bg-tech-danger/20 text-tech-danger')
                        }`}>
                            {(stats?.avgAsistencia || 0) >= 85 ? 'Excelente' : ((stats?.avgAsistencia || 0) >= 75 ? 'Aceptable' : 'Alerta')}
                        </span>
                    </div>

                    <p className="text-[11px] text-tech-muted truncate mt-2 font-mono">
                        {stats?.total || 0} registros procesados en el período
                    </p>

                    <div className="w-full bg-tech-surface/40 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                (stats?.avgAsistencia || 0) >= 85 ? 'bg-tech-cyan' : ((stats?.avgAsistencia || 0) >= 75 ? 'bg-tech-accent' : 'bg-tech-danger')
                            }`}
                            style={{ width: `${Math.min(stats?.avgAsistencia || 0, 100)}%` }}
                        />
                    </div>
                </motion.div>

                {/* KPI 2: Presentes & Tardanzas */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-tech-muted font-mono">
                            Presentes & Tardes
                        </span>
                        <span className="p-2 rounded-2xl bg-tech-cyan/15 text-tech-cyan border border-tech-cyan/30">
                            <CheckCircle2 size={18} />
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl lg:text-4xl font-black text-tech-text tracking-tight font-mono">
                            {loading ? '--' : ((stats?.present || 0) + (stats?.late || 0))}
                        </span>
                        <span className="text-xs text-tech-muted font-mono">
                            ({stats?.total > 0 ? Math.round((((stats?.present || 0) + (stats?.late || 0)) / stats.total) * 100) : 0}%)
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-tech-muted mt-2 font-mono border-t border-tech-surface/40 pt-2">
                        <span>Presentes: <strong className="text-tech-cyan">{stats?.present || 0}</strong></span>
                        <span>Tardes: <strong className="text-tech-accent">{stats?.late || 0}</strong></span>
                    </div>
                </motion.div>

                {/* KPI 3: Ausentes & Justificados */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-tech-muted font-mono">
                            Ausencias & Justificaciones
                        </span>
                        <span className="p-2 rounded-2xl bg-tech-danger/15 text-tech-danger border border-tech-danger/30">
                            <XCircle size={18} />
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl lg:text-4xl font-black text-tech-text tracking-tight font-mono">
                            {loading ? '--' : (stats?.absent || 0)}
                        </span>
                        <span className="text-xs text-tech-danger font-bold font-mono">
                            ({stats?.total > 0 ? Math.round(((stats?.absent || 0) / stats.total) * 100) : 0}% Ausentismo)
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-tech-muted mt-2 font-mono border-t border-tech-surface/40 pt-2">
                        <span>Faltas: <strong className="text-tech-danger">{stats?.absent || 0}</strong></span>
                        <span>Justificados: <strong className="text-blue-500">{stats?.justified || 0}</strong></span>
                    </div>
                </motion.div>

                {/* KPI 4: Alumnos en Riesgo */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                    className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-tech-muted font-mono">
                            Alumnos en Riesgo (&lt;75%)
                        </span>
                        <span className="p-2 rounded-2xl bg-tech-accent/15 text-tech-accent border border-tech-accent/30">
                            <ShieldAlert size={18} />
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl lg:text-4xl font-black text-tech-accent tracking-tight font-mono">
                            {loading ? '--' : (stats?.kpis?.atRiskCount || 0)}
                        </span>
                        <span className="text-xs text-tech-muted font-mono">
                            de {stats?.kpis?.totalStudents || 0} estudiantes
                        </span>
                    </div>

                    <button
                        onClick={() => { setActiveTab('table'); setShowOnlyRisk(true); }}
                        className="w-full flex items-center justify-between text-[11px] text-tech-cyan hover:underline mt-2 font-mono border-t border-tech-surface/40 pt-2"
                    >
                        <span>Ver lista de riesgo</span>
                        <ChevronRight size={14} />
                    </button>
                </motion.div>
            </div>

            {/* ════════════════ TAB CONTROLS ════════════════ */}
            <div className="flex items-center justify-between border-b border-tech-surface/60 pb-1">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('charts')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-mono ${
                            activeTab === 'charts'
                                ? 'bg-tech-cyan/15 text-tech-cyan border border-tech-cyan/30'
                                : 'text-tech-muted hover:text-tech-text hover:bg-tech-surface/40'
                        }`}
                    >
                        Gráficos y Tendencias
                    </button>
                    <button
                        onClick={() => setActiveTab('table')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-mono flex items-center gap-2 ${
                            activeTab === 'table'
                                ? 'bg-tech-cyan/15 text-tech-cyan border border-tech-cyan/30'
                                : 'text-tech-muted hover:text-tech-text hover:bg-tech-surface/40'
                        }`}
                    >
                        <span>Desglose por Alumno</span>
                        {stats?.kpis?.atRiskCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-tech-accent text-white text-[10px] font-black font-mono">
                                {stats.kpis.atRiskCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ════════════════ CHARTS VIEW ════════════════ */}
            {activeTab === 'charts' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Line Chart: Evolución Temporal */}
                        <div className="lg:col-span-2 bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-tech-text uppercase tracking-tight">
                                        Evolución Temporal de Asistencia
                                    </h3>
                                    <p className="text-xs text-tech-muted font-mono">
                                        Porcentaje de asistencia diaria registrado
                                    </p>
                                </div>
                                <span className="p-2 rounded-xl bg-tech-surface/50 text-tech-cyan">
                                    <TrendingUp size={16} />
                                </span>
                            </div>

                            <div className="h-72 w-full flex-1">
                                {lineChartData ? (
                                    <Line data={lineChartData} options={chartOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-tech-muted font-mono">
                                        Sin datos temporales suficientes para mostrar el gráfico
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Doughnut Chart: Distribución General */}
                        <div className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-tech-text uppercase tracking-tight">
                                        Distribución General
                                    </h3>
                                    <p className="text-xs text-tech-muted font-mono">
                                        Proporción por estado de asistencia
                                    </p>
                                </div>
                            </div>

                            <div className="h-64 w-full relative flex items-center justify-center">
                                {doughnutData ? (
                                    <Doughnut
                                        data={doughnutData}
                                        options={{
                                            ...chartOptions,
                                            plugins: {
                                                ...chartOptions.plugins,
                                                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } }
                                            },
                                            cutout: '72%'
                                        }}
                                    />
                                ) : (
                                    <div className="text-xs text-tech-muted font-mono">Sin datos</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart: Comparativa por Divisiones */}
                    <div className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-tech-text uppercase tracking-tight">
                                    Comparativa de Asistencia por División
                                </h3>
                                <p className="text-xs text-tech-muted font-mono">
                                    Promedio de asistencia comparado entre cursos
                                </p>
                            </div>
                            {stats?.kpis?.bestDivision && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-tech-cyan/15 border border-tech-cyan/30 text-tech-cyan rounded-full text-xs font-bold font-mono">
                                    <Award size={14} />
                                    <span>Mejor: {stats.kpis.bestDivision}</span>
                                </div>
                            )}
                        </div>

                        <div className="h-72 w-full">
                            {barChartData ? (
                                <Bar data={barChartData} options={chartOptions} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-tech-muted font-mono">
                                    Sin datos por división disponibles
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ TABLE VIEW (ESTUDIANTES EN RIESGO Y DETALLE) ════════════════ */}
            {activeTab === 'table' && (
                <div className="bg-tech-secondary/80 border border-tech-surface/70 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tech-surface/40 pb-4">
                        <div>
                            <h3 className="text-base font-bold text-tech-text uppercase tracking-tight">
                                Detalle de Asistencia por Estudiante
                            </h3>
                            <p className="text-xs text-tech-muted font-mono">
                                {filteredStudents.length} estudiantes mostrados
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Search filter */}
                            <div className="relative min-w-[220px]">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" />
                                <input
                                    type="text"
                                    placeholder="Buscar alumno, DNI o curso..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-tech-surface/30 border border-tech-surface/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tech-text placeholder:text-tech-muted outline-none focus:border-tech-cyan/50 transition-all font-sans"
                                />
                            </div>

                            {/* Risk filter toggle */}
                            <button
                                onClick={() => setShowOnlyRisk(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                                    showOnlyRisk
                                        ? 'bg-tech-accent text-white border-tech-accent shadow-sm'
                                        : 'bg-tech-surface/30 text-tech-muted border-tech-surface hover:text-tech-text'
                                }`}
                            >
                                <AlertTriangle size={14} />
                                <span>Solo en Riesgo (&lt;75%)</span>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs text-tech-text border-collapse">
                            <thead>
                                <tr className="border-b border-tech-surface/60 text-tech-muted uppercase font-mono tracking-wider">
                                    <th className="py-3 px-4">Estudiante</th>
                                    <th className="py-3 px-4">DNI</th>
                                    <th className="py-3 px-4">División</th>
                                    <th className="py-3 px-4 text-center">Presentes</th>
                                    <th className="py-3 px-4 text-center">Ausentes</th>
                                    <th className="py-3 px-4 text-center">Tardes</th>
                                    <th className="py-3 px-4 text-center">Justif.</th>
                                    <th className="py-3 px-4 text-center">% Asist.</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tech-surface/40">
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-tech-muted font-mono">
                                            No se encontraron estudiantes para los criterios seleccionados
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((s, idx) => (
                                        <tr key={s.id || idx} className="hover:bg-tech-surface/30 transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-tech-text">
                                                {s.nombre}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-tech-muted">
                                                {s.dni}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-tech-cyan font-semibold">
                                                {s.division}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-mono text-tech-cyan">
                                                {s.present}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-mono text-tech-danger font-semibold">
                                                {s.absent}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-mono text-tech-accent">
                                                {s.late}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-mono text-blue-500">
                                                {s.justified}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-mono font-black text-sm">
                                                <span className={s.pct >= 85 ? 'text-tech-cyan' : (s.pct >= 75 ? 'text-tech-accent' : 'text-tech-danger')}>
                                                    {s.pct}%
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                                                    s.isRisk
                                                        ? 'bg-tech-danger/15 text-tech-danger border border-tech-danger/30'
                                                        : (s.pct >= 85
                                                            ? 'bg-tech-cyan/15 text-tech-cyan border border-tech-cyan/30'
                                                            : 'bg-tech-accent/15 text-tech-accent border border-tech-accent/30')
                                                }`}>
                                                    {s.isRisk && <AlertTriangle size={12} />}
                                                    {s.isRisk ? 'Riesgo' : (s.pct >= 85 ? 'Regular' : 'Observado')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceOverview;
