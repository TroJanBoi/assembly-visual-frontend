// app/lib/playground/instructionDefs.ts
import { ElementType } from "react";
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
  HiFlag,
  HiStop,
} from "react-icons/hi";

export type NodeLayout = "ds" | "label" | "zero" | "single";
export type OperandKind = "reg" | "imm" | "mem" | "label";
export type IconDef = ElementType | string;

export type InstructionDef = {
  name: string;
  color: keyof typeof colorStyles;
  icon?: IconDef;
  layout: NodeLayout;
  operands?: OperandKind[];
};

export const zeroOperandNames = new Set<string>(["START", "HLT", "NOP"]);

export const colorStyles: Record<
  string,
  {
    button: string;
    iconBox: string;
    title: string;
    pill: string;
    divider: string;
  }
> = {
  startGreen: {
    button: "bg-green-50 border-green-200 text-green-700",
    iconBox: "bg-white border-green-200 text-green-600",
    title: "text-green-700",
    pill: "bg-green-100 text-gray-900",
    divider: "border-green-200",
  },
  red: {
    button: "bg-red-50 border-red-200 text-red-700",
    iconBox: "bg-white border-red-200 text-red-600",
    title: "text-red-700",
    pill: "bg-red-100 text-gray-900",
    divider: "border-red-200",
  },
  green: {
    button: "bg-green-50 text-green-700 border-green-200",
    iconBox: "bg-green-100 border-green-200",
    title: "text-green-700",
    pill: "bg-green-100 text-gray-900",
    divider: "border-green-200",
  },
  gray: {
    button: "bg-gray-50 text-gray-700 border-gray-200",
    iconBox: "bg-gray-200 border-gray-300",
    title: "text-gray-700",
    pill: "bg-gray-100 text-gray-900",
    divider: "border-gray-200",
  },
  blue: {
    button: "bg-blue-50 text-blue-700 border-blue-200",
    iconBox: "bg-blue-100 border-blue-200",
    title: "text-blue-700",
    pill: "bg-blue-100 text-gray-900",
    divider: "border-blue-200",
  },
  cyan: {
    button: "bg-cyan-50 text-cyan-700 border-cyan-200",
    iconBox: "bg-cyan-100 border-cyan-200",
    title: "text-cyan-700",
    pill: "bg-cyan-100 text-gray-900",
    divider: "border-cyan-200",
  },
  teal: {
    button: "bg-teal-50 text-teal-700 border-teal-200",
    iconBox: "bg-teal-100 border-teal-200",
    title: "text-teal-700",
    pill: "bg-teal-100 text-gray-900",
    divider: "border-teal-200",
  },
  orange: {
    button: "bg-orange-50 text-orange-700 border-orange-200",
    iconBox: "bg-orange-100 border-orange-200",
    title: "text-orange-700",
    pill: "bg-orange-100 text-gray-900",
    divider: "border-orange-200",
  },
  purple: {
    button: "bg-purple-50 text-purple-700 border-purple-200",
    iconBox: "bg-purple-100 border-purple-200",
    title: "text-purple-700",
    pill: "bg-purple-100 text-gray-900",
    divider: "border-purple-200",
  },
  pink: {
    button: "bg-pink-50 text-pink-700 border-pink-200",
    iconBox: "bg-pink-100 border-pink-200",
    title: "text-pink-700",
    pill: "bg-pink-100 text-gray-900",
    divider: "border-pink-200",
  },
  violet: {
    button: "bg-violet-50 text-violet-700 border-violet-200",
    iconBox: "bg-violet-100 border-violet-200",
    title: "text-violet-700",
    pill: "bg-violet-100 text-gray-900",
    divider: "border-violet-200",
  },
  lightBlue: {
    button: "bg-sky-50 text-sky-700 border-sky-200",
    iconBox: "bg-sky-100 border-sky-200",
    title: "text-sky-700",
    pill: "bg-sky-100 text-gray-900",
    divider: "border-sky-200",
  },
  slate: {
    button: "bg-slate-50 text-slate-700 border-slate-200",
    iconBox: "bg-slate-200 border-slate-300",
    title: "text-slate-700",
    pill: "bg-slate-100 text-gray-900",
    divider: "border-slate-200",
  },
  indigo: {
    button: "bg-indigo-50 text-indigo-700 border-indigo-200",
    iconBox: "bg-indigo-100 border-indigo-200",
    title: "text-indigo-700",
    pill: "bg-indigo-100 text-gray-900",
    divider: "border-indigo-200",
  },
  black: {
    button: "bg-gray-800 text-white border-gray-900",
    iconBox: "bg-gray-700 border-gray-600",
    title: "text-white",
    pill: "bg-gray-700 text-white",
    divider: "border-gray-700",
  },
};

