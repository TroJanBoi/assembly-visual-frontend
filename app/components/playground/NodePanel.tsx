// app/components/playground/NodePanel.tsx
"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  instructionCategories,
  colorStyles,
} from "@/lib/playground/instructionDefs";

const onDragStart = (event: React.DragEvent, nodeType: string) => {
  event.dataTransfer.setData("application/reactflow", nodeType);
  event.dataTransfer.effectAllowed = "move";
};

type Props = {
  allowedInstructions?: Set<string>;
  hideStart?: boolean;
  hideHlt?: boolean;
};

export default React.memo(function NodePanel({
  allowedInstructions,
  hideStart,
  hideHlt,
}: Props) {
  const allow = new Set<string>(
    (allowedInstructions ? Array.from(allowedInstructions) : []).map((s) =>
      s.toLowerCase(),
    ),
  );
  allow.add("start");
  allow.add("hlt");

  const filtered = useMemo(() => {
    return instructionCategories
      .map((cat) => {
        const items = cat.instructions
          // filter by allowed
          .filter((inst) =>
            allow.size === 0 ? true : allow.has(inst.name.toLowerCase()),
          )
          // NEW: hide START/HLT ถ้ากำลังถูกใช้งานอยู่บนแคนวาส
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
    <div className="max-w-64 p-4 h-full overflow-y-auto bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800">

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No instructions allowed for this assignment.
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.instructions.map((inst) => {
                  const styles = colorStyles[inst.color] || colorStyles["gray"];
                  const renderIcon = () => {
                    if (typeof inst.icon === "string")
                      return (
                        <span className="text-xs font-bold">{inst.icon}</span>
                      );
                    const IconComp = inst.icon as React.ElementType;
                    return <IconComp />;
                  };
                  return (
                    <div
                      key={inst.name}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border cursor-grab",
                        styles.button,
                      )}
                      onDragStart={(event) => onDragStart(event, inst.name)}
                      draggable
                      role="button"
                      tabIndex={0}
                      title={inst.name}
                    >
                      <span
                        className={cn(
                          "w-7 h-7 grid place-items-center rounded-md border shrink-0",
                          styles.iconBox,
                        )}
                        aria-hidden
                      >
                        {renderIcon()}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm leading-none">{inst.name}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {inst.arity === 0 ? "No operands" : `${inst.arity} operand${inst.arity > 1 ? "s" : ""}`}
                        </span>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight mt-1 truncate group-hover:whitespace-normal">
                          {inst.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
