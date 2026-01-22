import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { Users, ChevronRight, ChevronLeft, Search, Save, ArrowLeft, Calendar, FileText, AlertCircle } from 'lucide-react';
import { getApiEndpoint } from '../utils/api';

const MassJustification = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState('');
    const [studentsInDivision, setStudentsInDivision] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [observations, setObservations] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchDivisions();
    }, []);

    useEffect(() => {
        if (selectedDivisionId) {
            fetchStudents();
        } else {
            setStudentsInDivision([]);
        }
    }, [selectedDivisionId]);

    const fetchDivisions = async () => {
        const { data, error } = await supabase
            .from('divisiones')
            .select('*')
            .order('anio', { ascending: true });
        if (data) setDivisions(data);
        setLoading(false);
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('estudiantes_divisiones')
                .select(`
                    alumno:perfiles!alumno_id (id, nombre, dni)
                `)
                .eq('division_id', selectedDivisionId);

            if (error) throw error;

            const studentList = data.map(d => d.alumno).sort((a, b) => a.nombre.localeCompare(b.nombre));

            // Filter out students already in the 'selected' list
            const selectedIds = new Set(selectedStudents.map(s => s.id));
            setStudentsInDivision(studentList.filter(s => !selectedIds.has(s.id)));
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al cargar alumnos: ' + err.message });
        }
        setLoading(false);
    };

    const moveToSelected = (student) => {
        setStudentsInDivision(studentsInDivision.filter(s => s.id !== student.id));
        setSelectedStudents([...selectedStudents, student].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    };

    const moveToAvailable = (student) => {
        setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
        // Only return to available list if they belong to the CURRENTLY selected division
        // (to avoid confusion if switching divisions mid-selection)
        // For simplicity, let's just re-fetch or manage locally.
        setStudentsInDivision([...studentsInDivision, student].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    };

    const handleSubmit = async () => {
        if (selectedStudents.length === 0 || !startDate || !endDate) {
            return setMessage({ type: 'error', text: 'Por favor complete todos los campos y seleccione al menos un alumno.' });
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint('/attendance/mass-justify');

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    studentIds: selectedStudents.map(s => s.id),
                    startDate,
                    endDate,
                    observations
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Error desconocido');

            setMessage({ type: 'success', text: result.message });
            // Clear selection?
            // setSelectedStudents([]);
            // setStartDate('');
            // setEndDate('');
            // setObservations('');
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAvailable = studentsInDivision.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.dni && s.dni.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 border-b border-tech-surface pb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-surface rounded transition-colors text-tech-muted hover:text-tech-text"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-tech-text tracking-tight uppercase flex items-center gap-3">
                            <div className="p-2 bg-tech-cyan/20 rounded text-tech-cyan">
                                <FileText size={24} />
                            </div>
                            Justificación Masiva
                        </h1>
                        <p className="text-tech-muted text-sm font-mono mt-1">JUSTIFICAR INASISTENCIAS POR RANGO DE FECHA</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-8">
                {message && (
                    <div className={`p-4 rounded border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-tech-danger/10 border-tech-danger text-tech-danger' : 'bg-tech-success/10 border-tech-success text-tech-success'
                        }`}>
                        <AlertCircle size={20} />
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Config & Action */}
                    <div className="lg:col-span-1 space-y-6">
                        <section className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-xl space-y-6">
                            <h2 className="text-sm font-bold text-tech-cyan uppercase tracking-widest border-b border-tech-surface pb-2">Configuración</h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-tech-muted uppercase">Desde:</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" size={16} />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-tech-primary border border-tech-surface rounded focus:border-tech-cyan outline-none text-tech-text font-mono transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-tech-muted uppercase">Hasta:</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" size={16} />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-tech-primary border border-tech-surface rounded focus:border-tech-cyan outline-none text-tech-text font-mono transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-tech-muted uppercase">Motivo / Observaciones:</label>
                                    <textarea
                                        rows="3"
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        placeholder="Ej: Certificado médico, Trámite personal..."
                                        className="w-full p-3 bg-tech-primary border border-tech-surface rounded focus:border-tech-cyan outline-none text-tech-text text-sm transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-tech-cyan hover:bg-sky-600 disabled:bg-tech-surface disabled:text-tech-muted rounded font-bold transition-all shadow-lg hover:shadow-tech-cyan/20 uppercase tracking-wider text-sm text-white"
                            >
                                {submitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        PROCESANDO...
                                    </div>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        JUSTIFICAR ({selectedStudents.length})
                                    </>
                                )}
                            </button>
                        </section>
                    </div>

                    {/* Right Column: Student Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-xl">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div className="flex-grow w-full md:w-auto">
                                    <label className="text-xs font-bold text-tech-muted uppercase mb-2 block">Filtrar por División</label>
                                    <select
                                        className="w-full md:w-48 bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm outline-none focus:border-tech-cyan transition-colors"
                                        value={selectedDivisionId}
                                        onChange={(e) => setSelectedDivisionId(e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {divisions.map(d => (
                                            <option key={d.id} value={d.id}>{d.anio} "{d.seccion}"</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o DNI..."
                                        className="w-full pl-9 pr-4 py-2 bg-tech-primary border border-tech-surface rounded text-sm focus:border-tech-cyan outline-none transition-colors"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Students in Division */}
                                <div className="bg-tech-primary/30 rounded border border-tech-surface flex flex-col h-[400px]">
                                    <div className="p-3 bg-tech-secondary border-b border-tech-surface flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-tech-muted uppercase">Disponibles ({filteredAvailable.length})</span>
                                    </div>
                                    <div className="flex-grow overflow-y-auto p-2 space-y-1">
                                        {loading ? (
                                            <div className="p-4 text-center text-tech-muted font-mono animate-pulse">Cargando...</div>
                                        ) : filteredAvailable.length === 0 ? (
                                            <div className="p-8 text-center text-tech-muted italic text-xs">No hay alumnos.</div>
                                        ) : filteredAvailable.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => moveToSelected(s)}
                                                className="p-2 bg-tech-secondary hover:bg-tech-cyan/10 border border-transparent hover:border-tech-cyan/30 rounded flex justify-between items-center cursor-pointer transition-all group"
                                            >
                                                <div className="truncate">
                                                    <p className="text-xs font-bold text-tech-text uppercase">{s.nombre}</p>
                                                    <p className="text-[9px] text-tech-muted font-mono">{s.dni}</p>
                                                </div>
                                                <ChevronRight size={14} className="text-tech-muted group-hover:text-tech-cyan group-hover:translate-x-1 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Selected Students */}
                                <div className="bg-tech-cyan/5 rounded border border-tech-cyan/20 flex flex-col h-[400px]">
                                    <div className="p-3 bg-tech-cyan/10 border-b border-tech-cyan/20 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-tech-cyan uppercase">Seleccionados ({selectedStudents.length})</span>
                                        <button
                                            onClick={() => {
                                                // Move all back
                                                setSelectedStudents([]);
                                                if (selectedDivisionId) fetchStudents();
                                            }}
                                            className="text-[9px] text-tech-muted hover:text-tech-danger transition-colors underline uppercase uppercase"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                    <div className="flex-grow overflow-y-auto p-2 space-y-1">
                                        {selectedStudents.length === 0 ? (
                                            <div className="p-8 text-center text-tech-muted italic text-xs">Seleccione alumnos de la izquierda.</div>
                                        ) : selectedStudents.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => moveToAvailable(s)}
                                                className="p-2 bg-tech-secondary hover:bg-tech-danger/10 border border-transparent hover:border-tech-danger/30 rounded flex justify-between items-center cursor-pointer transition-all group"
                                            >
                                                <ChevronLeft size={14} className="text-tech-muted group-hover:text-tech-danger group-hover:-translate-x-1 transition-all" />
                                                <div className="text-right truncate">
                                                    <p className="text-xs font-bold text-tech-text uppercase">{s.nombre}</p>
                                                    <p className="text-[9px] text-tech-muted font-mono">{s.dni}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MassJustification;
