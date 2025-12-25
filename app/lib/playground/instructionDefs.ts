import { ElementType } from "react";
import {
  Square,
  Clock,
} from "lucide-react";
import { FaKeyboard, FaHashtag, FaPlus, FaMinus } from "react-icons/fa6";
import { RiFlag2Line } from "react-icons/ri";
import { MdDisplaySettings, MdOutlineCompareArrows } from "react-icons/md";
import { GoMoveToStart } from "react-icons/go";
import { ImMoveDown, ImMoveUp } from "react-icons/im";
import { TbLogicAnd, TbLogicOr, TbLogicNot, TbLogicXor, TbExposurePlus1, TbExposureMinus1, TbGitBranch, TbDivide, TbX, TbChevronLeft, TbChevronRight, TbMathFunction } from "react-icons/tb";
import { PiDatabase, PiDatabaseFill } from "react-icons/pi";

export type NodeLayout = "ds" | "label" | "zero" | "single";
export type OperandKind = "reg" | "imm" | "mem" | "label";
export type IconDef = ElementType;
export type NodeSize = "xs" | "sm" | "md" | "lg";

export interface ColorStyle {
  headerBg: string;
  bodyBg: string;
  borderColor: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
  borderHover: string;
  bgHover: string;
}

export type InstructionDef = {
  name: string;
  color: keyof typeof colorStyles;
  icon: IconDef;
  size: NodeSize; // Controls quantized width
  arity: 0 | 1 | 2; // Number of operands (for layout variant)
  layout: NodeLayout;
  operands?: OperandKind[];
};

export const zeroOperandNames = new Set<string>(["START", "HLT", "NOP", "RET"]);
export const jumpInstructions = new Set<string>(["JMP", "JZ", "JNZ", "JC", "JNC", "JN", "CALL"]);

// --- 0. Layout Configuration (Grid Alignment) ---
// Grid Size = 20px (from PlaygroundCanvas.tsx)
// Rule: Width must be (GridSize * EvenNumber) so Center (Width/2) falls on grid line.
export const layoutConfig = {
  gridSize: 20,
  widths: {
    // 10 * 20 = 200px (for 0-operand nodes)
    xs: 200,
    // 12 * 20 = 240px
    sm: 240,
    // 16 * 20 = 320px (for 1-operand nodes)
    md: 320,
    // 20 * 20 = 400px (for 2-operand nodes)
    lg: 400,
  }
};

// --- 1. Robust Color Palette (Soft & Solid) ---
export const colorStyles: Record<string, ColorStyle> = {
  // START -> Lime
  startNode: {
    headerBg: "bg-green-100",
    bodyBg: "bg-green-200",
    borderColor: "border-green-500",
    text: "text-green-600",
    badgeBg: "bg-green-300",
    badgeText: "text-green-800",
    accent: "bg-green-100",
    borderHover: "hover:border-green-300",
    bgHover: "hover:bg-green-100",
  },

  // HLT -> Rose
  hltNode: {
    headerBg: "bg-red-100",
    bodyBg: "bg-red-100",
    borderColor: "border-red-500",
    text: "text-red-600",
    badgeBg: "bg-red-300",
    badgeText: "text-red-800",
    accent: "bg-red-100",
    borderHover: "hover:border-red-300",
    bgHover: "hover:bg-red-100",
  },

  // NOP -> Gray
  nopNode: {
    headerBg: "bg-gray-100",
    bodyBg: "bg-gray-100",
    borderColor: "border-gray-500",
    text: "text-gray-600",
    badgeBg: "bg-gray-200",
    badgeText: "text-gray-800",
    accent: "bg-gray-200",
    borderHover: "hover:border-gray-400",
    bgHover: "hover:bg-gray-100",
  },

  // LABEL -> Green
  labelNode: {
    headerBg: "bg-lime-300",
    bodyBg: "bg-lime-100",
    borderColor: "border-lime-500",
    text: "text-lime-600",
    badgeBg: "bg-lime-300",
    badgeText: "text-lime-800",
    accent: "bg-lime-100",
    borderHover: "hover:border-lime-300",
    bgHover: "hover:bg-lime-100",
  },

  // CMP -> Zinc
  cmpNode: {
    headerBg: "bg-zinc-100",
    bodyBg: "bg-zinc-100",
    borderColor: "border-zinc-500",
    text: "text-zinc-600",
    badgeBg: "bg-zinc-200",
    badgeText: "text-zinc-800",
    accent: "bg-zinc-200",
    borderHover: "hover:border-zinc-400",
    bgHover: "hover:bg-zinc-100",
  },

  // General Categories
  io: {
    headerBg: "bg-slate-100",
    bodyBg: "bg-slate-100",
    borderColor: "border-slate-500",
    text: "text-slate-600",
    badgeBg: "bg-slate-300",
    badgeText: "text-slate-700",
    accent: "bg-slate-100",
    borderHover: "hover:border-slate-300",
    bgHover: "hover:bg-slate-100",
  },

  math: {
    headerBg: "bg-orange-100",
    bodyBg: "bg-orange-100",
    borderColor: "border-orange-500",
    text: "text-orange-600",
    badgeBg: "bg-orange-300",
    badgeText: "text-orange-800",
    accent: "bg-orange-100",
    borderHover: "hover:border-orange-300",
    bgHover: "hover:bg-orange-200",
  },

  logic: {
    headerBg: "bg-violet-200",
    bodyBg: "bg-violet-100",
    borderColor: "border-violet-500",
    text: "text-violet-600",
    badgeBg: "bg-violet-300",
    badgeText: "text-violet-800",
    accent: "bg-violet-100",
    borderHover: "hover:border-violet-300",
    bgHover: "hover:bg-violet-100",
  },

  data: {
    headerBg: "bg-sky-200",
    bodyBg: "bg-sky-100",
    borderColor: "border-sky-500",
    text: "text-sky-600",
    badgeBg: "bg-sky-300",
    badgeText: "text-sky-800",
    accent: "bg-sky-200",
    borderHover: "hover:border-sky-300",
    bgHover: "hover:bg-sky-200",
  },

  bitwise: {
    headerBg: "bg-fuchsia-200",
    bodyBg: "bg-fuchsia-100",
    borderColor: "border-fuchsia-500",
    text: "text-fuchsia-600",
    badgeBg: "bg-fuchsia-300",
    badgeText: "text-fuchsia-800",
    accent: "bg-fuchsia-100",
    borderHover: "hover:border-fuchsia-300",
    bgHover: "hover:bg-fuchsia-100",
  },

  system: {
    headerBg: "bg-slate-200",
    bodyBg: "bg-slate-100",
    borderColor: "border-slate-500",
    text: "text-slate-600",
    badgeBg: "bg-slate-300",
    badgeText: "text-slate-800",
    accent: "bg-slate-200",
    borderHover: "hover:border-slate-400",
    bgHover: "hover:bg-slate-200",
  },

  default: {
    headerBg: "bg-gray-200",
    bodyBg: "bg-gray-100",
    borderColor: "border-gray-500",
    text: "text-gray-600",
    badgeBg: "bg-gray-300",
    badgeText: "text-gray-800",
    accent: "bg-gray-100",
    borderHover: "hover:border-gray-300",
    bgHover: "hover:bg-gray-100",
  }
};

