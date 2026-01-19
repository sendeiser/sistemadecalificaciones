import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Layers, Plus, Pencil, Trash2, X, Check, Save, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

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
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-tech-surface pb-6 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 text-tech-muted hover:text-tech-text bg-tech-secondary hover:bg-tech-surface rounded border border-tech-surface transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Volver
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-tech-text tracking-tight uppercase">
                            Divisiones
                        </h1>
                        <p className="text-tech-muted text-xs md:text-sm font-mono">GESTIÓN DE CURSOS Y SECCIONES</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <ThemeToggle />
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingId(null);
                            setFormData({ anio: '', seccion: '', ciclo_lectivo: 2024, campo_formacion: '' });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-tech-accent hover:bg-violet-600 rounded transition-colors text-sm font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] uppercase tracking-wider text-white"
                    >
                        <Plus size={18} />
                        Nueva División
                    </button>
                </div>
            </header>

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
                                <input
                                    type="text"
                                    placeholder="Ej: 1ro, 2do..."
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-accent focus:ring-1 focus:ring-tech-accent outline-none transition-all placeholder-tech-muted/50 text-tech-text"
                                    value={formData.anio}
                                    onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-tech-muted uppercase font-bold tracking-wider">Sección</label>
                                <input
                                    type="text"
                                    placeholder="Ej: A, B, 1ra..."
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-accent focus:ring-1 focus:ring-tech-accent outline-none transition-all placeholder-tech-muted/50 text-tech-text"
                                    value={formData.seccion}
                                    onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-tech-muted uppercase font-bold tracking-wider">Ciclo Lectivo</label>
                                <input
                                    type="number"
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-accent focus:ring-1 focus:ring-tech-accent outline-none transition-all placeholder-tech-muted/50 text-tech-text font-mono"
                                    value={formData.ciclo_lectivo}
                                    onChange={(e) => setFormData({ ...formData, ciclo_lectivo: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-tech-muted uppercase font-bold tracking-wider">Campo de Formación</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Informática"
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-accent focus:ring-1 focus:ring-tech-accent outline-none transition-all placeholder-tech-muted/50 text-tech-text"
                                    value={formData.campo_formacion}
                                    onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3 relative z-10">
                            <button onClick={() => handleSave()} className="flex items-center gap-2 px-6 py-2 bg-tech-success hover:bg-emerald-600 rounded font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] text-white uppercase tracking-wider text-sm">
                                <Save size={18} />
                                Guardar División
                            </button>
                            <button onClick={() => setIsAdding(false)} className="px-6 py-2 bg-tech-surface hover:bg-tech-secondary rounded font-bold text-tech-muted hover:text-tech-text uppercase tracking-wider text-sm transition-colors">
                                Cancelar
                            </button>
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
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Campo Formación</th>
                                    <th className="p-4 text-center uppercase text-[10px] font-bold tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tech-surface">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-10 text-center text-tech-muted font-mono animate-pulse uppercase text-xs tracking-widest">Sincronizando divisiones...</td></tr>
                                ) : divisions.length === 0 ? (
                                    <tr><td colSpan="4" className="p-10 text-center text-tech-muted font-mono italic">No hay divisiones creadas.</td></tr>
                                ) : divisions.map(d => (
                                    <tr key={d.id} className="hover:bg-tech-primary/50 transition-colors">
                                        <td className="p-4">
                                            {editingId === d.id ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="bg-tech-primary border border-tech-accent rounded px-2 py-1 w-20 outline-none text-white text-sm"
                                                        value={formData.anio}
                                                        onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="bg-tech-primary border border-tech-accent rounded px-2 py-1 w-20 outline-none text-white text-sm"
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
                                                <input
                                                    type="number"
                                                    className="bg-tech-primary border border-tech-accent rounded px-2 py-1 w-24 outline-none text-tech-text text-sm font-mono"
                                                    value={formData.ciclo_lectivo}
                                                    onChange={(e) => setFormData({ ...formData, ciclo_lectivo: parseInt(e.target.value) })}
                                                />
                                            ) : (
                                                <span className="text-tech-text font-mono">{d.ciclo_lectivo}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingId === d.id ? (
                                                <input
                                                    type="text"
                                                    className="bg-tech-primary border border-tech-accent rounded px-2 py-1 w-full outline-none text-tech-text text-sm"
                                                    value={formData.campo_formacion}
                                                    onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                                                />
                                            ) : (
                                                <span className="text-tech-muted italic font-mono text-sm">{d.campo_formacion || '-'}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => navigate('/enrollment')}
                                                    className="p-1.5 bg-tech-primary text-tech-muted hover:text-tech-text border border-tech-surface hover:border-tech-cyan rounded transition-all group"
                                                    title="Gestionar Alumnos"
                                                >
                                                    <Users size={18} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                                <div className="w-px h-8 bg-tech-surface mx-1"></div>
                                                {editingId === d.id ? (
                                                    <>
                                                        <button onClick={() => handleSave(d.id)} className="p-1.5 bg-tech-success/10 text-tech-success rounded hover:bg-tech-success/20 transition-all">
                                                            <Check size={18} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-tech-danger/10 text-tech-danger rounded hover:bg-tech-danger/20 transition-all">
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(d)} className="p-1.5 text-tech-accent hover:bg-tech-accent/10 rounded transition-all">
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(d.id)} className="p-1.5 text-tech-danger hover:bg-tech-danger/10 rounded transition-all">
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
                        ) : divisions.length === 0 ? (
                            <div className="p-10 text-center text-tech-muted font-mono italic">No hay divisiones.</div>
                        ) : divisions.map(d => (
                            <div key={d.id} className="p-4 space-y-4">
                                {editingId === d.id ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 bg-tech-primary border border-tech-accent rounded px-3 py-2 outline-none text-white text-sm"
                                                value={formData.anio}
                                                onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                                                placeholder="Año"
                                            />
                                            <input
                                                type="text"
                                                className="flex-1 bg-tech-primary border border-tech-accent rounded px-3 py-2 outline-none text-white text-sm"
                                                value={formData.seccion}
                                                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                                                placeholder="Sec"
                                            />
                                        </div>
                                        <input
                                            type="number"
                                            inputmode="numeric"
                                            className="w-full bg-tech-primary border border-tech-accent rounded px-3 py-2 outline-none text-tech-text text-sm font-mono"
                                            value={formData.ciclo_lectivo}
                                            onChange={(e) => setFormData({ ...formData, ciclo_lectivo: parseInt(e.target.value) })}
                                            placeholder="Ciclo Lectivo"
                                        />
                                        <input
                                            type="text"
                                            className="w-full bg-tech-primary border border-tech-accent rounded px-3 py-2 outline-none text-tech-text text-sm"
                                            value={formData.campo_formacion}
                                            onChange={(e) => setFormData({ ...formData, campo_formacion: e.target.value })}
                                            placeholder="Campo de Formación"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSave(d.id)} className="flex-1 py-2 bg-tech-success text-white rounded font-bold text-xs uppercase tracking-widest">
                                                Guardar
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-tech-surface text-tech-muted rounded font-bold text-xs uppercase tracking-widest">
                                                Cancelar
                                            </button>
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
                                            <div className="mt-1 flex items-center gap-3 text-xs font-mono">
                                                <span className="text-tech-muted uppercase">Ciclo {d.ciclo_lectivo}</span>
                                                <span className="text-slate-600">|</span>
                                                <span className="text-tech-muted italic">{d.campo_formacion || 'General'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => navigate('/enrollment')}
                                                className="p-2.5 bg-tech-primary border border-tech-surface text-tech-muted rounded-lg hover:text-tech-text"
                                            >
                                                <Users size={20} />
                                            </button>
                                            <button onClick={() => startEdit(d)} className="p-2.5 bg-tech-primary border border-tech-surface text-tech-accent rounded-lg">
                                                <Pencil size={20} />
                                            </button>
                                            <button onClick={() => handleDelete(d.id)} className="p-2.5 bg-tech-primary border border-tech-surface text-tech-danger rounded-lg">
                                                <Trash2 size={20} />
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

export default DivisionManagement;
