import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Pencil, Trash2, X, Check, Search, Save, ArrowLeft } from 'lucide-react';

const StudentManagement = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

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
                            Alumnos
                        </h1>
                        <p className="text-slate-400 text-sm">Administrar perfiles de estudiantes y sus accesos.</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        setFormData({ nombre: '', dni: '', email: '', password: '' });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                >
                    <Plus size={18} />
                    Nuevo Alumno
                </button>
            </header>

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o DNI..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {
                    isAdding && (
                        <div className="mb-8 p-6 bg-slate-800 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Plus className="text-green-400" size={20} />
                                Registrar Nuevo Estudiante
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Nombre Completo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-green-500 outline-none"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">DNI</label>
                                    <input
                                        type="text"
                                        placeholder="Sin puntos"
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-green-500 outline-none"
                                        value={formData.dni}
                                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="usuario@escuela.com"
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-green-500 outline-none"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Contraseña Inicial</label>
                                    <input
                                        type="password"
                                        placeholder="Min. 6 caracteres"
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:border-green-500 outline-none"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => handleSave()}
                                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold"
                                >
                                    <Save size={18} />
                                    Crear Cuenta
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )
                }

                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-700/50 text-slate-400 text-sm">
                            <tr>
                                <th className="p-4 font-bold border-b border-slate-700">Nombre</th>
                                <th className="p-4 font-bold border-b border-slate-700">DNI</th>
                                <th className="p-4 font-bold border-b border-slate-700">Email</th>
                                <th className="p-4 font-bold border-b border-slate-700 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="p-10 text-center text-slate-500">Cargando alumnos...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="4" className="p-10 text-center text-slate-500">No se encontraron alumnos.</td></tr>
                            ) : filteredStudents.map(s => (
                                <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4">
                                        {editingId === s.id ? (
                                            <input
                                                type="text"
                                                className="bg-slate-900 border border-blue-500 rounded-lg px-2 py-1 w-full outline-none"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="font-semibold">{s.nombre}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingId === s.id ? (
                                            <input
                                                type="text"
                                                className="bg-slate-900 border border-blue-500 rounded-lg px-2 py-1 w-full outline-none"
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
                                                className="bg-slate-900 border border-blue-500 rounded-lg px-2 py-1 w-full outline-none"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        ) : (
                                            <span className="text-slate-400">{s.email || '-'}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {editingId === s.id ? (
                                                <>
                                                    <button onClick={() => handleSave(s.id)} className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/40 transition-colors shadow-inner" title="Guardar">
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition-colors" title="Cancelar">
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(s)} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600/20 transition-colors" title="Editar">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600/20 transition-colors" title="Eliminar">
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

                <div className="mt-8 p-4 bg-blue-500/5 rounded-lg border border-blue-500/20 flex gap-3 text-sm text-blue-300 items-center">
                    <div className="p-2 bg-blue-500/10 rounded-full">
                        <Save size={16} />
                    </div>
                    <p>
                        Al crear un alumno, se genera automáticamente su cuenta de acceso en el sistema. Los datos de prueba se guardan temporalmente en la base de datos de Auth.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StudentManagement;
