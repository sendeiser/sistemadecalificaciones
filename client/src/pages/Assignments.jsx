import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, BookOpen, Layers, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Assignments = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({ docente_id: '', materia_id: '', division_id: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [asRes, tcRes, subRes, divRes] = await Promise.all([
            supabase.from('asignaciones').select('id, docente:perfiles!docente_id(nombre), materia:materias(nombre), division:divisiones(anio, seccion)'),
            supabase.from('perfiles').select('id, nombre').eq('rol', 'docente'),
            supabase.from('materias').select('*'),
            supabase.from('divisiones').select('*')
        ]);

        if (asRes.error) console.error("Error asignaciones:", asRes.error.message);
        if (tcRes.error) console.error("Error docentes:", tcRes.error.message);
        if (subRes.error) console.error("Error materias:", subRes.error.message);
        if (divRes.error) console.error("Error divisiones:", divRes.error.message);

        if (asRes.data) setAssignments(asRes.data);
        if (tcRes.data) setTeachers(tcRes.data);
        if (subRes.data) setSubjects(subRes.data);
        if (divRes.data) setDivisions(divRes.data);

        if (!divRes.data || divRes.data.length === 0) {
            console.warn("No se encontraron divisiones. Verifica los datos y políticas RLS.");
        }
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.docente_id || !form.materia_id || !form.division_id) return;
        setSaving(true);
        const { error } = await supabase.from('asignaciones').insert(form);
        if (error) alert(error.message);
        else {
            setForm({ docente_id: '', materia_id: '', division_id: '' });
            fetchData();
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta asignación?')) return;
        const { error } = await supabase.from('asignaciones').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchData();
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between border-b border-tech-surface pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-surface rounded transition-colors text-tech-muted hover:text-tech-text"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-tech-text tracking-tight uppercase">
                            Asignaciones
                        </h1>
                        <p className="text-tech-muted text-sm font-mono">VINCULACIÓN DOCENTE - MATERIA - CURSO</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="bg-tech-secondary p-6 rounded border border-tech-surface h-fit shadow-lg shadow-black/20">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-tech-text uppercase tracking-wider border-b border-tech-surface pb-2">
                        <UserPlus className="text-tech-cyan" size={20} />
                        Nueva Asignación
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-tech-muted uppercase mb-1 tracking-wider">Docente</label>
                            <select
                                className="w-full bg-tech-primary border border-tech-surface rounded p-2.5 focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none text-tech-text transition-all text-sm"
                                value={form.docente_id}
                                onChange={e => setForm({ ...form, docente_id: e.target.value })}
                                required
                            >
                                <option value="">SELECCIONAR DOCENTE...</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-tech-muted uppercase mb-1 tracking-wider">Materia</label>
                            <select
                                className="w-full bg-tech-primary border border-tech-surface rounded p-2.5 focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none text-tech-text transition-all text-sm"
                                value={form.materia_id}
                                onChange={e => setForm({ ...form, materia_id: e.target.value })}
                                required
                            >
                                <option value="">SELECCIONAR MATERIA...</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-tech-muted uppercase mb-1 tracking-wider">División</label>
                            <select
                                className="w-full bg-tech-primary border border-tech-surface rounded p-2.5 focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none text-tech-text transition-all text-sm"
                                value={form.division_id}
                                onChange={e => setForm({ ...form, division_id: e.target.value })}
                                required
                            >
                                <option value="">SELECCIONAR DIVISIÓN...</option>
                                {divisions.map(d => <option key={d.id} value={d.id}>{d.anio} {d.seccion}</option>)}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 bg-tech-cyan hover:bg-sky-600 rounded font-bold transition-all disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(14,165,233,0.3)] uppercase tracking-wider text-sm text-white"
                        >
                            {saving ? 'PROCESANDO...' : 'CREAR ASIGNACIÓN'}
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-tech-text uppercase tracking-wider">
                        <Layers className="text-purple-400" size={20} />
                        Asignaciones Actuales
                    </h3>

                    {loading ? <p className="text-tech-muted font-mono animate-pulse">Cargando base de datos...</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignments.map(as => (
                                <div key={as.id} className="bg-tech-secondary p-5 rounded border border-tech-surface hover:border-tech-cyan/50 transition-all flex justify-between items-start shadow-md group">
                                    <div className="space-y-2">
                                        <p className="text-lg font-bold text-tech-text leading-tight font-heading">{as.materia?.nombre}</p>
                                        <div className="flex items-center gap-2 text-tech-muted text-sm font-mono">
                                            <span className="px-2 py-0.5 bg-tech-primary rounded border border-tech-surface text-tech-cyan font-bold">
                                                {as.division?.anio} {as.division?.seccion}
                                            </span>
                                            <span className="text-slate-600">|</span>
                                            <span className="text-tech-text">{as.docente?.nombre}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(as.id)}
                                        className="p-2 text-slate-500 hover:text-tech-danger hover:bg-tech-danger/10 rounded transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {assignments.length === 0 && <p className="text-tech-muted font-mono italic">No hay asignaciones registradas.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Assignments;