// --- 2. Categorized Instructions (Assigned S/M/L) ---
export const instructionCategories: {
  title: string;
  instructions: InstructionDef[];
}[] = [
    {
      title: "System & Control",
      instructions: [
        { name: "START", color: "startNode", icon: RiFlag2Line, size: "xs", arity: 0, layout: "zero" },
        { name: "HLT", color: "hltNode", icon: Square, size: "xs", arity: 0, layout: "zero" },
        { name: "NOP", color: "nopNode", icon: Clock, size: "xs", arity: 0, layout: "zero" },
        {
          name: "LABEL",
          color: "labelNode",
          icon: FaHashtag,
          size: "md",
          arity: 1,
          layout: "label",
          operands: ["label"]
        },
      ],
    },
    {
      title: "I/O Operations",
      instructions: [
        {
          name: "IN",
          color: "io",
          icon: FaKeyboard,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["reg", "imm"]
        },
        {
          name: "OUT",
          color: "io",
          icon: MdDisplaySettings,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["imm", "reg"]
        },
      ],
    },
    {
      title: "Data Movement",
      instructions: [
        {
          name: "MOV",
          color: "data",
          icon: GoMoveToStart,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["reg", "imm", "reg"]
        },
        {
          name: "LOAD",
          color: "data",
          icon: PiDatabase,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["reg", "mem"]
        },
        {
          name: "STORE",
          color: "data",
          icon: PiDatabaseFill,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["mem", "reg"]
        },
        {
          name: "PUSH",
          color: "data",
          icon: ImMoveDown,
          size: "md",
          arity: 1,
          layout: "single",
          operands: ["reg"]
        },
        {
          name: "POP",
          color: "data",
          icon: ImMoveUp,
          size: "md",
          arity: 1,
          layout: "single",
          operands: ["reg"]
        },
      ],
    },
    {
      title: "Arithmetic (Math)",
      instructions: [
        { name: "ADD", color: "math", icon: FaPlus, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "SUB", color: "math", icon: FaMinus, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "MUL", color: "math", icon: TbX, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "DIV", color: "math", icon: TbDivide, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "INC", color: "math", icon: TbExposurePlus1, size: "md", arity: 1, layout: "single", operands: ["reg"] },
        { name: "DEC", color: "math", icon: TbExposureMinus1, size: "md", arity: 1, layout: "single", operands: ["reg"] },
      ],
    },
    {
      title: "Control Flow",
      instructions: [
        {
          name: "CMP",
          color: "cmpNode",
          icon: MdOutlineCompareArrows,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["reg", "reg", "imm"]
        },
        // Jumps - Standard Medium
        { name: "JMP", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JZ", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JNZ", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JC", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JNC", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JN", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        // Subroutines
        { name: "CALL", color: "logic", icon: TbMathFunction, size: "md", arity: 1, layout: "label", operands: ["label", "imm"] },
        { name: "RET", color: "logic", icon: TbMathFunction, size: "xs", arity: 0, layout: "zero" },
      ],
    },
    {
      title: "Logic",
      instructions: [
        { name: "AND", color: "bitwise", icon: TbLogicAnd, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "OR", color: "bitwise", icon: TbLogicOr, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "XOR", color: "bitwise", icon: TbLogicXor, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "NOT", color: "bitwise", icon: TbLogicNot, size: "md", arity: 1, layout: "single", operands: ["reg"] },
        { name: "SHL", color: "bitwise", icon: TbChevronLeft, size: "md", arity: 1, layout: "single", operands: ["reg"] },
        { name: "SHR", color: "bitwise", icon: TbChevronRight, size: "md", arity: 1, layout: "single", operands: ["reg"] },
      ],
    },
  ];
