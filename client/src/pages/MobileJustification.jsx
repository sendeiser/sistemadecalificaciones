import React, { useState } from 'react';
import { Camera, Send, CheckCircle2, ChevronLeft, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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
                <Button variant="ghost" size="sm" className="p-2 h-auto rounded-full" onClick={() => navigate(-1)}>
                    <ChevronLeft />
                </Button>
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
                        <div className="bg-tech-secondary p-6 rounded-2xl border border-tech-surface shadow-xl">
                            <p className="text-tech-muted text-sm font-mono mb-6">Complete los detalles de la inasistencia para que el preceptor pueda validarla.</p>

                            <div className="space-y-4">
                                <Input
                                    type="date"
                                    label="Fecha de Inasistencia"
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                                <div>
                                    <label className="block text-xs font-bold text-tech-muted uppercase mb-2">Motivo / Causa</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Ej: Problemas de salud, tr├ímite personal..."
                                        className="w-full bg-tech-primary p-4 rounded-xl border border-tech-surface text-tech-text focus:border-tech-cyan outline-none"
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full shadow-lg shadow-tech-cyan/20"
                            onClick={() => setStep(2)}
                            disabled={!formData.date || !formData.reason}
                        >
                            Siguiente Paso
                            <Send size={18} />
                        </Button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-tech-secondary p-8 rounded-2xl border border-tech-surface shadow-xl text-center">
                            <div className="w-20 h-20 bg-tech-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6 text-tech-cyan">
                                <Camera size={40} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Adjuntar Certificado</h3>
                            <p className="text-tech-muted text-sm mb-8">Tome una foto del certificado m├⌐dico o comprobante para agilizar la validaci├│n.</p>

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
                            <Button
                                variant="ghost"
                                size="lg"
                                className="flex-1 border border-tech-surface"
                                onClick={() => setStep(1)}
                            >
                                Atr├ís
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                className="flex-[2] shadow-lg shadow-tech-cyan/20"
                                onClick={handleSubmit}
                            >
                                Enviar Solicitud
                            </Button>
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
                            <h2 className="text-2xl font-black uppercase tracking-tight">┬íEnviado con ├ëxito!</h2>
                            <p className="text-tech-muted font-mono max-w-xs mx-auto">La justificaci├│n fue registrada y est├í pendiente de revisi├│n por el preceptor.</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="lg"
                            className="border border-tech-surface"
                            onClick={() => navigate('/tutor')}
                        >
                            Volver al Inicio
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileJustification;
