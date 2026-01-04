import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, ChevronLeft, Search, Save, BookOpen, Layers, ArrowLeft } from 'lucide-react';

const DivisionEnrollment = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState('');
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDivisions();
    }, []);

    useEffect(() => {
        if (selectedDivisionId) {
            fetchEnrollments();
        } else {
            setAssignedStudents([]);
            setAvailableStudents([]);
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

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            // 1. Get all students
            const { data: allStudents, error: sErr } = await supabase
                .from('perfiles')
                .select('*')
                .eq('rol', 'alumno')
                .order('nombre');

            if (sErr) throw sErr;

            // 2. Get ALL enrollments to check for students in other divisions
            const { data: allEnrollments, error: eErr } = await supabase
                .from('estudiantes_divisiones')
                .select('alumno_id, division_id');

            if (eErr) throw eErr;

            // IDs of students already assigned to the SELECTED division
            const enrolledInCurrentIds = new Set(
                allEnrollments.filter(e => e.division_id === selectedDivisionId).map(e => e.alumno_id)
            );

            // IDs of students assigned to ANY division (to exclude them from 'Available')
            const allEnrolledIds = new Set(allEnrollments.map(e => e.alumno_id));

            // Right list: Students in the current division
            setAssignedStudents(allStudents.filter(s => enrolledInCurrentIds.has(s.id)));

            // Left list: Students NOT assigned to any division
            setAvailableStudents(allStudents.filter(s => !allEnrolledIds.has(s.id)));

        } catch (err) {
            alert('Error al cargar datos: ' + err.message);
        }
        setLoading(false);
    };

    const moveToAssigned = (student) => {
        setAvailableStudents(availableStudents.filter(s => s.id !== student.id));
        setAssignedStudents([...assignedStudents, student].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    };

    const moveToAvailable = (student) => {
        setAssignedStudents(assignedStudents.filter(s => s.id !== student.id));
        setAvailableStudents([...availableStudents, student].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    };

    const handleSave = async () => {
        if (!selectedDivisionId) return;
        setSaving(true);
        try {
            // Bulk update logic: 
            // 1. Delete all current enrollments for this division
            const { error: delErr } = await supabase
                .from('estudiantes_divisiones')
                .delete()
                .eq('division_id', selectedDivisionId);

            if (delErr) throw delErr;

            // 2. Insert new ones
            if (assignedStudents.length > 0) {
                const newEnrollments = assignedStudents.map(s => ({
                    division_id: selectedDivisionId,
                    alumno_id: s.id
                }));
                const { error: insErr } = await supabase
                    .from('estudiantes_divisiones')
                    .insert(newEnrollments);
                if (insErr) throw insErr;
            }

            alert('Agrupamiento guardado con éxito. Ahora el docente verá a estos alumnos en su planilla.');
        } catch (err) {
            alert('Error al guardar: ' + err.message);
        }
        setSaving(false);
    };

    const filteredAvailable = availableStudents.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.dni && s.dni.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto mb-10 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            Inscripción
                        </h1>
                        <p className="text-slate-400 text-sm">Asignar alumnos a cursos y divisiones.</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Selector de División */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4 flex-grow">
                            <label className="text-sm font-semibold text-slate-300 block">Seleccionar División</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {divisions.map((div) => (
                                    <button
                                        key={div.id}
                                        onClick={() => setSelectedDivisionId(div.id)}
                                        className={`p-3 rounded-lg border transition-all text-center ${selectedDivisionId === div.id
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40 scale-105'
                                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                            }`}
                                    >
                                        <div className="text-lg font-bold">{div.anio}</div>
                                        <div className="text-xs opacity-75">{div.seccion}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedDivisionId && (
                            <div className="relative w-full md:w-64 self-end">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Filtrar alumnos..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || !selectedDivisionId}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                    <Save size={20} />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {!selectedDivisionId ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700 text-slate-500">
                    <Layers size={48} className="mb-4 opacity-20" />
                    <p className="text-xl">Selecciona una división para comenzar a agrupar alumnos</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                    {/* Available Students */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col shadow-xl">
                        <div className="p-4 bg-slate-700/50 flex justify-between items-center border-b border-slate-700">
                            <h3 className="font-bold text-slate-300">Alumnos Disponibles ({filteredAvailable.length})</h3>
                            <span className="text-xs text-slate-500">Haz clic en {'>'} para asignar</span>
                        </div>
                        <div className="flex-grow overflow-y-auto max-h-[500px] p-2 space-y-1 custom-scrollbar">
                            {loading ? (
                                <p className="p-4 text-center text-slate-500">Cargando...</p>
                            ) : filteredAvailable.length === 0 ? (
                                <p className="p-4 text-center text-slate-500 italic text-sm">No hay alumnos disponibles para este filtro.</p>
                            ) : filteredAvailable.map(s => (
                                <div
                                    key={s.id}
                                    className="p-3 bg-slate-900/50 hover:bg-blue-500/10 border border-slate-900 hover:border-blue-500/30 rounded-xl flex justify-between items-center transition-all group"
                                >
                                    <div>
                                        <p className="font-semibold">{s.nombre}</p>
                                        <p className="text-xs text-slate-500 font-mono italic">DNI: {s.dni || 'N/A'}</p>
                                    </div>
                                    <button
                                        onClick={() => moveToAssigned(s)}
                                        className="p-2 bg-slate-800 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all transform group-hover:translate-x-1"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assigned Students */}
                    <div className="bg-slate-800 rounded-2xl border border-blue-500/30 overflow-hidden flex flex-col shadow-xl ring-1 ring-blue-500/10">
                        <div className="p-4 bg-blue-600/10 flex justify-between items-center border-b border-blue-500/20">
                            <h3 className="font-bold text-blue-300">Alumnos en esta División ({assignedStudents.length})</h3>
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-blue-400" />
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto max-h-[500px] p-2 space-y-1 custom-scrollbar bg-blue-500/5">
                            {assignedStudents.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center">
                                    <Users size={32} className="text-slate-600 mb-2 opacity-20" />
                                    <p className="text-slate-500 text-sm">Haz clic en {'>'} para agregar alumnos a este curso</p>
                                </div>
                            ) : assignedStudents.map(s => (
                                <div
                                    key={s.id}
                                    className="p-3 bg-slate-900 border border-blue-500/20 hover:border-red-500/30 rounded-xl flex justify-between items-center transition-all group shadow-sm"
                                >
                                    <button
                                        onClick={() => moveToAvailable(s)}
                                        className="p-2 bg-slate-800 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all transform group-hover:-translate-x-1"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="text-right">
                                        <p className="font-semibold text-blue-100">{s.nombre}</p>
                                        <p className="text-xs text-blue-300/50 font-mono italic">{s.dni}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DivisionEnrollment;
