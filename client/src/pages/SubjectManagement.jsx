import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Check, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SubjectManagement = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [divisionAnios, setDivisionAnios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', descripcion: '', campo_formacion: '', ciclo: '', anio: '' });
    const [isAdding, setIsAdding] = useState(false);

    const ANIOS = ['1ro', '2do', '3ro', '4to', '5to', '6to', '7mo'];
    const activeAnios = divisionAnios.length > 0 ? divisionAnios : ANIOS;

    useEffect(() => {
        fetchSubjects();
        fetchDivisionAnios();
    }, []);

    const fetchDivisionAnios = async () => {
        const { data, error } = await supabase
            .from('divisiones')
            .select('anio')
            .order('anio');
        if (error) {
            console.error("Error al obtener a├▒os de divisiones:", error.message);
        } else if (data) {
            const unique = [...new Set(data.map(d => d.anio))].sort((a, b) => a.localeCompare(b));
            setDivisionAnios(unique);
        }
    };

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
                        ciclo: formData.ciclo,
                        anio: formData.anio
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
            setFormData({ nombre: '', descripcion: '', campo_formacion: '', ciclo: '', anio: '' });
        } catch (err) {
            alert('Error al guardar: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('┬┐Est├ís seguro de eliminar esta materia?')) return;

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
            ciclo: subject.ciclo || '',
            anio: subject.anio || ''
        });
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-tech-surface pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-secondary rounded-lg transition-colors text-tech-muted hover:text-tech-text"
                        aria-label="Volver al panel"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-tech-text">
                            GESTI├ôN DE <span className="text-tech-cyan">MATERIAS</span>
                        </h1>
                        <p className="text-tech-muted text-xs font-mono tracking-[0.3em] mt-2">
                            Administraci├│n de unidades curriculares
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingId(null);
                            setFormData({ nombre: '', descripcion: '', campo_formacion: '', ciclo: '', anio: '' });
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
                            <Input
                                label="Nombre"
                                placeholder="NOMBRE DE LA MATERIA"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                            <Input
                                label="Descripci├│n"
                                placeholder="DESCRIPCI├ôN (OPCIONAL)"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                            <Input
                                label="Campo de Formaci├│n"
                                placeholder="CAMPO DE FORMACI├ôN"
                                value={formData.campo_formacion}
                                onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                            />
                            <Input
                                label="Ciclo"
                                placeholder="CICLO"
                                value={formData.ciclo}
                                onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })}
                            />
                            <select
                                className="bg-tech-primary border border-tech-surface rounded px-4 py-2 text-tech-text focus:border-tech-cyan focus:ring-1 focus:ring-tech-cyan outline-none transition-all"
                                value={formData.anio}
                                onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                            >
                                <option value="">SELECCIONAR A├æO</option>
                                {activeAnios.map(a => <option key={a} value={a}>{a} A├æO</option>)}
                            </select>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Button variant="primary" onClick={() => handleSave()}>Guardar</Button>
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
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
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">A├▒o</th>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Descripci├│n</th>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Campo Formaci├│n</th>
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
                                                <Input
                                                    className="border-tech-cyan"
                                                    value={formData.nombre}
                                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                />
                                            ) : (
                                                <span className="font-bold text-tech-text">{s.nombre}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingId === s.id ? (
                                                <select
                                                    className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 w-full text-tech-text outline-none text-xs"
                                                    value={formData.anio}
                                                    onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                                >
                                                    <option value="">A├æO</option>
                                                    {activeAnios.map(a => <option key={a} value={a}>{a}</option>)}
                                                </select>
                                            ) : (
                                                <span className="px-2 py-1 bg-tech-cyan/10 text-tech-cyan rounded text-[10px] font-black uppercase">{s.anio || '-'}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-tech-muted">
                                            {editingId === s.id ? (
                                                <Input
                                                    className="border-tech-cyan"
                                                    value={formData.descripcion}
                                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                                />
                                            ) : (
                                                s.descripcion || <span className="text-tech-muted/50 italic font-mono">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-tech-muted">
                                            {editingId === s.id ? (
                                                <Input
                                                    className="border-tech-cyan"
                                                    value={formData.campo_formacion}
                                                    onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                                                />
                                            ) : (
                                                s.campo_formacion || <span className="text-tech-muted/50 italic font-mono">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-tech-muted">
                                            {editingId === s.id ? (
                                                <Input
                                                    className="border-tech-cyan"
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
                                                        <Button variant="ghost" size="sm" onClick={() => handleSave(s.id)}>
                                                            <Check size={18} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                                            <X size={18} />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
                                                            <Pencil size={18} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                                                            <Trash2 size={18} />
                                                        </Button>
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
                                        <Input
                                            className="border-tech-cyan"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            placeholder="Materia"
                                        />
                                        <select
                                            className="w-full bg-tech-primary border border-tech-cyan rounded px-4 py-2 text-tech-text outline-none text-sm transition-all"
                                            value={formData.anio}
                                            onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                        >
                                            <option value="">A├æO</option>
                                            {activeAnios.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                        <Input
                                            className="border-tech-cyan"
                                            value={formData.descripcion}
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            placeholder="Descripci├│n"
                                        />
                                        <Input
                                            className="border-tech-cyan"
                                            value={formData.campo_formacion}
                                            onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                                            placeholder="Campo de Formaci├│n"
                                        />
                                        <Input
                                            className="border-tech-cyan"
                                            value={formData.ciclo}
                                            onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })}
                                            placeholder="Ciclo"
                                        />
                                        <div className="flex gap-2 pt-2">
                                            <Button variant="primary" onClick={() => handleSave(s.id)} className="flex-1">
                                                Guardar
                                            </Button>
                                            <Button variant="ghost" onClick={() => setEditingId(null)} className="flex-1">
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 mr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-tech-text text-base leading-tight uppercase tracking-tight">{s.nombre}</h3>
                                                <span className="px-1.5 py-0.5 bg-tech-cyan/20 text-tech-cyan rounded text-[9px] font-black">{s.anio || 'N/A'}</span>
                                            </div>
                                            <p className="text-tech-muted text-xs leading-relaxed">
                                                {s.descripcion || <span className="italic opacity-50">Sin descripci├│n</span>}
                                            </p>
                                            {(s.campo_formacion || s.ciclo) && (
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] font-mono text-tech-muted uppercase">
                                                    {s.campo_formacion && <span>Campo: {s.campo_formacion}</span>}
                                                    {s.ciclo && <span>Ciclo: {s.ciclo}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
                                                <Pencil size={18} />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                                                <Trash2 size={18} />
                                            </Button>
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
