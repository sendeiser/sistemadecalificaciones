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
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (profile?.id) fetchAssignments();
    }, [profile]);

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
                return { ...updatedG, promedio: prom };
            }
            return g;
        }));
    };

    const saveGrades = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const updates = grades.map(({ student, promedio, logro, ...g }) => ({
                ...g,
                parcial_1: g.parcial_1 !== '' && g.parcial_1 !== null ? parseFloat(g.parcial_1) : null,
                parcial_2: g.parcial_2 !== '' && g.parcial_2 !== null ? parseFloat(g.parcial_2) : null,
                parcial_3: g.parcial_3 !== '' && g.parcial_3 !== null ? parseFloat(g.parcial_3) : null,
                parcial_4: g.parcial_4 !== '' && g.parcial_4 !== null ? parseFloat(g.parcial_4) : null,
                asistencia: g.asistencia !== '' && g.asistencia !== null ? parseInt(g.asistencia) : 100
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
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => selectedAssignment ? setSelectedAssignment(null) : navigate('/dashboard')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title={selectedAssignment ? "Volver a la selección" : "Volver al Dashboard"}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            {selectedAssignment ? 'Carga de Notas' : 'Mis Materias'}
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {selectedAssignment
                                ? `${fullAssignmentData?.materia?.nombre} - ${fullAssignmentData?.division?.anio} ${fullAssignmentData?.division?.seccion}`
                                : 'Selecciona una materia asignada para cargar calificaciones.'}
                        </p>
                    </div>
                </div>
                {selectedAssignment && (
                    <button
                        onClick={saveGrades}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg transition-all font-bold shadow-lg shadow-blue-900/20 active:scale-95"
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
                )}
            </header>

            <div className="max-w-7xl mx-auto">
                {!selectedAssignment ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {assignments.map(a => (
                            <button
                                key={a.id}
                                onClick={() => fetchGrades(a)}
                                className="p-6 rounded-xl border border-slate-700 bg-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all text-left flex flex-col gap-3 group relative overflow-hidden shadow-md"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-blue-300">
                                        {a.division?.ciclo_lectivo}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-bold text-lg leading-tight text-white group-hover:text-blue-300 transition-colors">
                                        {a.materia?.nombre}
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {a.division?.anio} {a.division?.seccion}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {message && (
                            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${message.type === 'success'
                                    ? 'bg-green-600/10 border-green-500/50 text-green-400'
                                    : 'bg-red-600/10 border-red-500/50 text-red-400'
                                }`}>
                                {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                <span className="font-medium">{message.text}</span>
                            </div>
                        )}

                        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl relative">
                            {loading && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-700/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                                            <th className="p-4 border-b border-slate-700 sticky left-0 bg-slate-800 z-10">Alumno</th>
                                            <th className="p-4 border-b border-slate-700 text-center">P1</th>
                                            <th className="p-4 border-b border-slate-700 text-center">P2</th>
                                            <th className="p-4 border-b border-slate-700 text-center">P3</th>
                                            <th className="p-4 border-b border-slate-700 text-center">P4</th>
                                            <th className="p-4 border-b border-slate-700 text-center bg-blue-500/5 text-blue-300">Promedio</th>
                                            <th className="p-4 border-b border-slate-700 text-center">Asist %</th>
                                            <th className="p-4 border-b border-slate-700">Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.length === 0 && !loading ? (
                                            <tr>
                                                <td colSpan="8" className="p-12 text-center text-slate-500 italic">
                                                    No hay alumnos asignados a esta división.
                                                </td>
                                            </tr>
                                        ) : grades.map(g => (
                                            <tr key={g.alumno_id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors group">
                                                <td className="p-4 sticky left-0 bg-slate-800 z-10 group-hover:bg-slate-700/40 transition-colors">
                                                    <div className="font-semibold">{g.student?.nombre}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono italic">DNI: {g.student?.dni}</div>
                                                </td>
                                                {['parcial_1', 'parcial_2', 'parcial_3', 'parcial_4'].map(field => (
                                                    <td key={field} className="p-4 text-center">
                                                        <input
                                                            type="number"
                                                            min="0" max="10" step="0.5"
                                                            placeholder="-"
                                                            value={g[field] === null ? '' : g[field]}
                                                            onChange={e => handleGradeChange(g.alumno_id, field, e.target.value)}
                                                            className="w-14 h-10 bg-slate-900 border border-slate-600 rounded-lg text-center font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="p-4 text-center bg-blue-500/5">
                                                    <div className={`text-lg font-bold ${g.promedio >= 7 ? 'text-green-400' : g.promedio >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {g.promedio || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="0" max="100"
                                                        value={g.asistencia === null ? '' : g.asistencia}
                                                        onChange={e => handleGradeChange(g.alumno_id, 'asistencia', e.target.value)}
                                                        className="w-16 h-10 bg-slate-900 border border-slate-600 rounded-lg text-center focus:border-blue-500 focus:outline-none"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Nota interna..."
                                                        value={g.observaciones || ''}
                                                        onChange={e => handleGradeChange(g.alumno_id, 'observaciones', e.target.value)}
                                                        className="w-full h-10 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
