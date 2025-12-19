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

type RunMode = "default" | "test-case" | "debug";

interface PlaygroundNavbarProps {
  assignmentTitle: string;
  onBack: () => void;
  onRun: (mode: RunMode) => void;
  onSubmit: () => void;
  onReset?: () => void;
}

export default function PlaygroundNavbar({
  assignmentTitle,
  onBack,
  onRun,
  onSubmit,
  onReset,
}: PlaygroundNavbarProps) {
  const [runMode, setRunMode] = useState<RunMode>("default");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleModeChange = (mode: RunMode) => {
    setRunMode(mode);
    setIsDropdownOpen(false);
  };

  const getRunButtonContent = () => {
    switch (runMode) {
      case "test-case":
        return {
          text: "Run Test Case",
          icon: <HiCheckCircle className="w-5 h-5" />,
        };
      case "debug":
        return {
          text: "Run Debug",
          icon: <HiOutlinePlay className="w-5 h-5" />,
        };
      default:
        return { text: "Run", icon: <HiOutlinePlay className="w-5 h-5" /> };
    }
  };

  const { text: runButtonText, icon: runButtonIcon } = getRunButtonContent();

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

      {/* Center Section (Conditional) */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {runMode === "test-case" && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Test cases: Pass 0/1</span>
            <HiOutlineDotsHorizontal className="w-5 h-5" />
          </div>
        )}
        {runMode === "debug" && (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button className="p-2 text-gray-600 hover:bg-white hover:text-indigo-600 rounded-md">
              <HiOutlineChevronRight className="w-5 h-5" title="Step Over" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-white hover:text-indigo-600 rounded-md">
              <HiOutlinePlay className="w-5 h-5" title="Resume" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-white hover:text-indigo-600 rounded-md">
              <HiOutlinePause className="w-5 h-5" title="Pause" />
            </button>
            <button className="p-2 text-red-500 hover:bg-white hover:text-red-600 rounded-md">
              <HiOutlineStop className="w-5 h-5" title="Stop" />
            </button>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          className="p-2 text-gray-500 hover:text-red-600 rounded-md transition-colors"
          title="Reset Playground"
        >
          <HiOutlineRefresh className="w-5 h-5" />
        </button>

        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => onRun(runMode)}
              className="pl-4 pr-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-l-lg hover:bg-indigo-700 h-10 flex items-center gap-2"
            >
              {runButtonIcon}
              {runButtonText}
            </button>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-2 py-2 bg-indigo-700 text-white rounded-r-lg hover:bg-indigo-800 h-10"
              aria-label="Change run mode"
            >
              <HiChevronDown className="w-5 h-5" />
            </button>
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-30">
              <button
                onClick={() => handleModeChange("default")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Run
              </button>
              <button
                onClick={() => handleModeChange("test-case")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Run Test Case
              </button>
              <button
                onClick={() => handleModeChange("debug")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Run Debug
              </button>
            </div>
          )}
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
