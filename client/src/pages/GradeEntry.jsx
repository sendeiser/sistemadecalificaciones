import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, BookOpen, Users, Star, ClipboardList, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

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

    useEffect(() => {
        if (profile?.id) fetchAssignments();
        fetchPeriods();
    }, [profile]);

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

    const fetchGrades = async (assignmentObj) => {
        setLoading(true);
        setSelectedAssignment(assignmentObj.id);
        setFullAssignmentData(assignmentObj);
        setMessage(null);

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

            // 2. Fetch existing grades for this assignment
            const { data: existingGrades, error: gErr } = await supabase
                .from('calificaciones')
                .select('*')
                .eq('asignacion_id', assignmentObj.id);

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
                    promedio_cuatrimestre: null,
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

        const headers = ['Estudiante', 'DNI', 'Nota Intensificacion', 'Parcial 1', 'Parcial 2', 'Parcial 3', 'Parcial 4', 'Promedio', 'Asistencia', 'Promedio Cuatrimestre', 'Trayecto', 'Observaciones'];
        const rows = grades.map(g => [
            g.student.nombre,
            g.student.dni,
            g.nota_intensificacion || '',
            g.parcial_1 || '',
            g.parcial_2 || '',
            g.parcial_3 || '',
            g.parcial_4 || '',
            g.promedio || '',
            g.asistencia || '',
            g.promedio_cuatrimestre || '',
            g.trayecto_acompanamiento || '',
            g.observaciones || ''
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
                logro_trayecto: getLogro(g.promedio) || null
            }));

            const { error } = await supabase
                .from('calificaciones')
                .upsert(updates, { onConflict: 'alumno_id, asignacion_id' });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Calificaciones guardadas correctamente' });
            fetchGrades(fullAssignmentData);
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al guardar: ' + err.message });
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between border-b border-tech-surface pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => selectedAssignment ? setSelectedAssignment(null) : navigate('/dashboard')}
                        className="p-2 hover:bg-tech-secondary rounded border border-transparent hover:border-tech-surface transition-colors text-slate-400 hover:text-white"
                        title={selectedAssignment ? "Volver a la selección" : "Volver al Dashboard"}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight uppercase">
                            {selectedAssignment ? <span className="text-tech-cyan">Carga de Notas</span> : 'Mis Materias'}
                        </h1>
                        <p className="text-slate-400 text-sm font-mono mt-1">
                            {selectedAssignment
                                ? `${fullAssignmentData?.materia?.nombre} - ${fullAssignmentData?.division?.anio} ${fullAssignmentData?.division?.seccion}`
                                : 'Selecciona una materia asignada para cargar calificaciones.'}
                        </p>
                    </div>
                </div>
                {selectedAssignment && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-tech-secondary hover:bg-tech-surface rounded border border-tech-surface transition-all text-sm font-medium hover:border-tech-accent group"
                        >
                            <Star size={18} className="text-slate-400 group-hover:text-tech-accent transition-colors" />
                            PDF Planilla
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-tech-secondary hover:bg-tech-surface rounded border border-tech-surface transition-all text-sm font-medium hover:border-tech-success group"
                        >
                            <ClipboardList size={18} className="text-slate-400 group-hover:text-tech-success transition-colors" />
                            CSV
                        </button>
                        <button
                            onClick={saveGrades}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-tech-cyan hover:bg-sky-600 disabled:bg-slate-700 rounded transition-all font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)] active:scale-95 text-white uppercase tracking-wider"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                )}
            </header>

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
                                    <p className="font-bold text-lg leading-tight text-white group-hover:text-tech-cyan transition-colors uppercase tracking-tight">
                                        {a.materia?.nombre}
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1 font-mono">
                                        {a.division?.anio} {a.division?.seccion}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {message && (
                            <div className={`mb-6 p-4 rounded flex items-center gap-3 border ${message.type === 'success'
                                ? 'bg-tech-success/10 border-tech-success/50 text-tech-success'
                                : 'bg-tech-danger/10 border-tech-danger/50 text-tech-danger'
                                }`}>
                                {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                <span className="font-medium font-mono">{message.text}</span>
                            </div>
                        )}

                        <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden shadow-2xl relative">
                            {loading && (
                                <div className="absolute inset-0 bg-tech-primary/80 backdrop-blur-[2px] flex items-center justify-center z-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tech-cyan"></div>
                                </div>
                            )}

                            <div className="overflow-x-auto min-h-[500px]">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead>
                                        <tr className="bg-tech-primary/50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-tech-surface font-mono">
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface sticky left-0 bg-tech-secondary z-10 w-48 shadow-[4px_0_10px_rgba(0,0,0,0.2)]">Estudiantes</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center w-24">DNI</th>
                                            <th colSpan="2" className="p-2 border-r border-tech-surface text-center bg-tech-cyan/5 text-tech-cyan">Periodo Intensificación</th>
                                            <th colSpan="4" className="p-2 border-r border-tech-surface text-center">Calificaciones Parciales</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center bg-tech-cyan/5 text-tech-cyan w-16">Prom.</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center w-16">% Asist</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center w-16 text-tech-cyan">Logro</th>
                                            <th colSpan="2" className="p-2 border-r border-tech-surface text-center bg-purple-500/5 text-purple-400">Trayecto Acompañamiento</th>
                                            <th rowSpan="2" className="p-2 border-r border-tech-surface text-center w-32 font-bold text-white bg-tech-primary">Prom. Cuatrimestre</th>
                                            <th rowSpan="2" className="p-2 text-center w-40">Observaciones</th>
                                        </tr>
                                        <tr className="bg-tech-primary/50 text-slate-400 text-[9px] uppercase tracking-wider font-bold border-b border-tech-surface font-mono">
                                            <th className="p-2 border-r border-tech-surface text-center bg-tech-cyan/5 w-12 text-[8px]">Calif.</th>
                                            <th className="p-2 border-r border-tech-surface text-center bg-tech-cyan/5 w-12 text-[8px]">Logro</th>
                                            <th className="p-2 border-r border-tech-surface text-center w-12">1</th>
                                            <th className="p-2 border-r border-tech-surface text-center w-12">2</th>
                                            <th className="p-2 border-r border-tech-surface text-center w-12">3</th>
                                            <th className="p-2 border-r border-tech-surface text-center w-12">4</th>
                                            <th className="p-2 border-r border-tech-surface text-center bg-purple-500/5">Descripción</th>
                                            <th className="p-2 border-r border-tech-surface text-center bg-purple-500/5 w-12">Logro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.length === 0 && !loading ? (
                                            <tr>
                                                <td colSpan="15" className="p-12 text-center text-slate-500 italic font-medium font-mono">
                                                    No hay alumnos asignados a esta división.
                                                </td>
                                            </tr>
                                        ) : grades.map((g, index) => (
                                            <tr key={g.alumno_id} className="border-b border-tech-surface hover:bg-tech-surface/30 transition-colors group">
                                                <td className="p-2 border-r border-tech-surface sticky left-0 bg-tech-secondary z-10 group-hover:bg-tech-secondary/80 outline-none shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500 w-4 font-mono">{index + 1}</span>
                                                        <div className="font-bold text-xs truncate max-w-40 text-slate-200" title={g.student?.nombre}>
                                                            {g.student?.nombre}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2 border-r border-tech-surface text-center text-[10px] font-mono text-slate-400">
                                                    {g.student?.dni}
                                                </td>
                                                {/* Periodo Intensificación */}
                                                <td className="p-1 border-r border-tech-surface text-center bg-tech-cyan/5">
                                                    <input
                                                        type="number" min="0" max="10" step="0.5" placeholder="-"
                                                        value={g.nota_intensificacion === null ? '' : g.nota_intensificacion}
                                                        onChange={e => handleGradeChange(g.alumno_id, 'nota_intensificacion', e.target.value)}
                                                        disabled={periods['nota_intensificacion'] === false}
                                                        title={periods['nota_intensificacion'] === false ? "Periodo Cerrado" : ""}
                                                        className={`w-10 h-8 bg-tech-primary border border-tech-surface rounded-sm text-center text-xs font-bold font-mono focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none text-white placeholder-slate-600 focus:bg-tech-secondary transition-all ${periods['nota_intensificacion'] === false ? 'opacity-50 cursor-not-allowed bg-slate-800' : ''}`}
                                                    />
                                                </td>
                                                <td className="p-1 border-r border-tech-surface text-center bg-tech-cyan/5">
                                                    <div className={`text-[10px] font-mono font-bold ${getLogro(g.nota_intensificacion) === 'LD' ? 'text-tech-success' : 'text-slate-500'}`}>
                                                        {getLogro(g.nota_intensificacion) || '-'}
                                                    </div>
                                                </td>
                                                {/* Parciales */}
                                                {['parcial_1', 'parcial_2', 'parcial_3', 'parcial_4'].map(field => (
                                                    <td key={field} className="p-1 border-r border-tech-surface text-center">
                                                        <input
                                                            type="number" min="0" max="10" step="0.5" placeholder="-"
                                                            value={g[field] === null ? '' : g[field]}
                                                            onChange={e => handleGradeChange(g.alumno_id, field, e.target.value)}
                                                            disabled={periods[field] === false}
                                                            title={periods[field] === false ? "Periodo Cerrado" : ""}
                                                            className={`w-10 h-8 bg-tech-primary border border-tech-surface rounded-sm text-center text-xs font-bold font-mono focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none text-white placeholder-slate-600 focus:bg-tech-secondary transition-all ${periods[field] === false ? 'opacity-50 cursor-not-allowed bg-slate-800' : ''}`}
                                                        />
                                                    </td>
                                                ))}
                                                {/* Promedio Parcial */}
                                                <td className="p-1 border-r border-tech-surface text-center bg-tech-cyan/5">
                                                    <div className="text-xs font-bold font-mono text-tech-cyan">
                                                        {g.promedio || '-'}
                                                    </div>
                                                </td>
                                                {/* Asistencia */}
                                                <td className="p-1 border-r border-tech-surface text-center">
                                                    <input
                                                        type="number" min="0" max="100"
                                                        value={g.asistencia === null ? '' : g.asistencia}
                                                        onChange={e => handleGradeChange(g.alumno_id, 'asistencia', e.target.value)}
                                                        className="w-10 h-8 bg-tech-primary border border-tech-surface rounded-sm text-center text-xs font-mono focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none text-white focus:bg-tech-secondary transition-all"
                                                    />
                                                </td>
                                                {/* Logro Parcial */}
                                                <td className="p-1 border-r border-tech-surface text-center">
                                                    <div className={`text-[10px] font-mono font-bold ${parseFloat(g.promedio) >= 7 ? 'text-tech-success' : 'text-tech-accent'}`}>
                                                        {getLogro(g.promedio) || '-'}
                                                    </div>
                                                </td>
                                                {/* Trayecto Text */}
                                                <td className="p-1 border-r border-tech-surface bg-purple-500/5">
                                                    <div className="text-[10px] text-purple-300 font-medium px-1 font-mono leading-tight">
                                                        {g.trayecto_acompanamiento || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-1 border-r border-tech-surface text-center bg-purple-500/5 w-12">
                                                    <div className={`text-[10px] font-mono font-bold ${parseFloat(g.promedio) >= 7 ? 'text-tech-success' : 'text-purple-400'}`}>
                                                        {getLogro(g.promedio) || '-'}
                                                    </div>
                                                </td>
                                                {/* Promedio Cuatrimestre */}
                                                <td className="p-1 border-r border-tech-surface text-center bg-tech-primary">
                                                    <div className="text-sm font-black text-white py-1 font-mono">
                                                        {g.promedio_cuatrimestre || '-'}
                                                    </div>
                                                </td>
                                                {/* Observaciones */}
                                                <td className="p-1">
                                                    <input
                                                        type="text" placeholder="Nota..."
                                                        value={g.observaciones || ''}
                                                        onChange={e => handleGradeChange(g.alumno_id, 'observaciones', e.target.value)}
                                                        className="w-full h-8 bg-tech-primary border border-tech-surface rounded-sm px-2 text-[10px] font-mono focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none text-slate-200 placeholder-slate-600 focus:bg-tech-secondary transition-all"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradeEntry;
