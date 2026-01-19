// client/src/components/AttendanceCapture.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Calendar, Save, ArrowLeft, Check, X } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

import { getApiEndpoint } from '../utils/api';

const AttendanceCapture = () => {
    const navigate = useNavigate();
    const [divisions, setDivisions] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState('');
    const [students, setStudents] = useState([]);
    const [date, setDate] = useState('');
    const [attendance, setAttendance] = useState({}); // {studentId: 'presente'|'ausente'|'tarde'}
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchDivisions = async () => {
            const { data, error } = await supabase.from('divisiones').select('*');
            if (!error) setDivisions(data);
        };
        fetchDivisions();
    }, []);

    // Load students when division changes
    useEffect(() => {
        if (!selectedDivision) {
            setStudents([]);
            return;
        }
        const loadStudents = async () => {
            const { data, error } = await supabase
                .from('estudiantes_divisiones')
                .select(`
          alumno:perfiles!alumno_id (
            id,
            nombre,
            dni
          )
        `)
                .eq('division_id', selectedDivision);

            if (!error) {
                const studentList = data.map(d => d.alumno).sort((a, b) => a.nombre.localeCompare(b.nombre));
                setStudents(studentList);
            }
        };
        loadStudents();
    }, [selectedDivision]);

    const handleChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const submitAttendance = async () => {
        if (!selectedDivision || !date) return alert('Seleccione división y fecha');
        const records = Object.entries(attendance).map(([alumno_id, estado]) => ({
            estudiante_id: alumno_id,
            division_id: selectedDivision,
            fecha: date,
            estado
        }));
        if (records.length === 0) return alert('No se marcó asistencia para ningún alumno');
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const payload = { records };
            const endpoint = getApiEndpoint('/attendance/general');

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (res.ok) alert('Asistencias guardadas');
            else alert('Error: ' + json.error);
        } catch (e) {
            console.error(e);
            alert('Error al enviar');
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 flex items-center justify-between border-b border-tech-surface pb-6 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 bg-tech-secondary border border-tech-surface rounded-lg text-tech-muted hover:text-tech-text transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-bold text-tech-text">Captura General de Asistencia</h1>
                </div>
                <ThemeToggle />
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                    className="p-2 bg-tech-secondary border border-tech-surface rounded text-tech-text"
                    value={selectedDivision}
                    onChange={e => setSelectedDivision(e.target.value)}
                >
                    <option value="">Seleccionar División</option>
                    {divisions.map(d => (
                        <option key={d.id} value={d.id}>
                            {d.anio} {d.seccion}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    className="p-2 bg-tech-secondary border border-tech-surface rounded text-tech-text"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
            </div>
            {students.length > 0 && (
                <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {students.map(s => (
                        <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-tech-secondary rounded border border-tech-surface hover:border-tech-cyan/30 transition-all gap-4">
                            <div className="flex flex-col">
                                <span className="font-bold text-tech-text uppercase tracking-tight">{s.nombre}</span>
                                <span className="text-[10px] text-tech-muted font-mono">DNI: {s.dni || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                                <button
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${attendance[s.id] === 'presente' ? 'bg-tech-success border-tech-success shadow-[0_0_10px_rgba(16,185,129,0.3)] text-white' : 'bg-tech-primary border-tech-surface text-tech-muted hover:border-tech-muted/50'}`}
                                    onClick={() => handleChange(s.id, 'presente')}
                                >
                                    <Check size={20} />
                                    <span className="text-[8px] uppercase font-bold mt-1">Pres.</span>
                                </button>
                                <button
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${attendance[s.id] === 'ausente' ? 'bg-tech-danger border-tech-danger shadow-[0_0_10px_rgba(239,68,68,0.3)] text-white' : 'bg-tech-primary border-tech-surface text-tech-muted hover:border-tech-muted/50'}`}
                                    onClick={() => handleChange(s.id, 'ausente')}
                                >
                                    <X size={20} />
                                    <span className="text-[8px] uppercase font-bold mt-1">Aus.</span>
                                </button>
                                <button
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${attendance[s.id] === 'tarde' ? 'bg-tech-accent border-tech-accent shadow-[0_0_10px_rgba(245,158,11,0.3)] text-white' : 'bg-tech-primary border-tech-surface text-tech-muted hover:border-tech-muted/50'}`}
                                    onClick={() => handleChange(s.id, 'tarde')}
                                >
                                    <Calendar size={20} />
                                    <span className="text-[8px] uppercase font-bold mt-1">Tarde</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={submitAttendance}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-tech-cyan hover:bg-sky-600 rounded-lg text-white font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all text-lg"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Check size={24} />
                            Guardar Asistencia
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AttendanceCapture;
