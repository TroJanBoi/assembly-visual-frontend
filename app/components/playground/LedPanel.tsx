import React, { useEffect } from 'react';

interface LedPanelProps {
    value: number;
}

const LedPanel: React.FC<LedPanelProps> = ({ value }) => {
    // Logic: 8-bit Unsigned Integer (0-255)
    // No memory lookups. Pure I/O.
    const displayValue = value & 0xFF;

    useEffect(() => {
        // console.log(`[HW: LedPanel] Val: ${displayValue} (0x${displayValue.toString(16).toUpperCase().padStart(2, '0')})`);
    }, [displayValue]);

    // Programmatically generate the LEDs by iterating from Bit 7 (MSB) down to Bit 0 (LSB).
    const bits = Array.from({ length: 8 }, (_, i) => 7 - i);

    return (
        // Industrial Container with Inner Shadow/Bezel effect
        <div className="flex flex-col p-4 bg-slate-800 border-2 border-slate-700 rounded-lg w-fit shadow-xl relative overflow-hidden group">

            {/* Subtle top gloss/highlight for 'embedded' feel */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-slate-600 opacity-50"></div>

            {/* Title/Header - Optional but adds to the panel look */}
            <div className="mb-3 flex justify-between items-center border-b border-slate-700/50 pb-1">
                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                    LED Panel
                </span>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                </div>
            </div>

            {/* LED Row */}
            <div className="flex gap-3 mb-2 px-1 relative z-10">
                {bits.map((bitPosition) => {

                    const isBitSet = ((displayValue >> bitPosition) & 1) === 1;

                    return (
                        <div key={bitPosition} className="flex flex-col items-center gap-1.5">

                            <div
                                className={`w-6 h-8 rounded-t-full border-2 transition-all duration-200 ${isBitSet
                                    ? 'bg-red-500 border-red-300 shadow-[0_0_20px_5px_rgba(239,68,68,0.8)] scale-110'
                                    : 'bg-gray-800/40 border-gray-600 opacity-60'
                                    }`}
                                title={`Bit ${bitPosition}: ${isBitSet ? '1' : '0'}`}
                            />

                            {/* Bit Label */}
                            <span className="text-[9px] text-slate-500 font-mono select-none tracking-tight">
                                D{bitPosition}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-700/60 bg-slate-900/30 -mx-4 px-4 pb-0">
                <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Port</span>
                    <span className="text-xs font-mono text-slate-400">
                        5
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Dec</span>
                        <span className="text-xs text-slate-200 font-mono">
                            {displayValue}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Hex</span>
                        <span className="text-xs text-emerald-400 font-mono">
                            0x{displayValue.toString(16).toUpperCase().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LedPanel;
