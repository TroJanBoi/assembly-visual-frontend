
import { useState } from "react";
import { Plus, Trash2, Lock, Eye, EyeOff, Terminal, Hash, LayoutGrid, Cpu, Binary, Flag } from "lucide-react";
import { TestCase, TestCondition, TestLocationType } from "@/lib/playground/test_runner";
import { cn, generateUUID } from "@/lib/utils";
import ModernDropdown from "@/components/ui/ModernDropdown";

interface Props {
    testCase: TestCase | null;
    onUpdate: (updated: TestCase) => void;
    onRun?: () => void;
    isRunning?: boolean;
    availableRegisters: string[];
    isOwner?: boolean; // True if user is teacher/owner
}

export default function TestCaseEditor({ testCase, onUpdate, onRun, isRunning, availableRegisters, isOwner = true }: Props) {
    if (!testCase) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>Select a test case to edit</p>
            </div>
        );
    }

    const isHidden = !!testCase.isHidden;
    const canEdit = isOwner; // Owners can edit even if hidden for graded tests management

    const addCondition = (target: "initialState" | "expectedState") => {
        const newCond: TestCondition = {
            id: generateUUID(),
            type: "Register",
            location: "R0",
            value: "0"
        };
        onUpdate({
            ...testCase,
            [target]: [...testCase[target], newCond]
        });
    };

    const removeCondition = (target: "initialState" | "expectedState", id: string) => {
        onUpdate({
            ...testCase,
            [target]: testCase[target].filter(c => c.id !== id)
        });
    };

    const updateCondition = (
        target: "initialState" | "expectedState",
        id: string,
        field: keyof TestCondition,
        val: string
    ) => {
        onUpdate({
            ...testCase,
            [target]: testCase[target].map(c =>
                c.id === id ? { ...c, [field]: val } : c
            )
        });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{testCase.name}</h2>
                        {isOwner && (
                            <button
                                onClick={() => onUpdate({ ...testCase, isHidden: !isHidden })}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all",
                                    isHidden
                                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                        : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                )}
                                title={isHidden ? "Click to make visible to students" : "Click to hide from students (Graded)"}
                            >
                                {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                {isHidden ? "Hidden" : "Visible"}
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure inputs and expected outputs.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                {/* Initial State Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Initial State</h3>
                        {canEdit && (
                            <button
                                onClick={() => addCondition("initialState")}
                                className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-dashed border-gray-300 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-md transition-colors bg-white dark:bg-slate-800"
                            >
                                <Plus size={14} /> Add Value
                            </button>
                        )}
                    </div>


                    <div className={cn("w-full transition-colors", isHidden && isOwner && "rounded-lg p-3 border-2 border-amber-400 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-900/20")}>
                        {isHidden && !isOwner ? (
                            <div className="text-center py-12 text-gray-400 bg-amber-50 border-2 border-dashed border-amber-200 rounded-lg">
                                <Lock size={32} className="mx-auto mb-3 text-amber-500" />
                                <p className="text-sm font-medium text-gray-600">Hidden Test Case</p>
                                <p className="text-xs mt-1">Initial state is hidden from students</p>
                            </div>
                        ) : (
                            <>
                                {/* Table Header */}
                                {testCase.initialState.length > 0 && (
                                    <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-semibold text-gray-500 px-2">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-3">Type</div>
                                        <div className="col-span-3">Target / Address</div>
                                        <div className="col-span-4">Value</div>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    {testCase.initialState.map((cond, idx) => (
                                        <ConditionRow
                                            key={cond.id}
                                            index={idx + 1}
                                            condition={cond}
                                            onChange={(f, v) => updateCondition("initialState", cond.id, f, v)}
                                            onRemove={() => removeCondition("initialState", cond.id)}
                                            availableRegisters={availableRegisters}
                                            readOnly={!canEdit}
                                        />
                                    ))}
                                </div>

                                {testCase.initialState.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                                        No initial conditions set
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* Expected Final State Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Expected Final State</h3>
                        {canEdit && (
                            <button
                                onClick={() => addCondition("expectedState")}
                                className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-dashed border-gray-300 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-md transition-colors bg-white dark:bg-slate-800"
                            >
                                <Plus size={14} /> Add Expectation
                            </button>
                        )}
                    </div>

                    <div className={cn("w-full transition-colors", isHidden && isOwner && "rounded-lg p-3 border-2 border-amber-400 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-900/20")}>
                        {isHidden && !isOwner ? (
                            <div className="text-center py-12 text-gray-400 bg-amber-50 border-2 border-dashed border-amber-200 rounded-lg">
                                <Lock size={32} className="mx-auto mb-3 text-amber-500" />
                                <p className="text-sm font-medium text-gray-600">Hidden Test Case</p>
                                <p className="text-xs mt-1">Expected state is hidden from students</p>
                            </div>
                        ) : (
                            <>
                                {/* Table Header */}
                                {testCase.expectedState.length > 0 && (
                                    <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-semibold text-gray-500 px-2">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-3">Type</div>
                                        <div className="col-span-3">Target / Address</div>
                                        <div className="col-span-4">Value</div>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    {testCase.expectedState.map((cond, idx) => (
                                        <ConditionRow
                                            key={cond.id}
                                            index={idx + 1}
                                            condition={cond}
                                            onChange={(f, v) => updateCondition("expectedState", cond.id, f, v)}
                                            onRemove={() => removeCondition("expectedState", cond.id)}
                                            availableRegisters={availableRegisters}
                                            readOnly={!canEdit}
                                        />
                                    ))}
                                </div>

                                {testCase.expectedState.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                                        No expectations set
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button className="px-6 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                    Reset
                </button>
                <button
                    onClick={onRun}
                    disabled={isRunning}
                    className="px-8 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                >
                    {isRunning ? "Running..." : "Run Test"}
                </button>
            </div>
        </div>
    );
}

function ConditionRow({
    index,
    condition,
    onChange,
    onRemove,
    availableRegisters,
    readOnly = false
}: {
    index: number;
    condition: TestCondition;
    onChange: (field: keyof TestCondition, value: string) => void;
    onRemove: () => void;
    availableRegisters: string[];
    readOnly?: boolean;
}) {

    // --- Helpers for Options ---
    const FLAGS = ['Z', 'C', 'V', 'O'];
    const OUT_PORTS = [
        { id: '0', name: '0: Console', icon: Terminal },
        { id: '2', name: '2: 7-Segment', icon: Hash },
        { id: '3', name: '3: LED Panel', icon: LayoutGrid },
    ];
    const IN_PORTS = [
        { id: '0', name: '0: Keyboard', icon: Terminal },
    ];

    const renderLocationInput = () => {
        switch (condition.type) {
            case 'Register':
                return (
                    <div className="w-full">
                        <ModernDropdown
                            value={condition.location}
                            onChange={(v) => onChange("location", String(v))}
                            options={availableRegisters.map(r => ({ label: r, value: r, icon: Cpu }))}
                            placeholder="Register"
                            disabled={readOnly}
                        />
                    </div>
                );
            case 'Flag':
                return (
                    <div className="w-full">
                        <ModernDropdown
                            value={condition.location}
                            onChange={(v) => onChange("location", String(v))}
                            options={FLAGS.map(f => ({ label: f, value: f, icon: Flag }))}
                            placeholder="Flag"
                            disabled={readOnly}
                        />
                    </div>
                );
            case 'Output':
                return (
                    <div className="w-full">
                        <ModernDropdown
                            value={condition.location}
                            onChange={(v) => onChange("location", String(v))}
                            options={OUT_PORTS.map(p => ({ label: p.name, value: p.id, icon: p.icon }))}
                            placeholder="Port"
                            disabled={readOnly}
                        />
                    </div>
                );
            case 'Input':
                return (
                    <div className="w-full">
                        <ModernDropdown
                            value={condition.location}
                            onChange={(v) => onChange("location", String(v))}
                            options={IN_PORTS.map(p => ({ label: p.name, value: p.id, icon: p.icon }))}
                            placeholder="Port"
                            disabled={readOnly}
                        />
                    </div>
                );
            case 'Memory':
            default:
                return (
                    <input
                        type="number"
                        min="0"
                        max="255"
                        value={condition.location}
                        onChange={(e) => onChange("location", e.target.value)}
                        placeholder="Addr"
                        readOnly={readOnly}
                        disabled={readOnly}
                        className={cn(
                            "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors",
                            readOnly
                                ? "bg-gray-100 dark:bg-slate-800/50 text-gray-500 border-gray-200 dark:border-slate-700 cursor-not-allowed"
                                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-slate-700"
                        )}
                    />
                );
        }
    };

    return (

        <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 group border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-colors">
            {/* Index */}
            <div className="col-span-1 text-xs text-gray-400 font-mono text-center">
                {index}
            </div>

            {/* Type Selector */}
            <div className="col-span-3">
                <ModernDropdown
                    value={condition.type}
                    onChange={(v) => onChange("type", v as any)}
                    options={[
                        { label: "Register", value: "Register", icon: Cpu },
                        { label: "Memory", value: "Memory", icon: Hash },
                        { label: "Flag", value: "Flag", icon: Flag },
                        { label: "Output", value: "Output", icon: Terminal },
                        { label: "Input", value: "Input", icon: Terminal },
                    ]}
                    placeholder="Type"
                    disabled={readOnly}
                />
            </div>

            {/* Location / Address */}
            <div className="col-span-3">
                {renderLocationInput()}
            </div>

            {/* Value Input */}
            <div className="col-span-4">
                <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => onChange("value", e.target.value)}
                    placeholder="Value"
                    readOnly={readOnly}
                    disabled={readOnly}
                    className={cn(
                        "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors",
                        readOnly
                            ? "bg-gray-100 dark:bg-slate-800/50 text-gray-500 border-gray-200 dark:border-slate-700 cursor-not-allowed"
                            : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-slate-700"
                    )}
                />
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-center">
                {!readOnly && (
                    <button
                        onClick={onRemove}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Condition"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
