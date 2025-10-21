"use client";

import React, { useRef, useState } from "react";
import Draggable from "react-draggable";
import { HiOutlineChevronUp, HiOutlineChevronDown } from "react-icons/hi";
import { cn } from "@/lib/utils";

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  defaultPosition: { x: number; y: number };
}

export default function DraggablePanel({
  title,
  children,
  defaultPosition,
}: DraggablePanelProps) {
  const nodeRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      defaultPosition={defaultPosition}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className={cn(
          "absolute z-10 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-2xl flex flex-col transition-all duration-300",
          isCollapsed
            ? "w-auto h-auto"
            : "w-96 max-w-[90vw] h-[70vh] max-h-[700px]",
        )}
      >
        <div className="drag-handle flex items-center justify-between p-3 border-b bg-gray-50/50 cursor-move rounded-t-lg gap-4">
          <h3 className="font-semibold text-gray-700">{title}</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={isCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {isCollapsed ? (
              <HiOutlineChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <HiOutlineChevronUp className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div className="flex-grow overflow-y-auto">{children}</div>
        )}
      </div>
    </Draggable>
  );
}
