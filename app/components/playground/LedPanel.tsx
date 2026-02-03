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
        // Industrial Container matched with NumberDisplay
        <div className="bg-neutral-900 rounded-lg p-3 flex flex-col items-center justify-center border-4 border-neutral-700 shadow-xl min-w-[200px] relative select-none">
            {/* Mounting Holes */}
            <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 shadow-inner" />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 shadow-inner" />
            <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 shadow-inner" />
            <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 shadow-inner" />

            {/* Label */}
            <span className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase mb-1.5">
                LED PANEL
            </span>

            {/* Screen Container */}
            <div className="bg-black rounded border-2 border-neutral-800 shadow-[inset_0_2px_8px_rgba(0,0,0,1)] px-3 py-4 flex gap-2 relative overflow-hidden">
                {/* Screen Reflection (Glass effect) */}
                <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10" />

                {/* LED Row */}
                {bits.map((bitPosition) => {
                    const isBitSet = ((displayValue >> bitPosition) & 1) === 1;

                    return (
                        <div key={bitPosition} className="flex flex-col items-center gap-2">
                            {/* Realistic 3D Diode */}
                            <div
                                className={`relative w-6 h-8 rounded-t-[10px] rounded-b-[4px] border-b-2 transition-all duration-200 ${isBitSet
                                    ? 'bg-gradient-to-b from-red-400 to-red-600 border-red-800 shadow-[0_0_15px_4px_rgba(239,68,68,0.6),inset_0_-2px_4px_rgba(0,0,0,0.3)] scale-105 saturate-150'
                                    : 'bg-gradient-to-b from-red-950/40 to-red-900/20 border-red-950/50 shadow-inner opacity-60'
                                    }`}
                                title={`Bit ${bitPosition}: ${isBitSet ? '1' : '0'}`}
                            >
                                {/* 1. Inner Filament (The Anode/Cathode structure inside) */}
                                <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-4 border-t-2 rounded-[1px] ${isBitSet ? 'border-red-900/40 bg-red-800/20' : 'border-neutral-800/40 bg-black/20'}`} />

                                {/* 2. Core Glow (Center hot spot) */}
                                {isBitSet && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white blur-[3px] rounded-full opacity-80" />}

                                {/* 3. Glass Highlights (The shiny bulb surface) */}
                                {/* Top-Right Glint */}
                                <div className="absolute top-1 right-1 w-2 h-3 bg-gradient-to-b from-white to-transparent opacity-30 rounded-full skew-x-[-10deg]" />
                                {/* Bottom Rim Light */}
                                <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-t from-black/40 to-transparent rounded-b-[4px]" />
                            </div>
                            {/* Bit Label */}
                            <span className="text-[14px] text-neutral-500 font-mono">
                                {bitPosition}
                            </span>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default LedPanel;
