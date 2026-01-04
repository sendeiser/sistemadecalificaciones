import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Layers, Plus, Pencil, Trash2, X, Check, Save, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DivisionManagement = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        anio: '',
        seccion: '',
        ciclo_lectivo: new Date().getFullYear(),
        campo_formacion: ''
    });

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('divisiones')
            .select('*')
            .order('anio', { ascending: true })
            .order('seccion', { ascending: true });

        if (data) setDivisions(data);
        if (error) console.error(error);
        setLoading(false);
    };

    const handleSave = async (id = null) => {
        if (!formData.anio.trim() || !formData.seccion.trim()) {
            return alert('Año y Sección son obligatorios');
        }

        try {
            if (id) {
                const { error } = await supabase
                    .from('divisiones')
                    .update(formData)
                    .eq('id', id);

                if (error) throw error;
                setDivisions(divisions.map(d => d.id === id ? { ...d, ...formData } : d));
                setEditingId(null);
            } else {
                const { data, error } = await supabase
                    .from('divisiones')
                    .insert([formData])
                    .select()
                    .single();

                if (error) throw error;
                setDivisions([...divisions, data].sort((a, b) => a.anio.localeCompare(b.anio)));
                setIsAdding(false);
            }
            setFormData({ anio: '', seccion: '', ciclo_lectivo: new Date().getFullYear(), campo_formacion: '' });
        } catch (err) {
            alert('Error al guardar: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta división?')) return;

        const { error } = await supabase
            .from('divisiones')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            setDivisions(divisions.filter(d => d.id !== id));
        }
    };

    const startEdit = (division) => {
        setEditingId(division.id);
        setFormData({
            anio: division.anio,
            seccion: division.seccion,
            ciclo_lectivo: division.ciclo_lectivo,
            campo_formacion: division.campo_formacion || ''
        });
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
                            Divisiones
                        </h1>
                        <p className="text-slate-400 text-sm">Configurar los cursos y secciones de la institución.</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        setFormData({ anio: '', seccion: '', ciclo_lectivo: 2024, campo_formacion: '' });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium shadow-lg shadow-purple-900/20"
                >
                    <Plus size={18} />
                    Nueva División
                </button>
            </header>

            <div className="max-w-7xl mx-auto">

                {isAdding && (
                    <div className="mb-8 p-6 bg-slate-800 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-purple-400" />
                            Crear Nueva División
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Año</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 1ro, 2do..."
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
                                    value={formData.anio}
                                    onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Sección</label>
                                <input
                                    type="text"
                                    placeholder="Ej: A, B, 1ra..."
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
                                    value={formData.seccion}
                                    onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Ciclo Lectivo</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
                                    value={formData.ciclo_lectivo}
                                    onChange={(e) => setFormData({ ...formData, ciclo_lectivo: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Campo de Formación</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Informática"
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
                                    value={formData.campo_formacion}
                                    onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => handleSave()} className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold">
                                <Save size={18} />
                                Guardar División
                            </button>
                            <button onClick={() => setIsAdding(false)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold">
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-700/50 text-slate-400 text-sm">
                            <tr>
                                <th className="p-4 font-bold border-b border-slate-700">Año y Sección</th>
                                <th className="p-4 font-bold border-b border-slate-700">Ciclo Lectivo</th>
                                <th className="p-4 font-bold border-b border-slate-700">Campo Formación</th>
                                <th className="p-4 font-bold border-b border-slate-700 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="p-10 text-center text-slate-500">Cargando divisiones...</td></tr>
                            ) : divisions.length === 0 ? (
                                <tr><td colSpan="4" className="p-10 text-center text-slate-500">No hay divisiones creadas.</td></tr>
                            ) : divisions.map(d => (
                                <tr key={d.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4">
                                        {editingId === d.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="bg-slate-900 border border-purple-500 rounded px-2 py-1 w-20 outline-none"
                                                    value={formData.anio}
                                                    onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    className="bg-slate-900 border border-purple-500 rounded px-2 py-1 w-20 outline-none"
                                                    value={formData.seccion}
                                                    onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">{d.anio}</span>
                                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-sm font-mono border border-purple-500/30">
                                                    {d.seccion}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingId === d.id ? (
                                            <input
                                                type="number"
                                                className="bg-slate-900 border border-purple-500 rounded px-2 py-1 w-24 outline-none"
                                                value={formData.ciclo_lectivo}
                                                onChange={(e) => setFormData({ ...formData, ciclo_lectivo: parseInt(e.target.value) })}
                                            />
                                        ) : (
                                            <span className="text-slate-300 font-medium">{d.ciclo_lectivo}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingId === d.id ? (
                                            <input
                                                type="text"
                                                className="bg-slate-900 border border-purple-500 rounded px-2 py-1 w-full outline-none"
                                                value={formData.campo_formacion}
                                                onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                                            />
                                        ) : (
                                            <span className="text-slate-400 italic">{d.campo_formacion || '-'}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => navigate('/enrollment')}
                                                className="p-2 bg-purple-600/10 text-purple-400 rounded-lg hover:bg-purple-600/20 transition-colors"
                                                title="Gestionar Alumnos"
                                            >
                                                <Users size={18} />
                                            </button>
                                            {editingId === d.id ? (
                                                <>
                                                    <button onClick={() => handleSave(d.id)} className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/40 transition-colors shadow-inner">
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(d)} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600/20 transition-colors">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(d.id)} className="p-2 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600/20 transition-colors">
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

export default DivisionManagement;
