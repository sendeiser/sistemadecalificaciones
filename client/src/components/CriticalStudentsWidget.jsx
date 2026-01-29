import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiEndpoint } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, UserX, BookOpen, ChevronRight, CheckSquare } from 'lucide-react';

const CriticalStudentsWidget = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCriticalStudents();
    }, []);

    const fetchCriticalStudents = async () => {
        try {
            const res = await fetch(getApiEndpoint('/reports/at-risk'), {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (err) {
            console.error('Error fetching critical students:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse h-48 bg-tech-secondary rounded-lg"></div>;

    if (students.length === 0) return (
        <div className="bg-tech-secondary rounded border border-tech-surface p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="p-3 bg-tech-success/10 rounded-full text-tech-success mb-3">
                <CheckSquare size={24} />
            </div>
            <h3 className="text-tech-text font-bold uppercase">Sin Alumnos Críticos</h3>
            <p className="text-tech-muted text-xs font-mono mt-1">No se detectaron casos de alto riesgo.</p>
        </div>
    );

    return (
        <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden flex flex-col h-full shadow-lg shadow-red-500/5">
            <div className="p-4 border-b border-tech-surface flex justify-between items-center bg-tech-danger/5">
                <div className="flex items-center gap-2 text-tech-danger">
                    <AlertTriangle size={20} />
                    <h3 className="font-bold uppercase tracking-tight text-sm">Alumnos en Riesgo</h3>
                </div>
                <button
                    onClick={() => navigate('/students')}
                    className="text-[10px] text-tech-muted hover:text-tech-text uppercase font-bold tracking-wider flex items-center gap-1"
                >
                    Ver Todo <ChevronRight size={12} />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
                {students.map(s => (
                    <div key={s.id} onClick={() => navigate(`/student/report?student_id=${s.id}`)} className="p-3 rounded bg-tech-primary/50 hover:bg-tech-primary border border-tech-surface hover:border-tech-danger transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-tech-text text-xs uppercase truncate group-hover:text-tech-danger transition-colors">{s.nombre}</span>
                            <span className="text-[10px] font-mono text-tech-muted">{s.dni}</span>
                        </div>
                        <div className="text-[10px] text-tech-muted mb-2 font-mono">
                            Div: {s.division || s.materia}
                        </div>
                        <div className="flex gap-2">
                            {/* The backend returns pct (attendance %), so low pct is bad */}
                            {s.pct < 75 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-tech-danger/10 border border-tech-danger/30 text-tech-danger text-[10px] font-bold">
                                    <UserX size={10} />
                                    <span>{s.pct}% Asist.</span>
                                </div>
                            )}
                            {/* Backend doesn't return failed subjects count yet, only attendance. 
                                Could add later. For now showing attendance risk is enough. */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CriticalStudentsWidget;
