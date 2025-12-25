"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import {
  instructionCategories,
  colorStyles,
  layoutConfig,
  jumpInstructions,
  type InstructionDef,
} from "@/lib/playground/instructionDefs";
import { VIRTUAL_PORTS } from "@/lib/playground/ports";
import { ArrowLeft, Scale, Settings } from "lucide-react";
import { useStore } from "reactflow";

// --- 1. Helper: Find Definition ---
const allInstructions = instructionCategories.flatMap((c) => c.instructions);
const instructionMap = new Map<string, InstructionDef>(
  allInstructions.map((inst) => [inst.name.toUpperCase(), inst]),
);

// --- Helper: Get Port Name ---
const getPortName = (portId: number | undefined): string => {
  if (portId === undefined || portId === null) return "";
  const port = VIRTUAL_PORTS.find(p => p.id === portId);
  if (!port) return String(portId);
  const match = port.name.match(/Port \d+: (.+)/);
  return match ? match[1] : port.name;
};

// --- Helper: Color Map (Extracted) ---
const TAILWIND_COLOR_MAP: Record<string, string> = {
  'bg-green-200': '#bbf7d0',
  'bg-green-100': '#dcfce7',
  'border-green-500': '#22c55e',
  'bg-red-100': '#fee2e2',
  'border-red-500': '#ef4444',
  'bg-gray-100': '#f3f4f6',
  'border-gray-500': '#6b7280',
  'bg-lime-100': '#ecfccb',
  'bg-lime-300': '#bef264',
  'border-lime-500': '#84cc16',
  'bg-zinc-100': '#f4f4f5',
  'border-zinc-500': '#71717a',
  'bg-slate-100': '#f1f5f9',
  'border-slate-500': '#64748b',
  'bg-orange-100': '#ffedd5',
  'border-orange-500': '#f97316',
  'bg-violet-100': '#ede9fe',
  'bg-violet-200': '#ddd6fe',
  'border-violet-500': '#8b5cf6',
  'bg-sky-100': '#e0f2fe',
  'bg-sky-200': '#bae6fd',
  'border-sky-500': '#0ea5e9',
  'bg-fuchsia-100': '#fae8ff',
  'bg-fuchsia-200': '#f5d0fe',
  'border-fuchsia-500': '#d946ef',
  'bg-gray-200': '#e5e7eb',
  'bg-orange-300': '#fdba74',
  'bg-violet-300': '#c4b5fd',
  'bg-sky-300': '#7dd3fc',
  'bg-fuchsia-300': '#f0abfc',
  'bg-slate-300': '#cbd5e1',
};

const getTailwindColorValue = (tailwindClass: string): string => {
  return TAILWIND_COLOR_MAP[tailwindClass] || '#ffffff';
};

