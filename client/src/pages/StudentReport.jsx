import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Download, ArrowLeft, GraduationCap, Clock, AlertCircle, BookOpen, Brain } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getApiEndpoint } from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Sparkles, Award } from 'lucide-react';
import AiInsights from '../components/AiInsights';
import MedalBadge from '../components/MedalBadge';

const StudentReport = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [division, setDivision] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [medals, setMedals] = useState([]);
    const [aiData, setAiData] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Get student ID from URL parameter or use logged-in user's ID
    const studentId = searchParams.get('student_id') || profile?.id;

    useEffect(() => {
        if (profile && studentId) {
            fetchData();
            fetchMedals();
            fetchExistingAiDiagnostic();
        }
    }, [profile, studentId]);

    const fetchMedals = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(getApiEndpoint(`/gamification/medals/${studentId}`), {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMedals(data);
            }
        } catch (error) {
            console.error('Error fetching medals:', error);
        }
    };

    const fetchExistingAiDiagnostic = async () => {
        try {
            const { data, error } = await supabase
                .from('ai_diagnostics')
                .select('*')
                .eq('alumno_id', studentId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                setAiData(data.recomendaciones);
            }
        } catch (error) {
            console.error('Error fetching AI diagnostic:', error);
        }
    };

    const generateAiDiagnostic = async () => {
        setAiLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(getApiEndpoint(`/ai/diagnostics/${studentId}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAiData(data);
            } else {
                const err = await res.json();
                alert(`${err.error || 'Error al generar diagnóstico'}${err.details ? ': ' + err.details : ''}`);
            }
        } catch (error) {
            console.error('Error generating AI diagnostic:', error);
            alert('Error de conexión con el servicio de IA');
        } finally {
            setAiLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            console.log('🔍 [StudentReport] Starting data fetch...');
            console.log('🔍 [StudentReport] Student ID:', studentId);
            console.log('🔍 [StudentReport] Logged-in Profile ID:', profile.id);

            // If viewing another student's report, fetch their info
            if (studentId !== profile.id) {
                const { data: student, error: sErr } = await supabase
                    .from('perfiles')
                    .select('id, nombre, dni')
                    .eq('id', studentId)
                    .single();

                console.log('👤 [StudentReport] Student info query:', { student, error: sErr });

                if (sErr) {
                    console.error('❌ [StudentReport] Error fetching student info:', sErr);
                    throw sErr;
                }
                setStudentInfo(student);
            } else {
                // Viewing own report
                setStudentInfo(profile);
            }

            // 1. Fetch Student Division
            const { data: enrollment, error: eErr } = await supabase
                .from('estudiantes_divisiones')
                .select('division:divisiones(*)')
                .eq('alumno_id', studentId)
                .single();

            console.log('📚 [StudentReport] Enrollment query result:', { enrollment, error: eErr });

            if (eErr) {
                console.error('❌ [StudentReport] Error fetching enrollment:', eErr);
                throw eErr;
            }
            setDivision(enrollment.division);

            // 2. Fetch Assignments for this division
            const { data: assignments, error: aErr } = await supabase
                .from('asignaciones')
                .select('id, materia:materias(nombre), docente:perfiles(nombre)')
                .eq('division_id', enrollment.division.id);

            console.log('📋 [StudentReport] Assignments query result:', { assignments, error: aErr });

            if (aErr) {
                console.error('❌ [StudentReport] Error fetching assignments:', aErr);
                throw aErr;
            }

            // 3. Fetch My Grades
            const { data: myGrades, error: gErr } = await supabase
                .from('calificaciones')
                .select('*')
                .eq('alumno_id', studentId);

            console.log('📊 [StudentReport] Grades query result:', { myGrades, error: gErr });
            console.log('📊 [StudentReport] Number of grades found:', myGrades?.length || 0);

            if (gErr) {
                console.error('❌ [StudentReport] Error fetching grades:', gErr);
                console.error('❌ [StudentReport] Error details:', JSON.stringify(gErr, null, 2));
                throw gErr;
            }

            // Merge
            const report = assignments.map(asig => {
                const g = myGrades.find(grade => grade.asignacion_id === asig.id) || {};
                return {
                    id: asig.id,
                    materia: asig.materia.nombre,
                    docente: asig.docente?.nombre || 'No asignado',
                    parcial_1: g.parcial_1 || '-',
                    parcial_2: g.parcial_2 || '-',
                    parcial_3: g.parcial_3 || '-',
                    parcial_4: g.parcial_4 || '-',
                    promedio: g.promedio || '-',
                    trayecto: g.trayecto_acompanamiento || '-'
                };
            }).sort((a, b) => a.materia.localeCompare(b.materia));

            console.log('✅ [StudentReport] Final report:', report);
            console.log('✅ [StudentReport] Number of subjects:', report.length);

            setGrades(report);
        } catch (error) {
            console.error('💥 [StudentReport] Fatal error:', error);
            console.error('💥 [StudentReport] Error stack:', error.stack);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        setDownloading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const endpoint = getApiEndpoint(`/reports/bulletin/${studentId}`);

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Error al descargar el boletín');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Boletin_${studentInfo?.nombre || 'Estudiante'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error(error);
            alert('Error al descargar reporte');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-tech-primary text-tech-text">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-cyan"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-6 md:p-10 font-sans">
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-tech-surface pb-6 gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-tech-secondary rounded-lg transition-colors text-tech-muted hover:text-tech-text border border-transparent hover:border-tech-surface"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg md:text-3xl font-bold text-tech-text uppercase tracking-tight">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="p-1.5 md:p-2 bg-tech-success/20 rounded text-tech-success shrink-0">
                                    <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                                <span className="break-words leading-tight">Mi Boletín de Calificaciones</span>
                            </div>
                        </h1>
                        <p className="text-tech-muted font-mono mt-2 text-xs md:text-sm">
                            {division ? `${division.anio} "${division.seccion}" - Ciclo ${division.ciclo_lectivo} ` : 'Cargando división...'}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ThemeToggle />
                    <button
                        onClick={() => setShowQR(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-tech-secondary hover:bg-tech-surface text-tech-cyan rounded font-bold transition-all border border-tech-cyan/30 uppercase tracking-widest text-sm"
                        title="Mostrar mi QR de asistencia"
                    >
                        <QrCode size={20} />
                        <span className="hidden sm:inline">Mi Credencial</span>
                    </button>
                    <button
                        onClick={downloadPDF}
                        disabled={downloading}
                        className="flex items-center gap-2 px-6 py-3 bg-tech-success hover:bg-emerald-600 text-white rounded font-bold transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                        {downloading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <Download size={20} />
                        )}
                        Descargar PDF
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {showQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowQR(false)}>
                        <div className="bg-tech-secondary border border-tech-cyan/30 rounded-2xl p-8 max-w-xs w-full text-center space-y-6 animate-in zoom-in-95 duration-200 shadow-[0_0_50px_rgba(14,165,233,0.2)]" onClick={e => e.stopPropagation()}>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-tech-text uppercase tracking-tighter">Credencial Digital</h3>
                                <p className="text-[10px] text-tech-muted font-mono uppercase">Escolares • Asistencia</p>
                            </div>

                            <div className="bg-white p-4 rounded-xl inline-block shadow-inner mx-auto">
                                <QRCodeSVG
                                    value={studentInfo?.dni || studentInfo?.id || ''}
                                    size={180}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="space-y-1 pb-2">
                                <div className="font-black text-tech-text uppercase text-lg leading-tight">{studentInfo?.nombre}</div>
                                <div className="text-sm text-tech-cyan font-mono font-bold tracking-widest">DNI: {studentInfo?.dni}</div>
                            </div>

                            <button
                                onClick={() => setShowQR(false)}
                                className="w-full py-3 bg-tech-surface hover:bg-tech-primary text-tech-muted hover:text-white rounded-xl transition-colors font-bold uppercase text-xs tracking-widest border border-tech-surface"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}

                {/* Seccion de Logros */}
                {medals.length > 0 && (
                    <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-tech-accent/20 rounded-lg text-tech-accent">
                                <Award size={24} />
                            </div>
                            <h2 className="text-xl font-black text-tech-text uppercase tracking-widest">Logros y Reconocimientos</h2>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {medals.map((m, i) => (
                                <MedalBadge key={i} medalKey={m.medal_key} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Seccion de IA para Docentes/Admin o Alumno */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-tech-cyan/20 rounded-lg text-tech-cyan">
                            <Sparkles size={24} />
                        </div>
                        <h2 className="text-xl font-black text-tech-text uppercase tracking-widest">Inteligencia Educativa</h2>
                    </div>
                    {(!aiData && profile.rol === 'alumno') ? (
                        <div className="p-8 bg-tech-secondary/30 rounded-3xl border border-tech-surface border-dashed text-center">
                            <Brain className="mx-auto text-tech-muted mb-4 opacity-50" size={48} />
                            <p className="text-tech-muted font-mono text-sm uppercase">El equipo docente aún no ha generado un diagnóstico pedagógico para tu perfil.</p>
                        </div>
                    ) : (
                        <AiInsights
                            data={aiData}
                            loading={aiLoading}
                            onGenerate={generateAiDiagnostic}
                        />
                    )}
                </section>
                <div className="bg-tech-secondary rounded border border-tech-surface overflow-hidden shadow-xl">
                    <div className="p-4 bg-tech-primary/50 border-b border-tech-surface">
                        <h2 className="text-xl font-bold text-tech-text uppercase tracking-wider flex items-center gap-2">
                            <BookOpen size={20} className="text-tech-cyan" />
                            Calificaciones Consolidadas
                        </h2>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-tech-primary text-tech-muted text-xs uppercase font-bold tracking-wider border-b border-tech-surface">
                                <tr>
                                    <th className="p-4">Materia</th>
                                    <th className="p-4 text-center">P1</th>
                                    <th className="p-4 text-center">P2</th>
                                    <th className="p-4 text-center">P3</th>
                                    <th className="p-4 text-center">P4</th>
                                    <th className="p-4 text-center">Promedio</th>
                                    <th className="p-4 text-center">Final</th>
                                    <th className="p-4">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tech-surface">
                                {grades.map((g, idx) => {
                                    const avg = g.promedio;
                                    return (
                                        <tr key={idx} className="hover:bg-tech-primary/30 transition-colors">
                                            <td className="p-4 font-bold text-tech-text">{g.materia}</td>
                                            <td className="p-4 text-center font-mono text-tech-muted">{g.parcial_1}</td>
                                            <td className="p-4 text-center font-mono">{g.parcial_2}</td>
                                            <td className="p-4 text-center font-mono">{g.parcial_3}</td>
                                            <td className="p-4 text-center font-mono">{g.parcial_4}</td>
                                            <td className={`p-4 text-center font-bold font-mono ${avg !== '-' && Number(avg) < 7 ? 'text-tech-danger' : 'text-tech-success'}`}>
                                                {avg}
                                            </td>

                                            <td className={`p-4 text-center font-bold font-mono ${avg !== '-' && Number(avg) < 7 ? 'text-tech-danger' : 'text-tech-cyan'}`}>
                                                {avg}
                                            </td>
                                            <td className="p-4 text-sm text-tech-muted italic max-w-xs truncate" title={g.trayecto}>
                                                {g.trayecto}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {grades.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="p-12 text-center text-tech-muted font-mono uppercase tracking-widest">
                                            No hay calificaciones registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-tech-surface">
                        {grades.map((g, idx) => {
                            const avg = g.promedio;
                            return (
                                <div key={idx} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-tech-text text-lg leading-tight">{g.materia}</h3>
                                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest ${avg !== '-' && Number(avg) < 7 ? 'bg-tech-danger/20 text-tech-danger' : 'bg-tech-cyan/20 text-tech-cyan'}`}>
                                            FINAL: {avg}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="bg-tech-primary p-2 rounded border border-tech-surface text-center">
                                            <div className="text-[10px] text-tech-muted uppercase font-bold mb-1">P1</div>
                                            <div className="font-mono text-sm text-tech-text">{g.parcial_1}</div>
                                        </div>
                                        <div className="bg-tech-primary p-2 rounded border border-tech-surface text-center">
                                            <div className="text-[10px] text-tech-muted uppercase font-bold mb-1">P2</div>
                                            <div className="font-mono text-sm text-tech-text">{g.parcial_2}</div>
                                        </div>
                                        <div className="bg-tech-primary p-2 rounded border border-tech-surface text-center">
                                            <div className="text-[10px] text-tech-muted uppercase font-bold mb-1">P3</div>
                                            <div className="font-mono text-sm text-tech-text">{g.parcial_3}</div>
                                        </div>
                                        <div className="bg-tech-primary p-2 rounded border border-tech-surface text-center">
                                            <div className="text-[10px] text-tech-muted uppercase font-bold mb-1">P4</div>
                                            <div className="font-mono text-sm text-tech-text">{g.parcial_4}</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm p-2 bg-tech-primary/30 rounded border border-tech-surface/50">
                                        <div>
                                            <span className="text-tech-muted uppercase text-[10px] font-bold mr-2">Promedio:</span>
                                            <span className={`font-bold font-mono ${avg !== '-' && Number(avg) < 7 ? 'text-tech-danger' : 'text-tech-success'}`}>{avg}</span>
                                        </div>
                                    </div>

                                    {g.trayecto && g.trayecto !== '-' && (
                                        <div className="text-xs text-tech-muted italic bg-tech-primary/20 p-2 rounded">
                                            "{g.trayecto}"
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {grades.length === 0 && (
                            <div className="p-12 text-center text-tech-muted font-mono uppercase tracking-widest text-xs">
                                No hay calificaciones registradas.
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 bg-tech-secondary/30 p-6 rounded border border-tech-surface border-dashed flex items-center gap-4 text-tech-muted">
                    <AlertCircle size={24} className="text-tech-cyan shrink-0" />
                    <p className="text-sm font-mono italic">
                        Este boletín muestra las calificaciones cargadas hasta la fecha por los docentes.
                        Para reclamos o consultas, dirígete a preceptoría.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default StudentReport;
