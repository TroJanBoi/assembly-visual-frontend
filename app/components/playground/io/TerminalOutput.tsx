import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '@/lib/playground/io';
import { cn } from '@/lib/utils';
import { Terminal as TerminalIcon } from 'lucide-react';

type TerminalOutputProps = {
    logs: LogEntry[];
    consoleBuffer?: string;
    onInput?: (key: string) => void;
};

export function TerminalOutput({ logs, consoleBuffer, onInput }: TerminalOutputProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState("");

    // Auto-scroll to bottom when logs or buffer changes
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, consoleBuffer]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation(); // Stop global hotkeys

        if (e.key === 'Enter') {
            e.preventDefault();
            if (!onInput) return;

            // Send each char to the buffer
            // Since our IO system consumes char by char, we'll send the string + Enter
            const text = inputValue;

            // Loop send chars
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

    return (
        <div
            className="group flex flex-col h-full w-full bg-[#1e1e1e] border border-gray-800 rounded-none font-mono text-sm overflow-hidden"
            onClick={handleContainerClick}
        >
            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {/* Intro Message */}
                <div className="text-gray-500 mb-4 text-xs">
                    Assembly Visualizer v2.0 <br />
                    Type 'help' for available commands.
                </div>

                {logs.map((log) => (
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
                                <span className="text-emerald-400/80 font-normal">{log.content}</span>
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
                                <span className="text-gray-500 italic">{log.content}</span>
                            </>
                        )}
                    </div>
                ))}

                {/* Pending Output Buffer */}
                {consoleBuffer && (
                    <div className="break-words leading-tight animate-pulse">
                        <span className="text-gray-600 text-[10px] mr-3 select-none">...</span>
                        <span className="text-green-500 font-bold mr-2 select-none">&gt;&gt;</span>
                        <span className="text-green-400/80">{consoleBuffer}</span>
                        <span className="inline-block w-2 h-4 bg-green-500 ml-1.5 align-middle animate-pulse"></span>
                    </div>
                )}

                <div ref={bottomRef} className="h-2" />
            </div>

            {/* Sticky Input Line */}
            <div className="shrink-0 flex items-center px-4 py-2 bg-[#252525] border-t border-gray-800 focus-within:border-gray-600 transition-colors">
                <span className="text-green-500 font-bold mr-2 select-none animate-pulse">&gt;</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-600 font-mono h-6"
                    placeholder="Type here..."
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
