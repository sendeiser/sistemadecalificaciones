import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, FileText, GraduationCap, BookOpen, Layers, Info, HelpCircle, ArrowRight } from 'lucide-react';

const Dashboard = () => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-slate-700 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Hola, {profile.nombre}
                    </h1>
                    <p className="text-slate-400 capitalize mt-1 font-medium text-lg">Rol: <span className="text-blue-300">{profile.rol}</span></p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-700 hover:border-red-500/50"
                >
                    <LogOut size={18} />
                    Cerrar Sesión
                </button>
            </header>

            <main>
                {profile.rol === 'admin' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div
                            onClick={() => navigate('/assignments')}
                            className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500 transition-all cursor-pointer group hover:shadow-lg hover:shadow-blue-500/10">
                            <div className="flex items-center gap-4 mb-3 text-blue-400">
                                <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <Users size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Asignaciones</h3>
                            </div>
                            <p className="text-slate-400 text-sm">Vincular docentes, materias y divisiones.</p>
                        </div>

                        <div
                            onClick={() => navigate('/subjects')}
                            className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-400 transition-all cursor-pointer group hover:shadow-lg hover:shadow-blue-400/10">
                            <div className="flex items-center gap-4 mb-3 text-blue-300">
                                <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Materias</h3>
                            </div>
                            <p className="text-slate-400 text-sm">Crear y editar materias del sistema.</p>
                        </div>

                        <div
                            onClick={() => navigate('/students')}
                            className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-green-500 transition-all cursor-pointer group hover:shadow-lg hover:shadow-green-500/10">
                            <div className="flex items-center gap-4 mb-3 text-green-400">
                                <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                    <Users size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Alumnos</h3>
                            </div>
                            <p className="text-slate-400 text-sm">Administrar perfiles de estudiantes.</p>
                        </div>

                        <div
                            onClick={() => navigate('/divisions')}
                            className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-purple-600 transition-all cursor-pointer group hover:shadow-lg hover:shadow-purple-600/10">
                            <div className="flex items-center gap-4 mb-3 text-purple-500">
                                <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                    <Layers size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Divisiones</h3>
                            </div>
                            <p className="text-slate-400 text-sm">Gestionar cursos y secciones.</p>
                        </div>

                        <div
                            onClick={() => navigate('/enrollment')}
                            className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500 transition-all cursor-pointer group hover:shadow-lg hover:shadow-blue-500/10">
                            <div className="flex items-center gap-4 mb-3 text-blue-400">
                                <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <GraduationCap size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Agrupamiento</h3>
                            </div>
                            <p className="text-slate-400 text-sm">Asignar alumnos a sus divisiones.</p>
                        </div>

                        <div
                            onClick={() => navigate('/reports')}
                            className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-purple-500 transition-all cursor-pointer group hover:shadow-lg hover:shadow-purple-500/10">
                            <div className="flex items-center gap-4 mb-3 text-purple-400">
                                <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Reportes</h3>
                            </div>
                            <p className="text-slate-400 text-sm">Generar boletines y exportar PDF.</p>
                        </div>
                    </div>
                )}

                {profile.rol === 'docente' && (
                    <div
                        onClick={() => navigate('/grades')}
                        className="bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500 transition-all p-6 group cursor-pointer hover:shadow-lg hover:shadow-blue-500/10"
                    >
                        <div className="flex items-center gap-4 mb-4 text-blue-400">
                            <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                <GraduationCap size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Mis Cursos</h3>
                        </div>
                        <p className="text-slate-400 mb-6">Selecciona un curso para comenzar a cargar calificaciones.</p>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm">
                            Ver Cursos Asignados
                        </button>
                    </div>
                )}

                {profile.rol === 'alumno' && (
                    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-green-500 transition-all group">
                        <div className="flex items-center gap-4 mb-4 text-green-400">
                            <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Mis Calificaciones</h3>
                        </div>
                        <p className="text-slate-400 mb-6">Consulta tu historial académico y notas actuales.</p>
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm">
                            Ver Mi Boletín
                        </button>
                    </div>
                )}

                {/* Common Section: Welcome & Info Guide */}
                <div className="mt-10 border-t border-slate-700 pt-10">
                    <div
                        onClick={() => navigate('/')}
                        className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-blue-500/40 hover:bg-slate-800 transition-all cursor-pointer group flex items-center gap-6"
                    >
                        <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                            <Info size={32} />
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                Guía del Sistema
                                <HelpCircle size={18} className="text-slate-500" />
                            </h3>
                            <p className="text-slate-400">¿Necesitas ayuda? Revisa las instrucciones de uso, roles y tips de seguridad.</p>
                        </div>
                        <ArrowRight className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
