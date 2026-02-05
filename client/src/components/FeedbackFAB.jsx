import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FeedbackModal from './FeedbackModal';

const FeedbackFAB = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [justSent, setJustSent] = useState(false);

    const handleSuccess = () => {
        setJustSent(true);
        setTimeout(() => setJustSent(false), 5000);
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3">
                <AnimatePresence>
                    {justSent && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-tech-secondary border border-tech-success px-4 py-2 rounded-xl shadow-xl text-tech-success text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                        >
                            <div className="w-2 h-2 rounded-full bg-tech-success animate-pulse" />
                            Feedback Enviado!
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="p-1.5 bg-tech-cyan text-white rounded-lg shadow-xl shadow-tech-cyan/20 flex items-center justify-center gap-1 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <MessageSquarePlus size={16} className="relative z-10" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-[8px] font-bold uppercase tracking-widest relative z-10">
                        Sugerir Mejora
                    </span>
                </motion.button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <FeedbackModal
                        onClose={() => setIsOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default FeedbackFAB;
