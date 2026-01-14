import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Pencil, Trash2, X, Check, ArrowLeft } from 'lucide-react';

const SubjectManagement = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('materias')
            .select('*')
            .order('nombre');

        if (data) setSubjects(data);
        if (error) console.error(error);
        setLoading(false);
    };

    const handleSave = async (id = null) => {
        if (!formData.nombre.trim()) return alert('El nombre es obligatorio');

        try {
            if (id) {
                const { error } = await supabase
                    .from('materias')
                    .update({ nombre: formData.nombre, descripcion: formData.descripcion })
                    .eq('id', id);
                if (error) throw error;
                setSubjects(subjects.map(s => s.id === id ? { ...s, ...formData } : s));
                setEditingId(null);
            } else {
                const { data, error } = await supabase
                    .from('materias')
                    .insert([formData])
                    .select()
                    .single();
                if (error) throw error;
                setSubjects([...subjects, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
                setIsAdding(false);
            }
            setFormData({ nombre: '', descripcion: '' });
        } catch (err) {
            alert('Error al guardar: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta materia?')) return;

        const { error } = await supabase.from('materias').delete().eq('id', id);
        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            setSubjects(subjects.filter(s => s.id !== id));
        }
    };

    const startEdit = (subject) => {
        setEditingId(subject.id);
        setFormData({ nombre: subject.nombre, descripcion: subject.descripcion || '' });
    };

    return (
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            {/* Navigation Header */}
            <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between border-b border-tech-surface pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-surface rounded transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight uppercase">
                            Materias
                        </h1>
                        <p className="text-slate-400 text-sm font-mono">GESTIÓN DE UNIDADES CURRICULARES</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        setFormData({ nombre: '', descripcion: '' });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-tech-cyan hover:bg-sky-600 rounded transition-all text-sm font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)] uppercase tracking-wider text-white"
                >
                    <Plus size={18} />
                    Nueva Materia
                </button>
            </header>

            <div className="max-w-6xl mx-auto">

                {isAdding && (
                    <div className="mb-8 p-6 bg-tech-secondary rounded border border-tech-surface shadow-lg animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-wider">Cargar Nueva Materia</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="NOMBRE DE LA MATERIA"
                                className="bg-tech-primary border border-tech-surface rounded px-4 py-2 text-white focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none transition-all placeholder-slate-600"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="DESCRIPCIÓN (OPCIONAL)"
                                className="bg-tech-primary border border-tech-surface rounded px-4 py-2 text-white focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none transition-all placeholder-slate-600"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button onClick={() => handleSave()} className="px-4 py-2 bg-tech-success hover:bg-emerald-600 rounded font-bold text-white uppercase tracking-wider text-sm transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]">Guardar</button>
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-tech-surface hover:bg-slate-700 rounded font-bold text-slate-300 uppercase tracking-wider text-sm">Cancelar</button>
                        </div>
                    </div>
                )}

                <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead className="bg-tech-primary text-slate-400 border-b border-tech-surface">
                            <tr>
                                <th className="p-4 uppercase text-xs font-bold tracking-wider">Nombre</th>
                                <th className="p-4 uppercase text-xs font-bold tracking-wider">Descripción</th>
                                <th className="p-4 text-center uppercase text-xs font-bold tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-tech-surface">
                            {loading ? (
                                <tr><td colSpan="3" className="p-10 text-center text-slate-500 font-mono animate-pulse">Cargando unidades curriculares...</td></tr>
                            ) : subjects.map(s => (
                                <tr key={s.id} className="hover:bg-tech-primary/50 transition-colors">
                                    <td className="p-4">
                                        {editingId === s.id ? (
                                            <input
                                                type="text"
                                                className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 w-full text-white outline-none"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-bold text-slate-200">{s.nombre}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-400">
                                        {editingId === s.id ? (
                                            <input
                                                type="text"
                                                className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 w-full text-white outline-none"
                                                value={formData.descripcion}
                                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            />
                                        ) : (
                                            s.descripcion || <span className="text-slate-600 italic">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {editingId === s.id ? (
                                                <>
                                                    <button onClick={() => handleSave(s.id)} className="p-1.5 bg-tech-success/10 text-tech-success rounded hover:bg-tech-success/20 transition-all">
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-tech-danger/10 text-tech-danger rounded hover:bg-tech-danger/20 transition-all">
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(s)} className="p-1.5 text-tech-cyan hover:bg-tech-cyan/10 rounded transition-all">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-tech-danger hover:bg-tech-danger/10 rounded transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SubjectManagement;
