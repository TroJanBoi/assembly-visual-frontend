import React, { ReactNode } from 'react';

type IOContainerProps = {
    children: ReactNode;
};

export function IOContainer({ children }: IOContainerProps) {
    return (
        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-500 mb-4 px-1">
                Logic Probe & I/O
            </h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {children}
            </div>
        </div>
    );
}
