import React, { useState } from 'react';
import { LogEntry } from '@/lib/playground/io';
import { TerminalOutput } from './TerminalOutput';
import { cn } from '@/lib/utils';
import { Terminal, Bug } from 'lucide-react';

type ConsolePanelProps = {
    logs: LogEntry[];
    outputLines: string[];
    consoleBuffer: string;
    onInput?: (key: string) => void;
};

export function ConsolePanel({ logs, outputLines, consoleBuffer, onInput }: ConsolePanelProps) {
    const [activeTab, setActiveTab] = useState<'output' | 'debug'>('output');
    const bottomRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState("");

    // Auto-scroll to bottom when output changes
    React.useEffect(() => {
        if (activeTab === 'output') {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [outputLines, consoleBuffer, activeTab]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation(); // Stop global hotkeys

        if (e.key === 'Enter') {
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

    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e1e] border-r border-gray-800">
            {/* Tabs Header */}
            <div className="flex items-center bg-[#252525] border-b border-gray-700 select-none shrink-0">
                <button
                    onClick={() => setActiveTab('output')}
                    className={cn(
                        "flex items-center px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-r border-gray-700",
                        activeTab === 'output'
                            ? "bg-[#1e1e1e] text-green-400 border-t-2 border-t-green-500"
                            : "text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a]"
                    )}
                >
                    <Terminal size={14} className="mr-2" />
                    Output
                </button>
                <button
                    onClick={() => setActiveTab('debug')}
                    className={cn(
                        "flex items-center px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-r border-gray-700",
                        activeTab === 'debug'
                            ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-500"
                            : "text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a]"
                    )}
                >
                    <Bug size={14} className="mr-2" />
                    Debug Log
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {activeTab === 'output' ? (
                    <div
                        className="flex flex-col h-full w-full group"
                        onClick={handleContainerClick}
                    >
                        {/* Scrollable Output */}
                        <div className="flex-1 p-4 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 space-y-1">
                            {/* Standard Output View */}
                            {outputLines.length === 0 && !consoleBuffer && (
                                <div className="text-gray-600 italic text-xs">
                                    _ Program output will appear here...
                                </div>
                            )}

                            {outputLines.map((line, i) => (
                                <div key={i} className="flex flex-row items-start font-mono group/line">
                                    <span className="text-green-900/40 select-none mr-3 text-[10px] pt-0.5 font-bold group-hover/line:text-green-500/50 transition-colors">
                                        {(i + 1).toString().padStart(3, '0')}
                                    </span>
                                    <span className="text-green-500 font-bold mr-2 select-none">&gt;</span>
                                    <div className="text-green-300 break-words whitespace-pre-wrap flex-1 leading-snug">
                                        {line}
                                    </div>
                                </div>
                            ))}

                            {/* Pending Line (Partial) */}
                            {consoleBuffer && (
                                <div className="flex flex-row items-start font-mono animate-pulse">
                                    <span className="text-green-900/40 select-none mr-3 text-[10px] pt-0.5 font-bold">
                                        {(outputLines.length + 1).toString().padStart(3, '0')}
                                    </span>
                                    <span className="text-green-500 font-bold mr-2 select-none">&gt;</span>
                                    <div className="text-green-300/80 break-words whitespace-pre-wrap flex-1">
                                        {consoleBuffer}
                                        <span className="inline-block w-2 h-4 bg-green-500 ml-1.5 align-middle animate-pulse" />
                                    </div>
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
                                className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-600 font-mono h-5 text-xs"
                                placeholder="Input command..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                            />
                        </div>
                    </div>
                ) : (
                    /* Debug Log View */
                    <div className="absolute inset-0">
                        <TerminalOutput logs={logs} consoleBuffer={""} onInput={onInput} variant="filter" />
                    </div>
                )}
            </div>
        </div>
    );
}
