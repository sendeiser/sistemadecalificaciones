// client/src/components/AttendanceCapture.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Check, X } from 'lucide-react';

const AttendanceCapture = () => {
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
            const res = await fetch('/api/attendance/general', {
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
        <div className="min-h-screen bg-tech-primary text-slate-100 p-6 md:p-10 font-sans">
            <h1 className="text-3xl font-bold mb-6">Captura General de Asistencia</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                    className="p-2 bg-tech-secondary border border-tech-surface rounded text-white"
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
                    className="p-2 bg-tech-secondary border border-tech-surface rounded text-white"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
            </div>
            {students.length > 0 && (
                <div className="grid gap-2 max-h-[500px] overflow-y-auto">
                    {students.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2 bg-tech-secondary rounded">
                            <span>{s.nombre} ({s.dni || 'N/A'})</span>
                            <div className="flex gap-2">
                                <button
                                    className={`p-1 rounded ${attendance[s.id] === 'presente' ? 'bg-tech-cyan text-white' : 'bg-tech-primary text-slate-400'}`}
                                    onClick={() => handleChange(s.id, 'presente')}
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    className={`p-1 rounded ${attendance[s.id] === 'ausente' ? 'bg-red-600 text-white' : 'bg-tech-primary text-slate-400'}`}
                                    onClick={() => handleChange(s.id, 'ausente')}
                                >
                                    <X size={16} />
                                </button>
                                <button
                                    className={`p-1 rounded ${attendance[s.id] === 'tarde' ? 'bg-yellow-500 text-white' : 'bg-tech-primary text-slate-400'}`}
                                    onClick={() => handleChange(s.id, 'tarde')}
                                >
                                    <Calendar size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <button
                onClick={submitAttendance}
                className="mt-4 flex items-center gap-2 px-6 py-2 bg-tech-cyan hover:bg-sky-600 rounded text-white"
                disabled={saving}
            >
                {saving ? 'Guardando...' : 'Guardar Asistencia'}
            </button>
        </div>
    );
};

export default AttendanceCapture;
