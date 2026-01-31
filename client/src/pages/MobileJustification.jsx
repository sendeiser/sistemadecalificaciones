import React, { useState } from 'react';
import { Camera, FileText, Send, CheckCircle2, ChevronLeft, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MobileJustification = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        reason: '',
        date: '',
        file: null
    });

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStep(3); // Success state simulation
    };

    return (
        <div className="min-h-screen bg-tech-primary text-tech-text p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 bg-tech-secondary rounded-full">
                    <ChevronLeft />
                </button>
                <h1 className="text-xl font-bold uppercase tracking-tight">Justificar Inasistencia</h1>
            </header>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-tech-secondary p-6 rounded-3xl border border-tech-surface shadow-xl">
                            <p className="text-tech-muted text-sm font-mono mb-6">Complete los detalles de la inasistencia para que el preceptor pueda validarla.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-tech-muted uppercase mb-2">Fecha de Inasistencia</label>
                                    <input
                                        type="date"
                                        className="w-full bg-tech-primary p-4 rounded-xl border border-tech-surface text-tech-text focus:border-tech-cyan outline-none"
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-tech-muted uppercase mb-2">Motivo / Causa</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Ej: Problemas de salud, trámite personal..."
                                        className="w-full bg-tech-primary p-4 rounded-xl border border-tech-surface text-tech-text focus:border-tech-cyan outline-none"
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!formData.date || !formData.reason}
                            className="w-full py-5 bg-tech-cyan text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-tech-cyan/20 flex items-center justify-center gap-2"
                        >
                            Siguiente Paso
                            <Send size={18} />
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-tech-secondary p-8 rounded-3xl border border-tech-surface shadow-xl text-center">
                            <div className="w-20 h-20 bg-tech-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6 text-tech-cyan">
                                <Camera size={40} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Adjuntar Certificado</h3>
                            <p className="text-tech-muted text-sm mb-8">Tome una foto del certificado médico o comprobante para agilizar la validación.</p>

                            <label className="block w-full py-8 border-2 border-dashed border-tech-surface rounded-2xl cursor-pointer hover:border-tech-cyan transition-colors bg-tech-primary/30">
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="text-tech-muted" />
                                    <span className="text-sm font-bold text-tech-muted uppercase">
                                        {formData.file ? formData.file.name : 'Subir Imagen / Tomar Foto'}
                                    </span>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-5 bg-tech-secondary border border-tech-surface text-tech-text rounded-2xl font-bold uppercase tracking-widest"
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-[2] py-5 bg-tech-cyan text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-tech-cyan/20"
                            >
                                Enviar Solicitud
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-8 py-12"
                    >
                        <div className="w-24 h-24 bg-tech-success/10 rounded-full flex items-center justify-center mx-auto text-tech-success">
                            <CheckCircle2 size={56} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase tracking-tight">¡Enviado con Éxito!</h2>
                            <p className="text-tech-muted font-mono max-w-xs mx-auto">La justificación fue registrada y está pendiente de revisión por el preceptor.</p>
                        </div>
                        <button
                            onClick={() => navigate('/tutor')}
                            className="px-10 py-4 bg-tech-secondary border border-tech-surface text-tech-text rounded-xl font-bold uppercase tracking-widest"
                        >
                            Volver al Inicio
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileJustification;
