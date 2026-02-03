"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HiChevronLeft,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlinePlay,
  HiChevronDown,
  HiOutlineBell,
  HiCheckCircle,
  HiOutlineDotsHorizontal,
  HiOutlineChevronRight,
  HiOutlinePause,
  HiOutlineStop,
  HiOutlineUser,
} from "react-icons/hi";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";


export type ExecutionMode = "instant" | "debug" | "test";

interface PlaygroundNavbarProps {
  assignmentTitle: string;
  onBack: () => void;
  mode: ExecutionMode;
  onRun: (mode: ExecutionMode) => void;
  onSubmit: () => void;
  onReset?: () => void;
  onOpenTestManager?: () => void;
}

export default function PlaygroundNavbar({
  assignmentTitle,
  onBack,
  mode,
  onRun,
  onSubmit,
  onReset,
  onOpenTestManager
}: PlaygroundNavbarProps) {

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 grid grid-cols-12 items-center px-4 sm:px-6 flex-shrink-0 shadow-sm z-20 gap-4">

      {/* Zone 1: Context (Left) - span 3 */}
      <div className="col-span-3 flex items-center gap-3">
        <Button onClick={onBack} variant="outline" className="h-9 w-9 p-0 rounded-lg border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <HiChevronLeft className="size-5" />
        </Button>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{assignmentTitle}</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Assembly Playground</span>
        </div>
      </div>

      {/* Zone 2: Player (Center) - span 6 */}
      <div className="col-span-6 flex items-center justify-center">
        <div className="flex items-center gap-2 p-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-inner">

          {/* Mode Switcher */}
          {(["instant", "debug", "test"] as const).map((m) => {
            const isActive = mode === m;
            return (
              <button
                key={m}
                onClick={() => onRun(m)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-slate-600"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50"
                )}
              >
                {m === "instant" && (isActive ? <HiOutlinePlay className="size-3.5 fill-current" /> : <HiOutlinePlay className="size-3.5" />)}
                {m === "debug" && <HiOutlinePause className="size-3.5" />}
                {m === "test" && <HiCheckCircle className="size-3.5" />}
                <span className="capitalize">{m === "instant" ? "Execute" : m === "test" ? "Test Suite" : m}</span>
              </button>
            )
          })}

          {/* Formatting Separator */}
          <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1" />

          {/* Context Action depending on Mode */}
          {mode === "test" ? (
            <Button
              onClick={onOpenTestManager}
              variant="ghost"
              className="h-7 px-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
            >
              <HiOutlineDocumentText className="size-3.5 mr-1.5 inline -mt-0.5" />
              Manage
            </Button>
          ) : (
            <Button
              onClick={onReset}
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              title="Reset Simulator"
            >
              <HiOutlineRefresh className="size-3.5" />
            </Button>
          )}

        </div>
      </div>

      {/* Zone 3: System (Right) - span 3 */}
      <div className="col-span-3 flex items-center justify-end gap-3">
        <div className="flex items-center gap-1 border-r border-gray-200 dark:border-slate-700 pr-3 mr-1">
          <button className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <HiOutlineBell className="size-5" />
          </button>
        </div>

        <button
          onClick={onSubmit}
          className="h-9 px-4 text-xs font-semibold text-white bg-gray-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
        >
          <span>Submit</span>
          <HiOutlineChevronRight className="size-3 opacity-60" />
        </button>

        <Link
          href="/profile"
          className="h-9 w-9 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-200 hover:ring-2 hover:ring-gray-200 dark:hover:ring-slate-600 transition-all ml-1"
        >
          <HiOutlineUser className="size-4" />
        </Link>
      </div>
    </header>
  );
}
