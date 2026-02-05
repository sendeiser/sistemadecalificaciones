import { useState } from 'react';
import { MessageSquare, Send, X, AlertCircle } from 'lucide-react';

const FeedbackModal = ({ onClose, onSuccess }) => {
    const [tipo, setTipo] = useState('sugerencia');
    const [contenido, setContenido] = useState('');
    const [prioridad, setPrioridad] = useState('normal');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tipo, contenido, prioridad })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al enviar feedback');

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-tech-primary/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-tech-secondary w-full max-w-md rounded-2xl border border-tech-surface shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-tech-surface flex justify-between items-center bg-tech-primary/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-tech-cyan/10 rounded-lg text-tech-cyan">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-tech-text uppercase tracking-wider text-sm">Enviar Sugerencia</h3>
                            <p className="text-[10px] text-tech-muted font-mono uppercase tracking-widest">Mejora del Sistema ETA</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-tech-surface rounded-full text-tech-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-xs font-mono">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] text-tech-muted uppercase font-bold tracking-widest pl-1">Tipo de Feedback</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['sugerencia', 'error', 'pregunta'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTipo(t)}
                                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${tipo === t
                                            ? 'bg-tech-cyan text-white border-tech-cyan shadow-lg shadow-tech-cyan/20'
                                            : 'bg-tech-primary border-tech-surface text-tech-muted hover:border-tech-cyan/50'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-tech-muted uppercase font-bold tracking-widest pl-1">Gravedad / Prioridad</label>
                        <div className="flex gap-2">
                            {['baja', 'normal', 'alta'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPrioridad(p)}
                                    className={`flex-1 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all ${prioridad === p
                                            ? 'bg-tech-surface border-tech-cyan text-tech-cyan'
                                            : 'bg-tech-primary border-tech-surface text-tech-muted'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-tech-muted uppercase font-bold tracking-widest pl-1">Descripción de la Mejora</label>
                        <textarea
                            required
                            value={contenido}
                            onChange={(e) => setContenido(e.target.value)}
                            placeholder="Contanos qué podemos mejorar o qué falla encontraste..."
                            className="w-full h-32 bg-tech-primary border border-tech-surface rounded-xl p-3 text-xs text-tech-text placeholder-tech-muted/50 outline-none focus:ring-2 focus:ring-tech-cyan transition-all resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-tech-cyan text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 shadow-xl shadow-tech-cyan/10"
                    >
                        {loading ? 'Enviando...' : (
                            <>
                                <Send size={16} />
                                Enviar Mensaje
                            </>
                        )}
                    </button>

                    <p className="text-[9px] text-tech-muted text-center italic">
                        Tu feedback será revisado directamente por el administrador.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
