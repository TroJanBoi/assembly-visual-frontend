"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    instructionCategories,
    colorStyles,
    type InstructionDef,
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
    cat: { title: string; instructions: InstructionDef[] };
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
                    <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-64 relative z-40">
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
                                            "w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-black/5 shrink-0",
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
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-gray-700 leading-none group-hover/item:text-indigo-600 transition-colors">
                                            {inst.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                            {inst.arity === 0 ? "No operands" : `${inst.arity} operand${inst.arity > 1 ? "s" : ""}`}
                                        </span>
                                        <span className="text-[10px] text-gray-500 leading-tight mt-1">
                                            {inst.description}
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

// Sub-component for expanded category with toggle
const ExpandedCategoryItem = ({
    cat,
    onDragStart,
}: {
    cat: { title: string; instructions: InstructionDef[] };
    onDragStart: (event: React.DragEvent, nodeType: string) => void;
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const Icon = CATEGORY_ICONS[cat.title] || MoreHorizontal;

    return (
        <div className="border-b border-gray-100 last:border-0 pb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 hover:text-gray-600 transition-colors py-2"
            >
                <div className="flex items-center gap-2">
                    <Icon size={14} className="text-gray-400" />
                    <span>{cat.title}</span>
                </div>
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                )}
            </button>

            {isOpen && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {cat.instructions.map((inst) => {
                        const styles = colorStyles[inst.color] || colorStyles["gray"];
                        const renderIcon = () => {
                            if (typeof inst.icon === "string") {
                                return <span>{inst.icon}</span>;
                            }
                            const IconComp = inst.icon as React.ElementType;
                            return <IconComp size={16} />;
                        };

                        return (
                            <div
                                key={inst.name}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-lg border cursor-grab transition-all select-none hover:shadow-sm hover:border-gray-300 bg-white",
                                    styles.button
                                )}
                                onDragStart={(event) => onDragStart(event, inst.name)}
                                draggable
                            >
                                <span
                                    className={cn(
                                        "w-8 h-8 grid place-items-center rounded-md border shrink-0 text-xs font-bold shadow-sm",
                                        styles.iconBox
                                    )}
                                >
                                    {renderIcon()}
                                </span>
                                <div className="flex flex-col min-w-0 text-left">
                                    <span className="font-semibold text-sm leading-none text-gray-700">
                                        {inst.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                        {inst.arity === 0 ? "No operands" : `${inst.arity} operand${inst.arity > 1 ? "s" : ""}`}
                                    </span>
                                    <p className="text-[10px] text-gray-500 leading-tight mt-1 line-clamp-2 text-left">
                                        {inst.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
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
    const [isExpanded, setIsExpanded] = useState(true); // NEW: Expanded state

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
        <aside
            className={cn(
                "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] relative",
                isExpanded ? "w-64" : "w-16"
            )}
        >
            {/* Context-Aware Header (Toggle) */}
            <div
                className={cn(
                    "h-10 flex items-center justify-between px-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors",
                    isExpanded ? "bg-gray-50" : "justify-center"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse Toolbar" : "Expand Toolbar"}
            >
                {isExpanded ? (
                    <>
                        <div className="flex items-center gap-2 text-gray-700">
                            <MoreHorizontal size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                Components
                            </span>
                        </div>
                        <div className="rotate-180"><ArrowRightLeft size={14} /></div>
                    </>
                ) : (
                    <ArrowRightLeft size={18} className="text-gray-500" />
                )}
            </div>

            {/* Content Container */}
            <div className={cn("flex-1 w-full custom-scrollbar",
                isExpanded ? "overflow-y-auto overflow-x-hidden" : "visible items-center flex flex-col"
            )}>
                {isExpanded ? (
                    /* EXPANDED VIEW: Full list grouped by category */
                    <div className="px-4 pb-4 space-y-4 animate-in fade-in duration-300 pt-3">
                        {filteredCategories.map((cat) => (
                            <ExpandedCategoryItem
                                key={cat.title}
                                cat={cat}
                                onDragStart={onDragStart}
                            />
                        ))}
                    </div>
                ) : (
                    /* COLLAPSED VIEW: Icons only with Hover Flyouts */
                    <nav className="flex flex-col gap-3 w-full items-center py-4">
                        {filteredCategories.map((cat) => (
                            <CategoryItem
                                key={cat.title}
                                cat={cat}
                                isActive={activeCategory === cat.title}
                                onHover={setActiveCategory}
                                onLeave={() => {
                                    setActiveCategory((prev) => (prev === cat.title ? null : prev));
                                }}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </aside>
    );
});
