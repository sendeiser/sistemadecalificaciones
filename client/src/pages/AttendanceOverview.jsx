// client/src/pages/AttendanceOverview.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { ArrowLeft, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ThemeToggle from '../components/ThemeToggle';

import { getApiEndpoint } from '../utils/api';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const AttendanceOverview = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDivisions = async () => {
            const { data, error } = await supabase.from('divisiones').select('*');
            if (!error) setDivisions(data);
        };
        fetchDivisions();
    }, []);

    const fetchStats = async () => {
        if (!selectedDivision) return alert('Seleccione una división');
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let queryParams = `?division_id=${selectedDivision}`;
            if (startDate) queryParams += `&start_date=${startDate}`;
            if (endDate) queryParams += `&end_date=${endDate}`;

            const endpoint = getApiEndpoint(`/reports/attendance${queryParams}`);

            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const json = await res.json();
            setStats(json);
        } catch (e) {
            console.error(e);
            alert('Error al cargar estadísticas');
        }
        setLoading(false);
    };

    const pieData = stats ? {
        labels: ['Presente', 'Ausente', 'Tarde', 'Justificado'],
        datasets: [{
            data: [stats.present || 0, stats.absent || 0, stats.late || 0, stats.justified || 0],
            backgroundColor: ['#16a34a', '#b91c1c', '#dc2626', '#4b5563'],
        }],
    } : null;

    const barData = stats ? {
        labels: ['Asistencia Promedio %'],
        datasets: [{
            label: 'Promedio',
            data: [stats.avgAsistencia || 0],
            backgroundColor: '#dc2626',
        }],
    } : null;


    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between border-b border-tech-surface pb-6 gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 h-auto"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-3xl font-bold text-tech-text">Visión General de Asistencia</h1>
                </div>
                <ThemeToggle />
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                    className="p-2 bg-tech-secondary border border-tech-surface rounded text-tech-text"
                    value={selectedDivision}
                    onChange={e => setSelectedDivision(e.target.value)}
                >
                    <option value="">Seleccionar División</option>
                    {divisions.map(d => (
                        <option key={d.id} value={d.id}>
                            {d.anio} {d.seccion}
                        </option>
                    ))}
                </select>

                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className=""
                />

                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className=""
                />

                <div className="flex gap-2">
                    <Button
                        variant="primary"
                        size="md"
                        onClick={fetchStats}
                        disabled={loading}
                        className="flex-1 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                    >
                        <Search size={16} /> Cargar Estadísticas
                    </Button>
                </div>
            </div>
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-tech-secondary p-4 rounded shadow">
                        <h2 className="text-xl font-semibold mb-2 text-center text-tech-text">Distribución</h2>
                        <Pie data={pieData} />
                    </div>
                    <div className="bg-tech-secondary p-4 rounded shadow">
                        <h2 className="text-xl font-semibold mb-2 text-center text-tech-text">Promedio de Asistencia</h2>
                        <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceOverview;
