import { useState } from 'react';
import { MessageSquare, Send, AlertCircle, Lightbulb, Bug, HelpCircle, ArrowDown, Minus, AlertTriangle } from 'lucide-react';
import { getApiEndpoint } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Tabs from './ui/Tabs';

const FeedbackModal = ({ onClose, onSuccess }) => {
    const { session } = useAuth();
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
            const token = session?.access_token;
            const res = await fetch(getApiEndpoint('/feedback'), {
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

    const tipoTabs = [
        { value: 'sugerencia', label: 'Sugerencia', icon: <Lightbulb size={16} /> },
        { value: 'error', label: 'Error', icon: <Bug size={16} /> },
        { value: 'pregunta', label: 'Pregunta', icon: <HelpCircle size={16} /> },
    ];

    const prioridadTabs = [
        { value: 'baja', label: 'Baja', icon: <ArrowDown size={16} /> },
        { value: 'normal', label: 'Normal', icon: <Minus size={16} /> },
        { value: 'alta', label: 'Alta', icon: <AlertTriangle size={16} /> },
    ];

    return (
        <Modal open={true} onClose={onClose} size="sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-tech-cyan/10 rounded-lg text-tech-cyan">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <h3 className="title !text-sm">Enviar Sugerencia</h3>
                    <p className="mono text-tech-muted">Mejora del Sistema CGB</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 bg-tech-danger/10 border border-tech-danger/20 rounded-lg flex items-center gap-2 text-tech-danger text-xs font-mono">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <p className="label text-tech-muted pl-1">Tipo de Feedback</p>
                    <Tabs tabs={tipoTabs} activeTab={tipo} onChange={setTipo} />
                </div>

                <div className="space-y-2">
                    <p className="label text-tech-muted pl-1">Gravedad / Prioridad</p>
                    <Tabs tabs={prioridadTabs} activeTab={prioridad} onChange={setPrioridad} />
                </div>

                <div className="space-y-2">
                    <label htmlFor="feedback-descripcion" className="label text-tech-muted pl-1">Descripción de la Mejora</label>
                    <textarea
                        id="feedback-descripcion"
                        required
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                        placeholder="Contanos qué podemos mejorar o qué falla encontraste..."
                        className="w-full h-32 bg-tech-primary border border-tech-surface rounded-xl p-3 text-xs text-tech-text placeholder-tech-muted/50 outline-none focus:ring-2 focus:ring-tech-cyan transition-all resize-none"
                    />
                </div>

                <Button type="submit" disabled={loading} className="w-full" shine>
                    {loading ? 'Enviando...' : <><Send size={16} />Enviar Mensaje</>}
                </Button>

                <p className="mono text-tech-muted text-center italic text-[9px]">
                    Tu feedback será revisado directamente por el administrador.
                </p>
            </form>
        </Modal>
    );
};

export default FeedbackModal;
