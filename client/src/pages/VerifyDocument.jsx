import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ShieldCheck, Calendar, User, FileText, ArrowLeft } from 'lucide-react';
import { getApiEndpoint } from '../utils/api';

const VerifyDocument = () => {
    const { hash } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, valid, invalid
    const [docData, setDocData] = useState(null);

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await fetch(getApiEndpoint(`/verify/${hash}`));
                const data = await res.json();
                if (data.valid) {
                    setDocData(data);
                    setStatus('valid');
                } else {
                    setStatus('invalid');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('invalid');
            }
        };
        verify();
    }, [hash]);

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tech-cyan/5 via-tech-primary to-tech-primary">
            <div className="w-full max-w-lg">
                {/* Logo / Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-tech-text tracking-tighter flex items-center justify-center gap-2">
                        <span className="text-tech-cyan italic underline decoration-tech-accent decoration-4 underline-offset-4">ETA</span>TECNICA
                    </h1>
                    <p className="text-tech-muted uppercase tracking-[0.3em] text-xs mt-2 font-mono">Blockchain-Grade Verification</p>
                </div>

                <div className="bg-tech-secondary/60 backdrop-blur-xl border border-tech-surface rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-cyan to-transparent"></div>

                    {status === 'loading' && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-tech-cyan mx-auto mb-6"></div>
                            <p className="text-tech-muted font-mono uppercase tracking-widest text-sm">Verificando Hash...</p>
                        </div>
                    )}

                    {status === 'valid' && (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="flex flex-col items-center mb-8">
                                <div className="p-4 bg-tech-success/10 rounded-full mb-4">
                                    <ShieldCheck size={64} className="text-tech-success" />
                                </div>
                                <h2 className="text-2xl font-bold uppercase tracking-tight text-tech-success">Documento Válido</h2>
                                <p className="text-tech-muted text-sm font-mono mt-1">Este documento es auténtico y oficial.</p>
                            </div>

                            <div className="space-y-4 border-t border-tech-surface pt-6">
                                <div className="flex items-center gap-4 p-4 bg-tech-primary/50 rounded-xl border border-tech-surface/50">
                                    <User className="text-tech-cyan" size={20} />
                                    <div>
                                        <p className="text-[10px] text-tech-muted uppercase font-mono tracking-tighter">Alumno / Titular</p>
                                        <p className="font-bold text-tech-text">{docData.student_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-tech-primary/50 rounded-xl border border-tech-surface/50">
                                    <FileText className="text-tech-accent" size={20} />
                                    <div>
                                        <p className="text-[10px] text-tech-muted uppercase font-mono tracking-tighter">Tipo de Documento</p>
                                        <p className="font-bold text-tech-text">
                                            {docData.document_type === 'boletin_alumno' ? 'Boletín de Calificaciones' : 'Planilla de Asistencia/Notas'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-tech-primary/50 rounded-xl border border-tech-surface/50">
                                    <Calendar className="text-tech-muted" size={20} />
                                    <div>
                                        <p className="text-[10px] text-tech-muted uppercase font-mono tracking-tighter">Fecha de Emisión</p>
                                        <p className="font-bold text-tech-text">{new Date(docData.created_at).toLocaleDateString('es-AR', { dateStyle: 'long' })}</p>
                                    </div>
                                </div>

                                {docData.metadata?.division && (
                                    <div className="text-center mt-4">
                                        <span className="px-3 py-1 bg-tech-surface rounded-full text-[10px] font-mono text-tech-muted uppercase">
                                            División: {docData.metadata.division} {docData.metadata.materia && `| ${docData.metadata.materia}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {status === 'invalid' && (
                        <div className="text-center py-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="p-4 bg-tech-danger/10 rounded-full inline-block mb-4">
                                <XCircle size={64} className="text-tech-danger" />
                            </div>
                            <h2 className="text-2xl font-bold uppercase tracking-tight text-tech-danger">Verificación Fallida</h2>
                            <p className="text-tech-muted font-mono mt-4 text-sm max-w-[280px] mx-auto">
                                El hash proporcionado no coincide con ningún registro oficial en nuestra base de datos segura.
                            </p>
                            <button
                                onClick={() => navigate('/')}
                                className="mt-8 px-6 py-2 bg-tech-danger hover:bg-red-700 text-white rounded-full font-bold uppercase tracking-widest text-xs transition-colors"
                            >
                                Volver al Inicio
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-10 text-center">
                    <p className="text-tech-muted text-[10px] uppercase font-mono tracking-[0.2em]">
                        ETATECNICA v2.4 SafeDoc Infrastructure
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyDocument;
