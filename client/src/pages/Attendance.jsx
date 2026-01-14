import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Calendar, Save, Check, X, Clock, AlertCircle, ArrowLeft, Users, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Attendance = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState({}); // student_id -> status
    const [observationsMap, setObservationsMap] = useState({}); // student_id -> text
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchAssignments();
    }, [profile]);

    useEffect(() => {
        if (selectedAssignment) {
            fetchStudentsAndAttendance(selectedAssignment.id, selectedDate);
        }
    }, [selectedAssignment, selectedDate]);

    const fetchAssignments = async () => {
        try {
            if (!profile) return;

            let query = supabase
                .from('asignaciones')
                .select(`
                    id,
                    materia:materias(nombre),
                    division:divisiones(id, anio, seccion)
                `);

            if (profile.rol !== 'admin') {
                query = query.eq('docente_id', profile.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setAssignments(data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setMessage({ type: 'error', text: 'Error al cargar cursos.' });
            setLoading(false);
        }
    };

    const handleAssignmentSelect = (id) => {
        const assignment = assignments.find(a => a.id === id);
        setSelectedAssignment(assignment);
        setMessage(null);
    };

    const fetchStudentsAndAttendance = async (assignmentId, date) => {
        try {
            setLoading(true);
            const assignment = assignments.find(a => a.id === assignmentId);
            if (!assignment) return;

            // 1. Fetch Students
            const { data: studentsData, error: studentsError } = await supabase
                .from('estudiantes_divisiones')
                .select(`
                    alumno:perfiles!alumno_id(id, nombre, dni)
                `)
                .eq('division_id', assignment.division.id);

            if (studentsError) throw studentsError;

            const studentList = studentsData.map(s => s.alumno).sort((a, b) => a.nombre.localeCompare(b.nombre));
            setStudents(studentList);

            // 2. Fetch Existing Attendance
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('asistencias')
                .select('*')
                .eq('asignacion_id', assignmentId)
                .eq('fecha', date);

            if (attendanceError) throw attendanceError;

            // 3. Map Attendance
            const newAttendanceMap = {};
            const newObservationsMap = {};

            // Default to 'presente' if no record? Or null?
            // Usually easier to start with empty/null to force explicit check, or default Present.
            // Let's default to null (unset) visually, but maybe 'presente' for logic if we want "Mark all present".

            attendanceData.forEach(record => {
                newAttendanceMap[record.estudiante_id] = record.estado;
                newObservationsMap[record.estudiante_id] = record.observaciones || '';
            });

            setAttendanceMap(newAttendanceMap);
            setObservationsMap(newObservationsMap);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage({ type: 'error', text: 'Error al cargar datos.' });
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
    };

    const handleObservationChange = (studentId, text) => {
        setObservationsMap(prev => ({ ...prev, [studentId]: text }));
    };

    const markAllPresent = () => {
        const newMap = { ...attendanceMap };
        students.forEach(s => {
            if (!newMap[s.id]) {
                newMap[s.id] = 'presente';
            }
        });
        setAttendanceMap(newMap);
    };

    const saveAttendance = async () => {
        try {
            setSaving(true);
            setMessage(null);

            const records = students.map(s => ({
                estudiante_id: s.id,
                asignacion_id: selectedAssignment.id,
                fecha: selectedDate,
                estado: attendanceMap[s.id] || 'presente', // Default to present if saving
                observaciones: observationsMap[s.id]
            }));

            // Use backend route or direct Supabase? 
            // We set up RLS for direct access. Let's use direct Supabase upsert.
            const { error } = await supabase
                .from('asistencias')
                .upsert(records, { onConflict: 'estudiante_id, asignacion_id, fecha' });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Asistencia guardada correctamente.' });
            setSaving(false);
        } catch (error) {
            console.error('Error saving attendance:', error);
            setMessage({ type: 'error', text: 'Error al guardar asistencia.' });
            setSaving(false);
        }
    };

    if (loading && !selectedAssignment) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-tech-primary text-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-cyan"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between border-b border-tech-surface pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-tech-cyan/20 rounded text-tech-cyan">
                            <Clock size={32} />
                        </div>
                        Control de Asistencia
                    </h1>
                    <p className="text-slate-400 font-mono mt-2">
                        {selectedAssignment
                            ? `${selectedAssignment.materia.nombre} - ${selectedAssignment.division.anio} "${selectedAssignment.division.seccion}"`
                            : 'Selecciona una materia para registrar la asistencia del día.'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-tech-surface rounded transition-colors"
                >
                    <ArrowLeft size={20} />
                    Volver
                </button>
            </header>

            <div className="max-w-7xl mx-auto">
                {message && (
                    <div className={`mb-6 p-4 rounded border flex items-center gap-3 ${message.type === 'error'
                        ? 'bg-tech-danger/10 border-tech-danger text-tech-danger'
                        : 'bg-tech-success/10 border-tech-success text-tech-success'
                        }`}>
                        <AlertCircle size={20} />
                        {message.text}
                    </div>
                )}

                {!selectedAssignment ? (
                    // Course Selection Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.map(assign => (
                            <div
                                key={assign.id}
                                onClick={() => handleAssignmentSelect(assign.id)}
                                className="bg-tech-secondary p-6 rounded border border-tech-surface hover:border-tech-cyan cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-tech-cyan/10 rounded group-hover:bg-tech-cyan/20 transition-colors text-tech-cyan">
                                        <Users size={24} />
                                    </div>
                                    <span className="text-xs font-mono text-slate-500 border border-tech-surface px-2 py-1 rounded">
                                        ID: {assign.id.slice(0, 6)}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{assign.materia.nombre}</h3>
                                <p className="text-slate-400 font-mono">
                                    {assign.division.anio} "{assign.division.seccion}"
                                </p>
                            </div>
                        ))}
                        {assignments.length === 0 && !loading && (
                            <div className="col-span-full text-center py-12 text-slate-500 font-mono">
                                No tienes cursos asignados.
                            </div>
                        )}
                    </div>
                ) : (
                    // Attendance Form
                    <div className="space-y-6">
                        {/* Controls */}
                        <div className="bg-tech-secondary p-6 rounded border border-tech-surface flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <label className="text-slate-400 font-mono uppercase text-sm">Fecha:</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-tech-primary border border-tech-surface rounded px-4 py-2 text-white focus:border-tech-cyan outline-none font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button
                                    onClick={markAllPresent}
                                    className="flex items-center gap-2 px-4 py-2 bg-tech-surface hover:bg-slate-600 text-white rounded transition-colors text-sm uppercase font-bold tracking-wider"
                                >
                                    <CheckSquare size={18} />
                                    Todos Presentes
                                </button>
                                <button
                                    onClick={() => setSelectedAssignment(null)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm underline"
                                >
                                    Cambiar Curso
                                </button>
                            </div>
                        </div>

                        {/* Student List */}
                        <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center text-slate-500 font-mono animate-pulse">Cargando alumnos...</div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-tech-primary text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-tech-surface">
                                        <tr>
                                            <th className="p-4 text-left">Alumno</th>
                                            <th className="p-4 text-center">Estado</th>
                                            <th className="p-4 text-left">Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-tech-surface">
                                        {students.map(student => {
                                            const status = attendanceMap[student.id];
                                            return (
                                                <tr key={student.id} className="hover:bg-tech-surface/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold text-white">{student.nombre}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{student.dni}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleStatusChange(student.id, 'presente')}
                                                                className={`p-2 rounded transition-all ${status === 'presente' ? 'bg-tech-success text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-tech-primary text-slate-500 hover:bg-tech-surface'}`}
                                                                title="Presente"
                                                            >
                                                                <Check size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(student.id, 'ausente')}
                                                                className={`p-2 rounded transition-all ${status === 'ausente' ? 'bg-tech-danger text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-tech-primary text-slate-500 hover:bg-tech-surface'}`}
                                                                title="Ausente"
                                                            >
                                                                <X size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(student.id, 'tarde')}
                                                                className={`p-2 rounded transition-all ${status === 'tarde' ? 'bg-tech-accent text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-tech-primary text-slate-500 hover:bg-tech-surface'}`}
                                                                title="Tarde"
                                                            >
                                                                <Clock size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(student.id, 'justificado')}
                                                                className={`p-2 rounded transition-all ${status === 'justificado' ? 'bg-tech-cyan text-white shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'bg-tech-primary text-slate-500 hover:bg-tech-surface'}`}
                                                                title="Justificado"
                                                            >
                                                                <AlertCircle size={20} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <input
                                                            type="text"
                                                            placeholder="..."
                                                            value={observationsMap[student.id] || ''}
                                                            onChange={(e) => handleObservationChange(student.id, e.target.value)}
                                                            className="w-full bg-tech-primary border border-tech-surface rounded px-3 py-1 text-sm text-slate-200 focus:border-tech-cyan outline-none transition-colors"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {students.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="p-8 text-center text-slate-500 font-mono">No hay alumnos en esta división.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={saveAttendance}
                                disabled={saving || students.length === 0}
                                className="flex items-center gap-2 px-8 py-4 bg-tech-cyan hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-bold uppercase tracking-wider shadow-lg hover:shadow-cyan-500/20 transition-all text-lg"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={24} />
                                        Guardar Asistencia
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;
