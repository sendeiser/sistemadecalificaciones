import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanError, onClose }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner('reader', {
            qrbox: {
                width: 250,
                height: 250,
            },
            fps: 5,
        });

        scanner.render(onScanSuccess, onScanError);

        return () => {
            scanner.clear().catch(error => {
                console.error('Failed to clear html5QrcodeScanner. ', error);
            });
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="bg-tech-secondary border border-tech-surface rounded-xl p-6 w-full max-w-md relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-tech-muted hover:text-white transition-colors"
                >
                    ×
                </button>
                <h2 className="text-xl font-bold text-tech-cyan mb-4 uppercase tracking-wider text-center flex items-center justify-center gap-2">
                    Escáner de Asistencia
                </h2>
                <div id="reader" className="overflow-hidden rounded-lg border border-tech-surface bg-black"></div>
                <p className="text-xs text-tech-muted mt-4 text-center font-mono">
                    Apunta la cámara al código QR del estudiante para registrar su presente.
                </p>
            </div>
        </div>
    );
};

export default QRScanner;
