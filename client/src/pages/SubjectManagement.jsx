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
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
            {/* Navigation Header */}
            <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            Materias
                        </h1>
                        <p className="text-slate-400 text-sm">Gestionar las materias del sistema educativo.</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        setFormData({ nombre: '', descripcion: '' });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                >
                    <Plus size={18} />
                    Nueva Materia
                </button>
            </header>

            <div className="max-w-6xl mx-auto">

                {isAdding && (
                    <div className="mb-8 p-6 bg-slate-800 rounded-xl border border-slate-700">
                        <h3 className="text-xl font-bold mb-4">Cargar nueva materia</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Nombre de la materia"
                                className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Descripción (opcional)"
                                className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button onClick={() => handleSave()} className="px-4 py-2 bg-green-600 rounded-lg font-bold">Guardar</button>
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-slate-700 rounded-lg font-bold">Cancelar</button>
                        </div>
                    </div>
                )}

                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-700/50 text-slate-400">
                            <tr>
                                <th className="p-4">Nombre</th>
                                <th className="p-4">Descripción</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" className="p-10 text-center text-slate-500">Cargando materias...</td></tr>
                            ) : subjects.map(s => (
                                <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                                    <td className="p-4">
                                        {editingId === s.id ? (
                                            <input
                                                type="text"
                                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-semibold">{s.nombre}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-400">
                                        {editingId === s.id ? (
                                            <input
                                                type="text"
                                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full"
                                                value={formData.descripcion}
                                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            />
                                        ) : (
                                            s.descripcion || '-'
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {editingId === s.id ? (
                                                <>
                                                    <button onClick={() => handleSave(s.id)} className="p-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600/40">
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40">
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(s)} className="p-2 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600/20">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-600/10 text-red-400 rounded hover:bg-red-600/20">
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
