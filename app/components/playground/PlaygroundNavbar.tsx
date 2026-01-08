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
}

export default function PlaygroundNavbar({
  assignmentTitle,
  onBack,
  mode,
  onRun,
  onSubmit,
  onReset,
}: PlaygroundNavbarProps) {

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-sm z-20">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button onClick={onBack} variant="outline">
          <HiChevronLeft className="size-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Button className="" variant="outline">
            <HiOutlineDocumentText className=" size-6 text-gray-400" />
          </Button>

          <span className="font-semibold text-gray-800">{assignmentTitle}</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">

        {/* Mode Selector */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center gap-1">
          {(["instant", "debug", "test"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onRun(m)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                mode === m
                  ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              {m === "instant" && "Execute"}
              {m === "debug" && "Debugger"}
              {m === "test" && "Test Suite"}
            </button>
          ))}
        </div>

        <button
          onClick={onSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 h-10 shadow-sm"
        >
          Submit
        </button>

        <button className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
          <HiOutlineBell className="w-6 h-6" />
        </button>

        <Link
          href="/profile"
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <HiOutlineUser size={20} />
        </Link>
      </div>
    </header>
  );
}
