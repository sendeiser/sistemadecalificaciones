import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Settings, Lock, Unlock, AlertCircle, ArrowLeft } from 'lucide-react';

const PeriodManagement = () => {
    const navigate = useNavigate();
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('periodos_calificacion')
                .select('*')
                .order('clave');

            if (data) setPeriods(data);
            if (error) console.error(error);
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al cargar periodos.' });
        } finally {
            setLoading(false);
        }
    };

    const togglePeriod = async (clave, currentStatus) => {
        try {
            const { error } = await supabase
                .from('periodos_calificacion')
                .update({ abierto: !currentStatus })
                .eq('clave', clave);

            if (error) throw error;

            // Optimistic update
            setPeriods(periods.map(p =>
                p.clave === clave ? { ...p, abierto: !currentStatus } : p
            ));

            setMessage({ type: 'success', text: `Periodo ${!currentStatus ? 'ABIERTO' : 'CERRADO'} correctamente.` });

            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Error al actualizar el estado.' });
        }
    };

    return (
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            <header className="max-w-4xl mx-auto mb-10 flex items-center gap-4 border-b border-tech-surface pb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-tech-surface rounded transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
                        <Settings size={28} className="text-tech-cyan" />
                        Gestión de Periodos de Calificación
                    </h1>
                    <p className="text-slate-400 text-sm font-mono uppercase">Control de apertura y cierre de notas</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto">
                {message && (
                    <div className={`mb-6 p-4 rounded border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'error'
                            ? 'bg-tech-danger/10 border-tech-danger text-tech-danger'
                            : 'bg-tech-success/10 border-tech-success text-tech-success'
                        }`}>
                        <AlertCircle size={20} />
                        {message.text}
                    </div>
                )}

                <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden shadow-xl">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 font-mono animate-pulse">Cargando configuración...</div>
                    ) : (
                        <div className="divide-y divide-tech-surface">
                            {periods.map(period => (
                                <div key={period.clave} className="p-6 flex items-center justify-between hover:bg-tech-primary/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${period.abierto ? 'bg-tech-success/10 text-tech-success' : 'bg-tech-danger/10 text-tech-danger'}`}>
                                            {period.abierto ? <Unlock size={24} /> : <Lock size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white uppercase tracking-wide">{period.nombre}</h3>
                                            <p className="text-sm font-mono text-slate-500">
                                                Estado: <span className={period.abierto ? 'text-tech-success' : 'text-tech-danger'}>
                                                    {period.abierto ? 'HABILITADO' : 'BLOQUEADO'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={period.abierto}
                                            onChange={() => togglePeriod(period.clave, period.abierto)}
                                        />
                                        <div className="w-14 h-7 bg-tech-primary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-tech-cyan rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-tech-success peer-checked:after:bg-white peer-checked:after:border-white"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 p-6 bg-slate-800/50 rounded border border-tech-accent/30 flex gap-4 text-sm text-slate-400 font-mono">
                    <AlertCircle className="text-tech-accent shrink-0" size={24} />
                    <p>
                        ADVERTENCIA: Al cerrar un periodo, los docentes no podrán cargar ni modificar las notas correspondientes.
                        Este bloqueo es a nivel de base de datos y afecta a todas las materias y divisiones.
                        Los Administradores no se ven afectados por este bloqueo.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PeriodManagement;
