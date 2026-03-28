
import React, { useState } from 'react';
import { HiArrowUp, HiArrowDown, HiArrowLeft, HiArrowRight } from 'react-icons/hi';
import { cn } from '@/lib/utils';

type GamepadProps = {
    onStateChange: (mask: number) => void;
};

// Bit mappings
const MASKS = {
    UP: 1,      // Bit 0
    DOWN: 2,    // Bit 1
    LEFT: 4,    // Bit 2
    RIGHT: 8,   // Bit 3
    A: 16,      // Bit 4
    B: 32,      // Bit 5
};

export function Gamepad({ onStateChange }: GamepadProps) {
    const [currentMask, setCurrentMask] = useState(0);

    const handlePress = (mask: number) => {
        const newMask = currentMask | mask;
        setCurrentMask(newMask);
        onStateChange(newMask);
    };

    const handleRelease = (mask: number) => {
        const newMask = currentMask & ~mask;
        setCurrentMask(newMask);
        onStateChange(newMask);
    };

    const Button = ({ mask, className, children }: { mask: number; className?: string; children: React.ReactNode }) => (
        <button
            onMouseDown={() => handlePress(mask)}
            onMouseUp={() => handleRelease(mask)}
            onMouseLeave={() => handleRelease(mask)}
            onTouchStart={(e) => { e.preventDefault(); handlePress(mask); }}
            onTouchEnd={(e) => { e.preventDefault(); handleRelease(mask); }}
            className={cn(
                "flex items-center justify-center transition-all active:scale-95 select-none",
                className
            )}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-slate-50 rounded-lg p-4 flex flex-col items-center justify-center border border-slate-100 gap-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider">
                Gamepad (Port 4)
            </span>
            <div className="flex items-center gap-8">
                {/* D-Pad */}
                <div className="grid grid-cols-3 gap-1 bg-slate-200 p-2 rounded-full shadow-inner">
                    <div />
                    <Button mask={MASKS.UP} className="w-10 h-10 bg-slate-700 rounded-t-md hover:bg-slate-600 text-white">
                        <HiArrowUp />
                    </Button>
                    <div />

                    <Button mask={MASKS.LEFT} className="w-10 h-10 bg-slate-700 rounded-l-md hover:bg-slate-600 text-white">
                        <HiArrowLeft />
                    </Button>
                    <div className="w-10 h-10 bg-slate-700" /> {/* Center */}
                    <Button mask={MASKS.RIGHT} className="w-10 h-10 bg-slate-700 rounded-r-md hover:bg-slate-600 text-white">
                        <HiArrowRight />
                    </Button>

                    <div />
                    <Button mask={MASKS.DOWN} className="w-10 h-10 bg-slate-700 rounded-b-md hover:bg-slate-600 text-white">
                        <HiArrowDown />
                    </Button>
                    <div />
                </div>

                {/* A B Buttons */}
                <div className="flex gap-4 rotate-12 items-end">
                    <div className="flex flex-col items-center gap-1">
                        <Button mask={MASKS.B} className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md border-b-4 border-red-700 active:border-b-0 active:translate-y-1">
                            <span className="font-bold">B</span>
                        </Button>
                    </div>
                    <div className="flex flex-col items-center gap-1 mt-4">
                        <Button mask={MASKS.A} className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md border-b-4 border-green-700 active:border-b-0 active:translate-y-1">
                            <span className="font-bold">A</span>
                        </Button>
                    </div>
                </div>
            </div>
            {/* Debug Display */}
            <div className="font-mono text-xs text-slate-400">
                MASK: {currentMask.toString(2).padStart(8, '0')}
            </div>
        </div>
    );
}
