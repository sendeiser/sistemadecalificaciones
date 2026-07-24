import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { AlertCircle, ArrowLeft, Calendar, Search, RefreshCw, UserCheck, UserX } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { getApiEndpoint } from '../utils/api';

const AttendanceDiscrepancies = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [discrepancies, setDiscrepancies] = useState([]);
    const [loading, setLoading] = useState(false);
    const addToast = useToast();

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        const { data } = await supabase.from('divisiones').select('*').order('anio');
        if (data) setDivisions(data);
    };

    const fetchDiscrepancies = async () => {
        if (!selectedDivisionId || !date) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint(`/attendance/discrepancies/${selectedDivisionId}?date=${date}`);

            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setDiscrepancies(data);
                if (data.length === 0) addToast('No se encontraron discrepancias para esta fecha.', 'success');
            } else {
                throw new Error(data.error || 'Error al cargar datos');
            }
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (estado) => {
        const colors = {
            presente: 'bg-tech-success/10 text-tech-success border-tech-success',
            ausente: 'bg-tech-danger/10 text-tech-danger border-tech-danger',
            tarde: 'bg-tech-accent/10 text-tech-accent border-tech-accent',
            justificado: 'bg-tech-cyan/10 text-tech-cyan border-tech-cyan'
        };
        return (
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${colors[estado] || 'bg-tech-surface'}`}>
                {estado}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 border-b border-tech-surface pb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-tech-surface rounded transition-colors text-tech-muted">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-tech-text tracking-tight uppercase flex items-center gap-3">
                            <div className="p-2 bg-tech-accent/20 rounded text-tech-accent">
                                <AlertCircle size={24} />
                            </div>
                            Panel de Discrepancias
                        </h1>
                        <p className="text-tech-muted text-sm font-mono mt-1">COMPARATIVO ASISTENCIA PRECEPTOR VS DOCENTE</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>

            <main className="max-w-7xl mx-auto space-y-8">
                <section className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-xl flex flex-col md:flex-row items-end gap-6">
                    <div className="w-full md:w-64 space-y-2">
                        <label className="text-[10px] font-bold text-tech-muted uppercase">División:</label>
                        <select
                            className="w-full bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm outline-none focus:border-tech-cyan"
                            value={selectedDivisionId}
                            onChange={e => setSelectedDivisionId(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {divisions.map(d => (
                                <option key={d.id} value={d.id}>{d.anio} "{d.seccion}"</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        type="date"
                        icon={Calendar}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={fetchDiscrepancies}
                        disabled={loading || !selectedDivisionId}
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                        Analizar
                    </Button>
                </section>

                <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden shadow-2xl">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-tech-primary text-[10px] text-tech-muted uppercase font-bold border-b border-tech-surface">
                                <tr>
                                    <th className="p-4 text-left">Alumno</th>
                                    <th className="p-4 text-center">Estado Preceptor</th>
                                    <th className="p-4 text-left">Registros de Docentes (Materias)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tech-surface">
                                {discrepancies.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-20 text-center text-tech-muted italic text-xs uppercase tracking-widest">
                                            Sin discrepancias detectadas.
                                        </td>
                                    </tr>
                                ) : discrepancies.map(d => (
                                    <tr key={d.estudiante_id} className="hover:bg-tech-surface/10 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-tech-text uppercase text-sm">{d.nombre}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(d.preceptor)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {d.materias.length === 0 ? (
                                                    <span className="text-[10px] text-tech-danger italic">Sin registros de docentes</span>
                                                ) : d.materias.map((m, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-tech-primary p-2 rounded border border-tech-surface">
                                                        <span className="text-[9px] font-mono text-tech-muted uppercase">{m.materia}:</span>
                                                        {getStatusBadge(m.estado)}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-tech-surface">
                        {discrepancies.length === 0 ? (
                            <div className="p-12 text-center text-tech-muted italic text-xs uppercase tracking-widest leading-relaxed">
                                Sin discrepancias<br />detectadas.
                            </div>
                        ) : discrepancies.map(d => (
                            <div key={d.estudiante_id} className="p-4 space-y-4">
                                <div className="flex justify-between items-center bg-tech-primary/20 p-3 rounded-xl border border-tech-surface">
                                    <div className="font-bold text-tech-text uppercase text-sm">{d.nombre}</div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[8px] font-bold text-tech-muted uppercase">Preceptor</span>
                                        {getStatusBadge(d.preceptor)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <UserCheck size={12} className="text-tech-muted" />
                                        <span className="text-[10px] font-bold text-tech-muted uppercase">Registros Docentes</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {d.materias.length === 0 ? (
                                            <div className="p-3 bg-tech-danger/5 rounded-lg border border-tech-danger/20 text-[10px] text-tech-danger italic flex items-center gap-2">
                                                <UserX size={12} />
                                                Sin registros de docentes
                                            </div>
                                        ) : d.materias.map((m, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-tech-primary/40 p-3 rounded-lg border border-tech-surface">
                                                <span className="text-[10px] font-bold text-tech-text uppercase truncate max-w-[150px]">{m.materia}</span>
                                                {getStatusBadge(m.estado)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AttendanceDiscrepancies;
