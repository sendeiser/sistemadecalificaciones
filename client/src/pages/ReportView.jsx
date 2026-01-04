import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Download, ArrowLeft } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
            {/* Navigation Header */}
            <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-500">
                            Reportes
                        </h1>
                        <p className="text-slate-400 text-sm">Generar boletines de acreditación de saberes.</p>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar alumno por nombre o DNI..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                {loading ? <p className="text-slate-400 text-center py-20">Cargando alumnos...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <div key={student.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center group hover:border-blue-500 transition-all shadow-sm hover:shadow-lg hover:shadow-blue-500/10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-900 rounded-lg text-slate-400 group-hover:text-blue-400 transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">{student.nombre}</h3>
                                        <p className="text-slate-400 text-sm font-mono">DNI: {student.dni || 'N/A'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => downloadReport(student.id)}
                                    disabled={downloading === student.id}
                                    className="p-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all active:scale-95 disabled:opacity-50"
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
                            <div className="col-span-full py-20 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
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
