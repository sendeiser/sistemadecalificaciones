import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Pencil, Trash2, X, Check, Search, Save, ArrowLeft, FileText, Upload } from 'lucide-react';
import CSVImporter from '../components/CSVImporter';

const StudentManagement = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isBulkAdding, setIsBulkAdding] = useState(false);
    const [isImportingCSV, setIsImportingCSV] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        dni: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('rol', 'alumno')
            .order('nombre');

        if (data) setStudents(data);
        if (error) console.error(error);
        setLoading(false);
    };

    const handleSave = async (id = null) => {
        if (!formData.nombre.trim() || !formData.dni.trim() || !formData.email.trim()) {
            return alert('Nombre, DNI y Correo son obligatorios');
        }

        try {
            if (id) {
                // Update profile
                const { error } = await supabase
                    .from('perfiles')
                    .update({
                        nombre: formData.nombre,
                        dni: formData.dni,
                        email: formData.email
                    })
                    .eq('id', id);

                if (error) throw error;
                setStudents(students.map(s => s.id === id ? { ...s, ...formData } : s));
                setEditingId(null);
            } else {
                // Register new student (Auth + Profile) via Backend
                if (!formData.password || formData.password.length < 6) {
                    return alert('La contraseña debe tener al menos 6 caracteres');
                }

                const response = await fetch(`${import.meta.env.VITE_API_URL}/students/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (!response.ok) throw new Error(result.error || 'Error al registrar alumno');

                setStudents([...students, result].sort((a, b) => a.nombre.localeCompare(b.nombre)));
                setIsAdding(false);
                alert('Alumno registrado con éxito');
            }
            setFormData({ nombre: '', dni: '', email: '', password: '' });
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este alumno? Se borrará también su cuenta de acceso.')) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/students/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Error al eliminar');
            }

            setStudents(students.filter(s => s.id !== id));
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    const handleBulkAI = async () => {
        if (!bulkText.trim()) return alert('Por favor, ingresa algún texto para procesar');

        setIsProcessing(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/students/bulk-ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({ rawText: bulkText })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Error en el procesamiento masivo');

            // Update local list
            if (result.success.length > 0) {
                setStudents(prev => [...prev, ...result.success].sort((a, b) => a.nombre.localeCompare(b.nombre)));
            }

            const successCount = result.success.length;
            const errorCount = result.errors.length;

            let message = `Procesamiento completado.\n- Exitosos: ${successCount}`;
            if (errorCount > 0) {
                message += `\n- Errores: ${errorCount} (Ver consola para detalles)`;
                console.error('Errores en carga masiva:', result.errors);
            }

            alert(message);
            if (successCount > 0) {
                setIsBulkAdding(false);
                setBulkText('');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCSVImportComplete = (result) => {
        if (result.success.length > 0) {
            setStudents(prev => [...prev, ...result.success].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }
    };

    const startEdit = (student) => {
        setEditingId(student.id);
        setIsAdding(false);
        setFormData({
            nombre: student.nombre,
            dni: student.dni || '',
            email: student.email || '',
            password: '' // No editamos password aquí
        });
    };

    const filteredStudents = students.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dni.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            {/* Navigation Header */}
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between border-b border-tech-surface pb-6 gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-surface rounded transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight uppercase">
                            Alumnos
                        </h1>
                        <p className="text-slate-400 text-sm font-mono">BASE DE DATOS DE ESTUDIANTES</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto justify-end">
                    <button
                        onClick={() => {
                            setIsImportingCSV(!isImportingCSV);
                            setIsBulkAdding(false);
                            setIsAdding(false);
                            setEditingId(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-tech-surface hover:bg-slate-700 rounded transition-colors text-xs font-bold border border-tech-surface uppercase tracking-wider text-slate-300"
                    >
                        <Upload size={16} />
                        Importar CSV
                    </button>
                    <button
                        onClick={() => {
                            setIsBulkAdding(!isBulkAdding);
                            setIsAdding(false);
                            setIsImportingCSV(false);
                            setEditingId(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-tech-accent hover:bg-violet-600 rounded transition-colors text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] uppercase tracking-wider text-white"
                    >
                        <Users size={16} />
                        Carga IA
                    </button>
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setIsBulkAdding(false);
                            setIsImportingCSV(false);
                            setEditingId(null);
                            setFormData({ nombre: '', dni: '', email: '', password: '' });
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-tech-cyan hover:bg-sky-600 rounded transition-colors text-xs font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)] uppercase tracking-wider text-white"
                    >
                        <Plus size={16} />
                        Nuevo
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto">
                {/* Filters */}
                {!isImportingCSV && !isBulkAdding && !isAdding && (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="BUSCAR POR NOMBRE O DNI..."
                                className="w-full pl-10 pr-4 py-2 bg-tech-secondary border border-tech-surface rounded focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none text-white placeholder-slate-600 transition-all font-mono text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* CSV Import */}
                {isImportingCSV && (
                    <div className="mb-8 p-6 bg-tech-secondary rounded border border-tech-surface animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center mb-6 border-b border-tech-surface pb-2">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Upload className="text-tech-cyan" size={20} />
                                Importar desde archivo CSV
                            </h3>
                            <button onClick={() => setIsImportingCSV(false)} className="text-slate-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <CSVImporter
                            endpoint={`${import.meta.env.VITE_API_URL}/students/import`}
                            onComplete={handleCSVImportComplete}
                            requiredColumns={['dni', 'nombre', 'email']}
                        />
                    </div>
                )}

                {/* Manual Add Form */}
                {isAdding && (
                    <div className="mb-8 p-6 bg-tech-secondary rounded border border-tech-surface animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white uppercase tracking-wider border-b border-tech-surface pb-2">
                            <Plus className="text-tech-success" size={20} />
                            Registrar Nuevo Estudiante
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Nombre Completo</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-success focus:ring-1 focus:ring-tech-success outline-none transition-all placeholder-slate-600 text-white"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">DNI</label>
                                <input
                                    type="text"
                                    placeholder="Sin puntos"
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-success focus:ring-1 focus:ring-tech-success outline-none transition-all placeholder-slate-600 text-white font-mono"
                                    value={formData.dni}
                                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Correo Electrónico</label>
                                <input
                                    type="email"
                                    placeholder="usuario@escuela.com"
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-success focus:ring-1 focus:ring-tech-success outline-none transition-all placeholder-slate-600 text-white font-mono"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Contraseña Inicial</label>
                                <input
                                    type="password"
                                    placeholder="Min. 6 caracteres"
                                    className="w-full bg-tech-primary border border-tech-surface rounded px-4 py-2 focus:border-tech-success focus:ring-1 focus:ring-tech-success outline-none transition-all placeholder-slate-600 text-white"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => handleSave()}
                                className="flex items-center gap-2 px-6 py-2 bg-tech-success hover:bg-emerald-600 rounded font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] text-white uppercase tracking-wider text-sm"
                            >
                                <Save size={18} />
                                Crear Cuenta
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-6 py-2 bg-tech-surface hover:bg-slate-700 rounded font-bold text-slate-300 uppercase tracking-wider text-sm transaction-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Bulk AI */}
                {
                    isBulkAdding && (
                        <div className="mb-8 p-6 bg-tech-secondary rounded border border-tech-accent/30 animate-in fade-in slide-in-from-top-4 duration-300 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                            <div className="flex items-center justify-between mb-4 border-b border-tech-surface pb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white uppercase tracking-wider">
                                    <Plus size={20} className="text-tech-accent" />
                                    Carga Masiva con Inteligencia Artificial
                                </h3>
                                <div className="text-xs px-2 py-1 bg-tech-accent/10 text-tech-accent rounded border border-tech-accent/20 font-mono font-bold">
                                    GEMINI v1.5 FLASH
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-4 font-mono">
                                // PEGAR LISTA DE ALUMNOS (NOMBRES, DNI, EMAILS) PARA EXTRACCIÓN AUTOMÁTICA
                            </p>
                            <textarea
                                className="w-full h-40 bg-tech-primary border border-tech-surface rounded p-4 text-slate-300 focus:border-tech-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-slate-700 font-mono text-sm"
                                placeholder={"Ejemplo:\nJuan Perez 45678912 juan@mail.com\nMaria Gomez DNI 12345678 correomaria@test.com"}
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                disabled={isProcessing}
                            ></textarea>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={handleBulkAI}
                                    disabled={isProcessing}
                                    className={`flex items-center gap-2 px-6 py-2 rounded font-bold transition-all uppercase tracking-wider text-sm ${isProcessing
                                        ? 'bg-tech-surface text-slate-500 cursor-not-allowed'
                                        : 'bg-tech-accent hover:bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                                            PROCESANDO...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            PROCESAR Y CREAR
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsBulkAdding(false)}
                                    className="px-6 py-2 bg-tech-surface hover:bg-slate-700 rounded font-bold text-slate-300 uppercase tracking-wider text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )
                }

                <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden shadow-xl">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-tech-primary text-slate-400 text-sm border-b border-tech-surface font-heading">
                                <tr>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Nombre</th>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">DNI</th>
                                    <th className="p-4 uppercase text-[10px] font-bold tracking-widest">Email</th>
                                    <th className="p-4 text-center uppercase text-[10px] font-bold tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tech-surface">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-10 text-center text-slate-500 font-mono animate-pulse uppercase text-xs tracking-widest">Cargando base de datos...</td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan="4" className="p-10 text-center text-slate-500 font-mono italic">No se encontraron alumnos.</td></tr>
                                ) : filteredStudents.map(s => (
                                    <tr key={s.id} className="hover:bg-tech-primary/50 transition-colors">
                                        <td className="p-4">
                                            {editingId === s.id ? (
                                                <input
                                                    type="text"
                                                    className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 w-full outline-none text-white text-sm"
                                                    value={formData.nombre}
                                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-bold text-slate-200">{s.nombre}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingId === s.id ? (
                                                <input
                                                    type="text"
                                                    className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 w-full outline-none text-white text-sm font-mono"
                                                    value={formData.dni}
                                                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                                />
                                            ) : (
                                                <span className="text-slate-300 font-mono">{s.dni || '-'}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingId === s.id ? (
                                                <input
                                                    type="text"
                                                    className="bg-tech-primary border border-tech-cyan rounded px-2 py-1 w-full outline-none text-white text-sm font-mono"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            ) : (
                                                <span className="text-slate-400 font-mono text-sm">{s.email || '-'}</span>
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
                            <div className="p-10 text-center text-slate-500 font-mono animate-pulse uppercase text-xs tracking-widest">Sincronizando...</div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="p-10 text-center text-slate-500 font-mono italic">No hay resultados.</div>
                        ) : filteredStudents.map(s => (
                            <div key={s.id} className="p-4 space-y-4">
                                {editingId === s.id ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            className="w-full bg-tech-primary border border-tech-cyan rounded px-3 py-2 outline-none text-white text-sm"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            placeholder="Nombre"
                                        />
                                        <input
                                            type="text"
                                            inputmode="numeric"
                                            className="w-full bg-tech-primary border border-tech-cyan rounded px-3 py-2 outline-none text-white text-sm font-mono"
                                            value={formData.dni}
                                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                            placeholder="DNI"
                                        />
                                        <input
                                            type="email"
                                            className="w-full bg-tech-primary border border-tech-cyan rounded px-3 py-2 outline-none text-white text-sm font-mono"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Email"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSave(s.id)} className="flex-1 py-2 bg-tech-success text-white rounded font-bold text-xs uppercase tracking-widest">
                                                Guardar
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-tech-surface text-slate-400 rounded font-bold text-xs uppercase tracking-widest">
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-white text-base leading-tight uppercase tracking-tight">{s.nombre}</h3>
                                                <p className="text-tech-cyan font-mono text-xs mt-1">DNI: {s.dni || 'S/D'}</p>
                                                <p className="text-slate-500 text-xs font-mono mt-0.5">{s.email || 'Sin correo'}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => startEdit(s)} className="p-2 bg-tech-primary border border-tech-surface text-tech-cyan rounded-lg">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(s.id)} className="p-2 bg-tech-primary border border-tech-surface text-tech-danger rounded-lg">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 p-4 bg-tech-primary/50 rounded border border-tech-surface flex gap-3 text-sm text-slate-400 items-center font-mono">
                    <div className="p-2 bg-tech-secondary rounded border border-tech-surface">
                        <Save size={16} className="text-tech-cyan" />
                    </div>
                    <p>
                        NOTA: LA CREACIÓN DE CUENTAS DE ALUMNO GENERA CREDENCIALES DE ACCESO AUTOMÁTICAMENTE.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StudentManagement;
