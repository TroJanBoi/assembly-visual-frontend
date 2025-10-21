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

// Pill cell
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

  // demo values
  const dest = data?.dest ?? (def.layout === "ds" ? "R0" : "");
  const src =
    data?.src ??
    (def.layout === "ds" ? (def.operands?.[1] === "mem" ? "[R0]" : "0") : "");
  const labelVal = data?.label ?? (def.layout === "label" ? "LABEL" : "");

  const IconBox = () => {
    const { icon } = def as { icon?: any };
    if (!icon) return null;
    if (typeof icon === "string")
      return <span className="text-xs font-bold">{icon}</span>;
    const IconComp = icon as React.ElementType;
    return <IconComp />;
  };

  // Match center-arrow border to left icon border color
  const borderColorClass =
    styles.iconBox.match(/border-[\w-]+-\d+/)?.[0] || "border-gray-300";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border-2 shadow-sm px-3 py-2",
        "h-auto w-auto max-w-max",
        styles.button,
      )}
    >
      {/* Connection handles:
          START: only bottom (source)
          HLT  : only top (target)
          Others: both */}
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

      {/* Left icon */}
      <span
        className={cn(
          "w-8 h-8 grid place-items-center rounded-md border shrink-0",
          styles.iconBox,
        )}
      >
        <IconBox />
      </span>

      {/* Title + content */}
      <div className="flex items-center gap-3">
        <span className={cn("text-sm font-bold tracking-wide", styles.title)}>
          {def.name}
        </span>
        <span className={cn("h-6 border-l", styles.divider)} />

        {def.layout === "ds" && (
          <div className="flex items-center gap-2">
            <Pill toneClass={styles.pill}>{dest}</Pill>
            <Pill toneClass={styles.pill} square borderColor={borderColorClass}>
              <HiOutlineArrowLeft className="w-4 h-4" />
            </Pill>
            <Pill toneClass={styles.pill}>{src}</Pill>
          </div>
        )}

        {def.layout === "label" && (
          <div className="flex items-center gap-2">
            <Pill toneClass={styles.pill}>{labelVal}</Pill>
          </div>
        )}

        {isZero && <div className="text-xs text-gray-500 italic" />}
      </div>
    </div>
  );
});
