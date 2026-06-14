import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${sizes[size]} bg-tech-secondary rounded-2xl border border-tech-surface shadow-2xl max-h-[85vh] flex flex-col`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-tech-surface">
                <h2 className="title !text-base !normal-case">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-tech-surface/50 rounded-full transition-colors text-tech-muted hover:text-tech-text"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="px-6 py-6 overflow-y-auto flex-1 custom-scrollbar">
              {children}
            </div>
            {footer && (
              <div className="px-6 py-4 bg-tech-primary/30 border-t border-tech-surface flex justify-end gap-3 rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
