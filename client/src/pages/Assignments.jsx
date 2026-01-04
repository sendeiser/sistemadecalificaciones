import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, BookOpen, Layers, ArrowLeft } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            Asignaciones
                        </h1>
                        <p className="text-slate-400 text-sm">Vincular docentes, materias y divisiones.</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit shadow-xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <UserPlus className="text-blue-400" size={20} />
                        Nueva Asignación
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Docente</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                                value={form.docente_id}
                                onChange={e => setForm({ ...form, docente_id: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Docente...</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Materia</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                                value={form.materia_id}
                                onChange={e => setForm({ ...form, materia_id: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Materia...</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">División</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                                value={form.division_id}
                                onChange={e => setForm({ ...form, division_id: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar División...</option>
                                {divisions.map(d => <option key={d.id} value={d.id}>{d.anio} {d.seccion}</option>)}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors disabled:opacity-50 mt-2 shadow-lg shadow-blue-900/20"
                        >
                            {saving ? 'Guardando...' : 'Crear Asignación'}
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Layers className="text-purple-400" size={20} />
                        Asignaciones Actuales
                    </h3>

                    {loading ? <p className="text-slate-500">Cargando...</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignments.map(as => (
                                <div key={as.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 group hover:border-blue-500/50 transition-all flex justify-between items-start shadow-md">
                                    <div className="space-y-2">
                                        <p className="text-lg font-bold text-white leading-tight">{as.materia?.nombre}</p>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-700 text-blue-300 font-medium">
                                                {as.division?.anio} {as.division?.seccion}
                                            </span>
                                            <span className="text-slate-500">•</span>
                                            <span className="font-medium text-slate-300">{as.docente?.nombre}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(as.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {assignments.length === 0 && <p className="text-slate-600">No hay asignaciones creadas.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Assignments;
