import React from 'react';
import { ArrowRight, Minus } from 'lucide-react';
import Table from './ui/Table';

/**
 * Smart Diff Viewer Component
 * Compares two objects and displays only the changed fields with visual highlighting
 */
const DiffViewer = ({ before, after, isMobile = false }) => {
    // Handle null or undefined values
    const beforeData = before || {};
    const afterData = after || {};

    // Get all unique keys from both objects
    const allKeys = [...new Set([...Object.keys(beforeData), ...Object.keys(afterData)])];

    // Identify changed, added, and removed fields
    const changes = allKeys.map(key => {
        const beforeValue = beforeData[key];
        const afterValue = afterData[key];
        const hasChanged = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
        const isNew = !(key in beforeData);
        const isRemoved = !(key in afterData);

        return {
            key,
            beforeValue,
            afterValue,
            hasChanged,
            isNew,
            isRemoved
        };
    }).filter(change => change.hasChanged);

    const formatValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    const getFieldLabel = (key) => {
        const labels = {
            nota: 'Nota',
            cuatrimestre: 'Cuatrimestre',
            estado: 'Estado',
            justificado: 'Justificado',
            observaciones: 'Observaciones',
            nombre: 'Nombre',
            email: 'Email',
            dni: 'DNI',
            rol: 'Rol',
            fecha: 'Fecha',
            tipo: 'Tipo',
            division_id: 'División',
            alumno_id: 'Alumno',
            asignacion_id: 'Asignación',
            contenido: 'Contenido del Mensaje',
            destinatario_id: 'ID Destinatario',
            destinatario_nombre: 'Destinatario',
            rol_destinatario: 'Rol Destinatario',
            remitente_id: 'ID Remitente'
        };
        return labels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    };

    if (changes.length === 0) {
        return (
            <div className="text-center py-6 text-tech-muted font-mono text-xs">
                <Minus size={24} className="mx-auto mb-2 opacity-30" />
                Sin cambios detectados
            </div>
        );
    }

    if (isMobile) {
        // Mobile: Stacked layout with clear before/after sections
        return (
            <div className="space-y-3">
                {changes.map(({ key, beforeValue, afterValue, isNew, isRemoved }) => (
                    <div key={key} className="bg-tech-primary/50 rounded-lg p-3 border border-tech-surface">
                        <div className="text-[10px] uppercase font-black text-tech-muted tracking-widest mb-2">
                            {getFieldLabel(key)}
                        </div>

                        {!isNew && (
                            <div className="mb-2">
                                <div className="text-[9px] text-tech-danger/70 uppercase tracking-wide mb-1">
                                    Anterior:
                                </div>
                                <div className="text-sm font-mono text-tech-danger bg-tech-danger/5 px-2 py-1 rounded border border-tech-danger/20 whitespace-pre-wrap">
                                    {formatValue(beforeValue)}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-center my-1">
                            <ArrowRight size={14} className="text-tech-cyan" />
                        </div>

                        {!isRemoved && (
                            <div>
                                <div className="text-[9px] text-tech-success/70 uppercase tracking-wide mb-1">
                                    {isNew ? 'Nuevo:' : 'Actual:'}
                                </div>
                                <div className="text-sm font-mono text-tech-success bg-tech-success/5 px-2 py-1 rounded border border-tech-success/20 whitespace-pre-wrap">
                                    {formatValue(afterValue)}
                                </div>
                            </div>
                        )}

                        {isNew && (
                            <div className="mt-2 text-center">
                                <span className="text-[9px] px-2 py-0.5 bg-tech-success/20 text-tech-success rounded-full uppercase font-black">
                                    Campo Nuevo
                                </span>
                            </div>
                        )}

                        {isRemoved && (
                            <div className="mt-2 text-center">
                                <span className="text-[9px] px-2 py-0.5 bg-tech-danger/20 text-tech-danger rounded-full uppercase font-black">
                                    Campo Eliminado
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // Desktop: Side-by-side comparison table
    return (
        <Table
            columns={[
                { key: 'key', label: 'Campo', mono: true, render: (value, row) => (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-tech-text">
                            {getFieldLabel(value)}
                        </span>
                        {row.isNew && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-tech-success/20 text-tech-success rounded uppercase font-black">
                                Nuevo
                            </span>
                        )}
                        {row.isRemoved && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-tech-danger/20 text-tech-danger rounded uppercase font-black">
                                Eliminado
                            </span>
                        )}
                    </div>
                )},
                { key: 'beforeValue', label: 'Valor Anterior', mono: true, render: (value, row) => (
                    !row.isNew && (
                        <div className="font-mono text-tech-danger bg-tech-danger/5 px-3 py-1.5 rounded border border-tech-danger/20 whitespace-pre-wrap">
                            {formatValue(value)}
                        </div>
                    )
                )},
                { key: '_arrow', label: '', align: 'center', render: () => (
                    <ArrowRight size={16} className="text-tech-cyan mx-auto" />
                )},
                { key: 'afterValue', label: 'Valor Nuevo', mono: true, render: (value, row) => (
                    !row.isRemoved && (
                        <div className="font-mono text-tech-success bg-tech-success/5 px-3 py-1.5 rounded border border-tech-success/20 whitespace-pre-wrap">
                            {formatValue(value)}
                        </div>
                    )
                )},
            ]}
            data={changes}
        />
    );
};

export default DiffViewer;
