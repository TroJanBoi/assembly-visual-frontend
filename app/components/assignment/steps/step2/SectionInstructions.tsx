"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Square, Clock } from "lucide-react";
import { FaKeyboard, FaHashtag, FaPlus, FaMinus } from "react-icons/fa6";
import { RiFlag2Line } from "react-icons/ri";
import { MdDisplaySettings, MdOutlineCompareArrows } from "react-icons/md";
import { GoMoveToStart } from "react-icons/go";
import { ImMoveDown, ImMoveUp } from "react-icons/im";
import {
  TbLogicAnd,
  TbLogicOr,
  TbLogicNot,
  TbLogicXor,
  TbLogicNand,
  TbLogicNor,
  TbLogicXnor,
  TbExposurePlus1,
  TbExposureMinus1,
  TbGitBranch,
  TbDivide,
  TbX,
  TbChevronLeft,
  TbChevronRight,
  TbMathFunction
} from "react-icons/tb";
import { PiDatabase, PiDatabaseFill } from "react-icons/pi";
import { HiOutlineCode, HiX } from "react-icons/hi";

import { AssignmentFormData } from "@/types/assignment";

const instructionCategories = [
  {
    title: "System & Control",
    instructions: [
      { name: "START", icon: <RiFlag2Line />, color: "green" },
      { name: "HLT", icon: <Square className="w-4 h-4" />, color: "red" },
      { name: "NOP", icon: <Clock className="w-4 h-4" />, color: "gray" },
      { name: "LABEL", icon: <FaHashtag />, color: "lime" },
    ],
  },
  {
    title: "I/O Operations",
    instructions: [
      { name: "IN", icon: <FaKeyboard />, color: "slate" },
      { name: "OUT", icon: <MdDisplaySettings />, color: "slate" },
    ],
  },
  {
    title: "Data Movement",
    instructions: [
      { name: "MOV", icon: <GoMoveToStart />, color: "blue" },
      { name: "LOAD", icon: <PiDatabase />, color: "cyan" },
      { name: "STORE", icon: <PiDatabaseFill />, color: "teal" },
      { name: "PUSH", icon: <ImMoveDown />, color: "sky" },
      { name: "POP", icon: <ImMoveUp />, color: "sky" },
    ],
  },
  {
    title: "Arithmetic",
    instructions: [
      { name: "ADD", icon: <FaPlus />, color: "orange" },
      { name: "SUB", icon: <FaMinus />, color: "orange" },
      { name: "MUL", icon: <TbX />, color: "pink" },
      { name: "DIV", icon: <TbDivide />, color: "violet" },
      { name: "INC", icon: <TbExposurePlus1 />, color: "lightBlue" },
      { name: "DEC", icon: <TbExposureMinus1 />, color: "lightBlue" },
    ],
  },
  {
    title: "Control Flow",
    instructions: [
      { name: "CMP", icon: <MdOutlineCompareArrows />, color: "zinc" },
      { name: "JMP", icon: <TbGitBranch />, color: "purple" },
      { name: "JZ", icon: <TbGitBranch />, color: "purple" },
      { name: "JNZ", icon: <TbGitBranch />, color: "purple" },
      { name: "JC", icon: <TbGitBranch />, color: "purple" },
      { name: "JNC", icon: <TbGitBranch />, color: "purple" },
      { name: "JN", icon: <TbGitBranch />, color: "purple" },
      { name: "CALL", icon: <TbMathFunction />, color: "indigo" },
      { name: "RET", icon: <TbMathFunction />, color: "indigo" },
    ],
  },
  {
    title: "Bitwise Logic",
    instructions: [
      { name: "AND", icon: <TbLogicAnd />, color: "fuchsia" },
      { name: "OR", icon: <TbLogicOr />, color: "fuchsia" },
      { name: "XOR", icon: <TbLogicXor />, color: "fuchsia" },
      { name: "NAND", icon: <TbLogicNand />, color: "fuchsia" },
      { name: "NOR", icon: <TbLogicNor />, color: "fuchsia" },
      { name: "XNOR", icon: <TbLogicXnor />, color: "fuchsia" },
      { name: "NOT", icon: <TbLogicNot />, color: "fuchsia" },
      { name: "SHL", icon: <TbChevronLeft />, color: "fuchsia" },
      { name: "SHR", icon: <TbChevronRight />, color: "fuchsia" },
    ],
  },
];

