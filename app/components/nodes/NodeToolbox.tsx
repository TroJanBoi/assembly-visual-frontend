// NodeToolbox.tsx (แก้/วางทับไฟล์เดิม)
"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Settings,
  ArrowLeftRight,
  Diff,
  Combine,
  CircleStop,
  Circle,
  ArrowRightLeft,
  Download,
  Upload,
  Divide,
  Equal,
  CircleDot,
  CircleDashed,
  ArrowUpRight,
  X,
} from "lucide-react";

type NodeDef = {
  id: string;
  label: string;
  type?: string;
  borderColor: string; // tailwind class (for UI)
  bgColor: string;     // tailwind class (for UI)
  // icon component is used locally but we will send its name over dataTransfer
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconBgColor: string;
  textColor: string;
  hasValueCount?: number; // <-- new: number of value fields
  strokeColor?: string;   // <-- new: suggested edge stroke color (hex)
};

const GROUPS: {
  title: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  nodes: NodeDef[];
}[] = [
  {
    title: "System",
    icon: Settings,
    nodes: [
      {
        id: "sys-nop",
        label: "NOP",
        textColor: "text-gray-600",
        borderColor: "border-gray-500",
        bgColor: "bg-gray-200",
        icon: Circle,
        iconBgColor: "bg-gray-400",
        hasValueCount: 0,
        strokeColor: "#9CA3AF",
      },
      {
        id: "sys-halt",
        label: "HALT",
        textColor: "text-red-600",
        borderColor: "border-red-600",
        bgColor: "bg-red-200",
        icon: CircleStop,
        iconBgColor: "bg-red-400",
        hasValueCount: 0,
        strokeColor: "#EF4444",
      },
    ],
  },
  {
    title: "Data Movement",
    icon: ArrowLeftRight,
    nodes: [
      {
        id: "dm-mov",
        label: "MOV",
        textColor: "text-blue-600",
        borderColor: "border-blue-600",
        bgColor: "bg-blue-200",
        icon: ArrowRightLeft,
        iconBgColor: "bg-blue-400",
        hasValueCount: 2,           // MOV มี 2 ค่า
        strokeColor: "#2563EB",
      },
      {
        id: "dm-load",
        label: "LOAD",
        textColor: "text-blue-600",
        borderColor: "border-blue-600",
        bgColor: "bg-blue-200",
        icon: Download,
        iconBgColor: "bg-blue-400",
        hasValueCount: 1,
        strokeColor: "#2563EB",
      },
      {
        id: "dm-store",
        label: "STORE",
        textColor: "text-blue-600",
        borderColor: "border-blue-600",
        bgColor: "bg-blue-200",
        icon: Upload,
        iconBgColor: "bg-blue-400",
        hasValueCount: 1,
        strokeColor: "#2563EB",
      },
    ],
  },
  {
    title: "Arithmetic",
    icon: Diff,
    nodes: [
      {
        id: "ar-add",
        label: "ADD",
        textColor: "text-green-600",
        borderColor: "border-green-600",
        bgColor: "bg-green-200",
        icon: Plus,
        iconBgColor: "bg-green-400",
        hasValueCount: 2,
        strokeColor: "#16A34A",
      },
      {
        id: "ar-sub",
        label: "SUB",
        textColor: "text-green-600",
        borderColor: "border-green-600",
        bgColor: "bg-green-200",
        icon: Minus,
        iconBgColor: "bg-green-400",
        hasValueCount: 2,
        strokeColor: "#16A34A",
      },
      {
        id: "ar-mul",
        label: "MUL",
        textColor: "text-green-600",
        borderColor: "border-green-600",
        bgColor: "bg-green-200",
        icon: X,
        iconBgColor: "bg-green-400",
        hasValueCount: 2,
        strokeColor: "#16A34A",
      },
      {
        id: "ar-div",
        label: "DIV",
        textColor: "text-green-600",
        borderColor: "border-green-600",
        bgColor: "bg-green-200",
        icon: Divide,
        iconBgColor: "bg-green-400",
        hasValueCount: 2,
        strokeColor: "#16A34A",
      },
    ],
  },
  {
    title: "Comparison / Conditional",
    icon: Combine,
    nodes: [
      {
        id: "cmp-cmp",
        label: "CMP",
        textColor: "text-yellow-600",
        borderColor: "border-yellow-600",
        bgColor: "bg-yellow-200",
        icon: Equal,
        iconBgColor: "bg-yellow-400",
        hasValueCount: 2,
        strokeColor: "#D97706",
      },
      {
        id: "cmp-jz",
        label: "JZ",
        textColor: "text-yellow-600",
        borderColor: "border-yellow-600",
        bgColor: "bg-yellow-200",
        icon: CircleDot,
        iconBgColor: "bg-yellow-400",
        hasValueCount: 1,
        strokeColor: "#D97706",
      },
      {
        id: "cmp-jnz",
        label: "JNZ",
        textColor: "text-yellow-600",
        borderColor: "border-yellow-600",
        bgColor: "bg-yellow-200",
        icon: CircleDashed,
        iconBgColor: "bg-yellow-400",
        hasValueCount: 1,
        strokeColor: "#D97706",
      },
      {
        id: "cmp-jmp",
        label: "JMP",
        textColor: "text-yellow-600",
        borderColor: "border-yellow-600",
        bgColor: "bg-yellow-200",
        icon: ArrowUpRight,
        iconBgColor: "bg-yellow-400",
        hasValueCount: 1,
        strokeColor: "#D97706",
      },
    ],
  },
];

