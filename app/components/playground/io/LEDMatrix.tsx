import React from 'react';

type LEDMatrixProps = {
    rows: Uint8Array | number[];
};

export function LEDMatrix({ rows }: LEDMatrixProps) {
    // Generate 8x8 grid
    const grid = Array.from({ length: 8 }, (_, rowIndex) => {
        const rowValue = rows[rowIndex] || 0;
        return Array.from({ length: 8 }, (_, colIndex) => {
            // Check bit at colIndex (7 - colIndex to match MSB-first visual usually, or LSB? Let's assume bit 0 is rightmost)
            // If bit 0 is rightmost (column 7), bit 7 is leftmost (column 0).
            const bit = (rowValue >> (7 - colIndex)) & 1;
            return bit === 1;
        });
    });

    return (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-4 w-fit">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
                LED Matrix (Port 2+3)
            </h3>
            <div className="grid grid-cols-8 gap-1.5">
                {grid.map((row, r) =>
                    row.map((active, c) => (
                        <div
                            key={`${r}-${c}`}
                            className={`w-3 h-3 rounded-full transition-colors duration-200 ${active ? 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]' : 'bg-slate-100'
                                }`}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
