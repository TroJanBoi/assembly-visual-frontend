"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, Cpu, Flag, HardDrive, Calendar, AlignLeft, RotateCcw } from "lucide-react";
import ProcessorDashboard from "../ProcessorDashboard";

import EmbeddedPropertyPanel from "./EmbeddedPropertyPanel";

import { Variable } from "../VariableManager";
import { Assignment } from "@/lib/api/assignment";

type Props = {
    registers: { [key: string]: number };
    flags: { [key: string]: number };
    memory: { address: number; value: number }[];
    // New Props for Inspection
    selectedNode?: { id: string; type: string; data: any } | null;
    onNodeChange?: (nodeId: string, patch: Record<string, any>) => void;
    onCloseInspector?: () => void;
    availableRegisters?: string[];
    availableLabels?: string[];

    // Variables Props
    variables?: Variable[];
    onAddVariable?: (name: string, value: number) => void;
    onEditVariable?: (id: string, name: string, value: number) => void;
    onDeleteVariable?: (id: string) => void;

    // Assignment Props
    assignment?: Assignment | null;
};

export default function RightInspector({
    registers,
    flags,
    memory,
    selectedNode,
    onNodeChange,
    onCloseInspector,
    availableRegisters = [],
    availableLabels = [],
    variables,
    onAddVariable,
    onEditVariable,
    onDeleteVariable,
    assignment
}: Props) {
    const [isOpen, setIsOpen] = useState(true);
    const [taskExpanded, setTaskExpanded] = useState(true);

    const isInspecting = !!selectedNode;

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "No due date";
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <aside
            className={cn(
                "bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-20 shadow-sm",
                isOpen ? "w-80" : "w-12"
            )}
        >
            {/* Context-Aware Header */}
            <div
                className={cn(
                    "h-10 flex items-center justify-between px-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors",
                    isInspecting ? "bg-indigo-50 border-indigo-100" : "bg-gray-50"
                )}
                onClick={() => setIsOpen(!isOpen)}
                title={isOpen ? "Collapse Inspector" : "Expand Inspector"}
            >
                <div className="flex items-center gap-2 text-gray-700">
                    {/* Icon changes based on context */}
                    {isInspecting ? <Flag size={18} className="text-indigo-600" /> : <Cpu size={18} />}

                    {isOpen && (
                        <span className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            isInspecting ? "text-indigo-700" : "text-gray-600"
                        )}>
                            {isInspecting ? "Inspector" : "System"}
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronRight size={16} /> : <div className="rotate-180"><ChevronRight size={16} /></div>}
            </div>

            {/* Content Area */}
            <div className={cn("flex-1 overflow-hidden relative", !isOpen && "hidden")}>

                {/* 1. Processor Dashboard (Default) */}
                <div className={cn(
                    "absolute inset-0 transition-transform duration-300 ease-in-out bg-white",
                    isInspecting ? "-translate-x-full" : "translate-x-0"
                )}>
                    <div className="h-full w-full overflow-y-auto custom-scrollbar">

                        {/* TASK SECTION */}
                        {assignment && (
                            <div className="border-b border-gray-200 bg-gray-50/50">
                                <div
                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => setTaskExpanded(!taskExpanded)}
                                >
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <AlignLeft size={14} /> Task
                                    </div>
                                    <div className={cn("transition-transform duration-200", !taskExpanded && "-rotate-90")}>
                                        <ChevronDown size={14} className="text-gray-400" />
                                    </div>
                                </div>

                                {taskExpanded && (
                                    <div className="px-4 pb-4 space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm">{assignment.title}</h3>
                                            <p className="text-xs text-gray-600 mt-1 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                                                {assignment.description || "No description provided."}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                                    <Calendar size={12} /> Due Date
                                                </div>
                                                <div className="text-xs font-medium text-gray-900 truncate" title={formatDate(assignment.due_date)}>
                                                    {formatDate(assignment.due_date)}
                                                </div>
                                            </div>
                                            <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                                    <RotateCcw size={12} /> Attempts
                                                </div>
                                                <div className="text-xs font-medium text-gray-900">
                                                    {assignment.max_attempt === 0 ? "Unlimited" : `Max ${assignment.max_attempt}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="processor-dashboard-wrapper">
                            <ProcessorDashboard
                                registers={registers}
                                flags={flags}
                                memory={memory}
                                variables={variables}
                                onAddVariable={onAddVariable}
                                onEditVariable={onEditVariable}
                                onDeleteVariable={onDeleteVariable}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Property Inspector (Slide-In) */}
                <div className={cn(
                    "absolute inset-0 transition-transform duration-300 ease-in-out bg-white",
                    isInspecting ? "translate-x-0" : "translate-x-full"
                )}>
                    {isInspecting && selectedNode && onNodeChange && onCloseInspector && (
                        <EmbeddedPropertyPanel
                            node={selectedNode}
                            onChange={onNodeChange}
                            onClose={onCloseInspector}
                            registers={availableRegisters}
                            labels={availableLabels}
                            variables={variables || []}
                        />
                    )}
                </div>

            </div>
        </aside>
    );
}
