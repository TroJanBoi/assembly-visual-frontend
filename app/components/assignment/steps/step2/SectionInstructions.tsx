"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  HiPlus,
  HiCheck,
  HiOutlineClock,
  HiOutlineDatabase,
  HiOutlineDownload,
  HiOutlineUpload,
  HiMinus,
  HiX,
  HiOutlineSwitchHorizontal,
  HiOutlineArrowRight,
} from "react-icons/hi";

import { AssignmentFormData } from "@/types/assignment";

import { Horizontalrule } from "@/components/ui/Horizontalrule";

const instructionCategories = [
  {
    title: "System",
    instructions: [
      { name: "LABEL", icon: <HiCheck />, color: "green" },
      { name: "NOP", icon: <HiOutlineClock />, color: "gray" },
    ],
  },
  {
    title: "Data Movement",
    instructions: [
      { name: "MOV", icon: <HiOutlineDatabase />, color: "blue" },
      { name: "LOAD", icon: <HiOutlineDownload />, color: "cyan" },
      { name: "STORE", icon: <HiOutlineUpload />, color: "teal" },
    ],
  },
  {
    title: "Arithmetic",
    instructions: [
      { name: "ADD", icon: <HiPlus />, color: "orange" },
      { name: "SUB", icon: <HiMinus />, color: "purple" },
      { name: "MUL", icon: <HiX />, color: "pink" },
      {
        name: "DIV",
        icon: <span className="font-bold">÷</span>,
        color: "violet",
      },
      {
        name: "INC",
        icon: <span className="text-xs font-bold">+1</span>,
        color: "lightBlue",
      },
      {
        name: "DEC",
        icon: <span className="text-xs font-bold">-1</span>,
        color: "lightBlue",
      },
    ],
  },
  {
    title: "Comparison/Conditional",
    instructions: [
      { name: "CMP", icon: <HiOutlineSwitchHorizontal />, color: "slate" },
      { name: "JMP", icon: <HiOutlineArrowRight />, color: "indigo" },
      {
        name: "JZ",
        icon: <span className="text-xs font-bold">JZ</span>,
        color: "indigo",
      },
      {
        name: "JNZ",
        icon: <span className="text-xs font-bold">JNZ</span>,
        color: "indigo",
      },
      {
        name: "JC",
        icon: <span className="text-xs font-bold">JC</span>,
        color: "purple",
      },
      {
        name: "JNC",
        icon: <span className="text-xs font-bold">JNC</span>,
        color: "purple",
      },
      {
        name: "JN",
        icon: <span className="text-xs font-bold">JN</span>,
        color: "black",
      },
    ],
  },
  {
    title: "Stack",
    instructions: [
      { name: "PUSH", icon: <HiOutlineUpload />, color: "teal" },
      { name: "POP", icon: <HiOutlineDownload />, color: "cyan" },
    ],
  },
];

const colorStyles: { [key: string]: { button: string; iconBox: string } } = {
  green: {
    button: "bg-green-50 text-green-700 border-green-200",
    iconBox: "bg-green-100 border-green-200",
  },
  gray: {
    button: "bg-gray-50 text-gray-700 border-gray-200",
    iconBox: "bg-gray-200 border-gray-300",
  },
  blue: {
    button: "bg-blue-50 text-blue-700 border-blue-200",
    iconBox: "bg-blue-100 border-blue-200",
  },
  cyan: {
    button: "bg-cyan-50 text-cyan-700 border-cyan-200",
    iconBox: "bg-cyan-100 border-cyan-200",
  },
  teal: {
    button: "bg-teal-50 text-teal-700 border-teal-200",
    iconBox: "bg-teal-100 border-teal-200",
  },
  orange: {
    button: "bg-orange-50 text-orange-700 border-orange-200",
    iconBox: "bg-orange-100 border-orange-200",
  },
  purple: {
    button: "bg-purple-50 text-purple-700 border-purple-200",
    iconBox: "bg-purple-100 border-purple-200",
  },
  pink: {
    button: "bg-pink-50 text-pink-700 border-pink-200",
    iconBox: "bg-pink-100 border-pink-200",
  },
  violet: {
    button: "bg-violet-50 text-violet-700 border-violet-200",
    iconBox: "bg-violet-100 border-violet-200",
  },
  lightBlue: {
    button: "bg-sky-50 text-sky-700 border-sky-200",
    iconBox: "bg-sky-100 border-sky-200",
  },
  slate: {
    button: "bg-slate-50 text-slate-700 border-slate-200",
    iconBox: "bg-slate-200 border-slate-300",
  },
  indigo: {
    button: "bg-indigo-50 text-indigo-700 border-indigo-200",
    iconBox: "bg-indigo-100 border-indigo-200",
  },
  black: {
    button: "bg-gray-800 text-white border-gray-900",
    iconBox: "bg-gray-700 border-gray-600",
  },
};

interface SectionInstructionsProps {
  formData: AssignmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AssignmentFormData>>;
}

export default function SectionInstructions({
  formData,
  setFormData,
}: SectionInstructionsProps) {
  const toggleInstruction = (instructionName: string) => {
    setFormData((prev) => {
      const isDisallowed =
        prev.disallowedInstructions.includes(instructionName);
      let newDisallowedList: string[];

      if (isDisallowed) {
        newDisallowedList = prev.disallowedInstructions.filter(
          (name) => name !== instructionName,
        );
      } else {
        newDisallowedList = [...prev.disallowedInstructions, instructionName];
      }

      return { ...prev, disallowedInstructions: newDisallowedList };
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold">Allowed Instructions</h3>
      <p className="text-sm text-gray-500 mb-4">
        Define the set of instructions available to the student for this
        assignment. Use "Allow Only" mode for introductory tasks, or "Disallow"
        mode to challenge students to find creative solutions without certain
        instructions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {instructionCategories.map((category) => (
          <div
            key={category.title}
            className="p-4 border rounded-lg shadow-sm bg-white"
          >
            <h4 className="text-center text-base font-semibold mb-3 break-words">
              {category.title}
            </h4>
            <Horizontalrule />
            <div className="space-y-2">
              {category.instructions.map((inst) => {
                const isDisallowed = formData.disallowedInstructions.includes(
                  inst.name,
                );
                const styles = colorStyles[inst.color] || colorStyles["gray"];

                return (
                  <button
                    key={inst.name}
                    type="button"
                    onClick={() => toggleInstruction(inst.name)}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-lg border transition-all duration-200",
                      styles.button,
                      isDisallowed ? "opacity-30" : "opacity-100",
                    )}
                  >
                    <span
                      className={cn(
                        "w-7 h-7 grid place-items-center rounded-md border shrink-0",
                        styles.iconBox,
                      )}
                    >
                      {inst.icon}
                    </span>
                    <span className="font-semibold">{inst.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
