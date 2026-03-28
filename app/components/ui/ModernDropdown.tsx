"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownOption = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    disabled?: boolean;
};

type Props = {
    value?: string | number;
    onChange: (value: any) => void;
    options: DropdownOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

export default function ModernDropdown({
    value,
    onChange,
    options,
    placeholder = "Select...",
    disabled = false,
    className,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: DropdownOption) => {
        if (option.disabled) return;
        onChange(option.value);
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full", className)}
        >
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200 outline-none",
                    // Default Border
                    !isOpen && "border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/10 dark:hover:bg-slate-800",
                    // Open State
                    isOpen && "border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/10 shadow-sm",
                    // Disabled
                    disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-800",
                    // Selected Value styling
                    !selectedOption && "text-gray-400 dark:text-gray-500"
                )}
            >
                <span className="flex items-center gap-2 truncate font-medium text-gray-700 dark:text-gray-200">
                    {selectedOption?.icon && (
                        <selectedOption.icon className="w-4 h-4 text-gray-400" />
                    )}
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-gray-400 transition-transform duration-200",
                        isOpen && "rotate-180 text-indigo-500"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={String(option.value)}
                                    type="button"
                                    disabled={option.disabled}
                                    onClick={() => handleSelect(option)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors text-left mb-0.5 last:mb-0",
                                        // Interactive states
                                        "hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-700 dark:hover:text-indigo-300",
                                        // Active State
                                        isSelected && "bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-semibold",
                                        // Disabled
                                        option.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent text-gray-400 dark:text-gray-600"
                                    )}
                                >
                                    <span className="flex items-center gap-2 truncate">
                                        {option.icon && (
                                            <option.icon
                                                className={cn(
                                                    "w-4 h-4",
                                                    isSelected ? "text-indigo-500" : "text-gray-400"
                                                )}
                                            />
                                        )}
                                        {option.label}
                                    </span>
                                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                                </button>
                            );
                        })}

                        {options.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-400 text-center italic">
                                No options
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
