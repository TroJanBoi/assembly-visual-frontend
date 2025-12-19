import React, { useEffect, useRef } from 'react';

type TerminalOutputProps = {
    content: string;
    onInput?: (key: string) => void;
};

export function TerminalOutput({ content, onInput }: TerminalOutputProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when content changes
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [content]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // 1. CRITICAL: Stop global hotkeys (like Space to Run)
        e.stopPropagation();

        if (!onInput) return;

        // Debug log
        console.log("Terminal Key:", e.key);

        // 2. Prevent default scrolling/browser actions
        if ([' ', 'ArrowUp', 'ArrowDown', 'Backspace', 'Enter'].includes(e.key) || e.code === 'Space') {
            e.preventDefault();
        }

        // 3. Send raw key to IO Handler
        onInput(e.key);
    };

    return (
        <div
            className="nodrag bg-slate-900 rounded-lg border border-slate-800 flex flex-col h-48 w-full overflow-hidden shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            <div className="bg-slate-800 px-3 py-1 flex items-center justify-between border-b border-slate-700">
                <span className="text-xs text-slate-400 font-mono">Terminal (Port 0) - Click to Focus</span>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                </div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-sm leading-relaxed cursor-text" onClick={(e) => e.currentTarget.parentElement?.focus()}>
                <span className="text-emerald-400 whitespace-pre-wrap break-words">
                    {content || <span className="text-slate-600 italic">No output...</span>}
                </span>
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
