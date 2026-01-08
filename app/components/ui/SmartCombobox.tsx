"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Type, Variable, Cpu, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboOption = {
    label: string;
    value: string | number;
    type: "register" | "variable" | "value" | "other";
    group?: string;
};

type Props = {
    value?: string | number;
    onChange: (value: string | number) => void;
    options: ComboOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

export default function SmartCombobox({
    value,
    onChange,
    options,
    placeholder = "Enter value...",
    disabled = false,
    className,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync search with value externally if not editing
    // User requested pattern: "Sync with parent prop if it changes externally"
    useEffect(() => {
        setSearch(value?.toString() ?? "");
    }, [value]);

    // Filter options
    const filteredOptions = useMemo(() => {
        // Fix: If input matches the current selection exactly, show ALL options (don't filter)
        if (search === value?.toString()) {
            return options;
        }

        if (!search) return options;
        const lower = search.toLowerCase();
        return options.filter((opt) =>
            opt.label.toLowerCase().includes(lower) ||
            opt.value.toString().toLowerCase().includes(lower)
        );
    }, [options, search, value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                // Don't reset search here, relying on onBlur to handle commit/reset if needed
                // If we reset here, we might race with onBlur commit.
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val: string | number) => {
        onChange(val);
        setSearch(val.toString());
        setIsOpen(false);
    };

    // Buffer updates: Update UI only
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        setIsOpen(true);
    };

    // Commit updates: Update Parent
    const handleCommit = () => {
        if (value?.toString() !== search) {
            onChange(search);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleCommit();
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "register": return Cpu;
            case "variable": return Variable;
            case "value": return Hash;
            default: return Type;
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full", className)}
        >
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    disabled={disabled}
                    value={search}
                    onChange={handleInputChange}
                    onBlur={handleCommit}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className={cn(
                        "w-full pl-9 pr-8 py-2 text-sm bg-white border rounded-xl transition-all duration-200 outline-none font-mono",
                        !isOpen && "border-gray-200 hover:border-indigo-300",
                        isOpen && "border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm",
                        disabled && "opacity-50 cursor-not-allowed bg-gray-50"
                    )}
                />

                {/* Left Icon (Dynamic based on probable type) */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {(() => {
                        const Icon = getIcon(
                            options.find(o => o.value.toString() === search)?.type ??
                            (!isNaN(Number(search)) ? "value" : "other")
                        );
                        return <Icon className="w-4 h-4" />;
                    })()}
                </div>

                {/* Right Chevron */}
                <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    onClick={() => {
                        if (!disabled) {
                            if (isOpen) setIsOpen(false);
                            else {
                                inputRef.current?.focus();
                                setIsOpen(true);
                            }
                        }
                    }}
                >
                    <ChevronDown
                        className={cn(
                            "w-4 h-4 text-gray-400 transition-transform duration-200",
                            isOpen && "rotate-180 text-indigo-500"
                        )}
                    />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1 max-h-64 overflow-y-auto custom-scrollbar">

                    {/* Immediate Value Option (Creatable) */}
                    {search && !options.some(o => o.value.toString() === search) && !isNaN(Number(search)) && (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelect(search)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg mb-1 border border-indigo-100 border-dashed"
                        >
                            <Hash className="w-3.5 h-3.5" />
                            <span className="font-medium">Use Immediate: "{search}"</span>
                        </button>
                    )}

                    {filteredOptions.length === 0 && (!search || isNaN(Number(search))) && (
                        <div className="px-3 py-2 text-sm text-gray-400 text-center italic">
                            No matching options
                        </div>
                    )}

                    {/* Render Grouped Options */}
                    {["register", "variable", "value", "other"].map(group => {
                        const groupOpts = filteredOptions.filter(o => o.type === group);
                        if (groupOpts.length === 0) return null;

                        return (
                            <div key={group} className="mb-2 last:mb-0">
                                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {group === "register" ? "Registers" :
                                        group === "variable" ? "Variables" :
                                            group === "value" ? "Values" : "Other"}
                                </div>
                                {groupOpts.map((option) => {
                                    const isSelected = option.value.toString() === value?.toString();
                                    const Icon = getIcon(option.type);
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleSelect(option.value)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left mb-0.5",
                                                "hover:bg-indigo-50 hover:text-indigo-700",
                                                isSelected && "bg-indigo-50 text-indigo-700 font-semibold"
                                            )}
                                        >
                                            <span className="flex items-center gap-2 truncate font-mono">
                                                <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-indigo-500" : "text-gray-400")} />
                                                {option.label}
                                            </span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
