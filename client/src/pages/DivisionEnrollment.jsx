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
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto mb-10 border-b border-tech-surface pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-surface rounded transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight uppercase">
                            Inscripción de Alumnos
                        </h1>
                        <p className="text-slate-400 text-sm font-mono">ASIGNACIÓN A CURSOS Y DISVISIONES</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Selector de División */}
                <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4 flex-grow">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Seleccionar División</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {divisions.map((div) => (
                                    <button
                                        key={div.id}
                                        onClick={() => setSelectedDivisionId(div.id)}
                                        className={`p-3 rounded border transition-all text-center relative overflow-hidden group ${selectedDivisionId === div.id
                                            ? 'bg-tech-cyan border-tech-cyan text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                                            : 'bg-tech-primary border-tech-surface text-slate-400 hover:border-tech-cyan/50 hover:text-white'
                                            }`}
                                    >
                                        <div className="text-lg font-bold">{div.anio}</div>
                                        <div className="text-xs opacity-75 font-mono">{div.seccion}</div>
                                        {selectedDivisionId === div.id && (
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full m-1 animate-pulse"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedDivisionId && (
                            <div className="relative w-full md:w-64 self-end">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="FILTRAR ALUMNOS..."
                                    className="w-full pl-10 pr-4 py-2 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan outline-none transition-all text-white placeholder-slate-600 font-mono text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedDivisionId}
                        className="flex items-center gap-2 px-8 py-3 bg-tech-cyan hover:bg-sky-600 disabled:bg-tech-surface disabled:text-slate-500 rounded font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:shadow-none uppercase tracking-wider text-sm text-white"
                    >
                        <Save size={20} />
                        {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                    </button>
                </div>
            </div>

            {!selectedDivisionId ? (
                <div className="flex flex-col items-center justify-center py-20 bg-tech-secondary/50 rounded border border-dashed border-tech-surface text-slate-600 mt-8">
                    <Layers size={64} className="mb-4 opacity-20" />
                    <p className="text-xl font-light uppercase tracking-widest">Seleccionar División</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500 mt-4">
                    {/* Available Students */}
                    <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden flex flex-col shadow-xl">
                        <div className="p-4 bg-tech-primary/50 flex justify-between items-center border-b border-tech-surface">
                            <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">Alumnos Disponibles <span className="text-tech-cyan ml-1">({filteredAvailable.length})</span></h3>
                            <span className="text-xs text-slate-600 font-mono">CLICK PARA ASIGNAR ►</span>
                        </div>
                        <div className="flex-grow overflow-y-auto max-h-[500px] p-2 space-y-1 custom-scrollbar">
                            {loading ? (
                                <p className="p-4 text-center text-slate-500 font-mono animate-pulse">Cargando...</p>
                            ) : filteredAvailable.length === 0 ? (
                                <p className="p-4 text-center text-slate-500 italic text-sm font-mono">No hay alumnos disponibles.</p>
                            ) : filteredAvailable.map(s => (
                                <div
                                    key={s.id}
                                    className="p-3 bg-tech-primary hover:bg-tech-cyan/10 border border-transparent hover:border-tech-cyan/30 rounded flex justify-between items-center transition-all group cursor-pointer"
                                    onClick={() => moveToAssigned(s)}
                                >
                                    <div>
                                        <p className="font-bold text-slate-200 text-sm">{s.nombre}</p>
                                        <p className="text-xs text-slate-500 font-mono">DNI: {s.dni || 'N/A'}</p>
                                    </div>
                                    <button
                                        className="p-1.5 bg-tech-secondary text-tech-cyan rounded hover:bg-tech-cyan hover:text-white transition-all transform group-hover:translate-x-1"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assigned Students */}
                    <div className="bg-tech-secondary rounded border border-tech-cyan/30 overflow-hidden flex flex-col shadow-[0_0_20px_rgba(14,165,233,0.1)]">
                        <div className="p-4 bg-tech-cyan/10 flex justify-between items-center border-b border-tech-cyan/20">
                            <h3 className="font-bold text-white uppercase text-xs tracking-wider">Alumnos Asignados <span className="text-tech-cyan ml-1">({assignedStudents.length})</span></h3>
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-tech-cyan" />
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto max-h-[500px] p-2 space-y-1 custom-scrollbar bg-tech-cyan/5">
                            {assignedStudents.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center">
                                    <Users size={32} className="text-slate-700 mb-2 opacity-50" />
                                    <p className="text-slate-500 text-xs font-mono uppercase">Lista vacía</p>
                                </div>
                            ) : assignedStudents.map(s => (
                                <div
                                    key={s.id}
                                    className="p-3 bg-tech-primary border border-tech-surface hover:border-tech-danger/50 rounded flex justify-between items-center transition-all group cursor-pointer hover:bg-tech-danger/5"
                                    onClick={() => moveToAvailable(s)}
                                >
                                    <button
                                        className="p-1.5 bg-tech-secondary text-slate-500 group-hover:text-tech-danger rounded transition-all transform group-hover:-translate-x-1"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="text-right">
                                        <p className="font-bold text-white text-sm">{s.nombre}</p>
                                        <p className="text-xs text-slate-500 font-mono">{s.dni}</p>
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