// --- 2. Main Component ---
export default memo(function InstructionNode({
  data,
  isConnectable,
  selected,
}: NodeProps) {
  const instrName = String(data?.instructionType || "NOP").toUpperCase();
  const def = instructionMap.get(instrName);

  // Fallback for unknown instructions
  if (!def) return <div className="p-2 border border-red-200 bg-red-50 text-red-600 rounded">? {instrName}</div>;

  const styles = colorStyles[def.color] || colorStyles.default;
  const isStart = def.name === "START";
  const isHlt = def.name === "HLT";
  const Icon = def.icon;

  // QUANTIZED WIDTH LOGIC
  const sizeKey = (def.size || "md") as keyof typeof layoutConfig.widths;
  const nodeWidth = layoutConfig.widths[sizeKey];

  // Helper: Get value with fallback for empty/undefined
  const getVal = (val: any, fallback: string) => {
    if (val === undefined || val === null || val === "") return fallback;
    return val;
  };

  // Get operand values with placeholders
  const dest = getVal(data?.dest ?? data?.data?.dest, "Register");
  const srcMode = data?.srcMode ?? data?.data?.srcMode ?? "imm";
  const srcReg = getVal(data?.srcReg ?? data?.data?.srcReg, "Register");
  const srcImm = data?.srcImm ?? data?.data?.srcImm; // Numbers, keep 0

  // Label handling: Jumps vs LABEL node
  const labelPlaceholder = instrName === "LABEL" ? "Set Label" : "Target";
  const rawLabel = data?.label ?? data?.data?.label;

  // Validate label existence if it's a jump instruction
  // PERFORMANCE FIX: Use a selector that returns a primitive boolean, not an array.
  // This prevents the component from re-rendering whenever ANY node in the graph changes.
  const isJump = jumpInstructions.has(instrName);

  const labelExists = useStore(
    React.useCallback(
      (s: any) => {
        if (!isJump || !rawLabel) return true; // Don't care if not jump/no label
        if (!s.nodeInternals) return false;

        // Efficient iteration
        for (const n of s.nodeInternals.values()) {
          if (
            String(n.data?.instructionType || "").toUpperCase() === "LABEL" &&
            n.data?.label === rawLabel
          ) {
            return true;
          }
        }
        return false;
      },
      [isJump, rawLabel]
    )
  );

  let validatedLabel = rawLabel;
  if (isJump && rawLabel && !labelExists) {
    validatedLabel = undefined; // Force placeholder
  }

  const label = getVal(validatedLabel, labelPlaceholder);

  // Memory operands (for LOAD/STORE)
  const memMode = data?.memMode ?? data?.data?.memMode ?? "imm";
  const memReg = getVal(data?.memReg ?? data?.data?.memReg, "Register");
  const memImm = data?.memImm ?? data?.data?.memImm;

  // For IN instruction: show port name instead of port ID
  const isIn = instrName === "IN";
  const isOut = instrName === "OUT";
  const isLoad = instrName === "LOAD";
  const isStore = instrName === "STORE";

  let src;
  if (isIn) {
    // IN uses srcImm for port ID
    src = (srcImm !== undefined && srcImm !== null) ? getPortName(srcImm) : "Port";
  } else if (isOut) {
    // OUT uses srcReg/srcImm for the value to output
    src = srcMode === "reg" ? srcReg : (srcImm !== undefined && srcImm !== null ? srcImm : "Immediate");
  } else if (isLoad) {
    // LOAD uses memImm/memReg for the source address
    src = memMode === "reg" ? memReg : (memImm !== undefined && memImm !== null ? memImm : "Address");
  } else if (isStore) {
    // STORE uses srcReg for the value to store, memImm/memReg for address (shown as dest)
    src = memMode === "reg" ? memReg : (memImm !== undefined && memImm !== null ? memImm : "Address");
  } else {
    // Other instructions (MOV, ADD, SUB, etc.)
    src = srcMode === "reg" ? srcReg : (srcImm !== undefined && srcImm !== null ? srcImm : "Immediate");
  }

  // Determine action icon based on instruction
  const getActionIcon = (colorClass: string) => {
    if (def.name === "CMP") {
      return <Scale className={cn("w-3.5 h-3.5", colorClass)} />;
    }
    if (["AND", "OR", "XOR", "NOT", "SHL", "SHR"].includes(def.name)) {
      return <Settings className={cn("w-3.5 h-3.5", colorClass)} />;
    }
    // Default: Assignment arrow
    return <ArrowLeft className={cn("w-3.5 h-3.5", colorClass)} />;
  };



  // Extract strong border color from styles
  const getBorderColorClass = () => {
    const borderClass = styles.borderColor; // e.g., "border-lime-200"
    // Convert to stronger variant: border-lime-200 -> border-lime-500
    return borderClass.replace(/-200$/, "-500").replace(/-300$/, "-500");
  };

  return (
    <div
      style={{ width: nodeWidth }}
      className={cn(
        "rounded-2xl border-2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group overflow-hidden",
        "flex flex-row items-center h-14",
        getBorderColorClass(),
        styles.bodyBg,
        // Active Proximity State (Magnetic Pulse)
        data.isProximity
          ? "scale-105 shadow-xl ring-4 ring-offset-2 ring-indigo-400/50 z-50"
          : "shadow-md hover:shadow-lg",
        // Selection State (Lower Priority than Proximity if overlapping, or merge?)
        // If selected AND proximity, proximity should win for "drag target" feel, or both? 
        // User asked for "Base State: ring-0". 
        // Existing selection logic: "ring-2 ring-offset-2 ring-indigo-500 shadow-lg scale-105"
        // We replace it or append. 
        (!data.isProximity && selected) && "ring-2 ring-offset-2 ring-indigo-500 shadow-lg scale-105"
      )}
    >
      {/* Handles */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          id="in"
          isConnectable={isConnectable}
          className="!w-3 !h-3 transition-colors z-50"
          style={{
            backgroundColor: getTailwindColorValue(styles.bodyBg),
            borderColor: getTailwindColorValue(styles.borderColor),
            borderWidth: '2px',
            borderRadius: '50%',
            borderStyle: 'solid',
          }}
        />
      )}
      {!isHlt && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-bottom"
          isConnectable={isConnectable}
          className="!w-3 !h-3 transition-colors z-50"
          style={{
            backgroundColor: getTailwindColorValue(styles.bodyBg),
            borderColor: getTailwindColorValue(styles.borderColor),
            borderWidth: '2px',
            borderRadius: '50%',
            borderStyle: 'solid',
          }}
        />
      )}

      {/* Side Handles for Branching */}
      {['JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN', 'CALL'].includes(instrName) && (
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          isConnectable={false}
          className="!w-2 !h-2"
          style={{
            backgroundColor: getTailwindColorValue(styles.badgeBg),
            borderRadius: '50%',
            border: 'none',
          }}
        />
      )}
      {instrName === 'LABEL' && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          isConnectable={false}
          className="!w-2 !h-2"
          style={{
            backgroundColor: getTailwindColorValue(styles.badgeBg),
            borderRadius: '50%',
            border: 'none',
          }}
        />
      )}

      {/* VARIANT A: Zero-Operand (Arity 0) - Centered Badge */}
      {def.arity === 0 && (
        <div className="flex items-center justify-center gap-3 p-2 w-full">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center border-2",
            styles.badgeBg, styles.borderColor

          )}>
            {Icon && <Icon className={cn("size-6", styles.text)} />}
          </div>

          <span className={cn(" h-7 border", styles.borderColor)}
          />

          <span className={cn(" mx-auto font-bold text-xl uppercase tracking-wide", styles.text)}>
            {def.name}
          </span>
        </div>
      )}

      {/* VARIANT B: Single-Operand (Arity 1) - Header | Input */}
      {def.arity === 1 && (
        <>
          {/* Header Section */}
          <div className="flex items-center gap-2 p-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center border-2", styles.borderColor, styles.badgeBg
            )}>
              {Icon && <Icon className={cn("size-6", styles.text)} />}
            </div>
            <span className={cn("font-bold text-xl uppercase whitespace-nowrap", styles.text)}>
              {def.name}
            </span>
          </div>

          <span className={cn("h-7 border", styles.borderColor)}
          />

          {/* Input Slot */}
          <div className="w-full overflow-hidden flex-1 py-2 flex items-center justify-center px-2">
            <div className={cn("bg-white rounded-md px-3 py-1.5 flex-1 min-w-0 border-2", styles.borderColor)}>
              <span className="max-w-full overflow-hidden text-sm font-mono font-medium text-slate-700 truncate block text-center">
                {['LABEL', 'JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN', 'CALL'].includes(def.name) ? label : dest}
              </span>
            </div>
          </div>
        </>
      )
      }

      {/* VARIANT C: Two-Operand (Arity 2) - Header | Input1 | Icon | Input2 */}
      {
        def.arity === 2 && (
          <>
            {/* Header Section */}
            <div className="flex items-center gap-2 p-2 shrink-0">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center border-2", styles.borderColor, styles.badgeBg
              )}>
                {Icon && <Icon className={cn("size-6", styles.text)} />}
              </div>
              <span className={cn("font-bold text-xl uppercase whitespace-nowrap", styles.text)}>
                {def.name}
              </span>
            </div>

            {/* Divider */}
            <span className={cn("h-7 border", styles.borderColor)}
            />

            {/* Body: Input1 | Icon | Input2 */}
            <div className="flex-1 flex items-center gap-2 px-2">
              {/* Input 1 */}
              <div className={cn("bg-white rounded-md border-2 px-2 py-1.5 flex-1 min-w-0", styles.borderColor)}>
                <span className="text-xs font-mono font-medium text-slate-700 truncate block text-center">
                  {isOut
                    ? (memImm !== undefined && memImm !== null ? getPortName(memImm) : "Port")
                    : isStore
                      ? srcReg
                      : dest}
                </span>
              </div>

              {/* Action Icon */}
              <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2",
                styles.borderColor, styles.badgeBg
              )}>
                {getActionIcon(styles.badgeText)}
              </div>

              {/* Input 2 (Source) */}
              <div className={cn("bg-white rounded-md border-2 px-2 py-1.5 flex-1 min-w-0", styles.borderColor)}>
                <span className="text-xs font-mono font-medium text-slate-700 truncate block text-center">
                  {src}
                </span>
              </div>
            </div>
          </>
        )
      }
    </div >
  );
});