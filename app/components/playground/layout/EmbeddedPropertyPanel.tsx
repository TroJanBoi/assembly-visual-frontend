"use client";

import React, { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import {
    instructionCategories,
    type InstructionDef,
} from "@/lib/playground/instructionDefs";
import { VIRTUAL_PORTS } from "@/lib/playground/ports";

type AddressMode = "imm" | "reg";
type SrcMode = "imm" | "reg";

import ModernDropdown, { type DropdownOption } from "@/components/ui/ModernDropdown";

import { Variable } from "@/components/playground/VariableManager";
import SmartCombobox, { ComboOption } from "@/components/ui/SmartCombobox";

export type EmbeddedPanelProps = {
    node: { id: string; type: string; data: any } | null;
    onChange: (nodeId: string, patch: Record<string, any>) => void;
    onClose: () => void; // Used to go back to dashboard
    registers: string[];
    labels: string[];
    variables: Variable[];
};

const defs = instructionCategories.flatMap((c) => c.instructions);
const findDef = (name?: string): InstructionDef | undefined =>
    defs.find((d) => d.name.toUpperCase() === String(name || "").toUpperCase());

export default React.memo(function EmbeddedPropertyPanel({
    node,
    onChange,
    onClose,
    registers,
    labels,
    variables = [],
}: EmbeddedPanelProps) {
    const [data, setData] = useState(node?.data || {});

    useEffect(() => {
        setData(node?.data || {});
    }, [node?.id, node?.data]);

    const def = useMemo(
        () => findDef(data?.instructionType),
        [data?.instructionType],
    );

    if (!node || !def) {
        return (
            <div className="p-4 text-center text-gray-500 text-sm">
                Select a node to edit properties.
            </div>
        );
    }

    const patch = (p: Record<string, any>) => {
        const newData = { ...data, ...p };
        setData(newData);
        onChange(node.id, p);
    };

    // Shared UI widgets ---------------------------------------------------------
    const L = ({ children }: { children: React.ReactNode }) => (
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{children}</div>
    );



    const SelectRegister = ({
        value,
        onChange,
        disabledOption,
    }: {
        value?: string;
        onChange: (v: string) => void;
        disabledOption?: string;
    }) => {
        // We use SmartOperandInput but force "reg" mode for UX consistency
        // This ensures it looks and feels like the Source inputs
        const handleSmartChange = (val: string | number, mode: "reg" | "imm") => {
            // Force register selection logic if needed, but usually the input handles it.
            // If user types a register name, mode will be 'reg'.
            // If they type a random number, mode might be 'imm', but specific instructions (DEST) usually require REG.
            // For now, we trust the user or the validation. 
            // Since this is "SelectRegister", we nominally expect a string.
            onChange(String(val));
        };

        return (
            <SmartOperandInput
                value={value}
                mode="reg"
                onChange={handleSmartChange}
                disabledRegister={disabledOption}
                placeholder="Register (e.g. R0)"
                hideVariables={true}
            />
        );
    };

    // --- Unified Smart Input ---
    const InputByte = ({
        value,
        onChange,
        placeholder = "Value (0-255)",
    }: {
        value?: number;
        onChange: (v: number | undefined) => void;
        placeholder?: string;
    }) => {
        const [text, setText] = useState(value?.toString() ?? "");
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
            const next = value == null ? "" : String(value);
            setText(next);
            setError(null);
        }, [value]);

        const validate = (t: string) => {
            if (t === "") return { ok: true, num: undefined as number | undefined };
            if (!/^\d{1,3}$/.test(t)) return { ok: false, num: undefined };
            const n = Number(t);
            if (n < 0 || n > 255) return { ok: false, num: n };
            return { ok: true, num: n };
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const t = e.target.value;
            if (t === "" || /^\d{0,3}$/.test(t)) {
                setText(t);
                const { ok } = validate(t);
                setError(ok ? null : "Must be 0-255");
            }
        };

        const commit = () => {
            const { ok, num } = validate(text);
            if (ok) {
                setError(null);
                onChange(num);
            } else {
                const lastValid = value == null ? "" : String(value);
                setText(lastValid);
                setError(null);
            }
        };

        return (
            <div className="space-y-1">
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={text}
                    placeholder={placeholder}
                    onChange={handleChange}
                    onBlur={commit}
                    onKeyDown={(e) => e.key === "Enter" && commit()}
                    className={cn(
                        "w-full h-9 text-sm rounded-md border border-gray-300 px-2 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors",
                        error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    )}
                />
                {error && <p className="text-[10px] text-red-600 font-medium">{error}</p>}
            </div>
        );
    };

    const SmartOperandInput = ({
        value,        // current raw value in data (e.g. "R0", "10", "count")
        mode,         // current mode in data ("reg" | "imm")
        onChange,     // (val: string | number, newMode: "reg" | "imm") => void
        placeholder = "Register, Variable, or Value",
        disabledRegister, // Optional: register to exclude
        hideVariables = false, // Optional: hide variable options
    }: {
        value?: string | number;
        mode?: "reg" | "imm";
        onChange: (v: string | number, m: "reg" | "imm") => void;
        placeholder?: string;
        disabledRegister?: string;
        hideVariables?: boolean;
    }) => {
        // Build Options
        const options: ComboOption[] = [
            // Registers
            ...registers
                .filter(r => r !== disabledRegister)
                .map(r => ({ label: r, value: r, type: "register" } as ComboOption)),
            // Variables
            ...(hideVariables ? [] : variables.map(v => ({
                label: `${v.name} (#${v.address})`,
                value: v.name,
                type: "variable"
            } as ComboOption))),
        ];

        const handleSmartChange = (val: string | number) => {
            const strVal = String(val);

            // Check if it matches a register
            const isReg = registers.includes(strVal);

            if (isReg) {
                onChange(strVal, "reg");
            } else {
                // Determine if number or variable -> logic is handled by parser
                // For UI state, we treat everything else as 'imm' (Immediate/Address/Label)
                onChange(val, "imm");
            }
        };

        return (
            <SmartCombobox
                value={value}
                onChange={handleSmartChange}
                options={options}
                placeholder={placeholder}
            />
        );
    };

    const Toggle = ({
        left,
        right,
        active,
        onLeft,
        onRight,
    }: {
        left: string;
        right: string;
        active: "left" | "right";
        onLeft: () => void;
        onRight: () => void;
    }) => (
        <div className="flex bg-gray-100 p-0.5 rounded-lg w-full">
            <button
                type="button"
                onClick={onLeft}
                className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                    active === "left"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                )}
            >
                {left}
            </button>
            <button
                type="button"
                onClick={onRight}
                className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                    active === "right"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                )}
            >
                {right}
            </button>
        </div>
    );

    const setDest = (v: string) => {
        const patchObj: any = { dest: v };
        // Clear conflict if needed, though with SmartInput logic we update separate fields.
        // For Load/Store logic:
        if ((data.memMode ?? "imm") === "reg" && data.memReg === v) patchObj.memReg = "";
        if ((data.srcMode ?? "imm") === "reg" && data.srcReg === v) patchObj.srcReg = "";
        patch(patchObj);
    };

    const setSrcReg = (v: string) => {
        if (v === data.dest) return;
        patch({ srcReg: v });
    };

    // Unified setters using mode
    const handleSrcChange = (val: string | number, mode: "reg" | "imm") => {
        if (mode === "reg") {
            // If picking register, clear imm, set reg, set mode
            patch({ srcMode: "reg", srcReg: val, srcImm: undefined });
        } else {
            // Text/Number -> imm
            patch({ srcMode: "imm", srcImm: val, srcReg: "" });
        }
    };

    const handleMemChange = (val: string | number, mode: "reg" | "imm") => {
        if (mode === "reg") {
            patch({ memMode: "reg", memReg: val, memImm: undefined });
        } else {
            patch({ memMode: "imm", memImm: val, memReg: "" });
        }
    };

    const SelectPort = ({
        value,
        onChange,
        type,
    }: {
        value?: number;
        onChange: (v: number) => void;
        type: "INPUT" | "OUTPUT";
    }) => {
        const options: DropdownOption[] = [
            ...VIRTUAL_PORTS.filter((p) => p.type === type || p.type === "INOUT").map((p) => ({
                label: p.name,
                value: p.id,
            })),
            { label: "Custom Port #", value: -1 }
        ];

        return (
            <ModernDropdown
                value={value}
                onChange={(v) => onChange(Number(v))}
                options={options}
                placeholder="Select Port"
            />
        );
    };

    const NAME = def.name;
    const isZero = def.layout === "zero" && NAME !== "LABEL";
    const isLabelDef = NAME === "LABEL";
    const isJump = def.layout === "label" && NAME !== "LABEL";
    const isLoad = NAME === "LOAD";
    const isStore = NAME === "STORE";
    const isCmp = NAME === "CMP";
    const isUnary = ["INC", "DEC", "NOT", "SHL", "SHR", "PUSH", "POP"].includes(NAME);
    const hasSrcValueOrReg = ["MOV", "ADD", "SUB", "MUL", "DIV", "AND", "OR", "XOR"].includes(NAME);
    const isIn = NAME === "IN";
    const isOut = NAME === "OUT";
    const allowCmpImm = true;
    const srcMode: SrcMode = data.srcMode ?? (isCmp && allowCmpImm ? "reg" : "imm");
    const memMode: AddressMode = data.memMode ?? "imm";

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 mb-4 bg-gray-50/50">
                <button
                    onClick={onClose}
                    className="p-1.5 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Back to System View"
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h2 className="text-base font-bold text-gray-800 leading-none">{NAME}</h2>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium tracking-wide uppercase">Properties</p>
                </div>
            </div>

            <div className="px-5 pb-8 space-y-6 overflow-y-auto flex-1">

                {isZero && (
                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center border border-gray-100">
                        No configuration needed.
                    </div>
                )}

                {isLabelDef && (
                    <div className="space-y-1">
                        <L>Label Name</L>
                        <input
                            className="w-full h-9 text-sm rounded-md border border-gray-300 px-2 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            placeholder="e.g. LOOP_START"
                            value={data.label ?? ""}
                            onChange={(e) => patch({ label: e.target.value })}
                        />
                    </div>
                )}

                {isJump && (
                    <div className="space-y-1">
                        <L>Jump Target</L>
                        <ModernDropdown
                            value={data.label}
                            onChange={(v: string) => patch({ label: v })}
                            options={labels.map(lb => ({ label: lb, value: lb }))}
                            placeholder="Select Label"
                        />
                    </div>
                )}

                {isLoad && (
                    <div className="space-y-5">
                        <div>
                            <L>Destination Register</L>
                            <SelectRegister value={data.dest} onChange={setDest} />
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <L>Source Address</L>
                            <SmartOperandInput
                                value={memMode === "reg" ? data.memReg : data.memImm}
                                mode={memMode}
                                onChange={handleMemChange}
                                disabledRegister={data.dest}
                                placeholder="Address (0-255), Variable, Register"
                            />
                        </div>
                    </div>
                )}

                {isStore && (
                    <div className="space-y-5">
                        <div>
                            <L>Source Register</L>
                            <SelectRegister value={data.srcReg} onChange={setSrcReg} disabledOption={data.dest} />
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <L>Target Address</L>
                            <SmartOperandInput
                                value={memMode === "reg" ? data.memReg : data.memImm}
                                mode={memMode}
                                onChange={handleMemChange}
                                disabledRegister={data.srcReg}
                                placeholder="Address (0-255), Variable, Register"
                            />
                        </div>
                    </div>
                )}

                {isIn && (
                    <div className="space-y-5">
                        <div>
                            <L>Destination Register</L>
                            <SelectRegister value={data.dest} onChange={setDest} />
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <L>Input Port</L>
                            <SelectPort value={data.srcImm} onChange={(v) => patch({ srcImm: v })} type="INPUT" />
                            {data.srcImm === -1 && (
                                <div className="mt-2">
                                    <InputByte value={undefined} onChange={(v) => patch({ srcImm: v })} placeholder="Port ID (0-255)" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isOut && (
                    <div className="space-y-5">
                        <div>
                            <L>Output Port</L>
                            <SelectPort value={data.memImm} onChange={(v) => patch({ memImm: v })} type="OUTPUT" />
                            {data.memImm === -1 && (
                                <div className="mt-2">
                                    <InputByte value={undefined} onChange={(v) => patch({ memImm: v })} placeholder="Port ID (0-255)" />
                                </div>
                            )}
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <L>Value to Output</L>
                            <SmartOperandInput
                                value={srcMode === "reg" ? data.srcReg : data.srcImm}
                                mode={srcMode}
                                onChange={handleSrcChange}
                                placeholder="Value or Register"
                                hideVariables={true}
                            />
                        </div>
                    </div>
                )}

                {isCmp && (
                    <div className="space-y-5">
                        <div>
                            <L>Compare (Left)</L>
                            <SelectRegister value={data.dest} onChange={setDest} />
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <L>Compare With (Right)</L>
                            <SmartOperandInput
                                value={srcMode === "reg" ? data.srcReg : data.srcImm}
                                mode={srcMode}
                                onChange={handleSrcChange}
                                disabledRegister={data.dest}
                                placeholder="Value, Variable, Register"
                            />
                        </div>
                    </div>
                )}

                {isUnary && (
                    <div>
                        <L>Target Register</L>
                        <SelectRegister value={data.dest} onChange={setDest} />
                    </div>
                )}

                {hasSrcValueOrReg && (
                    <div className="space-y-5">
                        <div>
                            <L>Destination Register</L>
                            <SelectRegister value={data.dest} onChange={setDest} />
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <L>Source Value</L>
                            <SmartOperandInput
                                value={srcMode === "reg" ? data.srcReg : data.srcImm}
                                mode={srcMode}
                                onChange={handleSrcChange}
                                disabledRegister={data.dest}
                                placeholder="Value, Variable, Register"
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
});
