import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { Users, ChevronRight, ChevronLeft, Search, Save, BookOpen, Layers, ArrowLeft, Clipboard, X, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

const DivisionEnrollment = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState('');
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedAvailable, setSelectedAvailable] = useState(new Set());
    const [selectedAssigned, setSelectedAssigned] = useState(new Set());
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [bulkStats, setBulkStats] = useState(null);

    useEffect(() => {
        fetchDivisions();
    }, []);

    useEffect(() => {
        if (selectedDivisionId) {
            fetchEnrollments();
            setSelectedAvailable(new Set());
            setSelectedAssigned(new Set());
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

    const toggleSelection = (id, type) => {
        const target = type === 'available' ? selectedAvailable : selectedAssigned;
        const setter = type === 'available' ? setSelectedAvailable : setSelectedAssigned;
        const newSet = new Set(target);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setter(newSet);
    };

    const moveSelectedToAssigned = () => {
        const toMove = availableStudents.filter(s => selectedAvailable.has(s.id));
        setAvailableStudents(availableStudents.filter(s => !selectedAvailable.has(s.id)));
        setAssignedStudents([...assignedStudents, ...toMove].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setSelectedAvailable(new Set());
    };

    const moveAllFilteredToAssigned = () => {
        const toMove = filteredAvailable;
        const toMoveIds = new Set(toMove.map(s => s.id));
        setAvailableStudents(availableStudents.filter(s => !toMoveIds.has(s.id)));
        setAssignedStudents([...assignedStudents, ...toMove].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setSelectedAvailable(new Set());
    };

    const moveSelectedToAvailable = () => {
        const toMove = assignedStudents.filter(s => selectedAssigned.has(s.id));
        setAssignedStudents(assignedStudents.filter(s => !selectedAssigned.has(s.id)));
        setAvailableStudents([...availableStudents, ...toMove].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setSelectedAssigned(new Set());
    };

    const moveAllAssignedToAvailable = () => {
        setAvailableStudents([...availableStudents, ...assignedStudents].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setAssignedStudents([]);
        setSelectedAssigned(new Set());
    };

    const moveToAssigned = (student) => {
        setAvailableStudents(availableStudents.filter(s => s.id !== student.id));
        setAssignedStudents([...assignedStudents, student].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    };

    const moveToAvailable = (student) => {
        setAssignedStudents(assignedStudents.filter(s => s.id !== student.id));
        setAvailableStudents([...availableStudents, student].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    };

    const handleBulkProcess = async () => {
        if (!bulkText.trim()) return;
        setBulkProcessing(true);
        const lines = bulkText.split(/\n|,/).map(l => l.trim().toLowerCase()).filter(l => l.length > 0);

        let found = [];
        let notFound = [];
        let alreadyAssigned = [];

        const tempAvailable = [...availableStudents];
        const tempAssigned = [...assignedStudents];

        for (const line of lines) {
            // Check if already in assigned
            const inAssigned = tempAssigned.find(s =>
                s.dni === line || s.nombre.toLowerCase().includes(line)
            );
            if (inAssigned) {
                alreadyAssigned.push(line);
                continue;
            }

            // Find in available
            const matchIndex = tempAvailable.findIndex(s =>
                s.dni === line || s.nombre.toLowerCase().includes(line)
            );

            if (matchIndex !== -1) {
                const student = tempAvailable.splice(matchIndex, 1)[0];
                tempAssigned.push(student);
                found.push(student.nombre);
            } else {
                notFound.push(line);
            }
        }

        setAvailableStudents(tempAvailable.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setAssignedStudents(tempAssigned.sort((a, b) => a.nombre.localeCompare(b.nombre)));

        setBulkStats({
            found: found.length,
            notFound: notFound.length,
            alreadyAssigned: alreadyAssigned.length,
            missingList: notFound
        });

        setBulkText('');
        setBulkProcessing(false);
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
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto mb-10 border-b border-tech-surface pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-surface rounded transition-colors text-tech-muted hover:text-tech-text"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-tech-text tracking-tight uppercase">
                            Inscripción de Alumnos
                        </h1>
                        <p className="text-tech-muted text-sm font-mono">ASIGNACIÓN A CURSOS Y DISVISIONES</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Selector de División */}
                <div className="bg-tech-secondary p-6 rounded border border-tech-surface shadow-lg relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-tech-cyan/5 rounded-full blur-3xl"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-4 flex-grow">
                            <label className="text-xs font-bold text-tech-muted uppercase tracking-wider block flex items-center gap-2">
                                <Layers size={14} className="text-tech-cyan" /> Seleccionar División
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {divisions.map((div) => (
                                    <button
                                        key={div.id}
                                        onClick={() => setSelectedDivisionId(div.id)}
                                        className={`p-3 rounded border transition-all text-center relative overflow-hidden group ${selectedDivisionId === div.id
                                            ? 'bg-tech-cyan border-tech-cyan text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                                            : 'bg-tech-primary border-tech-surface text-tech-muted hover:border-tech-cyan/50 hover:text-tech-text'
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
                            <div className="flex flex-col gap-3">
                                <div className="relative w-full md:w-64 self-end">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-muted" size={18} />
                                    <input
                                        type="text"
                                        placeholder="BUSCAR NOMBRE/DNI..."
                                        className="w-full pl-10 pr-4 py-2 bg-tech-primary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan outline-none transition-all text-tech-text placeholder-tech-muted/50 font-mono text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => setIsBulkOpen(!isBulkOpen)}
                                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${isBulkOpen
                                            ? 'bg-tech-surface text-tech-text border border-tech-cyan/50'
                                            : 'bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/20 hover:bg-tech-cyan/20'
                                        }`}
                                >
                                    <Sparkles size={14} />
                                    Pegado Inteligente
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Smart Paste Area */}
                    {isBulkOpen && (
                        <div className="mt-8 pt-8 border-t border-tech-surface animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-tech-text uppercase flex items-center gap-2">
                                            <Clipboard size={16} className="text-tech-cyan" /> Inscripción en Lote
                                        </h4>
                                        <span className="text-[10px] text-tech-muted font-mono uppercase">Separa por líneas o comas</span>
                                    </div>
                                    <textarea
                                        className="w-full h-40 p-4 bg-tech-primary border border-tech-surface rounded focus:ring-2 focus:ring-tech-cyan outline-none text-tech-text font-mono text-sm custom-scrollbar"
                                        placeholder="Ejemplos:&#10;34555123&#10;GOMEZ JUAN&#10;RODRIGUEZ ANA, 33444555"
                                        value={bulkText}
                                        onChange={(e) => setBulkText(e.target.value)}
                                    ></textarea>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setIsBulkOpen(false)}
                                            className="px-6 py-2 text-tech-muted hover:text-tech-text text-xs font-bold uppercase"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleBulkProcess}
                                            disabled={bulkProcessing || !bulkText.trim()}
                                            className="px-6 py-2 bg-tech-cyan text-white rounded text-xs font-bold uppercase hover:bg-sky-600 transition-all disabled:opacity-50"
                                        >
                                            {bulkProcessing ? 'Procesando...' : 'Analizar e Inscribir'}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-tech-primary/50 rounded-xl p-6 border border-tech-surface flex flex-col justify-center gap-4">
                                    {!bulkStats ? (
                                        <div className="text-center space-y-2 opacity-40">
                                            <Sparkles size={48} className="mx-auto mb-2" />
                                            <p className="text-xs font-mono uppercase">Pega un listado para que la IA identifique a los alumnos automáticamente</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in">
                                            <h5 className="text-xs font-black text-tech-text uppercase tracking-widest border-b border-tech-surface pb-2">Resultado del Proceso</h5>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="p-3 bg-tech-success/10 rounded-lg border border-tech-success/30">
                                                    <div className="text-xl font-bold text-tech-success">{bulkStats.found}</div>
                                                    <div className="text-[8px] uppercase font-mono text-tech-muted">Encontrados</div>
                                                </div>
                                                <div className="p-3 bg-tech-cyan/10 rounded-lg border border-tech-cyan/30">
                                                    <div className="text-xl font-bold text-tech-cyan">{bulkStats.alreadyAssigned}</div>
                                                    <div className="text-[8px] uppercase font-mono text-tech-muted">Ya estaban</div>
                                                </div>
                                                <div className="p-3 bg-tech-danger/10 rounded-lg border border-tech-danger/30">
                                                    <div className="text-xl font-bold text-tech-danger">{bulkStats.notFound}</div>
                                                    <div className="text-[8px] uppercase font-mono text-tech-muted">Ignorados</div>
                                                </div>
                                            </div>
                                            {bulkStats.missingList.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-tech-danger uppercase flex items-center gap-1">
                                                        <AlertTriangle size={12} /> No se encontraron los siguientes alumnos:
                                                    </p>
                                                    <div className="max-h-20 overflow-y-auto text-[10px] font-mono text-tech-muted bg-tech-primary p-2 rounded custom-scrollbar">
                                                        {bulkStats.missingList.map((m, i) => <div key={i}>• {m}</div>)}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-[10px] text-tech-success font-bold uppercase bg-tech-success/5 p-2 rounded">
                                                <CheckCircle2 size={14} /> Se han movido los alumnos a la lista de "Asignados"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedDivisionId}
                        className="flex items-center gap-2 px-8 py-3 bg-tech-cyan hover:bg-sky-600 disabled:bg-tech-surface disabled:text-tech-muted rounded font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:shadow-none uppercase tracking-wider text-sm text-white"
                    >
                        <Save size={20} />
                        {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                    </button>
                </div>
            </div>

            {!selectedDivisionId ? (
                <div className="flex flex-col items-center justify-center py-20 bg-tech-secondary/50 rounded border border-dashed border-tech-surface text-tech-muted mt-8">
                    <Layers size={64} className="mb-4 opacity-20" />
                    <p className="text-xl font-light uppercase tracking-widest">Seleccionar División</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500 mt-4">
                    {/* Available Students */}
                    <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden flex flex-col shadow-xl">
                        <div className="p-4 bg-tech-primary/50 flex flex-col gap-4 border-b border-tech-surface">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-tech-text uppercase text-xs tracking-wider">
                                    Alumnos Disponibles <span className="text-tech-cyan ml-1">({filteredAvailable.length})</span>
                                </h3>
                                <div className="flex gap-2">
                                    {selectedAvailable.size > 0 && (
                                        <button
                                            onClick={moveSelectedToAssigned}
                                            className="px-3 py-1 bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/30 rounded text-[10px] font-bold uppercase hover:bg-tech-cyan hover:text-white transition-all animate-in fade-in"
                                        >
                                            Asignar {selectedAvailable.size}
                                        </button>
                                    )}
                                    <button
                                        onClick={moveAllFilteredToAssigned}
                                        className="px-3 py-1 bg-tech-surface text-tech-muted border border-tech-surface rounded text-[10px] font-bold uppercase hover:text-tech-text hover:border-tech-cyan transition-all"
                                    >
                                        Asignar Todos
                                    </button>
                                </div>
                            </div>
                            <span className="text-[10px] text-tech-muted font-mono uppercase tracking-widest italic flex items-center gap-2">
                                <Search size={12} /> Selecciona varios o arrastra
                            </span>
                        </div>
                        <div className="flex-grow overflow-y-auto max-h-[500px] p-2 space-y-1 custom-scrollbar">
                            {loading ? (
                                <p className="p-4 text-center text-tech-muted font-mono animate-pulse">Cargando...</p>
                            ) : filteredAvailable.length === 0 ? (
                                <p className="p-4 text-center text-tech-muted italic text-sm font-mono">No hay alumnos disponibles.</p>
                            ) : filteredAvailable.map(s => (
                                <div
                                    key={s.id}
                                    className={`p-3 border rounded flex justify-between items-center transition-all group cursor-pointer ${selectedAvailable.has(s.id)
                                        ? 'bg-tech-cyan/10 border-tech-cyan/40 scale-[0.98]'
                                        : 'bg-tech-primary border-transparent hover:border-tech-cyan/30'
                                        }`}
                                    onClick={(e) => {
                                        if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                            toggleSelection(s.id, 'available');
                                        } else {
                                            moveToAssigned(s);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedAvailable.has(s.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleSelection(s.id, 'available');
                                            }}
                                            className="w-4 h-4 rounded border-tech-surface text-tech-cyan bg-tech-primary focus:ring-tech-cyan"
                                        />
                                        <div>
                                            <p className="font-bold text-tech-text text-sm">{s.nombre}</p>
                                            <p className="text-xs text-tech-muted font-mono">DNI: {s.dni || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveToAssigned(s); }}
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
                        <div className="p-4 bg-tech-cyan/10 flex flex-col gap-4 border-b border-tech-cyan/20">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-tech-text uppercase text-xs tracking-wider">
                                    Alumnos Asignados <span className="text-tech-cyan ml-1">({assignedStudents.length})</span>
                                </h3>
                                <div className="flex gap-2">
                                    {selectedAssigned.size > 0 && (
                                        <button
                                            onClick={moveSelectedToAvailable}
                                            className="px-3 py-1 bg-tech-danger/20 text-tech-danger border border-tech-danger/30 rounded text-[10px] font-bold uppercase hover:bg-tech-danger hover:text-white transition-all animate-in fade-in"
                                        >
                                            Quitar {selectedAssigned.size}
                                        </button>
                                    )}
                                    <button
                                        onClick={moveAllAssignedToAvailable}
                                        className="px-3 py-1 bg-tech-surface/50 text-tech-muted border border-tech-surface rounded text-[10px] font-bold uppercase hover:text-tech-danger hover:border-tech-danger transition-all"
                                    >
                                        Quitar Todos
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto max-h-[500px] p-2 space-y-1 custom-scrollbar bg-tech-cyan/5">
                            {assignedStudents.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center">
                                    <Users size={32} className="text-tech-surface mb-2 opacity-50" />
                                    <p className="text-tech-muted text-xs font-mono uppercase">Lista vacía</p>
                                </div>
                            ) : assignedStudents.map(s => (
                                <div
                                    key={s.id}
                                    className={`p-3 border rounded flex justify-between items-center transition-all group cursor-pointer ${selectedAssigned.has(s.id)
                                        ? 'bg-tech-danger/5 border-tech-danger/30'
                                        : 'bg-tech-primary border-tech-surface hover:border-tech-danger/50'
                                        }`}
                                    onClick={(e) => {
                                        if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                            toggleSelection(s.id, 'assigned');
                                        } else {
                                            moveToAvailable(s);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedAssigned.has(s.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleSelection(s.id, 'assigned');
                                            }}
                                            className="w-4 h-4 rounded border-tech-surface text-tech-danger bg-tech-primary focus:ring-tech-danger"
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); moveToAvailable(s); }}
                                            className="p-1.5 bg-tech-secondary text-tech-muted group-hover:text-tech-danger rounded transition-all transform group-hover:-translate-x-1"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-tech-text text-sm">{s.nombre}</p>
                                        <p className="text-xs text-tech-muted font-mono">{s.dni}</p>
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
