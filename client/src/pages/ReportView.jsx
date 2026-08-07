import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Download, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

import { getApiEndpoint } from '../utils/api';

const ReportView = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Get all students
            const { data: stds, error: sErr } = await supabase
                .from('perfiles')
                .select('*')
                .eq('rol', 'alumno')
                .order('nombre');
            if (sErr) throw sErr;
            setStudents(stds);

            // 2. Get divisions
            const { data: divs, error: dErr } = await supabase
                .from('divisiones')
                .select('*')
                .order('anio', { ascending: true });
            if (dErr) throw dErr;
            setDivisions(divs);

            // 3. Get student-division mappings
            const { data: enrs, error: eErr } = await supabase
                .from('estudiantes_divisiones')
                .select('*');
            if (eErr) throw eErr;
            setEnrollments(enrs);

        } catch (err) {
            console.error('Error fetching data:', err);
        }
        setLoading(false);
    };

    const downloadReport = async (studentId) => {
        setDownloading(studentId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const endpoint = getApiEndpoint(`/reports/bulletin/${studentId}`);

            const response = await fetch(endpoint, {
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

    const filteredStudents = students.filter(s => {
        // Search term filter
        const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.dni && s.dni.includes(searchTerm));

        // Division filter
        if (!selectedDivision) return matchesSearch;

        const studentEnrollment = enrollments.find(e => e.alumno_id === s.id);
        const matchesDivision = studentEnrollment && studentEnrollment.division_id === parseInt(selectedDivision);

        return matchesSearch && matchesDivision;
    });

    const getStudentDivisionLabel = (studentId) => {
        const enrollment = enrollments.find(e => e.alumno_id === studentId);
        if (!enrollment) return 'Sin División';
        const div = divisions.find(d => d.id === enrollment.division_id);
        return div ? `${div.anio} ${div.seccion}` : 'N/A';
    };

    return (
        <div className="w-full min-h-full space-y-8 font-sans pb-16">
            {/* Navigation Header */}
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
                        <h1 className="text-xl md:text-2xl font-black text-tech-text uppercase tracking-tight flex items-center gap-2">
                            <FileText className="text-tech-cyan" size={24} />
                            Boletines de Acreditación de Saberes
                        </h1>
                        <p className="text-xs text-tech-muted mt-1 font-mono">Generación y descarga de boletines oficiales de estudiantes</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
                    <div className="flex-grow max-w-xl">
                        <Input
                            icon={Search}
                            placeholder="Buscar alumno por nombre o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full md:w-64">
                        <select
                            className="w-full p-2.5 bg-tech-secondary border border-tech-surface rounded-xl text-tech-text focus:border-tech-cyan outline-none transition-all font-bold text-xs uppercase cursor-pointer hover:border-tech-cyan/50"
                            value={selectedDivision}
                            onChange={(e) => setSelectedDivision(e.target.value)}
                        >
                            <option value="">TODOS LOS CURSOS</option>
                            {divisions.map(d => (
                                <option key={d.id} value={d.id}>{d.anio} {d.seccion}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? <p className="text-tech-muted font-mono text-center py-20 animate-pulse uppercase tracking-widest">Sincronizando Alumnos...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <div key={student.id} className="bg-tech-secondary p-5 rounded-2xl border border-tech-surface flex justify-between items-center group hover:border-tech-cyan/50 hover:bg-tech-primary/30 transition-all shadow-xl hover:shadow-tech-cyan/5">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 flex-shrink-0 bg-tech-primary border border-tech-surface rounded-xl flex items-center justify-center text-tech-muted group-hover:text-tech-cyan transition-all transform group-hover:rotate-6 shadow-inner">
                                        <FileText size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-tech-text text-sm truncate group-hover:text-tech-cyan transition-colors uppercase tracking-tight">{student.nombre}</h3>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-tech-muted font-mono uppercase">DNI: {student.dni || 'N/A'}</span>
                                            <span className="text-[10px] text-tech-cyan font-black uppercase mt-0.5 tracking-tighter bg-tech-cyan/5 px-2 py-0.5 rounded-full inline-block w-fit">
                                                {getStudentDivisionLabel(student.id)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-3 h-auto w-auto"
                                    onClick={() => downloadReport(student.id)}
                                    disabled={downloading === student.id}
                                    title="Descargar Boletín"
                                >
                                    {downloading === student.id ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-current/30 border-t-current"></div>
                                    ) : (
                                        <Download size={20} />
                                    )}
                                </Button>
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
