import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import QRScanner from '../components/QRScanner';
import { QrCode, Clock, ArrowLeft, AlertCircle, Calendar, User, Save, Edit, Search, CheckCircle, X, Users, CheckSquare, Check } from 'lucide-react';

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
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanned, setLastScanned] = useState(null);

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
            // Let's default to null (unset) visually,- [x] Optimize `Attendance.jsx` for mobile (Stacked view + larger touch targets)
            // [/] Optimize `AttendanceCapture.jsx` for mobile (Card refinements)

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

    const handleQRScan = (decodedText) => {
        // Find student by DNI or Profile ID
        const student = students.find(s => s.dni === decodedText || s.id === decodedText);

        if (student) {
            handleStatusChange(student.id, 'presente');
            setLastScanned({
                name: student.nombre,
                status: 'presente',
                time: new Date().toLocaleTimeString()
            });
            // Optional: visual feedback
            setMessage({ type: 'success', text: `Presente registrado: ${student.nombre}` });
            setTimeout(() => setMessage(null), 3000);
        } else {
            console.warn("Student not found for QR:", decodedText);
        }
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
            <div className="flex items-center justify-center min-h-screen bg-tech-primary text-tech-text">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-cyan"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between border-b border-tech-surface pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-tech-text uppercase tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-tech-cyan/20 rounded text-tech-cyan">
                            <Clock size={32} />
                        </div>
                        Control de Asistencia
                    </h1>
                    <p className="text-tech-muted font-mono mt-2">
                        {selectedAssignment
                            ? `${selectedAssignment.materia.nombre} - ${selectedAssignment.division.anio} "${selectedAssignment.division.seccion}"`
                            : 'Selecciona una materia para registrar la asistencia del día.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 text-tech-muted hover:text-tech-text hover:bg-tech-surface rounded transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Volver
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto">
                {message && (
                    <div className={`mb-6 p-4 rounded border flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 ${message.type === 'error'
                        ? 'bg-tech-danger/10 border-tech-danger text-tech-danger'
                        : 'bg-tech-success/10 border-tech-success text-tech-success'
                        }`}>
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} />
                            <span className="font-bold">{message.text}</span>
                        </div>
                        <button onClick={() => setMessage(null)} className="text-current opacity-50 hover:opacity-100">×</button>
                    </div>
                )}

                {isScanning && (
                    <QRScanner
                        onScanSuccess={handleQRScan}
                        onScanError={(err) => console.debug(err)} // Too noisy for console.error
                        onClose={() => setIsScanning(false)}
                    />
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
                                    <span className="text-xs font-mono text-tech-muted border border-tech-surface px-2 py-1 rounded">
                                        ID: {assign.id.slice(0, 6)}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-tech-text mb-2">{assign.materia.nombre}</h3>
                                <p className="text-tech-muted font-mono">
                                    {assign.division.anio} "{assign.division.seccion}"
                                </p>
                            </div>
                        ))}
                        {assignments.length === 0 && !loading && (
                            <div className="col-span-full text-center py-12 text-tech-muted font-mono">
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
                                <label className="text-tech-muted font-mono uppercase text-sm">Fecha:</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan outline-none font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                <button
                                    onClick={() => setIsScanning(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-tech-cyan/20 hover:bg-tech-cyan/30 text-tech-cyan rounded border border-tech-cyan/30 transition-all text-sm uppercase font-bold tracking-wider whitespace-nowrap"
                                >
                                    <QrCode size={18} />
                                    <span>Escanear QR</span>
                                </button>
                                <button
                                    onClick={markAllPresent}
                                    className="flex items-center gap-2 px-4 py-2 bg-tech-surface hover:bg-tech-secondary text-tech-text rounded border border-tech-surface transition-colors text-sm uppercase font-bold tracking-wider whitespace-nowrap"
                                >
                                    <CheckSquare size={18} />
                                    <span>Todos Presentes</span>
                                </button>
                                <button
                                    onClick={() => setSelectedAssignment(null)}
                                    className="px-4 py-2 text-tech-muted hover:text-tech-text transition-colors text-sm underline whitespace-nowrap"
                                >
                                    Curso
                                </button>
                            </div>
                        </div>

                        {/* Student List */}
                        <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center text-tech-muted font-mono animate-pulse">Cargando alumnos...</div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block">
                                        <table className="w-full">
                                            <thead className="bg-tech-primary text-tech-muted text-xs uppercase font-bold tracking-wider border-b border-tech-surface">
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
                                                                <div className="font-bold text-tech-text uppercase">{student.nombre}</div>
                                                                <div className="text-xs text-tech-muted font-mono">{student.dni}</div>
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
                                                                        className={`p-2 rounded transition-all ${status === 'tarde' ? 'bg-tech-accent text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-tech-primary text-tech-muted hover:bg-tech-surface'}`}
                                                                        title="Tarde"
                                                                    >
                                                                        <Clock size={20} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleStatusChange(student.id, 'justificado')}
                                                                        className={`p-2 rounded transition-all ${status === 'justificado' ? 'bg-tech-cyan text-white shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'bg-tech-primary text-tech-muted hover:bg-tech-surface'}`}
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
                                                                    className="w-full bg-tech-primary border border-tech-surface rounded px-3 py-2 text-sm text-tech-text placeholder-tech-muted/50 focus:border-tech-cyan outline-none transition-colors"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card List */}
                                    <div className="md:hidden divide-y divide-tech-surface">
                                        {students.map(student => {
                                            const status = attendanceMap[student.id];
                                            return (
                                                <div key={student.id} className="p-4 space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-bold text-tech-text uppercase tracking-tight">{student.nombre}</div>
                                                        <div className="text-[10px] text-tech-muted font-mono">DNI: {student.dni}</div>
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-2">
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'presente')}
                                                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${status === 'presente' ? 'bg-tech-success border-tech-success shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-tech-primary border-tech-surface text-tech-muted'}`}
                                                        >
                                                            <Check size={24} />
                                                            <span className="text-[8px] uppercase font-bold mt-1">Pres.</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'ausente')}
                                                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${status === 'ausente' ? 'bg-tech-danger border-tech-danger shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-tech-primary border-tech-surface text-tech-muted'}`}
                                                        >
                                                            <X size={24} />
                                                            <span className="text-[8px] uppercase font-bold mt-1">Aus.</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'tarde')}
                                                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${status === 'tarde' ? 'bg-tech-accent border-tech-accent shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-tech-primary border-tech-surface text-tech-muted'}`}
                                                        >
                                                            <Clock size={24} />
                                                            <span className="text-[8px] uppercase font-bold mt-1">Tarde</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'justificado')}
                                                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${status === 'justificado' ? 'bg-tech-cyan border-tech-cyan shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'bg-tech-primary border-tech-surface text-tech-muted'}`}
                                                        >
                                                            <AlertCircle size={24} />
                                                            <span className="text-[8px] uppercase font-bold mt-1">Just.</span>
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        placeholder="Observaciones..."
                                                        value={observationsMap[student.id] || ''}
                                                        onChange={(e) => handleObservationChange(student.id, e.target.value)}
                                                        className="w-full bg-tech-primary border border-tech-surface rounded-lg px-4 py-3 text-sm text-tech-text focus:border-tech-cyan outline-none transition-colors placeholder-tech-muted/50"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {students.length === 0 && (
                                        <div className="p-8 text-center text-tech-muted font-mono uppercase tracking-widest text-xs">
                                            No hay alumnos en esta división.
                                        </div>
                                    )}
                                </>
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
