import React, { useEffect, useRef, useState, useMemo } from 'react';
import { LogEntry } from '@/lib/playground/io';
import { cn } from '@/lib/utils';
import { Terminal as TerminalIcon, Search } from 'lucide-react';

type TerminalOutputProps = {
    logs: LogEntry[];
    consoleBuffer?: string;
    onInput?: (key: string) => void;
    variant?: 'input' | 'filter'; // Default: 'input' if onInput provided, else 'filter'
};

export function TerminalOutput({ logs, consoleBuffer, onInput, variant = 'filter' }: TerminalOutputProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState("");

    // Auto-scroll to bottom when logs or buffer changes
    useEffect(() => {
        // Only auto-scroll if NOT filtering (or if new logs arrive and we are at bottom? simplistic for now)
        // Actually, if filtering, we might want to stay put or scroll top? 
        // Let's keep auto-scroll behavior for now as it's a "tail -f" style view usually.
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, consoleBuffer]);

    // Handle Input (Enter key)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation(); // Stop global hotkeys

        if (variant === 'input' && e.key === 'Enter') {
            e.preventDefault();
            if (!onInput) return;

            // Send each char to the buffer
            const text = inputValue;
            for (const char of text) {
                onInput(char);
            }
            onInput('Enter'); // Commit line
            setInputValue("");
        }
    };

    // Keep focus on input if user clicks anywhere in terminal
    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    const getInstructionColor = (content: string) => {
        const upper = content.toUpperCase();
        // 1. System & Control
        if (/\b(START|HLT|NOP)\b/.test(upper)) return "text-green-400";
        // 2. I/O
        if (/\b(IN|OUT)\b/.test(upper)) return "text-slate-400";
        // 3. Data Movement
        if (/\b(MOV|LOAD|STORE|PUSH|POP)\b/.test(upper)) return "text-sky-400";
        // 4. MATH
        if (/\b(ADD|SUB|INC|DEC|MUL|DIV|CMP)\b/.test(upper)) return "text-orange-400";
        // 5. Control Flow
        if (/\b(JMP|JZ|JNZ|JC|JNC|JN|CALL|RET)\b/.test(upper)) return "text-indigo-400";
        // 6. Logic Gates
        if (/\b(AND|OR|XOR|NOT|SHL|SHR|NAND|NOR|XNOR)\b/.test(upper)) return "text-pink-400";

        return null;
    };

    // Filter Logic
    const filteredLogs = useMemo(() => {
        if (variant === 'input' || !inputValue) return logs;
        const lowerSearch = inputValue.toLowerCase();
        return logs.filter(log =>
            log.content.toLowerCase().includes(lowerSearch) ||
            log.type.toLowerCase().includes(lowerSearch)
        );
    }, [logs, inputValue, variant]);

    return (
        <div
            className="group flex flex-col h-full w-full bg-[#1e1e1e] border border-gray-800 rounded-none font-mono text-sm overflow-hidden"
            onClick={handleContainerClick}
        >
            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {/* Intro Message */}
                <div className="text-gray-500 mb-4 text-xs">
                    BLYLAB Assembly Visualizer v1.0
                </div>

                {filteredLogs.map((log) => (
                    <div key={log.id} className="break-words leading-tight">
                        <span className="text-gray-600 text-[10px] mr-3 select-none">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                        </span>

                        {log.type === 'OUTPUT' && (
                            <>
                                <span className="text-green-500 font-bold mr-2 select-none">&gt;&gt;</span>
                                <span className="text-green-400">{log.content}</span>
                            </>
                        )}

                        {log.type === 'IO_TEXT' && (
                            <>
                                <span className="text-cyan-500 font-bold mr-2 select-none">[TXT]</span>
                                <span className="text-cyan-300">{log.content}</span>
                            </>
                        )}

                        {log.type === 'IO_VISUAL' && (
                            <>
                                <span className="text-fuchsia-500 font-bold mr-2 select-none">[VIS]</span>
                                <span className="text-fuchsia-400">{log.content}</span>
                            </>
                        )}

                        {log.type === 'CPU_INTERNAL' && (
                            <>
                                <span className="text-emerald-500 font-bold mr-2 select-none">[CPU]</span>
                                <span className={cn("font-normal", getInstructionColor(log.content) || "text-emerald-400/80")}>
                                    {log.content}
                                </span>
                            </>
                        )}

                        {log.type === 'INPUT' && (
                            <>
                                <span className="text-blue-500 font-bold mr-2 select-none">&lt;&lt;</span>
                                <span className="text-blue-300">{log.content}</span>
                            </>
                        )}

                        {log.type === 'ERROR' && (
                            <div className="bg-red-900/20 border-l-2 border-red-500 pl-2 py-1 my-1">
                                <span className="text-red-500 font-bold mr-2">[ERR]</span>
                                <span className="text-red-200">{log.content}</span>
                            </div>
                        )}

                        {log.type === 'SYSTEM' && (
                            <>
                                <span className="text-gray-500 font-bold mr-2 select-none">[SYS]</span>
                                <span className="text-gray-500 italic opacity-85">
                                    {log.content}
                                </span>
                            </>
                        )}
                    </div>
                ))}

                {/* Pending Output Buffer (Only relevant in input mode or raw view, usually system handles this outside logs) */}
                {consoleBuffer && variant === 'input' && (
                    <div className="break-words leading-tight animate-pulse">
                        <span className="text-gray-600 text-[10px] mr-3 select-none">...</span>
                        <span className="text-green-500 font-bold mr-2 select-none">&gt;&gt;</span>
                        <span className="text-green-400/80">{consoleBuffer}</span>
                        <span className="inline-block w-2 h-4 bg-green-500 ml-1.5 align-middle animate-pulse"></span>
                    </div>
                )}

                <div ref={bottomRef} className="h-2" />
            </div>

            {/* Sticky Input/Search Line */}
            <div className="shrink-0 flex items-center px-4 py-2 bg-[#252525] border-t border-gray-800 focus-within:border-gray-600 transition-colors">
                {variant === 'input' ? (
                    <span className="text-green-500 font-bold mr-2 select-none animate-pulse">&gt;</span>
                ) : (
                    <Search size={14} className="text-gray-500 mr-2" />
                )}

                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-600 font-mono h-5 text-xs"
                    placeholder={variant === 'input' ? "Input command..." : "Filter logs..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                />
            </div>
        </div>
    );
}
