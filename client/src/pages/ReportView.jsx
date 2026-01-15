import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Download, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const ReportView = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        // Only admin should see this page typically, or teacher
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('rol', 'alumno')
            .order('nombre');

        if (data) setStudents(data);
        setLoading(false);
    };

    const downloadReport = async (studentId) => {
        setDownloading(studentId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            // Adjust URL based on environment or hardcode for now
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${API_URL}/reports/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error downloading report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Boletin_${studentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(err);
            alert('Error al descargar el reporte: ' + err.message);
        } finally {
            setDownloading(null);
        }
    };

    const filteredStudents = students.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.dni && s.dni.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10">
            {/* Navigation Header */}
            <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between border-b border-tech-surface pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-secondary rounded-lg transition-colors text-tech-muted hover:text-tech-text"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-tech-text">
                            Reportes
                        </h1>
                        <p className="text-tech-muted text-sm">Generar boletines de acreditación de saberes.</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar alumno por nombre o DNI..."
                            className="w-full pl-10 pr-4 py-2 bg-tech-secondary border border-tech-surface rounded-lg focus:ring-2 focus:ring-tech-cyan outline-none transition-all text-tech-text placeholder-tech-muted/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                {loading ? <p className="text-tech-muted text-center py-20 animate-pulse">Cargando alumnos...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <div key={student.id} className="bg-tech-secondary p-6 rounded-xl border border-tech-surface flex justify-between items-center group hover:border-tech-cyan/50 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-tech-primary rounded-lg text-tech-muted group-hover:text-tech-cyan transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-tech-text group-hover:text-tech-cyan transition-colors">{student.nombre}</h3>
                                        <p className="text-tech-muted text-sm font-mono">DNI: {student.dni || 'N/A'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => downloadReport(student.id)}
                                    disabled={downloading === student.id}
                                    className="p-3 bg-tech-cyan/10 hover:bg-tech-cyan text-tech-cyan hover:text-white rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                    title="Descargar Boletín"
                                >
                                    {downloading === student.id ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                                    ) : (
                                        <Download size={20} />
                                    )}
                                </button>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center text-tech-muted bg-tech-secondary/50 rounded-xl border border-dashed border-tech-surface">
                                No se encontraron alumnos con ese criterio.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportView;
