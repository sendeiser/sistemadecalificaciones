// client/src/pages/AttendanceOverview.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Search } from 'lucide-react';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const AttendanceOverview = () => {
    const [divisions, setDivisions] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState('');
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
            const res = await fetch(`/api/reports/attendance?division_id=${selectedDivision}`, {
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
        labels: ['Presente', 'Ausente', 'Tarde'],
        datasets: [{
            data: [stats.present || 0, stats.absent || 0, stats.late || 0],
            backgroundColor: ['#34d399', '#ef4444', '#fbbf24'],
        }],
    } : null;

    const barData = stats ? {
        labels: ['Asistencia Promedio %'],
        datasets: [{
            label: 'Promedio',
            data: [stats.avgAsistencia || 0],
            backgroundColor: '#60a5fa',
        }],
    } : null;

    return (
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            <h1 className="text-3xl font-bold mb-6">Visión General de Asistencia</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                    className="p-2 bg-tech-secondary border border-tech-surface rounded text-white"
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
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-tech-cyan hover:bg-sky-600 rounded text-white"
                    disabled={loading}
                >
                    <Search size={18} /> Cargar Estadísticas
                </button>
            </div>
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-tech-secondary p-4 rounded shadow">
                        <h2 className="text-xl font-semibold mb-2 text-center">Distribución</h2>
                        <Pie data={pieData} />
                    </div>
                    <div className="bg-tech-secondary p-4 rounded shadow">
                        <h2 className="text-xl font-semibold mb-2 text-center">Promedio de Asistencia</h2>
                        <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceOverview;
