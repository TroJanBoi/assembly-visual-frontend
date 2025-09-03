// CustomNode.tsx (แทนไฟล์เดิม)
"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";

type CustomNodeData = {
  label: string;
  icon: React.ElementType;
  textColor: string;
  borderColor: string;
  bgColor: string;
  iconBgColor: string;
  value?: string;
  hasValueCount?: number;
  strokeColor?: string;
};

export default function CustomNode({ data }: NodeProps<CustomNodeData>) {
  const Icon = data.icon as any;
  const count = data.hasValueCount ?? 1;

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm  ${data.bgColor} ${data.borderColor}`}
    >
      {/* Top handle (target) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "white",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: data.strokeColor ?? "#9CA3AF",
          width: 9,
          height: 9,
          top: -4,
          boxSizing: "border-box",
        }}
      />
      {/* header: icon + label */}
      <div className="flex items-center gap-2 h ">
        <span
          className={`inline-flex items-center justify-center p-1 rounded-lg ${data.iconBgColor} border ${data.borderColor}`}
        >
          {Icon ? <Icon className="text-white" size={18} /> : null}
        </span>

        <div className={`text-xl font-bold ${data.textColor}`}>
          {data.label}
        </div>
      </div>

      <span className={`w-0 rounded-full border  ${data.borderColor}`}>&nbsp;</span>

      {/* value fields (vertical stack) */}
      <div className="flex  gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <input
            key={i}
            type="text"
            placeholder={count > 1 ? `value ${i + 1}` : "value"}
            defaultValue={data.value ?? ""}
            className={`w-24 border ${data.borderColor} text-sm px-2 py-1 rounded  focus:outline-none focus:ring-1 focus:ring-blue-400 `}
          />
        ))}
      </div>

      {/* bottom handle (source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "white",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: data.strokeColor ?? "#9CA3AF",
          width: 9,
          height: 9,
          bottom: -4,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
