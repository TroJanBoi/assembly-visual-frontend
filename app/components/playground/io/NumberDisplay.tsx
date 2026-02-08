import React, { useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

type NumberDisplayProps = {
    value: number;
};

// --- 1. Segment Logic (The Brain) ---
// Standard 7-Segment Map (0-9, A-F)
// Segments: a(top), b(tr), c(br), d(btm), e(bl), f(tl), g(mid)
const SEGMENT_MAP: Record<string, Record<string, boolean>> = {
    '0': { a: true, b: true, c: true, d: true, e: true, f: true, g: false },
    '1': { a: false, b: true, c: true, d: false, e: false, f: false, g: false },
    '2': { a: true, b: true, c: false, d: true, e: true, f: false, g: true },
    '3': { a: true, b: true, c: true, d: true, e: false, f: false, g: true },
    '4': { a: false, b: true, c: true, d: false, e: false, f: true, g: true },
    '5': { a: true, b: false, c: true, d: true, e: false, f: true, g: true },
    '6': { a: true, b: false, c: true, d: true, e: true, f: true, g: true },
    '7': { a: true, b: true, c: true, d: false, e: false, f: false, g: false },
    '8': { a: true, b: true, c: true, d: true, e: true, f: true, g: true },
    '9': { a: true, b: true, c: true, d: true, e: false, f: true, g: true },
    'A': { a: true, b: true, c: true, d: false, e: true, f: true, g: true },
    'B': { a: false, b: false, c: true, d: true, e: true, f: true, g: true }, // b (lower)
    'C': { a: true, b: false, c: false, d: true, e: true, f: true, g: false },
    'D': { a: false, b: true, c: true, d: true, e: true, f: false, g: true }, // d (lower)
    'E': { a: true, b: false, c: false, d: true, e: true, f: true, g: true },
    'F': { a: true, b: false, c: false, d: false, e: true, f: true, g: true },
};

// --- 2. SVG Sub-Component (The Hardware) ---
const SevenSegmentDigit = ({ char }: { char: string }) => {
    // Decode char to segments
    const active = SEGMENT_MAP[char.toUpperCase()] || SEGMENT_MAP['0']; // Default to 0 if invalid


    const poly = {
        a: "12,2 40,2 36,10 8,10",
        b: "41,3 49,3 43,38 35,38",
        c: "34,42 42,42 34,77 26,77",
        d: "5,78 33,78 27,70 -1,70",
        e: "-2,77 6,77 12,42 4,42",
        f: "3,38 11,38 17,3 9,3",
        g: "6,40 32,40 36,34 10,34" // Center bar
    };

    return (
        <svg viewBox="0 0 50 80" width="40" height="64" className="overflow-visible">
            <g transform="skewX(-5)">
                {Object.entries(poly).map(([key, points]) => {
                    const isActive = active[key as keyof typeof active];
                    return (
                        <polygon
                            key={key}
                            points={points}
                            fill={isActive ? "#ff0000" : "#320000"}
                            className={cn(
                                "transition-colors duration-75",
                                isActive && "sepia-0 drop-shadow-[0_0_6px_rgba(255,0,0,0.8)]"
                            )}
                        />
                    );
                })}
            </g>
        </svg>
    );
};

export function NumberDisplay({ value }: NumberDisplayProps) {
    // Logic: 8-bit Hex
    // Clamp to 8-bit unsigned for display (masking)
    const safeValue = value & 0xFF;
    const hexString = safeValue.toString(16).toUpperCase().padStart(2, '0');
    const [digit1, digit2] = hexString.split('');

    useEffect(() => {
        console.log(`[HW: 7-Seg] Val: ${safeValue} (0x${hexString})`);
    }, [safeValue, hexString]);

    return (
        <div className="bg-neutral-900 rounded-lg p-3 flex flex-col items-center justify-center border-4 border-neutral-700 shadow-xl min-w-[120px] relative select-none">
            {/* Mounting Holes */}
            <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 shadow-inner" />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 shadow-inner" />
            <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 shadow-inner" />
            <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neutral-800 shadow-inner" />

            {/* Label */}
            <span className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase mb-1.5">
                HEX DISPLAY
            </span>

            {/* Screen Container */}
            <div className="bg-black rounded border-2 border-neutral-800 shadow-[inset_0_2px_8px_rgba(0,0,0,1)] px-4 py-2 flex gap-3 relative overflow-hidden">
                {/* Screen Reflection (Glass effect) */}
                <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10" />

                <SevenSegmentDigit char={digit1} />
                <SevenSegmentDigit char={digit2} />
            </div>
        </div>
    );
}