export default function NodeToolbox({
  className = "",
}: {
  className?: string;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const g of GROUPS) map[g.title] = false;
    return map;
  });

  const [collapsed, setCollapsed] = useState(false);

  // **ส่ง payload เป็น plain JSON (ไม่ส่งฟังก์ชัน/Component)**
  function onDragStart(e: React.DragEvent, node: NodeDef) {
    const iconName = (node.icon && ((node.icon as any).displayName || (node.icon as any).name)) || null;

    const payload = {
      id: node.id,
      label: node.label,
      textColor: node.textColor,
      borderColor: node.borderColor,
      bgColor: node.bgColor,
      iconName,
      iconBgColor: node.iconBgColor,
      hasValueCount: node.hasValueCount ?? 1,
      strokeColor: node.strokeColor ?? "#6B7280",
    };

    e.dataTransfer.setData("application/reactflow", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside
      className={`pointer-events-auto select-none fixed right-4 top-20 z-50 w-72 max-h-[70vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden ${className}`}
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
        <div className="overflow-y-auto scroll-container max-h-[calc(70vh-40px)] px-2 py-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="">
              <button
                onClick={() =>
                  setOpenGroups((s) => ({ ...s, [g.title]: !s[g.title] }))
                }
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="inline-flex items-center justify-center p-2 rounded-lg border bg-gray-100 dark:bg-slate-800 text-xs">
                    {<g.icon className="size-4" />}
                  </span>
                  {g.title}
                </div>
                <div className="text-xs">
                  {openGroups[g.title] ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </div>
              </button>

              {openGroups[g.title] && (
                <div className="flex h-full my- ml-6">
                  <span className="w-0.5 rounded-full bg-slate-200/50"></span>
                  <div className="w-full my-2 grid gap-2 px-4">
                    {g.nodes.map((n) => (
                      <div
                        key={n.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, n)}
                        className={`flex items-center gap-2 p-1 pr-2 w-fit rounded-lg bg-white dark:bg-slate-800 border  dark:border-slate-700 shadow-sm hover:shadow-md cursor-grab ${n.bgColor} ${n.borderColor} `}
                      >
                        {/* icon  */}
                        <span
                          className={`inline-flex items-center justify-center p-1 rounded-lg border dark:bg-slate-800 text-xs ${n.iconBgColor} ${n.borderColor}`}
                        >
                          {<n.icon className="size-4 text-white" />}
                        </span>

                        {/* node  */}
                        <div>
                          <div className={`text-sm font-medium ${n.textColor}`}>
                            {n.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
