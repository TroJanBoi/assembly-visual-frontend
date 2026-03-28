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
import { TbLogicAnd, TbLogicOr, TbLogicNot, TbLogicXor, TbLogicNand, TbLogicNor, TbLogicXnor, TbExposurePlus1, TbExposureMinus1, TbGitBranch, TbDivide, TbX, TbChevronLeft, TbChevronRight, TbMathFunction } from "react-icons/tb";
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
  button: string;
  iconBox: string;
}

export type InstructionDef = {
  name: string;
  description: string;
  color: keyof typeof colorStyles;
  icon: IconDef;
  size: NodeSize;
  arity: 0 | 1 | 2;
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
    headerBg: "bg-green-100 dark:bg-green-900/40",
    bodyBg: "bg-green-200 dark:bg-green-900/20",
    borderColor: "border-green-500 dark:border-green-600",
    text: "text-green-600 dark:text-green-400",
    badgeBg: "bg-green-300 dark:bg-green-800",
    badgeText: "text-green-800 dark:text-green-100",
    accent: "bg-green-100 dark:bg-green-900",
    borderHover: "hover:border-green-300 dark:hover:border-green-500",
    bgHover: "hover:bg-green-100 dark:hover:bg-green-900/30",
    button: "hover:border-green-400 dark:hover:border-green-500",
    iconBox: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },

  // HLT -> Rose
  hltNode: {
    headerBg: "bg-red-100 dark:bg-red-900/40",
    bodyBg: "bg-red-100 dark:bg-red-900/20",
    borderColor: "border-red-500 dark:border-red-600",
    text: "text-red-600 dark:text-red-400",
    badgeBg: "bg-red-300 dark:bg-red-800",
    badgeText: "text-red-800 dark:text-red-100",
    accent: "bg-red-100 dark:bg-red-900",
    borderHover: "hover:border-red-300 dark:hover:border-red-500",
    bgHover: "hover:bg-red-100 dark:hover:bg-red-900/30",
    button: "hover:border-red-400 dark:hover:border-red-500",
    iconBox: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },

  // NOP -> Gray
  nopNode: {
    headerBg: "bg-gray-100 dark:bg-gray-800",
    bodyBg: "bg-gray-100 dark:bg-gray-900/40",
    borderColor: "border-gray-500 dark:border-gray-600",
    text: "text-gray-600 dark:text-gray-400",
    badgeBg: "bg-gray-200 dark:bg-gray-700",
    badgeText: "text-gray-800 dark:text-gray-100",
    accent: "bg-gray-200 dark:bg-gray-800",
    borderHover: "hover:border-gray-400 dark:hover:border-gray-500",
    bgHover: "hover:bg-gray-100 dark:hover:bg-gray-800",
    button: "hover:border-gray-400 dark:hover:border-gray-500",
    iconBox: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },

  // LABEL -> Green
  labelNode: {
    headerBg: "bg-lime-300 dark:bg-lime-900/60",
    bodyBg: "bg-lime-100 dark:bg-lime-900/20",
    borderColor: "border-lime-500 dark:border-lime-600",
    text: "text-lime-600 dark:text-lime-400",
    badgeBg: "bg-lime-300 dark:bg-lime-800",
    badgeText: "text-lime-800 dark:text-lime-100",
    accent: "bg-lime-100 dark:bg-lime-900",
    borderHover: "hover:border-lime-300 dark:hover:border-lime-500",
    bgHover: "hover:bg-lime-100 dark:hover:bg-lime-900/30",
    button: "hover:border-lime-400 dark:hover:border-lime-500",
    iconBox: "bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-800",
  },

  // CMP -> Zinc
  cmpNode: {
    headerBg: "bg-zinc-100 dark:bg-zinc-800",
    bodyBg: "bg-zinc-100 dark:bg-zinc-900/40",
    borderColor: "border-zinc-500 dark:border-zinc-600",
    text: "text-zinc-600 dark:text-zinc-400",
    badgeBg: "bg-zinc-200 dark:bg-zinc-700",
    badgeText: "text-zinc-800 dark:text-zinc-100",
    accent: "bg-zinc-200 dark:bg-zinc-800",
    borderHover: "hover:border-zinc-400 dark:hover:border-zinc-500",
    bgHover: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
    button: "hover:border-zinc-400 dark:hover:border-zinc-500",
    iconBox: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  },

  // General Categories
  io: {
    headerBg: "bg-slate-100 dark:bg-slate-800",
    bodyBg: "bg-slate-100 dark:bg-slate-900/40",
    borderColor: "border-slate-500 dark:border-slate-600",
    text: "text-slate-600 dark:text-slate-400",
    badgeBg: "bg-slate-300 dark:bg-slate-700",
    badgeText: "text-slate-700 dark:text-slate-100",
    accent: "bg-slate-100 dark:bg-slate-800",
    borderHover: "hover:border-slate-300 dark:hover:border-slate-500",
    bgHover: "hover:bg-slate-100 dark:hover:bg-slate-800",
    button: "hover:border-slate-400 dark:hover:border-slate-500",
    iconBox: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  },

  math: {
    headerBg: "bg-orange-100 dark:bg-orange-900/40",
    bodyBg: "bg-orange-100 dark:bg-orange-900/20",
    borderColor: "border-orange-500 dark:border-orange-600",
    text: "text-orange-600 dark:text-orange-400",
    badgeBg: "bg-orange-300 dark:bg-orange-800",
    badgeText: "text-orange-800 dark:text-orange-100",
    accent: "bg-orange-100 dark:bg-orange-900",
    borderHover: "hover:border-orange-300 dark:hover:border-orange-500",
    bgHover: "hover:bg-orange-200 dark:hover:bg-orange-900/30",
    button: "hover:border-orange-400 dark:hover:border-orange-500",
    iconBox: "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },

  logic: {
    headerBg: "bg-violet-200 dark:bg-violet-900/50",
    bodyBg: "bg-violet-100 dark:bg-violet-900/20",
    borderColor: "border-violet-500 dark:border-violet-600",
    text: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-300 dark:bg-violet-800",
    badgeText: "text-violet-800 dark:text-violet-100",
    accent: "bg-violet-100 dark:bg-violet-900",
    borderHover: "hover:border-violet-300 dark:hover:border-violet-500",
    bgHover: "hover:bg-violet-100 dark:hover:bg-violet-900/30",
    button: "hover:border-violet-400 dark:hover:border-violet-500",
    iconBox: "bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
  },

  data: {
    headerBg: "bg-sky-200 dark:bg-sky-900/50",
    bodyBg: "bg-sky-100 dark:bg-sky-900/20",
    borderColor: "border-sky-500 dark:border-sky-600",
    text: "text-sky-600 dark:text-sky-400",
    badgeBg: "bg-sky-300 dark:bg-sky-800",
    badgeText: "text-sky-800 dark:text-sky-100",
    accent: "bg-sky-200 dark:bg-sky-900",
    borderHover: "hover:border-sky-300 dark:hover:border-sky-500",
    bgHover: "hover:bg-sky-200 dark:hover:bg-sky-900/30",
    button: "hover:border-sky-400 dark:hover:border-sky-500",
    iconBox: "bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  },

  bitwise: {
    headerBg: "bg-fuchsia-200 dark:bg-fuchsia-900/50",
    bodyBg: "bg-fuchsia-100 dark:bg-fuchsia-900/20",
    borderColor: "border-fuchsia-500 dark:border-fuchsia-600",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    badgeBg: "bg-fuchsia-300 dark:bg-fuchsia-800",
    badgeText: "text-fuchsia-800 dark:text-fuchsia-100",
    accent: "bg-fuchsia-100 dark:bg-fuchsia-900",
    borderHover: "hover:border-fuchsia-300 dark:hover:border-fuchsia-500",
    bgHover: "hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30",
    button: "hover:border-fuchsia-400 dark:hover:border-fuchsia-500",
    iconBox: "bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
  },

  system: {
    headerBg: "bg-slate-200 dark:bg-slate-800",
    bodyBg: "bg-slate-100 dark:bg-slate-900/40",
    borderColor: "border-slate-500 dark:border-slate-600",
    text: "text-slate-600 dark:text-slate-400",
    badgeBg: "bg-slate-300 dark:bg-slate-700",
    badgeText: "text-slate-800 dark:text-slate-100",
    accent: "bg-slate-200 dark:bg-slate-800",
    borderHover: "hover:border-slate-400 dark:hover:border-slate-500",
    bgHover: "hover:bg-slate-200 dark:hover:bg-slate-800",
    button: "hover:border-slate-400 dark:hover:border-slate-500",
    iconBox: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  },

  default: {
    headerBg: "bg-gray-200 dark:bg-gray-800",
    bodyBg: "bg-gray-100 dark:bg-gray-900/40",
    borderColor: "border-gray-500 dark:border-gray-600",
    text: "text-gray-600 dark:text-gray-400",
    badgeBg: "bg-gray-300 dark:bg-gray-700",
    badgeText: "text-gray-800 dark:text-gray-100",
    accent: "bg-gray-100 dark:bg-gray-800",
    borderHover: "hover:border-gray-300 dark:hover:border-gray-500",
    bgHover: "hover:bg-gray-100 dark:hover:bg-gray-800",
    button: "hover:border-gray-400 dark:hover:border-gray-500",
    iconBox: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700",
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
        { name: "START", description: "The beginning point of your program execution.", color: "startNode", icon: RiFlag2Line, size: "xs", arity: 0, layout: "zero" },
        { name: "HLT", description: "Stops the execution of the program.", color: "hltNode", icon: Square, size: "xs", arity: 0, layout: "zero" },
        { name: "NOP", description: "No Operation - Does nothing for one cycle.", color: "nopNode", icon: Clock, size: "xs", arity: 0, layout: "zero" },
        {
          name: "LABEL",
          description: "Defines a named marker for jump instructions.",
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
          description: "Reads a value from an input port into a register.",
          color: "io",
          icon: FaKeyboard,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["reg", "imm"]
        },
        {
          name: "OUT",
          description: "Sends a value from a register to an output port.",
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
          description: "Copies a value or register content into another register.",
          color: "data",
          icon: GoMoveToStart,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["reg", "imm", "reg"]
        },
        {
          name: "LOAD",
          description: "Loads a value from a memory address into a register.",
          color: "data",
          icon: PiDatabase,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["reg", "mem"]
        },
        {
          name: "STORE",
          description: "Saves a value from a register into a memory address.",
          color: "data",
          icon: PiDatabaseFill,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["mem", "reg"]
        },
        {
          name: "PUSH",
          description: "Pushes a register value onto the stack.",
          color: "data",
          icon: ImMoveDown,
          size: "md",
          arity: 1,
          layout: "single",
          operands: ["reg"]
        },
        {
          name: "POP",
          description: "Pops the top value from the stack into a register.",
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
        { name: "ADD", description: "Adds two values together and stores the result.", color: "math", icon: FaPlus, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "SUB", description: "Subtracts second value from the first and stores the result.", color: "math", icon: FaMinus, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "MUL", description: "Multiplies two values and stores the result.", color: "math", icon: TbX, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "DIV", description: "Divides first value by the second and stores the result.", color: "math", icon: TbDivide, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "INC", description: "Increments the register value by 1.", color: "math", icon: TbExposurePlus1, size: "md", arity: 1, layout: "single", operands: ["reg"] },
        { name: "DEC", description: "Decrements the register value by 1.", color: "math", icon: TbExposureMinus1, size: "md", arity: 1, layout: "single", operands: ["reg"] },
      ],
    },
    {
      title: "Control Flow",
      instructions: [
        {
          name: "CMP",
          description: "Compares two values and sets CPU flags according to the result.",
          color: "cmpNode",
          icon: MdOutlineCompareArrows,
          size: "lg",
          arity: 2,
          layout: "ds",
          operands: ["reg", "reg", "imm"]
        },
        // Jumps - Standard Medium
        { name: "JMP", description: "Unconditional jump to a specific label.", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JZ", description: "Jump to a label if the Zero flag is set (result was zero).", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JNZ", description: "Jump to a label if the Zero flag is not set (result was not zero).", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JC", description: "Jump to a label if the Carry flag is set (arithmetic overflow).", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JNC", description: "Jump to a label if the Carry flag is not set.", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        { name: "JN", description: "Jump to a label if the Negative flag is set (result was negative).", color: "logic", icon: TbGitBranch, size: "md", arity: 1, layout: "label", operands: ["label"] },
        // Subroutines
        { name: "CALL", description: "Calls a subroutine and pushes return address to stack.", color: "logic", icon: TbMathFunction, size: "md", arity: 1, layout: "label", operands: ["label", "imm"] },
        { name: "RET", description: "Returns from a subroutine by popping address from stack.", color: "logic", icon: TbMathFunction, size: "xs", arity: 0, layout: "zero" },
      ],
    },
    {
      title: "Logic",
      instructions: [
        { name: "AND", description: "Performs a bitwise AND between two values.", color: "bitwise", icon: TbLogicAnd, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "OR", description: "Performs a bitwise OR between two values.", color: "bitwise", icon: TbLogicOr, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "XOR", description: "Performs a bitwise XOR (Exclusive OR) between two values.", color: "bitwise", icon: TbLogicXor, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "NAND", description: "Bitwise NAND (NOT AND) between two values.", color: "bitwise", icon: TbLogicNand, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "NOR", description: "Bitwise NOR (NOT OR) between two values.", color: "bitwise", icon: TbLogicNor, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "XNOR", description: "Bitwise XNOR (NOT XOR) between two values.", color: "bitwise", icon: TbLogicXnor, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "NOT", description: "Inverts all bits of the value (Bitwise NOT).", color: "bitwise", icon: TbLogicNot, size: "md", arity: 1, layout: "single", operands: ["reg"] },
        { name: "SHL", description: "Shifts the bits of a value to the left.", color: "bitwise", icon: TbChevronLeft, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
        { name: "SHR", description: "Shifts the bits of a value to the right.", color: "bitwise", icon: TbChevronRight, size: "lg", arity: 2, layout: "ds", operands: ["reg", "imm", "reg"] },
      ],
    },
  ];
