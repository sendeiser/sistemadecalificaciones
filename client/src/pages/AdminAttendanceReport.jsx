import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FileText, Calendar, Layers, Download, ArrowLeft, Search, FileDown } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { getApiEndpoint } from '../utils/api';

const AdminAttendanceReport = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        try {
            const { data, error } = await supabase.from('divisiones').select('*');
            if (error) throw error;
            setDivisions(data || []);
        } catch (error) {
            console.error('Error fetching divisions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedDivision) return alert('Seleccione una división');
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return alert('No hay sesión activa');

        const endpoint = getApiEndpoint(`/reports/attendance/division/${selectedDivision}`);

        let queryParams = `?token=${token}`;
        if (startDate) queryParams += `&start_date=${startDate}`;
        if (endDate) queryParams += `&end_date=${endDate}`;

        window.open(`${endpoint}${queryParams}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-12 font-sans overflow-x-hidden">
            <header className="max-w-4xl mx-auto mb-12 flex items-center justify-between border-b border-tech-surface pb-6 gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-3 bg-tech-secondary border border-tech-surface rounded-xl text-tech-muted hover:text-tech-text transition-all hover:scale-110 active:scale-95 shadow-lg"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-widest uppercase">
                            Reporte <span className="text-tech-accent uppercase">Asistencia</span>
                        </h1>
                        <p className="text-tech-muted text-xs font-mono tracking-[0.2em] mt-1">SISTEMA DE CONTROL DE PRESENTISMO</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="bg-tech-secondary p-8 rounded-xl border border-tech-surface shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-tech-accent/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                    <div className="space-y-8 relative z-10">
                        {/* Division Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold uppercase tracking-widest text-tech-accent flex items-center gap-2">
                                <Layers size={16} />
                                Seleccionar División
                            </label>
                            <select
                                className="w-full p-4 bg-tech-primary border border-tech-surface rounded-lg text-tech-text font-mono focus:border-tech-accent outline-none transition-all"
                                value={selectedDivision}
                                onChange={e => setSelectedDivision(e.target.value)}
                            >
                                <option value="">--- Seleccione una división ---</option>
                                {divisions.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.anio} {d.seccion} - Ciclo {d.ciclo_lectivo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-widest text-tech-muted flex items-center gap-2">
                                    <Calendar size={16} />
                                    Fecha Desde
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-4 bg-tech-primary border border-tech-surface rounded-lg text-tech-text font-mono focus:border-tech-cyan outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-widest text-tech-muted flex items-center gap-2">
                                    <Calendar size={16} />
                                    Fecha Hasta
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full p-4 bg-tech-primary border border-tech-surface rounded-lg text-tech-text font-mono focus:border-tech-cyan outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-6 border-t border-tech-surface/50">
                            <button
                                onClick={handleDownloadPDF}
                                disabled={!selectedDivision || loading}
                                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-tech-accent hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg font-bold uppercase tracking-widest shadow-lg hover:shadow-amber-500/20 transition-all text-lg"
                            >
                                <FileDown size={24} />
                                Generar Reporte PDF
                            </button>
                            <p className="text-center text-tech-muted text-xs mt-4 font-mono">
                                El reporte incluirá todos los registros de asistencia del preceptor para el periodo seleccionado.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminAttendanceReport;
