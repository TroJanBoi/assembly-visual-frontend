// app/components/playground/InstructionNode.tsx
"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import {
  instructionCategories,
  colorStyles,
  zeroOperandNames,
  type InstructionDef,
} from "@/lib/playground/instructionDefs";
import { HiOutlineArrowLeft } from "react-icons/hi";

const allInstructions = instructionCategories.flatMap((c) => c.instructions);
const instructionMap = new Map<string, InstructionDef>(
  allInstructions.map((inst) => [inst.name.toUpperCase(), inst]),
);

function Pill({
  children,
  toneClass,
  square = false,
  borderColor,
}: {
  children: React.ReactNode;
  toneClass: string;
  square?: boolean;
  borderColor?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-semibold text-sm border rounded-md",
        toneClass,
        square ? "w-8 h-8" : "h-8 w-16 px-2",
        borderColor,
      )}
    >
      {children}
    </div>
  );
}

export default memo(function InstructionNode({
  data,
  isConnectable,
}: NodeProps) {
  const instrName = String(data?.instructionType || "NOP").toUpperCase();
  const def = instructionMap.get(instrName);

  // ---- Guard unknown instruction early
  if (!def) {
    return (
      <div className="inline-flex items-center px-3 py-2 rounded-lg border-2 bg-white text-gray-600">
        Unknown: {instrName}
      </div>
    );
  }

  const styles = colorStyles[def.color] || colorStyles.gray;
  const isZero = def.layout === "zero" || zeroOperandNames.has(def.name);
  const isStart = def.name === "START";
  const isHlt = def.name === "HLT";
  const isLoad = def.name === "LOAD";
  const isStore = def.name === "STORE";

  const destReg = data?.dest ?? "R0";

  const memMode: "imm" | "reg" = data?.memMode ?? "imm";
  const memText =
    memMode === "imm"
      ? `[${Number.isFinite(data?.memImm) ? data.memImm : 0}]`
      : `[${data?.memReg ?? "R0"}]`;

  const srcMode: "imm" | "reg" = data?.srcMode ?? "imm";

  const srcText =
    srcMode === "reg"
      ? (data?.srcReg ?? "R0")
      : Number.isFinite(data?.srcImm)
        ? data.srcImm
        : 0;

  let displayLeft: string;
  let displayRight: string | number;

  if (isLoad) {
    // LOAD  REG <- [ADDR]
    displayLeft = destReg;
    displayRight = memText;
  } else if (isStore) {
    // STORE [ADDR] <- REG
    displayLeft = memText;
    displayRight = data?.srcReg ?? "R0";
  } else if (def.layout === "ds") {
    displayLeft = destReg;
    displayRight = srcText;
  } else {
    displayLeft = "";
    displayRight = "";
  }

  const labelVal = data?.label ?? (def.layout === "label" ? "LABEL" : "");

  // Left icon renderer
  const IconBox = () => {
    const { icon } = def as { icon?: any };
    if (!icon) return null;
    if (typeof icon === "string")
      return <span className="text-xs font-bold">{icon}</span>;
    const IconComp = icon as React.ElementType;
    return <IconComp />;
  };

  // Arrow pill border matches left icon's border-* class
  const borderColorClass =
    styles.iconBox.match(/border-[\w-]+-\d+/)?.[0] || "border-gray-300";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border-2 shadow-sm px-3 py-2",
        "h-auto min-w-[200px] justify-start", // Fixed width for consistent grid alignment
        styles.button,
      )}
    >
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          id="in"
          className="!bg-gray-400"
          isConnectable={isConnectable}
        />
      )}
      {!isHlt && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="out"
          className="!bg-gray-400"
          isConnectable={isConnectable}
        />
      )}

      {/* Left handle for label jumps - Branch is SOURCE */}
      {['JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN'].includes(instrName) && (
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="!bg-purple-500"
          isConnectable={false}
        />
      )}

      {/* Left handle for label jumps - LABEL is TARGET */}
      {instrName === 'LABEL' && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!bg-purple-500"
          isConnectable={false}
        />
      )}

      <span
        className={cn(
          "w-8 h-8 grid place-items-center rounded-md border shrink-0",
          styles.iconBox,
        )}
      >
        <IconBox />
      </span>

      <div className="flex items-center gap-3">
        <span className={cn("text-sm font-bold tracking-wide", styles.title)}>
          {def.name}
        </span>
        <span className={cn("h-6 border-l", styles.divider)} />
        {def.layout === "ds" && (
          <div className="flex items-center gap-2">
            <Pill toneClass={styles.pill}>{displayLeft}</Pill>
            <Pill
              toneClass={styles.pill}
              square
              borderColor={
                styles.iconBox.match(/border-[\w-]+-\d+/)?.[0] ||
                "border-gray-300"
              }
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
            </Pill>
            <Pill toneClass={styles.pill}>{String(displayRight)}</Pill>
          </div>
        )}
        {def.layout === "single" && (
          <div className="flex items-center gap-2">
            <Pill toneClass={styles.pill}>{destReg}</Pill>
          </div>
        )}
        {def.layout === "label" && (
          <div className="flex items-center gap-2">
            <Pill toneClass={styles.pill}>{data?.label ?? "LABEL"}</Pill>
          </div>
        )}
        {isZero && <div className="text-xs text-gray-500 italic" />}
      </div>
    </div>
  );
});
