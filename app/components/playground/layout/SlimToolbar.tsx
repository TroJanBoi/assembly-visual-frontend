"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    instructionCategories,
    colorStyles,
} from "@/lib/playground/instructionDefs";
import {
    Calculator,
    ArrowRightLeft,
    Database,
    Cpu,
    MoreHorizontal,
    Binary,
    Activity,
} from "lucide-react";

// Map category titles to lucide icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    "Data Movement": Database,
    "Arithmetic (Math)": Calculator,
    "Control Flow": Cpu,
    "I/O Operations": Activity,
    "System & Control": MoreHorizontal,
    "Logic": Binary,
};

type Props = {
    allowedInstructions?: Set<string>;
    hideStart?: boolean;
    hideHlt?: boolean;
};

const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
};

// Sub-component for individual category interactions
const CategoryItem = ({
    cat,
    isActive,
    onHover,
    onLeave,
}: {
    cat: { title: string; instructions: any[] };
    isActive: boolean;
    onHover: (title: string) => void;
    onLeave: () => void;
}) => {
    const Icon = CATEGORY_ICONS[cat.title] || MoreHorizontal;
    const styles = colorStyles[cat.instructions[0]?.color] || colorStyles["gray"];
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        onHover(cat.title);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            onLeave();
        }, 300); // 300ms grace period
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <div
            className="relative group w-full flex justify-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Toolbar Icon */}
            <button
                className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative z-20",
                    isActive
                        ? "bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100"
                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                )}
            >
                <Icon size={20} />
            </button>

            {/* Flyout Menu */}
            {isActive && (
                <div
                    className="absolute left-full top-0 ml-3 z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                    style={{ top: '-4px' }} // Slight vertical alignment adjustment
                >
                    {/* Pointer Arrow */}
                    <div className="absolute top-4 -left-1.5 w-3 h-3 bg-white border-l border-b border-gray-200 transform rotate-45 z-50" />

                    {/* Menu Content */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-52 relative z-40">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1 border-b border-gray-100 pb-2">
                            {cat.title}
                        </div>
                        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {cat.instructions.map((inst) => (
                                <div
                                    key={inst.name}
                                    className="flex items-center gap-3 p-2 rounded-lg cursor-grab hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group/item"
                                    onDragStart={(event) => {
                                        onDragStart(event, inst.name);
                                    }}
                                    draggable
                                >
                                    <span
                                        className={cn(
                                            "w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-black/5",
                                            styles.badgeBg,
                                            styles.badgeText
                                        )}
                                    >
                                        {typeof inst.icon === "string" ? (
                                            inst.icon
                                        ) : (
                                            <inst.icon size={14} />
                                        )}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-700 leading-none group-hover/item:text-indigo-600 transition-colors">
                                            {inst.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {inst.arity === 0 ? "No operands" : `${inst.arity} operand${inst.arity > 1 ? "s" : ""}`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(function SlimToolbar({
    allowedInstructions,
    hideStart,
    hideHlt,
}: Props) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const allow = useMemo(() => {
        const s = new Set<string>(
            (allowedInstructions ? Array.from(allowedInstructions) : []).map((s) =>
                s.toLowerCase()
            )
        );
        s.add("start");
        s.add("hlt");
        return s;
    }, [allowedInstructions]);

    const filteredCategories = useMemo(() => {
        return instructionCategories
            .map((cat) => {
                const items = cat.instructions
                    .filter((inst) =>
                        allow.size === 0 ? true : allow.has(inst.name.toLowerCase())
                    )
                    .filter((inst) => {
                        const key = inst.name.toLowerCase();
                        if (hideStart && key === "start") return false;
                        if (hideHlt && key === "hlt") return false;
                        return true;
                    });

                return { title: cat.title, instructions: items };
            })
            .filter((cat) => cat.instructions.length > 0);
    }, [allow, hideStart, hideHlt]);

    return (
        <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] relative">


            <nav className="flex flex-col gap-3 w-full">
                {filteredCategories.map((cat) => (
                    <CategoryItem
                        key={cat.title}
                        cat={cat}
                        isActive={activeCategory === cat.title}
                        onHover={setActiveCategory}
                        onLeave={() => {
                            // Only clear if this specific category is still trying to close itself
                            // (Though with React state, setting null is enough)
                            setActiveCategory((prev) => (prev === cat.title ? null : prev));
                        }}
                    />
                ))}
            </nav>
        </aside>
    );
});
