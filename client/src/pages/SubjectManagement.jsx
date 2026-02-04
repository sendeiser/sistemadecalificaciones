import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Pencil, Trash2, X, Check, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const SubjectManagement = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', descripcion: '', campo_formacion: '', ciclo: '' });
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
                    .update({
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        campo_formacion: formData.campo_formacion,
                        ciclo: formData.ciclo
                    })
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
            setFormData({ nombre: '', descripcion: '', campo_formacion: '', ciclo: '' });
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
        setFormData({
            nombre: subject.nombre,
            descripcion: subject.descripcion || '',
            campo_formacion: subject.campo_formacion || '',
            ciclo: subject.ciclo || ''
        });
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                        GESTIÓN DE <span className="text-tech-cyan">MATERIAS</span>
                    </h1>
                    <p className="text-tech-muted text-xs font-mono uppercase tracking-[0.3em] mt-2">
                        Administración de unidades curriculares
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingId(null);
                            setFormData({ nombre: '', descripcion: '' });
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-tech-cyan hover:bg-tech-cyan/80 rounded-xl text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-tech-cyan/20 active:scale-95"
                    >
                        <Plus size={18} />
                        Nueva Materia
                    </button>
                    <ThemeToggle />
                </div>
            </div>

            <div className="max-w-6xl mx-auto">

                {isAdding && (
                    <div className="mb-8 p-6 bg-tech-secondary rounded border border-tech-surface shadow-lg animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-xl font-bold mb-4 text-tech-text uppercase tracking-wider">Cargar Nueva Materia</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="NOMBRE DE LA MATERIA"
                                className="bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none transition-all placeholder-tech-muted/50"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="DESCRIPCIÓN (OPCIONAL)"
                                className="bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none transition-all placeholder-tech-muted/50"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="CAMPO DE FORMACIÓN"
                                className="bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none transition-all placeholder-tech-muted/50"
                                value={formData.campo_formacion}
                                onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="CICLO"
                                className="bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none transition-all placeholder-tech-muted/50"
                                value={formData.ciclo}
                                onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })}
                            />
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button onClick={() => handleSave()} className="px-4 py-2 bg-tech-success hover:bg-emerald-600 rounded font-bold text-white uppercase tracking-wider text-sm transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]">Guardar</button>
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-tech-surface hover:bg-tech-secondary rounded font-bold text-tech-muted hover:text-tech-text uppercase tracking-wider text-sm">Cancelar</button>
                        </div>
                    </div>
                )}

                <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden shadow-xl">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-tech-primary text-tech-muted border-b border-tech-surface font-heading">
                                <tr>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Nombre</th>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Descripción</th>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Campo Formación</th>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Ciclo</th>
                                    <th className="p-4 text-center uppercase text-[10px] font-bold tracking_widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tech-surface">
                                {loading ? (
                                    <tr><td colSpan="3" className="p-10 text-center text-tech-muted font-mono animate-pulse uppercase text-xs tracking-widest">Cargando unidades curriculares...</td></tr>
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
                                                <span className="font-bold text-tech-text">{s.nombre}</span>
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
                                                s.descripcion || <span className="text-tech-muted/50 italic font-mono">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {editingId === s.id ? (
                                                <input
                                                    type="text"
                                                    className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 w-full text-white outline-none"
                                                    value={formData.campo_formacion}
                                                    onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                                                />
                                            ) : (
                                                s.campo_formacion || <span className="text-tech-muted/50 italic font-mono">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {editingId === s.id ? (
                                                <input
                                                    type="text"
                                                    className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 w-full text-white outline-none"
                                                    value={formData.ciclo}
                                                    onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })}
                                                />
                                            ) : (
                                                s.ciclo || <span className="text-tech-muted/50 italic font-mono">-</span>
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

                    {/* Mobile Card List View */}
                    <div className="md:hidden divide-y divide-tech-surface">
                        {loading ? (
                            <div className="p-10 text-center text-tech-muted font-mono animate-pulse uppercase text-xs tracking-widest">Sincronizando...</div>
                        ) : subjects.length === 0 ? (
                            <div className="p-10 text-center text-tech-muted font-mono italic">No hay materias.</div>
                        ) : subjects.map(s => (
                            <div key={s.id} className="p-4 space-y-4">
                                {editingId === s.id ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            className="w-full bg-tech-primary border border-tech-cyan rounded px-3 py-2 outline-none text-tech-text text-sm"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            placeholder="Materia"
                                        />
                                        <input
                                            type="text"
                                            className="w-full bg-tech-primary border border-tech-cyan rounded px-3 py-2 outline-none text-tech-text text-sm"
                                            value={formData.descripcion}
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            placeholder="Descripción"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSave(s.id)} className="flex-1 py-2 bg-tech-success text-white rounded font-bold text-xs uppercase tracking-widest">
                                                Guardar
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-tech-surface text-tech-muted rounded font-bold text-xs uppercase tracking-widest">
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 mr-4">
                                            <h3 className="font-bold text-tech-text text-base leading-tight uppercase tracking-tight">{s.nombre}</h3>
                                            <p className="text-tech-muted text-xs mt-1 leading-relaxed">
                                                {s.descripcion || <span className="italic opacity-50">Sin descripción</span>}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button onClick={() => startEdit(s)} className="p-2 bg-tech-primary border border-tech-surface text-tech-cyan rounded-lg">
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} className="p-2 bg-tech-primary border border-tech-surface text-tech-danger rounded-lg">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectManagement;
