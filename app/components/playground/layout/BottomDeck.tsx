"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Terminal, Monitor, GripHorizontal, GripVertical } from "lucide-react";
import { TerminalOutput } from "@/components/playground/io/TerminalOutput";
import { NumberDisplay } from "@/components/playground/io/NumberDisplay";
import { LEDMatrix } from "@/components/playground/io/LEDMatrix";

import { LogEntry } from "@/lib/playground/io";

type Props = {
    logs: LogEntry[];
    consoleBuffer: string;
    onConsoleInput: (key: string) => void;
    sevenSegment: number;
    ledMatrix: number[];
};

export default function BottomDeck({
    logs,
    consoleBuffer,
    onConsoleInput,
    sevenSegment,
    ledMatrix,
}: Props) {
    const [isOpen, setIsOpen] = useState(true);

    // Layout State
    const [panelHeight, setPanelHeight] = useState(320); // Default height in px
    const [splitRatio, setSplitRatio] = useState(65);    // Left pane percentage (0-100)

    // Dragging State
    const [isDraggingV, setIsDraggingV] = useState(false); // Vertical (Height)
    const [isDraggingH, setIsDraggingH] = useState(false); // Horizontal (Split)

    const containerRef = useRef<HTMLDivElement>(null);

    // --- Constraints ---
    const MIN_HEIGHT = 200;
    const MAX_HEIGHT = 800; // Ideally relative to window height, but fixed safety cap works
    const MIN_SPLIT = 20;   // 20%
    const MAX_SPLIT = 80;   // 80%

    // --- Mouse Event Handlers ---

    // 1. VERTICAL RESIZE (Top Border)
    const startResizeV = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) return; // Can't resize if closed
        setIsDraggingV(true);
    }, [isOpen]);

    // 2. HORIZONTAL RESIZE (Middle Divider)
    const startResizeH = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingH(true);
    }, []);

    // Global Mouse Move / Up
    useEffect(() => {
        if (!isDraggingV && !isDraggingH) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingV) {
                // Resizing Height: 
                // Since panel is bottom-anchored, dragging UP (lower Y) increases height
                // We need to calculate based on window height or previous rect
                // Ideally: newHeight = window.innerHeight - e.clientY
                const newHeight = window.innerHeight - e.clientY;
                setPanelHeight(Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT));
            } else if (isDraggingH && containerRef.current) {
                // Resizing Split Position
                const rect = containerRef.current.getBoundingClientRect();
                const relativeX = e.clientX - rect.left;
                const newPct = (relativeX / rect.width) * 100;
                setSplitRatio(Math.min(Math.max(newPct, MIN_SPLIT), MAX_SPLIT));
            }
        };

        const handleMouseUp = () => {
            setIsDraggingV(false);
            setIsDraggingH(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        // Add User Select None to body to prevent text highlighting
        document.body.style.userSelect = "none";
        document.body.style.cursor = isDraggingV ? "row-resize" : isDraggingH ? "col-resize" : "default";

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isDraggingV, isDraggingH]);


    return (
        <div
            ref={containerRef}
            className={cn(
                "bg-white border-t border-gray-200 flex flex-col transition-[height] duration-75 ease-out z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative",
                // If dragging, disable transition for generic smoothness
                (isDraggingV || isDraggingH) ? "transition-none" : ""
            )}
            style={{
                height: isOpen ? `${panelHeight}px` : '36px'
            }}
        >
            {/* --- VERTICAL RESIZER HANDLER (Top Edge) --- */}
            {isOpen && (
                <div
                    className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-indigo-400/50 active:bg-indigo-600 z-50 transition-colors group"
                    onMouseDown={startResizeV}
                >
                    {/* Visual Indicator on Hover */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 rounded-full bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}

            {/* Header / Toggle */}
            <div
                className="h-9 shrink-0 flex items-center justify-between px-3 bg-gray-50 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-gray-500">
                    <Monitor size={15} />
                    <span className="text-xs font-bold uppercase tracking-wider">Input / Output Deck</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </div>
            </div>

            {/* Split Content Area */}
            {isOpen && (
                <div className="flex-1 flex overflow-hidden relative">

                    {/* LEFT PANE: Console */}
                    <div
                        className="flex flex-col min-w-0"
                        style={{ width: `${splitRatio}%` }}
                    >
                        {/* Optional sub-header for Console */}
                        <div className="h-8 flex items-center px-3 bg-white border-b border-gray-100 shrink-0">
                            <Terminal size={12} className="text-gray-400 mr-2" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Console</span>
                        </div>

                        <div className="flex-1 p-0 overflow-hidden relative">
                            {/* Wrapper to ensure TerminalOutput fits */}
                            <div className="absolute inset-0">
                                <TerminalOutput logs={logs} consoleBuffer={consoleBuffer} onInput={onConsoleInput} />
                            </div>
                        </div>
                    </div>

                    {/* --- HORIZONTAL RESIZER (Divider) --- */}
                    <div
                        className="w-1.5 bg-gray-100 border-l border-r border-gray-200 hover:bg-indigo-400 active:bg-indigo-600 cursor-col-resize z-40 relative shrink-0 transition-colors flex flex-col justify-center items-center group"
                        onMouseDown={startResizeH}
                    >
                        {/* Grip Icon */}
                        <div className="h-8 w-0.5 bg-gray-300 group-hover:bg-white rounded-full" />
                    </div>

                    {/* RIGHT PANE: Visual I/O */}
                    <div className="flex-1 flex flex-col bg-gray-50/50 min-w-0">
                        <div className="h-8 flex items-center px-3 bg-gray-50 border-b border-gray-100 shrink-0">
                            <Monitor size={12} className="text-gray-400 mr-2" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visual Devices</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-row flex-wrap items-center justify-center gap-6 content-center">

                            {/* Device 1: 7-Segment */}
                            <div className="flex flex-col items-center gap-2 scale-90 origin-center bg-white p-3 rounded-xl border border-gray-200/60 shadow-sm">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Port 1</span>
                                <NumberDisplay value={sevenSegment} />
                            </div>

                            {/* Device 2: LED Matrix */}
                            <div className="flex flex-col items-center gap-2 scale-90 origin-center bg-white p-3 rounded-xl border border-gray-200/60 shadow-sm">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Port 2+3</span>
                                <LEDMatrix rows={ledMatrix} />
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
