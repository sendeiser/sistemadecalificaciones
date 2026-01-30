import React from 'react';
import { Award, Star, Zap, ShieldCheck, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const MedalBadge = ({ medalKey, size = 48, showLabel = true }) => {
    const medals = {
        asistencia_perfecta: {
            icon: <ShieldCheck size={size * 0.5} />,
            color: 'text-tech-cyan',
            bg: 'bg-tech-cyan/10',
            border: 'border-tech-cyan/30',
            label: 'Asistencia Perfecta',
            desc: 'Más del 95% de presentismo'
        },
        excelencia_academica: {
            icon: <Trophy size={size * 0.5} />,
            color: 'text-tech-accent',
            bg: 'bg-tech-accent/10',
            border: 'border-tech-accent/30',
            label: 'Excelencia Académica',
            desc: 'Promedio superior a 9'
        },
        gran_progreso: {
            icon: <Zap size={size * 0.5} />,
            color: 'text-tech-success',
            bg: 'bg-tech-success/10',
            border: 'border-tech-success/30',
            label: 'Gran Progreso',
            desc: 'Mejora sostenida entre parciales'
        }
    };

    const medal = medals[medalKey] || {
        icon: <Award size={size * 0.5} />,
        color: 'text-tech-muted',
        bg: 'bg-tech-primary',
        border: 'border-tech-surface',
        label: 'Logro Obtenido',
        desc: 'Actividad destacada reconocida'
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${medal.border} ${medal.bg} group relative cursor-help`}
        >
            <div className={`p-3 rounded-full ${medal.color} bg-tech-primary shadow-inner border border-white/5`}>
                {medal.icon}
            </div>

            {showLabel && (
                <div className="text-center">
                    <p className={`text-[10px] font-black uppercase tracking-tighter ${medal.color}`}>
                        {medal.label}
                    </p>
                    <p className="text-[9px] text-tech-muted font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 left-1/2 -translate-x-1/2 bg-tech-secondary px-2 py-1 rounded border border-tech-surface z-10 pointer-events-none">
                        {medal.desc}
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default MedalBadge;