const colorStyles: { [key: string]: { button: string; iconBox: string; textColor: string } } = {
  red: {
    button: "bg-red-50 border-red-200 hover:bg-red-100",
    iconBox: "bg-red-100 border-red-200",
    textColor: "text-red-700",
  },
  green: {
    button: "bg-green-50 border-green-200 hover:bg-green-100",
    iconBox: "bg-green-100 border-green-200",
    textColor: "text-green-700",
  },
  lime: {
    button: "bg-lime-50 border-lime-200 hover:bg-lime-100",
    iconBox: "bg-lime-100 border-lime-200",
    textColor: "text-lime-700",
  },
  gray: {
    button: "bg-gray-50 border-gray-200 hover:bg-gray-100",
    iconBox: "bg-gray-200 border-gray-300",
    textColor: "text-gray-700",
  },
  slate: {
    button: "bg-slate-50 border-slate-200 hover:bg-slate-100",
    iconBox: "bg-slate-200 border-slate-300",
    textColor: "text-slate-700",
  },
  zinc: {
    button: "bg-zinc-50 border-zinc-200 hover:bg-zinc-100",
    iconBox: "bg-zinc-200 border-zinc-300",
    textColor: "text-zinc-700",
  },
  blue: {
    button: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconBox: "bg-blue-100 border-blue-200",
    textColor: "text-blue-700",
  },
  cyan: {
    button: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100",
    iconBox: "bg-cyan-100 border-cyan-200",
    textColor: "text-cyan-700",
  },
  teal: {
    button: "bg-teal-50 border-teal-200 hover:bg-teal-100",
    iconBox: "bg-teal-100 border-teal-200",
    textColor: "text-teal-700",
  },
  sky: {
    button: "bg-sky-50 border-sky-200 hover:bg-sky-100",
    iconBox: "bg-sky-100 border-sky-200",
    textColor: "text-sky-700",
  },
  orange: {
    button: "bg-orange-50 border-orange-200 hover:bg-orange-100",
    iconBox: "bg-orange-100 border-orange-200",
    textColor: "text-orange-700",
  },
  purple: {
    button: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    iconBox: "bg-purple-100 border-purple-200",
    textColor: "text-purple-700",
  },
  pink: {
    button: "bg-pink-50 border-pink-200 hover:bg-pink-100",
    iconBox: "bg-pink-100 border-pink-200",
    textColor: "text-pink-700",
  },
  violet: {
    button: "bg-violet-50 border-violet-200 hover:bg-violet-100",
    iconBox: "bg-violet-100 border-violet-200",
    textColor: "text-violet-700",
  },
  lightBlue: {
    button: "bg-sky-50 border-sky-200 hover:bg-sky-100",
    iconBox: "bg-sky-100 border-sky-200",
    textColor: "text-sky-700",
  },
  indigo: {
    button: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    iconBox: "bg-indigo-100 border-indigo-200",
    textColor: "text-indigo-700",
  },
  fuchsia: {
    button: "bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100",
    iconBox: "bg-fuchsia-100 border-fuchsia-200",
    textColor: "text-fuchsia-700",
  },
  black: {
    button: "bg-gray-800 border-gray-900 hover:bg-gray-700",
    iconBox: "bg-gray-700 border-gray-600",
    textColor: "text-white",
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
    <Card>
      <CardHeader className="bg-gray-50/50 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <HiOutlineCode className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Instruction Set</CardTitle>
            <CardDescription>Define allowed assembly instructions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-6">
          Click to toggle instructions. Grayed-out instructions will be{" "}
          <span className="font-semibold text-foreground">disallowed</span>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {instructionCategories.map((category) => (
            <div
              key={category.title}
              className="p-4 border rounded-xl bg-card hover:bg-accent/5 transition-colors"
            >
              <h4 className="text-center text-sm font-bold mb-3 text-foreground border-b pb-2">
                {category.title}
              </h4>
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
                        "w-full flex items-center gap-2 p-2.5 rounded-lg border transition-all duration-200 relative",
                        isDisallowed
                          ? "bg-muted border-muted-foreground/20 opacity-50 grayscale hover:opacity-100"
                          : cn(styles.button, styles.textColor)
                      )}
                    >
                      <span
                        className={cn(
                          "w-7 h-7 grid place-items-center rounded-md border shrink-0",
                          isDisallowed ? "bg-muted border-transparent" : styles.iconBox
                        )}
                      >
                        {inst.icon}
                      </span>
                      <span className="font-bold text-sm">{inst.name}</span>
                      {isDisallowed && (
                        <span className="ml-auto">
                          <HiX className="w-4 h-4 text-red-500" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
