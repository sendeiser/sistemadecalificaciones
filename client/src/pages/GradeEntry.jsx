import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, BookOpen, Users, Star, ClipboardList, AlertCircle, CheckCircle2, ArrowLeft, Zap, MessageSquare, FileText } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { OBSERVATION_TEMPLATES, TRAYECTO_TEMPLATES, GET_GRADE_COLOR, GET_GRADE_BG } from '../utils/constants';

const GradeEntry = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [fullAssignmentData, setFullAssignmentData] = useState(null);
    const [grades, setGrades] = useState([]);
    const [periods, setPeriods] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [focusMode, setFocusMode] = useState(false);
    const [activeCell, setActiveCell] = useState({ row: 0, field: 'parcial_1' });
    const [isSecondSemester, setIsSecondSemester] = useState(new Date().getMonth() + 1 > 7);

    useEffect(() => {
        if (profile?.id) fetchAssignments();
        fetchPeriods();
    }, [profile]);

    useEffect(() => {
        if (selectedAssignment && fullAssignmentData) {
            fetchGrades(fullAssignmentData, true);
        }
    }, [isSecondSemester]);

    const fetchPeriods = async () => {
        const { data } = await supabase.from('periodos_calificacion').select('*');
        if (data) {
            const periodMap = data.reduce((acc, p) => ({ ...acc, [p.clave]: p.abierto }), {});
            setPeriods(periodMap);
        }
    };

    const fetchAssignments = async () => {
        const { data, error } = await supabase
            .from('asignaciones')
            .select(`
                id,
                division_id,
                materia:materias(nombre, descripcion),
                division:divisiones(id, anio, seccion, ciclo_lectivo)
            `)
            .eq('docente_id', profile.id);

        if (data) setAssignments(data);
    };

    const fetchGrades = async (assignmentObj, keepMessage = false) => {
        setLoading(true);
        setSelectedAssignment(assignmentObj.id);
        setFullAssignmentData(assignmentObj);
        if (!keepMessage) setMessage(null);

        try {
            // 1. Fetch all students in that division
            const { data: students, error: sErr } = await supabase
                .from('estudiantes_divisiones')
                .select(`
                    alumno:perfiles!alumno_id (
                        id,
                        nombre,
                        dni
                    )
                `)
                .eq('division_id', assignmentObj.division_id || (await getDivisionId(assignmentObj.id)));

            if (sErr) throw sErr;

            // 2. Fetch existing grades for this assignment and active semester
            const { data: existingGrades, error: gErr } = await supabase
                .from('calificaciones')
                .select('*')
                .eq('asignacion_id', assignmentObj.id)
                .eq('cuatrimestre', isSecondSemester ? 2 : 1);

            if (gErr) throw gErr;

            // 3. Merge: for each student, find their grade or create an empty object
            const mergedGrades = students.map(s => {
                const existing = existingGrades.find(g => g.alumno_id === s.alumno.id);
                if (existing) {
                    return { ...existing, student: s.alumno };
                }
                return {
                    alumno_id: s.alumno.id,
                    asignacion_id: assignmentObj.id,
                    parcial_1: null,
                    parcial_2: null,
                    parcial_3: null,
                    parcial_4: null,
                    asistencia: 100,
                    observaciones: '',
                    nota_intensificacion: null,
                    trayecto_acompanamiento: '',
                    cuatrimestre: isSecondSemester ? 2 : 1,
                    student: s.alumno
                };
            }).sort((a, b) => a.student.nombre.localeCompare(b.student.nombre));

            setGrades(mergedGrades);
        } catch (err) {
            console.error('Error fetching data:', err);
            setMessage({ type: 'error', text: 'Error al cargar alumnos y notas' });
        }
        setLoading(false);
    };

    const getDivisionId = async (asId) => {
        const { data } = await supabase.from('asignaciones').select('division_id').eq('id', asId).single();
        return data?.division_id;
    }

    const getLogro = (nota) => {
        const n = parseFloat(nota);
        if (isNaN(n)) return null;
        if (n >= 9) return 'LD';
        if (n >= 7) return 'LS';
        if (n >= 6) return 'LB'; // Corrected: Includes 6.0 to 6.99
        if (n >= 4) return 'LI c. A. E.';
        if (n >= 1) return 'LI c. A. M.';
        return null;
    };

    const calculateAverage = (g) => {
        const partials = [g.parcial_1, g.parcial_2, g.parcial_3, g.parcial_4]
            .map(p => parseFloat(p))
            .filter(p => !isNaN(p) && p !== null);

        if (partials.length === 0) return null;
        const sum = partials.reduce((a, b) => a + b, 0);
        return (sum / partials.length).toFixed(2);
    };

    const handleGradeChange = (alumnoId, field, value) => {
        let val = value === '' ? null : value;

        // Limit grades to 1-10
        if (field.startsWith('parcial') && val !== null) {
            val = parseFloat(val);
            if (val > 10) val = 10;
            if (val < 0) val = 0;
        }

        setGrades(prevGrades => prevGrades.map(g => {
            if (g.alumno_id === alumnoId) {
                const updatedG = { ...g, [field]: val };
                const prom = calculateAverage(updatedG);

                // Automate Trayecto Text & Achievement based on scale
                let trayectoText = '';
                const p = parseFloat(prom);
                if (p >= 7) trayectoText = 'Profundización de Saberes';
                else if (p >= 6) trayectoText = 'Fortalecimiento de Saberes'; // Corrected: Covers 6 to < 7
                else if (p >= 4) trayectoText = 'Recuperación de Saberes';
                else if (p >= 1) trayectoText = 'Apropiación de Saberes';

                return {
                    ...updatedG,
                    promedio: prom,
                    promedio_cuatrimestre: prom,
                    trayecto_acompanamiento: trayectoText
                };
            }
            return g;
        }));
    };

    // Keyboard Navigation Logic
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 'f') {
                setFocusMode(prev => !prev);
                return;
            }

            if (!selectedAssignment || grades.length === 0) return;

            const fields = ['parcial_1', 'parcial_2', 'parcial_3', 'parcial_4', 'asistencia', 'nota_intensificacion'];
            const { row, field } = activeCell;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveCell(prev => ({ ...prev, row: Math.min(prev.row + 1, grades.length - 1) }));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveCell(prev => ({ ...prev, row: Math.max(prev.row - 1, 0) }));
            } else if (e.key === 'ArrowRight' && fields.indexOf(field) < fields.length - 1) {
                // Only navigate if cursor is at the end or field is not a text input
                setActiveCell(prev => ({ ...prev, field: fields[fields.indexOf(prev.field) + 1] }));
            } else if (e.key === 'ArrowLeft' && fields.indexOf(field) > 0) {
                setActiveCell(prev => ({ ...prev, field: fields[fields.indexOf(prev.field) - 1] }));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                setActiveCell(prev => ({ ...prev, row: Math.min(prev.row + 1, grades.length - 1) }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedAssignment, grades.length, activeCell]);

    const activeGrade = grades[activeCell.row];

    const [activeTemplate, setActiveTemplate] = useState(null); // { id, field }

    const TemplateMenu = ({ templates, onSelect, onClose }) => (
        <div className="absolute z-50 mt-1 w-64 bg-tech-secondary border border-tech-cyan/30 rounded shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-bold text-tech-cyan uppercase tracking-widest">Sugerencias</span>
                <button onClick={onClose} className="text-tech-muted hover:text-white text-xs">×</button>
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                {templates.map((t, idx) => (
                    <button
                        key={idx}
                        onClick={() => { onSelect(t); onClose(); }}
                        className="w-full text-left p-2 text-[10px] text-tech-text hover:bg-tech-cyan/10 rounded transition-colors border border-transparent hover:border-tech-cyan/20"
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );

    const handleDownloadPDF = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return alert('No hay sesión activa');

        const apiUrl = import.meta.env.VITE_API_URL || '';
        let base = apiUrl || (window.location.origin.includes('localhost') ? 'http://localhost:5000' : '');

        // Remove trailing slash if present
        if (base.endsWith('/')) base = base.slice(0, -1);

        // Construct path avoiding duplication of /api
        const path = base.endsWith('/api') ? '/reports/division' : '/api/reports/division';

        window.open(`${base}${path}/${selectedAssignment}?token=${token}`, '_blank');
    };

    const handleExportCSV = () => {
        if (grades.length === 0) return alert('No hay datos para exportar');

        const getLogro = (grade) => {
            if (!grade) return '';
            const num = parseFloat(grade);
            if (isNaN(num)) return '';
            if (num >= 9) return 'LD';
            if (num >= 7) return 'LS';
            if (num >= 6) return 'LB';
            if (num >= 1) return 'LAA/LIE';
            return '';
        };

        const headers = ['N°', 'Estudiante', 'Perio. Intif', 'Logros Intif.', 'P1', 'P2', 'P3', 'P4', 'Promedio Parcial', 'Logros Prom.', '% Asist', 'Trayecto de Acompañamiento', 'Logros Tray.', 'Observaciones', 'Promedio General'];
        const rows = grades.map((g, index) => [
            index + 1,
            g.student.nombre,
            g.nota_intensificacion || '',
            getLogro(g.nota_intensificacion),
            g.parcial_1 || '',
            g.parcial_2 || '',
            g.parcial_3 || '',
            g.parcial_4 || '',
            g.promedio || '',
            getLogro(g.promedio),
            g.asistencia !== undefined ? g.asistencia + '%' : '-',
            g.trayecto_acompanamiento || '',
            '', // Logro Trayecto placeholder
            g.observaciones || '',
            g.promedio_cuatrimestre || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(c => {
                if (c === null || c === undefined) return '';
                const str = String(c);
                return str.includes(',') ? `"${str}"` : str;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${fullAssignmentData.materia.nombre}_${fullAssignmentData.division.anio}_${fullAssignmentData.division.seccion}_Notas.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveGrades = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const updates = grades.map(({ student, student_info, promedio, logro, ...g }) => ({
                ...g,
                parcial_1: g.parcial_1 !== '' && g.parcial_1 !== null ? parseFloat(g.parcial_1) : null,
                parcial_2: g.parcial_2 !== '' && g.parcial_2 !== null ? parseFloat(g.parcial_2) : null,
                parcial_3: g.parcial_3 !== '' && g.parcial_3 !== null ? parseFloat(g.parcial_3) : null,
                parcial_4: g.parcial_4 !== '' && g.parcial_4 !== null ? parseFloat(g.parcial_4) : null,
                asistencia: g.asistencia !== '' && g.asistencia !== null ? parseFloat(g.asistencia) : 0,
                nota_intensificacion: g.nota_intensificacion !== '' && g.nota_intensificacion !== null ? parseFloat(g.nota_intensificacion) : null,
                promedio_cuatrimestre: g.promedio_cuatrimestre !== '' && g.promedio_cuatrimestre !== null ? parseFloat(g.promedio_cuatrimestre) : null,
                trayecto_acompanamiento: g.trayecto_acompanamiento || null,
                logro_parcial: getLogro(g.promedio) || null,
                logro_intensificacion: getLogro(g.nota_intensificacion) || null,
                logro_trayecto: getLogro(g.promedio) || null,
                cuatrimestre: isSecondSemester ? 2 : 1
            }));

            const { error } = await supabase
                .from('calificaciones')
                .upsert(updates, { onConflict: 'alumno_id, asignacion_id, cuatrimestre' });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Calificaciones guardadas correctamente' });

            // Auto-dismiss toast after 4 seconds
            setTimeout(() => {
                setMessage(null);
            }, 4000);

            fetchGrades(fullAssignmentData, true);
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al guardar: ' + err.message });
        }
        setSaving(false);
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                        {selectedAssignment ? <><span className="text-tech-cyan">CARGA</span> DE NOTAS</> : <>MIS <span className="text-tech-cyan">MATERIAS</span></>}
                    </h1>
                    <p className="text-tech-muted text-xs font-mono uppercase tracking-[0.3em] mt-2">
                        {selectedAssignment
                            ? `${fullAssignmentData?.materia?.nombre} • ${fullAssignmentData?.division?.anio} ${fullAssignmentData?.division?.seccion}`
                            : 'Selecciona una materia asignada para gestionar calificaciones'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {selectedAssignment && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleDownloadPDF}
                                className="p-2.5 bg-tech-secondary hover:bg-tech-surface text-tech-muted hover:text-tech-danger rounded-xl border border-tech-surface hover:border-tech-danger/50 transition-all shadow-lg"
                                title="Planilla PDF"
                            >
                                <FileText size={20} />
                            </button>
                            <button
                                onClick={saveGrades}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-tech-cyan hover:bg-tech-cyan/80 disabled:bg-tech-surface rounded-xl text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-tech-cyan/20 active:scale-95"
                            >
                                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <Save size={18} />}
                                <span>{saving ? 'Guardando...' : 'Guardar Datos'}</span>
                            </button>
                        </div>
                    )}

                    <div className="flex bg-tech-secondary p-1 rounded-xl border border-tech-surface shadow-inner">
                        <button
                            onClick={() => setIsSecondSemester(false)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isSecondSemester ? 'bg-tech-cyan text-white shadow-lg' : 'text-tech-muted hover:text-tech-text'}`}
                        >
                            1er C
                        </button>
                        <button
                            onClick={() => setIsSecondSemester(true)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isSecondSemester ? 'bg-tech-cyan text-white shadow-lg' : 'text-tech-muted hover:text-tech-text'}`}
                        >
                            2do C
                        </button>
                    </div>

                    <button
                        onClick={() => setFocusMode(!focusMode)}
                        className={`p-2.5 rounded-xl border transition-all shadow-lg ${focusMode ? 'bg-tech-cyan text-white border-tech-cyan shadow-tech-cyan/20' : 'bg-tech-secondary text-tech-muted hover:text-tech-cyan border-tech-surface hover:border-tech-cyan/50'}`}
                        title="Modo Focus (Alt+F)"
                    >
                        <Zap size={20} className={focusMode ? 'animate-pulse' : ''} />
                    </button>
                    <ThemeToggle />
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {!selectedAssignment ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {assignments.map(a => (
                            <button
                                key={a.id}
                                onClick={() => fetchGrades(a)}
                                className="p-6 rounded border border-tech-surface bg-tech-secondary hover:border-tech-cyan hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] transition-all text-left flex flex-col gap-3 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-tech-cyan/10 rounded text-tech-cyan group-hover:scale-110 transition-transform">
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-tech-primary text-tech-cyan font-mono border border-tech-surface">
                                        {a.division?.ciclo_lectivo}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-bold text-lg leading-tight text-tech-text group-hover:text-tech-cyan transition-colors uppercase tracking-tight">
                                        {a.materia?.nombre}
                                    </p>
                                    <p className="text-sm text-tech-muted mt-1 font-mono">
                                        {a.division?.anio} {a.division?.seccion}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden shadow-2xl relative">
                            {loading && (
                                <div className="absolute inset-0 bg-tech-primary/80 backdrop-blur-[2px] flex items-center justify-center z-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tech-cyan"></div>
                                </div>
                            )}

                            <div className="hidden md:block overflow-x-auto min-h-[500px]">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead>
                                        <tr className="bg-tech-primary/50 text-tech-muted text-[10px] uppercase tracking-wider font-bold border-b border-tech-surface font-mono">
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface sticky left-0 bg-tech-secondary z-10 w-48 shadow-[4px_0_10px_rgba(0,0,0,0.2)]">Estudiantes</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center w-24">DNI</th>
                                            {!isSecondSemester && (
                                                <th colSpan="2" className="p-2 border-r border-tech-surface text-center bg-tech-cyan/5 text-tech-cyan">Periodo Intensificación</th>
                                            )}
                                            <th colSpan="4" className="p-2 border-r border-tech-surface text-center">Calificaciones Parciales</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center bg-tech-cyan/5 text-tech-cyan w-16">Prom.</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center w-16">% Asist</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center w-16 text-tech-cyan">Logro</th>
                                            <th colSpan="2" className="p-2 border-r border-tech-surface text-center bg-purple-500/5 text-purple-400">Trayecto Acompañamiento</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center w-32 font-bold text-tech-text bg-tech-primary">Prom. Cuatrimestre</th>
                                            <th rowSpan="2" className="p-2 text-center w-40">Observaciones</th>
                                        </tr>
                                        <tr className="bg-tech-primary/50 text-tech-muted text-[9px] uppercase tracking-wider font-bold border-b border-tech-surface font-mono">
                                            {!isSecondSemester && (
                                                <>
                                                    <th className="p-2 border-r border-tech-surface text-center bg-tech-cyan/5 w-12 text-[8px]">Calif.</th>
                                                    <th className="p-2 border-r border-tech-surface text-center bg-tech-cyan/5 w-12 text-[8px]">Logro</th>
                                                </>
                                            )}
                                            <th className="p-2 border-r border-tech-surface text-center w-12 text-tech-cyan/70">1</th>
                                            <th className="p-2 border-r border-tech-surface text-center w-12 text-tech-cyan/70">2</th>
                                            <th className="p-2 border-r border-tech-surface text-center w-12 text-tech-cyan/70">3</th>
                                            <th className="p-2 border-r border-tech-surface text-center w-12 text-tech-cyan/70">4</th>
                                            <th className="p-2 border-r border-tech-surface text-center bg-purple-500/5">Descripción</th>
                                            <th className="p-2 border-r border-tech-surface text-center bg-purple-500/5 w-12">Logro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.length === 0 && !loading ? (
                                            <tr>
                                                <td colSpan="15" className="p-12 text-center text-tech-muted italic font-medium font-mono">
                                                    No hay alumnos asignados a esta división.
                                                </td>
                                            </tr>
                                        ) : grades.map((g, index) => (
                                            <tr key={g.alumno_id} className="border-b border-tech-surface hover:bg-tech-surface/30 transition-colors group">
                                                <td className="p-2 border-r border-tech-surface sticky left-0 bg-tech-secondary z-10 group-hover:bg-tech-secondary/80 outline-none shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-tech-muted w-4 font-mono">{index + 1}</span>
                                                        <div className="font-bold text-xs truncate max-w-[200px] text-tech-text" title={g.student?.nombre}>
                                                            {g.student?.nombre}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2 border-r border-tech-surface text-center text-[10px] font-mono text-tech-muted">
                                                    {g.student?.dni}
                                                </td>
                                                {/* Periodo Intensificación */}
                                                {!isSecondSemester && (
                                                    <>
                                                        <td className="p-1 border-r border-tech-surface text-center bg-tech-cyan/5">
                                                            <input
                                                                type="number" min="0" max="10" step="0.5" placeholder="-"
                                                                inputMode="decimal"
                                                                value={g.nota_intensificacion === null ? '' : g.nota_intensificacion}
                                                                onChange={e => handleGradeChange(g.alumno_id, 'nota_intensificacion', e.target.value)}
                                                                disabled={periods['nota_intensificacion'] === false}
                                                                title={periods['nota_intensificacion'] === false ? "Periodo Cerrado" : ""}
                                                                className={`w-10 h-8 bg-tech-primary border rounded-sm text-center text-xs font-bold font-mono focus:ring-1 focus:ring-tech-cyan outline-none text-tech-text placeholder-tech-muted/70 focus:bg-tech-secondary transition-all ${GET_GRADE_BG(g.nota_intensificacion)} ${periods['nota_intensificacion'] === false ? 'opacity-50 cursor-not-allowed bg-tech-surface' : ''}`}
                                                            />
                                                        </td>
                                                        <td className="p-1 border-r border-tech-surface text-center bg-tech-cyan/5">
                                                            <div className={`text-[10px] font-mono font-bold ${GET_GRADE_COLOR(g.nota_intensificacion)}`}>
                                                                {getLogro(g.nota_intensificacion) || '-'}
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                                {/* Parciales */}
                                                {['parcial_1', 'parcial_2', 'parcial_3', 'parcial_4'].map(field => (
                                                    <td key={field} className="p-1 border-r border-tech-surface text-center">
                                                        <input
                                                            type="number" min="0" max="10" step="0.5" placeholder="-"
                                                            inputMode="decimal"
                                                            value={g[field] === null ? '' : g[field]}
                                                            onChange={e => handleGradeChange(g.alumno_id, field, e.target.value)}
                                                            disabled={periods[field] === false}
                                                            title={periods[field] === false ? "Periodo Cerrado" : ""}
                                                            className={`w-10 h-8 bg-tech-primary border rounded-sm text-center text-xs font-bold font-mono focus:ring-1 focus:ring-tech-cyan outline-none text-tech-text placeholder-tech-muted/70 focus:bg-tech-secondary transition-all ${GET_GRADE_BG(g[field])} ${periods[field] === false ? 'opacity-50 cursor-not-allowed bg-tech-surface border-tech-surface' : ''}`}
                                                        />
                                                    </td>
                                                ))}
                                                {/* Promedio Parcial */}
                                                <td className="p-1 border-r border-tech-surface text-center bg-tech-cyan/5">
                                                    <div className={`text-xs font-bold font-mono ${GET_GRADE_COLOR(g.promedio)}`}>
                                                        {g.promedio || '-'}
                                                    </div>
                                                </td>
                                                {/* Asistencia */}
                                                <td className="p-1 border-r border-tech-surface text-center">
                                                    <input
                                                        type="number" min="0" max="100"
                                                        inputMode="numeric"
                                                        value={g.asistencia === null ? '' : g.asistencia}
                                                        onChange={e => handleGradeChange(g.alumno_id, 'asistencia', e.target.value)}
                                                        className="w-10 h-8 bg-tech-primary border border-tech-surface rounded-sm text-center text-xs font-mono focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none text-tech-text focus:bg-tech-secondary transition-all"
                                                    />
                                                </td>
                                                {/* Logro Parcial */}
                                                <td className="p-1 border-r border-tech-surface text-center">
                                                    <div className={`text-[10px] font-mono font-bold ${GET_GRADE_COLOR(g.promedio)}`}>
                                                        {getLogro(g.promedio) || '-'}
                                                    </div>
                                                </td>
                                                {/* Trayecto Text */}
                                                <td className="p-1 border-r border-tech-surface bg-purple-500/5 relative">
                                                    <div className="flex items-center gap-1 group/trayecto">
                                                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium px-1 font-mono leading-tight flex-grow">
                                                            {g.trayecto_acompanamiento || '-'}
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveTemplate({ id: g.alumno_id, field: 'trayecto' })}
                                                            className="p-1 text-purple-600 dark:text-purple-400 hover:text-tech-text transition-colors opacity-0 group-hover/trayecto:opacity-100"
                                                        >
                                                            <Zap size={12} />
                                                        </button>
                                                        {activeTemplate?.id === g.alumno_id && activeTemplate?.field === 'trayecto' && (
                                                            <TemplateMenu
                                                                templates={TRAYECTO_TEMPLATES}
                                                                onSelect={(t) => handleGradeChange(g.alumno_id, 'trayecto_acompanamiento', t)}
                                                                onClose={() => setActiveTemplate(null)}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-1 border-r border-tech-surface text-center bg-purple-500/5 w-12">
                                                    <div className={`text-[10px] font-mono font-bold ${GET_GRADE_COLOR(g.promedio)}`}>
                                                        {getLogro(g.promedio) || '-'}
                                                    </div>
                                                </td>
                                                {/* Promedio Cuatrimestre */}
                                                <td className="p-1 border-r border-tech-surface text-center bg-tech-primary">
                                                    <div className={`text-sm font-black py-1 font-mono ${GET_GRADE_COLOR(g.promedio_cuatrimestre)}`}>
                                                        {g.promedio_cuatrimestre || '-'}
                                                    </div>
                                                </td>
                                                {/* Observaciones */}
                                                <td className="p-1 relative">
                                                    <div className="flex items-center gap-1 group/obs">
                                                        <input
                                                            type="text" placeholder="Nota..."
                                                            value={g.observaciones || ''}
                                                            onChange={e => handleGradeChange(g.alumno_id, 'observaciones', e.target.value)}
                                                            className="flex-grow h-8 bg-tech-primary border border-tech-surface rounded-sm px-2 text-[10px] font-mono focus:border-tech-cyan outline-none text-tech-text placeholder-tech-muted/70 focus:bg-tech-secondary transition-all"
                                                        />
                                                        <button
                                                            onClick={() => setActiveTemplate({ id: g.alumno_id, field: 'obs' })}
                                                            className="p-1 text-tech-muted hover:text-tech-cyan transition-colors opacity-0 group-hover/obs:opacity-100"
                                                        >
                                                            <MessageSquare size={14} />
                                                        </button>
                                                        {activeTemplate?.id === g.alumno_id && activeTemplate?.field === 'obs' && (
                                                            <TemplateMenu
                                                                templates={OBSERVATION_TEMPLATES}
                                                                onSelect={(t) => {
                                                                    const currentObs = g.observaciones || '';
                                                                    const newObs = currentObs ? `${currentObs} ${t}` : t;
                                                                    handleGradeChange(g.alumno_id, 'observaciones', newObs);
                                                                }}
                                                                onClose={() => setActiveTemplate(null)}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden p-4 space-y-4">
                                {grades.map((g, index) => (
                                    <div key={g.alumno_id} className="bg-tech-primary/50 rounded border border-tech-surface p-4 space-y-4">
                                        <div className="flex justify-between items-start border-b border-tech-surface pb-2">
                                            <div>
                                                <div className="text-[10px] text-tech-cyan font-mono uppercase font-bold">Estudiante {index + 1}</div>
                                                <div className="font-bold text-tech-text uppercase">{g.student?.nombre}</div>
                                                <div className="text-xs text-tech-muted font-mono">DNI: {g.student?.dni}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-tech-muted font-mono uppercase">Promedio</div>
                                                <div className={`text-xl font-black ${GET_GRADE_COLOR(g.promedio)}`}>{g.promedio || '-'}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <div className="text-[10px] text-tech-muted uppercase font-bold tracking-widest border-l-2 border-tech-cyan pl-2">Parciales</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {['parcial_1', 'parcial_2', 'parcial_3', 'parcial_4'].map((field, i) => (
                                                        <div key={field} className="flex flex-col items-center gap-1">
                                                            <span className="text-[8px] text-tech-muted font-mono">{i + 1}</span>
                                                            <input
                                                                type="number" min="0" max="10" step="0.5" placeholder="-"
                                                                inputMode="decimal"
                                                                value={g[field] === null ? '' : g[field]}
                                                                onChange={e => handleGradeChange(g.alumno_id, field, e.target.value)}
                                                                disabled={periods[field] === false}
                                                                className={`w-12 h-10 bg-tech-secondary border rounded text-center text-sm font-bold font-mono focus:ring-1 focus:ring-tech-cyan outline-none text-tech-text transition-all ${GET_GRADE_BG(g[field])} ${periods[field] === false ? 'opacity-50 border-tech-surface' : ''}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="text-[10px] text-tech-muted uppercase font-bold tracking-widest border-l-2 border-tech-success pl-2">Asistencia</div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[8px] text-tech-muted font-mono">% actual</span>
                                                    <input
                                                        type="number" min="0" max="100"
                                                        inputMode="numeric"
                                                        value={g.asistencia === null ? '' : g.asistencia}
                                                        onChange={e => handleGradeChange(g.alumno_id, 'asistencia', e.target.value)}
                                                        className="w-full h-10 bg-tech-secondary border border-tech-surface rounded text-center text-sm font-bold font-mono focus:border-tech-success outline-none text-tech-text"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            {!isSecondSemester && (
                                                <div className="space-y-2">
                                                    <div className="text-[10px] text-tech-muted uppercase font-bold tracking-widest border-l-2 border-tech-accent pl-2">Intensificación</div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number" min="0" max="10" step="0.5" placeholder="-"
                                                            inputMode="decimal"
                                                            value={g.nota_intensificacion === null ? '' : g.nota_intensificacion}
                                                            onChange={e => handleGradeChange(g.alumno_id, 'nota_intensificacion', e.target.value)}
                                                            disabled={periods['nota_intensificacion'] === false}
                                                            className={`w-14 h-10 bg-tech-secondary border rounded text-center text-sm font-bold font-mono focus:ring-1 focus:ring-tech-cyan outline-none text-tech-text transition-all ${GET_GRADE_BG(g.nota_intensificacion)} ${periods['nota_intensificacion'] === false ? 'opacity-50 border-tech-surface' : ''}`}
                                                        />
                                                        <span className={`text-[10px] font-mono font-bold ${GET_GRADE_COLOR(g.nota_intensificacion)}`}>{getLogro(g.nota_intensificacion) || '-'}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className={`${isSecondSemester ? 'col-span-2' : ''} space-y-2`}>
                                                <div className="text-[10px] text-tech-muted uppercase font-bold tracking-widest border-l-2 border-purple-500 pl-2">Trayecto</div>
                                                <div className="relative">
                                                    <div className="flex items-center justify-between bg-purple-600/10 dark:bg-purple-400/10 p-2 rounded border border-purple-500/20">
                                                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-mono leading-tight">
                                                            {g.trayecto_acompanamiento || 'No definido'}
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveTemplate({ id: g.alumno_id, field: 'trayecto_mob' })}
                                                            className="p-1 text-purple-600 dark:text-purple-400 hover:text-tech-text"
                                                        >
                                                            <Zap size={14} />
                                                        </button>
                                                    </div>
                                                    {activeTemplate?.id === g.alumno_id && activeTemplate?.field === 'trayecto_mob' && (
                                                        <div className="relative">
                                                            <TemplateMenu
                                                                templates={TRAYECTO_TEMPLATES}
                                                                onSelect={(t) => handleGradeChange(g.alumno_id, 'trayecto_acompanamiento', t)}
                                                                onClose={() => setActiveTemplate(null)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-[10px] text-tech-muted uppercase font-bold tracking-widest border-l-2 border-tech-muted/50 pl-2">Observaciones</div>
                                            <div className="relative">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text" placeholder="Agregar nota..."
                                                        value={g.observaciones || ''}
                                                        onChange={e => handleGradeChange(g.alumno_id, 'observaciones', e.target.value)}
                                                        className="flex-grow h-10 bg-tech-secondary border border-tech-surface rounded px-3 text-xs font-mono focus:border-tech-cyan outline-none text-tech-text"
                                                    />
                                                    <button
                                                        onClick={() => setActiveTemplate({ id: g.alumno_id, field: 'obs_mob' })}
                                                        className="p-2 bg-tech-secondary border border-tech-surface rounded text-tech-muted"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                </div>
                                                {activeTemplate?.id === g.alumno_id && activeTemplate?.field === 'obs_mob' && (
                                                    <div className="relative">
                                                        <TemplateMenu
                                                            templates={OBSERVATION_TEMPLATES}
                                                            onSelect={(t) => {
                                                                const currentObs = g.observaciones || '';
                                                                const newObs = currentObs ? `${currentObs} ${t}` : t;
                                                                handleGradeChange(g.alumno_id, 'observaciones', newObs);
                                                            }}
                                                            onClose={() => setActiveTemplate(null)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Focus Mode Overlay */}
                        {focusMode && activeGrade && (
                            <div className="fixed inset-0 z-[60] bg-tech-primary flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                                <div className="absolute top-8 right-8 flex gap-4">
                                    <button
                                        onClick={() => setFocusMode(false)}
                                        className="p-3 bg-tech-secondary rounded-full border border-tech-surface text-tech-muted hover:text-tech-text transition-all"
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                </div>

                                <div className="w-full max-w-2xl space-y-8 text-center">
                                    <div className="space-y-2">
                                        <p className="text-tech-cyan font-mono text-sm uppercase tracking-[0.3em]">Modo Focus Activo</p>
                                        <h2 className="text-4xl font-black text-tech-text uppercase tracking-tighter">
                                            {activeGrade.student?.nombre}
                                        </h2>
                                        <p className="text-tech-muted font-mono">{activeCell.row + 1} de {grades.length} alumnos</p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {['parcial_1', 'parcial_2', 'parcial_3', 'parcial_4', 'asistencia', !isSecondSemester && 'nota_intensificacion'].filter(Boolean).map(field => (
                                            <div key={field} className={`p-6 rounded-2xl border-2 transition-all ${activeCell.field === field ? 'bg-tech-secondary border-tech-cyan shadow-[0_0_30px_rgba(14,165,233,0.1)] scale-105' : 'bg-tech-primary/50 border-tech-surface opacity-50'}`}>
                                                <p className="text-[10px] font-bold text-tech-muted uppercase mb-3 tracking-widest">{field.replace('_', ' ')}</p>
                                                <input
                                                    type="number"
                                                    autoFocus={activeCell.field === field}
                                                    value={activeGrade[field] === null ? '' : activeGrade[field]}
                                                    onChange={e => handleGradeChange(activeGrade.alumno_id, field, e.target.value)}
                                                    onFocus={() => setActiveCell({ row: activeCell.row, field })}
                                                    className="w-full bg-transparent text-4xl font-black text-center text-tech-text outline-none focus:text-tech-cyan"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-12 flex flex-col items-center gap-4">
                                        <div className="flex gap-2 text-tech-muted font-mono text-[10px]">
                                            <kbd className="px-2 py-1 bg-tech-secondary rounded border border-tech-surface shadow-sm text-tech-text">↑</kbd>
                                            <kbd className="px-2 py-1 bg-tech-secondary rounded border border-tech-surface shadow-sm text-tech-text">↓</kbd>
                                            <span>Navegar Alumnos</span>
                                            <span className="mx-2">|</span>
                                            <kbd className="px-2 py-1 bg-tech-secondary rounded border border-tech-surface shadow-sm text-tech-text">TAB</kbd>
                                            <span>Siguiente Campo</span>
                                        </div>
                                        <button
                                            onClick={saveGrades}
                                            disabled={saving}
                                            className="px-8 py-4 bg-tech-cyan text-white rounded-xl font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                                        >
                                            {saving ? 'Guardando...' : 'Finalizar Sesión Focus'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Custom Toast Notification */}
            {message && (
                <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-full duration-300 z-50 ${message.type === 'success'
                    ? 'bg-tech-secondary border-tech-success text-tech-success'
                    : 'bg-tech-secondary border-tech-danger text-tech-danger'
                    }`}>
                    <div className={`p-2 rounded-full ${message.type === 'success' ? 'bg-tech-success/10' : 'bg-tech-danger/10'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide">
                            {message.type === 'success' ? 'Éxito' : 'Error'}
                        </h4>
                        <p className="text-xs font-mono text-tech-muted">{message.text}</p>
                    </div>
                    <button
                        onClick={() => setMessage(null)}
                        className="ml-4 p-1 hover:bg-tech-surface rounded transition-colors text-tech-muted hover:text-tech-text"
                    >
                        <div className="h-4 w-4 flex items-center justify-center font-bold">×</div>
                    </button>
                </div>
            )}
        </div>
    );
};

export default GradeEntry;
