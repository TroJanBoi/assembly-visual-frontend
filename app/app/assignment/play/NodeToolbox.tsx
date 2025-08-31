"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Minus, Plus } from "lucide-react";

type NodeDef = {
  id: string;
  label: string;
  type?: string;
};

const GROUPS: { title: string; nodes: NodeDef[] }[] = [
  {
    title: "System",
    nodes: [
      { id: "sys-nop", label: "NOP" },
      { id: "sys-halt", label: "HALT" },
    ],
  },
  {
    title: "Data Movement",
    nodes: [
      { id: "dm-mov", label: "MOV" },
      { id: "dm-load", label: "LOAD" },
      { id: "dm-store", label: "STORE" },
    ],
  },
  {
    title: "Arithmetic",
    nodes: [
      { id: "ar-add", label: "ADD" },
      { id: "ar-sub", label: "SUB" },
      { id: "ar-mul", label: "MUL" },
      { id: "ar-div", label: "DIV" },
    ],
  },
  {
    title: "Comparison / Conditional",
    nodes: [
      { id: "cmp-cmp", label: "CMP" },
      { id: "cmp-jz", label: "JZ" },
      { id: "cmp-jnz", label: "JNZ" },
      { id: "cmp-jmp", label: "JMP" },
    ],
  },
];

export default function NodeToolbox({ className = "" }: { className?: string }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const g of GROUPS) map[g.title] = false;
    return map;
  });

  const [collapsed, setCollapsed] = useState(false);

  function onDragStart(e: React.DragEvent, node: NodeDef) {
    e.dataTransfer.setData("application/reactflow", JSON.stringify(node));
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside
      className={`pointer-events-auto select-none fixed right-4 top-20 z-50 w-64 max-h-[70vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden ${className}`}
      aria-label="Node toolbox"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-slate-800">
        <div className="text-sm font-semibold">Toolbox</div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Collapse toolbox"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <Plus size={14} /> : <Minus size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="overflow-auto px-2 py-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-3">
              <button
                onClick={() => setOpenGroups((s) => ({ ...s, [g.title]: !s[g.title] }))}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-slate-800 text-xs">{g.title[0]}</span>
                  {g.title}
                </div>
                <div className="text-xs">
                  {openGroups[g.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {openGroups[g.title] && (
                <div className="mt-2 grid gap-2">
                  {g.nodes.map((n) => (
                    <div
                      key={n.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, n)}
                      className="px-3 py-2 rounded bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md cursor-grab"
                    >
                      <div className="text-sm font-medium">{n.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
