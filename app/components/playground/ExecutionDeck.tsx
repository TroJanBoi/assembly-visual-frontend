import React from "react";
import { Play, Pause, FastForward, RotateCcw, Zap, CheckCircle2, Loader2, Bug, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Discrete speed steps in Hz
const SPEED_STEPS = [1, 2, 5, 10, 20, 50, 100];

export type ExecutionMode = "instant" | "debug" | "test";

interface ExecutionDeckProps {
    mode: ExecutionMode;
    isPlaying: boolean;
    isRunning: boolean; // General "active" state
    speed: number;
    setSpeed: (val: number) => void;
    onRunInstant: () => void;
    onStep: () => void;
    onPause: () => void;
    onPlay: () => void;
    onReset: () => void;
    onRunTests: () => void;
    testStatus: string | null;
    logsOpen?: boolean;
    embedded?: boolean;
    onStepBack?: () => void;
    canStepBack?: boolean;
}

export function ExecutionDeck({
    mode,
    isPlaying,
    isRunning,
    speed,
    setSpeed,
    onRunInstant,
    onStep,
    onPause,
    onPlay,
    onReset,
    onRunTests,
    testStatus,
    embedded = false,
    onStepBack,
    canStepBack = false,
}: ExecutionDeckProps) {
    const baseClasses = embedded
        ? "flex items-center gap-3 px-2 py-0" // Embedded: specific styling for header
        : cn(
            "absolute bottom-6 left-1/2 -translate-x-1/2 z-[100]",
            "flex items-center gap-4 px-6 py-3",
            "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md",
            "rounded-full shadow-2xl border border-slate-200 dark:border-slate-700",
            "transition-all duration-300 ease-out"
        );

    // Find the closest step index for the current speed
    // This handles cases where 'speed' might be a custom value not in the array
    const currentStepIndex = SPEED_STEPS.reduce((prev, curr, index) =>
        Math.abs(curr - speed) < Math.abs(SPEED_STEPS[prev] - speed) ? index : prev, 0);

    const handleSpeedDecrease = () => {
        if (currentStepIndex > 0) {
            setSpeed(SPEED_STEPS[currentStepIndex - 1]);
        }
    };

    const handleSpeedIncrease = () => {
        if (currentStepIndex < SPEED_STEPS.length - 1) {
            setSpeed(SPEED_STEPS[currentStepIndex + 1]);
        }
    };

    return (
        <div className={baseClasses}>

            {/* --- MODE: INSTANT RUN --- */}
            {mode === "instant" && (
                <>
                    {!embedded && (
                        <div className="flex flex-col mr-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instant Run</span>
                        </div>
                    )}
                    {!embedded && <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />}

                    <button
                        onClick={onReset}
                        className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition"
                        title="Reset"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onRunInstant}
                        className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 text-xs"
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Execute</span>
                    </button>
                </>
            )}

            {/* --- MODE: DEBUGGER --- */}
            {mode === "debug" && (
                <>
                    {!embedded && (
                        <div className="flex flex-col mr-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Bug className="w-3 h-3" /> Debugger
                            </span>
                        </div>
                    )}
                    {!embedded && <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />}

                    <button
                        onClick={onReset}
                        className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition"
                        title="Reset"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
                        {/* STEP BACK */}
                        <button
                            onClick={onStepBack}
                            disabled={!canStepBack || isPlaying}
                            className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-600 disabled:opacity-30 transition"
                            title="Step Back"
                        >
                            <FastForward className="w-4 h-4 rotate-180" />
                        </button>

                        <button
                            onClick={isPlaying ? onPause : onPlay}
                            className={cn(
                                "p-1.5 rounded-full transition-all shadow-sm mx-1",
                                isPlaying
                                    ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                    : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                            )}
                        >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <button
                            onClick={onStep}
                            disabled={isPlaying}
                            className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-600 disabled:opacity-50 transition"
                            title="Step Forward"
                        >
                            <FastForward className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Speed Control (Step-based) */}
                    <div className="flex items-center gap-1 ml-2 bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 px-2">
                        <button
                            onClick={handleSpeedDecrease}
                            disabled={currentStepIndex === 0}
                            className="p-1 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 transition"
                            title="Decrease Speed"
                        >
                            <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 w-10 text-center select-none">
                            {speed}Hz
                        </span>

                        <button
                            onClick={handleSpeedIncrease}
                            disabled={currentStepIndex === SPEED_STEPS.length - 1}
                            className="p-1 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 transition"
                            title="Increase Speed"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </>
            )}

            {/* --- MODE: TEST SUITE --- */}
            {mode === "test" && (
                <>
                    <div className="flex flex-col mr-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Test Suite</span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                    {testStatus === "running" ? (
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 text-slate-600 rounded-full font-medium">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            <span>Running Tests...</span>
                        </div>
                    ) : testStatus ? (
                        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-bold shadow-sm">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{testStatus}</span>
                        </div>
                    ) : (
                        <button
                            onClick={onRunTests}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-200/50 transition-all hover:scale-105 active:scale-95"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            <span>Run All Tests</span>
                        </button>
                    )}

                    {testStatus && testStatus !== "running" && (
                        <button
                            onClick={onReset} // Using reset to clear status for now
                            className="ml-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                            title="Reset Tests"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    )}
                </>
            )}

        </div>
    );
}
