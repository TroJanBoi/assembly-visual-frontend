// app/components/playground/BottomTerminal.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  HiTerminal,
  HiChevronUp,
  HiChevronDown,
  HiOutlineTrash,
} from "react-icons/hi";
import { cn } from "@/lib/utils";

type BottomTerminalProps = {
  labName: string; // just the lab name (e.g., "lab-1")
  logs: (string | { text: string })[];
  onClear?: () => void;
  defaultOpen?: boolean;
  maxHeightPx?: number; // default 260
};

export default React.memo(function BottomTerminal({
  labName,
  logs,
  onClear,
  defaultOpen = true,
  maxHeightPx = 180,
}: BottomTerminalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const endRef = useRef<HTMLDivElement>(null);

  const rendered = useMemo(() => {
    const norm = logs.map((l) => (typeof l === "string" ? l : (l?.text ?? "")));
    return norm.flatMap((entry) => String(entry).split(/\r?\n/));
  }, [logs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rendered.length, open]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 ",
        open ? "shadow-[0_-6px_20px_rgba(0,0,0,0.25)]" : "",
      )}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900 text-gray-100 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <HiTerminal className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold">Terminal</span>
          <span className="text-xs text-gray-400">({labName})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Clear logs"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="px-2 py-1 rounded-md bg-gray-800 text-gray-200 hover:bg-gray-700"
            aria-label={open ? "Minimize" : "Expand"}
            title={open ? "Minimize" : "Expand"}
          >
            {open ? (
              <HiChevronDown className="w-4 h-4" />
            ) : (
              <HiChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* View-only log area */}
      {open && (
        <div className="bg-black text-gray-100 font-mono text-[13px] leading-relaxed overflow-y-auto border-t border-gray-800 h-40">
          <div className="px-3 py-2 space-y-1">
            {rendered.length === 0 ? (
              <div className="text-gray-500">
                ({labName}&gt; waiting for logs)
              </div>
            ) : (
              rendered.map((line, i) => (
                <div key={i}>
                  <span className="text-emerald-400">{labName}&gt;</span>{" "}
                  <span className="whitespace-pre-wrap">{line}</span>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
        </div>
      )}
    </div>
  );
});
