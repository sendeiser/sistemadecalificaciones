import { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const CSVImporter = ({ endpoint, onComplete, requiredColumns = [] }) => {
    const { session } = useAuth();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResults(null);
            setError(null);
            parsePreview(selectedFile);
        }
    };

    const parsePreview = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());

            // Basic validation of headers
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            if (missingColumns.length > 0) {
                setError(`El archivo CSV falta las siguientes columnas requeridas: ${missingColumns.join(', ')}`);
                setFile(null); // Reset file
                return;
            }

            // Preview first 5 rows
            const previewData = lines.slice(1, 6).map(line => {
                const values = line.split(',');
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index]?.trim();
                    return obj;
                }, {});
            }).filter(row => Object.values(row).some(val => val)); // Filter empty rows

            setPreview(previewData);
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setResults(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Using fetch to hit our Express backend (via VITE_API_URL or relative path if proxied)
            // Assuming endpoint is full URL or relative '/api/...'
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error uploading file');
            }

            setResults(data);
            if (onComplete) onComplete(data);
        } catch (err) {
            console.error('Upload Error:', err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreview([]);
        setResults(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-tech-secondary p-6 rounded border border-tech-surface">
            {!results ? (
                <>
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-tech-cyan bg-tech-cyan/5' : 'border-tech-surface hover:border-tech-cyan/50'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files[0]) {
                                fileInputRef.current.files = e.dataTransfer.files;
                                handleFileChange({ target: { files: e.dataTransfer.files } });
                            }
                        }}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileText size={48} className="text-tech-cyan" />
                                <span className="font-bold text-lg text-white">{file.name}</span>
                                <span className="text-tech-muted text-sm">{(file.size / 1024).toFixed(2)} KB</span>
                                <button onClick={reset} className="text-tech-danger hover:underline text-sm mt-2">
                                    Cambiar archivo
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                <Upload size={48} className="text-tech-muted" />
                                <span className="font-bold text-lg text-tech-muted">Haz clic o arrastra un archivo CSV</span>
                                <span className="text-tech-muted text-sm font-mono">Columnas requeridas: {requiredColumns.join(', ')}</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-tech-danger/10 border border-tech-danger text-tech-danger rounded flex items-center gap-3">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {preview.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-bold text-tech-muted uppercase tracking-wider mb-2">Vista Previa (Primeras 5 filas)</h4>
                            <div className="overflow-x-auto border border-tech-surface rounded">
                                <table className="w-full text-sm font-mono">
                                    <thead className="bg-tech-primary text-tech-muted">
                                        <tr>
                                            {Object.keys(preview[0]).map(header => (
                                                <th key={header} className="p-2 text-left border-r border-tech-surface last:border-0">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i} className="border-t border-tech-surface">
                                                {Object.values(row).map((val, j) => (
                                                    <td key={j} className="p-2 text-tech-muted border-r border-tech-surface last:border-0">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="w-full mt-6 py-3 bg-tech-cyan hover:bg-sky-600 text-white rounded font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Confirmar Importación
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="inline-block p-4 rounded-full bg-tech-success/10 text-tech-success mb-4">
                            <Check size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Proceso Completado</h3>
                        <p className="text-tech-muted">El archivo ha sido procesado.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-tech-primary p-4 rounded border border-tech-success/30">
                            <span className="block text-3xl font-bold text-tech-success">{results.success.length}</span>
                            <span className="text-tech-muted text-sm uppercase">Importados con éxito</span>
                        </div>
                        <div className="bg-tech-primary p-4 rounded border border-tech-danger/30">
                            <span className="block text-3xl font-bold text-tech-danger">{results.errors.length}</span>
                            <span className="text-tech-muted text-sm uppercase">Errores</span>
                        </div>
                    </div>

                    {results.errors.length > 0 && (
                        <div className="bg-tech-primary border border-tech-danger/30 rounded max-h-60 overflow-y-auto p-4 text-sm font-mono text-tech-danger">
                            <h4 className="font-bold mb-2">Detalle de Errores:</h4>
                            <ul className="space-y-1">
                                {results.errors.map((err, i) => (
                                    <li key={i}>
                                        <span className="font-bold">{err.student?.nombre || 'Registro desconocido'}:</span> {err.error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={reset}
                        className="w-full py-3 bg-tech-surface hover:bg-slate-600 text-white rounded font-bold uppercase tracking-wider transition-colors flex justify-center items-center gap-2"
                    >
                        <RefreshCw size={20} />
                        Importar Otro Archivo
                    </button>
                </div>
            )}
        </div>
    );
};

export default CSVImporter;