export const instructionCategories: {
  title: string;
  instructions: InstructionDef[];
}[] = [
    {
      title: "System",
      instructions: [
        { name: "START", color: "startGreen", icon: HiFlag, layout: "zero" },
        {
          name: "LABEL",
          color: "green",
          icon: HiCheck,
          layout: "label",
          operands: ["label"],
        },
        { name: "NOP", color: "gray", icon: HiOutlineClock, layout: "zero" },
        { name: "HLT", color: "red", icon: HiStop, layout: "zero" },
      ],
    },
    {
      title: "Data Movement",
      instructions: [
        {
          name: "MOV",
          color: "blue",
          icon: HiOutlineDatabase,
          layout: "ds",
          operands: ["reg", "imm"],
        },
        {
          name: "LOAD",
          color: "cyan",
          icon: HiOutlineDownload,
          layout: "ds",
          operands: ["reg", "mem"],
        },
        {
          name: "STORE",
          color: "teal",
          icon: HiOutlineUpload,
          layout: "ds",
          operands: ["mem", "reg"],
        },
      ],
    },
    {
      title: "Arithmetic",
      instructions: [
        {
          name: "ADD",
          color: "orange",
          icon: HiPlus,
          layout: "ds",
          operands: ["reg", "imm"],
        },
        {
          name: "SUB",
          color: "purple",
          icon: HiMinus,
          layout: "ds",
          operands: ["reg", "imm"],
        },
        {
          name: "MUL",
          color: "pink",
          icon: HiX,
          layout: "ds",
          operands: ["reg", "imm"],
        },
        {
          name: "DIV",
          color: "violet",
          icon: "÷",
          layout: "ds",
          operands: ["reg", "imm"],
        },
        {
          name: "INC",
          color: "lightBlue",
          icon: "+1",
          layout: "single",
          operands: ["reg"],
        },
        {
          name: "DEC",
          color: "lightBlue",
          icon: "-1",
          layout: "single",
          operands: ["reg"],
        },
        {
          name: "CMP",
          color: "slate",
          icon: HiOutlineSwitchHorizontal,
          layout: "ds",
          operands: ["reg", "reg"],
        },
      ],
    },
    {
      title: "Comparison/Conditional",
      instructions: [
        {
          name: "JMP",
          color: "indigo",
          icon: HiOutlineArrowRight,
          layout: "label",
          operands: ["label"],
        },
        {
          name: "JZ",
          color: "indigo",
          icon: "JZ",
          layout: "label",
          operands: ["label"],
        },
        {
          name: "JNZ",
          color: "indigo",
          icon: "JNZ",
          layout: "label",
          operands: ["label"],
        },
        {
          name: "JC",
          color: "purple",
          icon: "JC",
          layout: "label",
          operands: ["label"],
        },
        {
          name: "JNC",
          color: "purple",
          icon: "JNC",
          layout: "label",
          operands: ["label"],
        },
        {
          name: "JN",
          color: "black",
          icon: "JN",
          layout: "label",
          operands: ["label"],
        },
      ],
    },
    {
      title: "Stack",
      instructions: [
        {
          name: "PUSH",
          color: "teal",
          icon: HiOutlineUpload,
          layout: "single",
          operands: ["reg"],
        },
        {
          name: "POP",
          color: "cyan",
          icon: HiOutlineDownload,
          layout: "single",
          operands: ["reg"],
        },
      ],
    },
    {
      title: "Input/Output",
      instructions: [
        {
          name: "IN",
          color: "green",
          icon: HiOutlineDownload,
          layout: "ds",
          operands: ["reg", "imm"],
        },
        {
          name: "OUT",
          color: "orange",
          icon: HiOutlineUpload,
          layout: "ds",
          operands: ["imm", "reg"],
        },
      ],
    },
  ];


