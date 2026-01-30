import React from 'react';

const Skeleton = ({ className, variant = 'rect' }) => {
    const baseStyles = "bg-tech-surface animate-pulse";
    const variantStyles = {
        rect: "rounded",
        circle: "rounded-full",
        text: "h-4 w-full rounded"
    };

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }}
        />
    );
};

export const DashboardSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-tech-secondary p-6 rounded border border-tech-surface h-32">
                    <div className="flex items-center gap-4">
                        <Skeleton variant="circle" className="w-12 h-12" />
                        <div className="space-y-2 flex-grow">
                            <Skeleton variant="text" className="w-24" />
                            <Skeleton variant="text" className="w-16 h-8" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="lg:col-span-2 bg-tech-secondary p-6 rounded border border-tech-surface h-64">
            <Skeleton variant="text" className="w-48 mb-6" />
            <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rect" className="h-4" />)}
            </div>
        </div>
        <div className="bg-tech-secondary p-6 rounded border border-tech-surface h-64 flex flex-col items-center justify-center">
            <Skeleton variant="circle" className="w-20 h-20 mb-4" />
            <Skeleton variant="text" className="w-32" />
        </div>
    </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
    <div className="w-full space-y-4 animate-pulse p-4">
        <div className="h-10 bg-tech-surface rounded w-full mb-6"></div>
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center border-b border-tech-surface pb-4">
                <Skeleton variant="rect" className="h-10 w-12" />
                <Skeleton variant="rect" className="h-10 flex-grow" />
                <Skeleton variant="rect" className="h-10 w-24" />
                <Skeleton variant="rect" className="h-10 w-24" />
            </div>
        ))}
    </div>
);

export default Skeleton;
