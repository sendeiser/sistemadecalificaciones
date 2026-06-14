import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Layers, Plus, Pencil, Trash2, X, Check, Save, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const DivisionManagement = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const ANIOS = ['1ro', '2do', '3ro', '4to', '5to', '6to', '7mo'];

    const [formData, setFormData] = useState({
        anio: '',
        seccion: '',
        ciclo_lectivo_id: ''
    });
    const [ciclos, setCiclos] = useState([]);

    useEffect(() => {
        fetchDivisions();
        fetchCiclos();
    }, []);

    const fetchCiclos = async () => {
        const { data } = await supabase.from('ciclos_lectivos').select('*').order('anio', { ascending: false });
        if (data) {
            setCiclos(data);
            if (data.length > 0 && !formData.ciclo_lectivo_id) {
                setFormData(prev => ({ ...prev, ciclo_lectivo_id: data[0].id }));
            }
        }
    };

    const fetchDivisions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('divisiones')
            .select('*, ciclo_lectivo:ciclos_lectivos(anio, id)')
            .order('anio', { ascending: true })
            .order('seccion', { ascending: true });

        if (data) setDivisions(data);
        if (error) console.error(error);
        setLoading(false);
    };

    const handleSave = async (id = null) => {
        if (!formData.anio.trim() || !formData.seccion.trim() || !formData.ciclo_lectivo_id) {
            return alert('Año, Sección y Ciclo Lectivo son obligatorios');
        }

        const payload = {
            anio: formData.anio,
            seccion: formData.seccion,
            ciclo_lectivo_id: formData.ciclo_lectivo_id
        };

        try {
            if (id) {
                const { error } = await supabase
                    .from('divisiones')
                    .update(payload)
                    .eq('id', id);

                if (error) throw error;
                await fetchDivisions();
                setEditingId(null);
            } else {
                const { data, error } = await supabase
                    .from('divisiones')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                await fetchDivisions();
                setIsAdding(false);
            }
            setFormData({ anio: '', seccion: '', ciclo_lectivo_id: ciclos[0]?.id || '' });
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
            ciclo_lectivo_id: division.ciclo_lectivo_id || division.ciclo_lectivo?.id || ''
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
                            GESTIÓN DE <span className="text-tech-cyan">DIVISIONES</span>
                        </h1>
                        <p className="text-tech-muted text-xs font-mono tracking-[0.3em] mt-2">
                            Administración de cursos y secciones
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingId(null);
                            setFormData({ anio: '', seccion: '', ciclo_lectivo_id: ciclos[0]?.id || '' });
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-tech-accent hover:bg-violet-600 rounded-xl text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-tech-accent/20 active:scale-95"
                    >
                        <Plus size={18} />
                        Nueva División
                    </button>
                    <ThemeToggle />
                </div>
            </div>

            <div className="max-w-7xl mx-auto">

                {isAdding && (
                    <div className="mb-8 p-6 bg-tech-secondary rounded border border-tech-surface animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Layers size={100} />
                        </div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-tech-text uppercase tracking-wider border-b border-tech-surface pb-2 relative z-10">
                            <Plus size={20} className="text-tech-accent" />
                            Crear Nueva División
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                            <div className="space-y-1">
                                <label className="text-xs text-tech-muted uppercase font-bold tracking-wider">Año</label>
                                <select
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-accent focus:ring-1 focus:ring-tech-accent outline-none transition-all text-tech-text"
                                    value={formData.anio}
                                    onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                >
                                    <option value="">SELECCIONAR...</option>
                                    {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <Input
                                label="Sección"
                                placeholder="Ej: A, B, 1ra..."
                                value={formData.seccion}
                                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                            />
                            <div className="space-y-1">
                                <label className="text-xs text-tech-muted uppercase font-bold tracking-wider">Ciclo Lectivo</label>
                                <select
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-accent focus:ring-1 focus:ring-tech-accent outline-none transition-all text-tech-text font-mono"
                                    value={formData.ciclo_lectivo_id}
                                    onChange={(e) => setFormData({ ...formData, ciclo_lectivo_id: e.target.value })}
                                >
                                    <option value="">SELECCIONAR...</option>
                                    {ciclos.map(c => <option key={c.id} value={c.id}>{c.anio}</option>)}
                                </select>
                            </div>

                        </div>
                        <div className="mt-6 flex gap-3 relative z-10">
                            <Button variant="primary" onClick={() => handleSave()}>
                                <Save size={18} />
                                Guardar División
                            </Button>
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden shadow-xl">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-tech-primary text-tech-muted text-sm border-b border-tech-surface font-heading">
                                <tr>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Año y Sección</th>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Ciclo Lectivo</th>
                                    <th className="p-4 text-center uppercase text-[10px] font-bold tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tech-surface">
                                {loading ? (
                                    <tr><td colSpan="3" className="p-10 text-center text-tech-muted font-mono animate-pulse uppercase text-xs tracking-widest">Sincronizando divisiones...</td></tr>
                                ) : divisions.length === 0 ? (
                                    <tr><td colSpan="3" className="p-10 text-center text-tech-muted font-mono italic">No hay divisiones creadas.</td></tr>
                                ) : divisions.map(d => (
                                    <tr key={d.id} className="hover:bg-tech-primary/50 transition-colors">
                                        <td className="p-4">
                                            {editingId === d.id ? (
                                                <div className="flex gap-2">
                                                    <select
                                                        className="bg-tech-primary border border-tech-accent rounded px-2 py-1 w-24 outline-none text-tech-text text-xs"
                                                        value={formData.anio}
                                                        onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                                    >
                                                        <option value="">AÑO</option>
                                                        {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                                                    </select>
                                                    <Input
                                                        className="border-tech-accent w-20"
                                                        value={formData.seccion}
                                                        onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-tech-text uppercase">{d.anio}</span>
                                                    <span className="px-2 py-0.5 bg-tech-primary text-tech-accent rounded text-sm font-mono border border-tech-surface font-bold">
                                                        {d.seccion}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingId === d.id ? (
                                                <select
                                                    className="bg-tech-primary border border-tech-accent rounded px-2 py-1 w-28 outline-none text-tech-text font-mono text-xs"
                                                    value={formData.ciclo_lectivo_id}
                                                    onChange={(e) => setFormData({ ...formData, ciclo_lectivo_id: e.target.value })}
                                                >
                                                    <option value="">SELECCIONAR...</option>
                                                    {ciclos.map(c => <option key={c.id} value={c.id}>{c.anio}</option>)}
                                                </select>
                                            ) : (
                                                <span className="text-tech-text font-mono">{d.ciclo_lectivo?.anio || d.ciclo_lectivo}</span>
                                            )}
                                        </td>

                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate('/enrollment')}
                                                    title="Inscribir Alumnos en esta División"
                                                >
                                                    <Users size={18} />
                                                    <span className="hidden xl:inline">Inscribir</span>
                                                </Button>
                                                <div className="w-px h-8 bg-tech-surface mx-1"></div>
                                                {editingId === d.id ? (
                                                    <>
                                                        <Button variant="ghost" size="sm" onClick={() => handleSave(d.id)}>
                                                            <Check size={18} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                                            <X size={18} />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button variant="ghost" size="sm" onClick={() => startEdit(d)}>
                                                            <Pencil size={18} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
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
                        ) : divisions.length === 0 ? (
                            <div className="p-10 text-center text-tech-muted font-mono italic">No hay divisiones.</div>
                        ) : divisions.map(d => (
                            <div key={d.id} className="p-4 space-y-4">
                                {editingId === d.id ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                className="border-tech-accent flex-1"
                                                value={formData.anio}
                                                onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                                placeholder="Año"
                                            />
                                            <Input
                                                className="border-tech-accent flex-1"
                                                value={formData.seccion}
                                                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                                                placeholder="Sec"
                                            />
                                        </div>
                                        <select
                                            className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-accent focus:ring-1 focus:ring-tech-accent outline-none transition-all text-tech-text font-mono text-sm"
                                            value={formData.ciclo_lectivo_id}
                                            onChange={(e) => setFormData({ ...formData, ciclo_lectivo_id: e.target.value })}
                                        >
                                            <option value="">SELECCIONAR CICLO...</option>
                                            {ciclos.map(c => <option key={c.id} value={c.id}>{c.anio}</option>)}
                                        </select>

                                        <div className="flex gap-2">
                                            <Button variant="primary" onClick={() => handleSave(d.id)} className="flex-1">
                                                Guardar
                                            </Button>
                                            <Button variant="ghost" onClick={() => setEditingId(null)} className="flex-1">
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-tech-text text-lg uppercase tracking-tight">{d.anio}</h3>
                                                <span className="px-2 py-0.5 bg-tech-primary text-tech-accent rounded text-sm font-mono font-bold border border-tech-surface">
                                                    {d.seccion}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-3 text-xs font-mono text-tech-muted">
                                                <span className="uppercase">Ciclo {d.ciclo_lectivo?.anio || d.ciclo_lectivo}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate('/enrollment')}
                                                title="Inscribir Alumnos"
                                            >
                                                <Users size={20} />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => startEdit(d)}>
                                                <Pencil size={20} />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                                                <Trash2 size={20} />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default DivisionManagement;
