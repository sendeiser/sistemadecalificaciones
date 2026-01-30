import React, { useState } from 'react';
import { Brain, Sparkles, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AiInsights = ({ data, loading, onGenerate }) => {
    if (loading) {
        return (
            <div className="glass-panel p-8 rounded-3xl border border-tech-cyan/30 bg-tech-cyan/5 flex flex-col items-center text-center space-y-4">
                <Loader2 className="text-tech-cyan animate-spin" size={48} />
                <div>
                    <h3 className="text-xl font-bold text-tech-text">Consultando a la IA...</h3>
                    <p className="text-tech-muted text-sm font-mono">Analizando rendimiento y asistencia académica</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="glass-panel p-8 rounded-3xl border border-tech-surface bg-tech-secondary/30 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-tech-cyan/10 rounded-2xl">
                        <Brain className="text-tech-cyan" size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-tech-text">Análisis Pedagógico IA</h3>
                        <p className="text-tech-muted text-sm font-mono">Genera recomendaciones inteligentes basadas en datos reales.</p>
                    </div>
                </div>
                <button
                    onClick={onGenerate}
                    className="px-6 py-3 bg-tech-cyan text-white rounded-xl font-bold flex items-center gap-2 hover:bg-sky-600 transition-all shadow-lg hover:shadow-tech-cyan/20 active:scale-95"
                >
                    <Sparkles size={18} />
                    Generar Diagnóstico
                </button>
            </div>
        );
    }

    const { analisis, recomendaciones, riesgo } = data;

    const riskColors = {
        bajo: 'text-tech-success bg-tech-success/10 border-tech-success/20',
        medio: 'text-tech-accent bg-tech-accent/10 border-tech-accent/20',
        alto: 'text-tech-danger bg-tech-danger/10 border-tech-danger/20'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 rounded-3xl border border-tech-cyan/20 bg-tech-secondary/50 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Brain size={120} />
            </div>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-tech-cyan rounded-lg text-white">
                        <Sparkles size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-tech-text uppercase tracking-tighter">Insights de Gemini Pro</h3>
                </div>
                <div className={`px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${riskColors[riesgo] || riskColors.medio}`}>
                    Nivel de Riesgo: {riesgo}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <h4 className="text-sm font-bold text-tech-cyan uppercase tracking-widest flex items-center gap-2">
                        <Brain size={16} />
                        Análisis Académico
                    </h4>
                    <p className="text-tech-text leading-relaxed font-medium bg-tech-primary/30 p-4 rounded-2xl border border-tech-surface">
                        {analisis}
                    </p>
                </section>

                <section className="space-y-4">
                    <h4 className="text-sm font-bold text-tech-accent uppercase tracking-widest flex items-center gap-2">
                        <ArrowRight size={16} />
                        Recomendaciones
                    </h4>
                    <ul className="space-y-3">
                        {recomendaciones.map((rec, i) => (
                            <motion.li
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="flex items-start gap-3 p-3 bg-tech-primary/30 rounded-xl border border-tech-surface text-sm font-medium"
                            >
                                <CheckCircle2 className="text-tech-success shrink-0" size={18} />
                                {rec}
                            </motion.li>
                        ))}
                    </ul>
                </section>
            </div>

            <footer className="mt-8 pt-6 border-t border-tech-surface flex justify-between items-center">
                <p className="text-[10px] text-tech-muted font-mono uppercase">Diagnóstico generado por IA • Basado en el rendimiento curricular actual</p>
                <button
                    onClick={onGenerate}
                    className="text-xs font-bold text-tech-cyan hover:underline"
                >
                    Recalcular
                </button>
            </footer>
        </motion.div>
    );
};

export default AiInsights;
