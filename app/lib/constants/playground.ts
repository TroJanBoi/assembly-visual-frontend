// Playground configuration constants

/**
 * Visual and interaction constants for the playground
 */
export const PLAYGROUND_UI = {
    /** Distance threshold for node proximity detection during drag */
    PROXIMITY_THRESHOLD: 200,

    /** Width of the processor dashboard panel */
    PANEL_WIDTH: 384,

    /** Margin around draggable panels */
    PANEL_MARGIN: 20,
} as const;

/**
 * Memory configuration constants
 */
export const MEMORY_CONFIG = {
    /** Total memory size in bytes */
    SIZE: 256,

    /** Starting address for stack (0xE0) */
    STACK_START: 224,

    /** Maximum addressable memory (0xFF) */
    MAX_ADDRESS: 255,

    /** Maximum value per memory cell */
    MAX_VALUE: 255,
} as const;

/**
 * Instruction sets that have special handling rules
 */
export const INSTRUCTION_SETS = {
    /** Instructions that require exactly 2 operands */
    TWO_OPERAND: new Set(['MOV', 'LOAD', 'STORE', 'ADD', 'SUB', 'MUL', 'DIV', 'CMP', 'IN', 'OUT']),

    /** Instructions that require 0 operands */
    ZERO_OPERAND: new Set(['HLT', 'NOP']),

    /** Instructions that require 1 operand */
    ONE_OPERAND: new Set(['INC', 'DEC', 'PUSH', 'POP']),

    /** Jump instructions that require 1 label operand */
    JUMP_ONE_OPERAND: new Set(['JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN']),

    /** LABEL instruction (special case with string argument) */
    LABEL_INSTRUCTION: 'LABEL',

    /** Stack instructions that require 1 register operand */
    STACK_ONE_OPERAND: new Set(['PUSH', 'POP']),

    /** Instructions that are forbidden from having 'next' field */
    FORBIDDEN_NEXT: new Set(['JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN', 'HLT', 'LABEL', 'NOP']),

    /** Core instructions that are always allowed */
    ALWAYS_ALLOWED: new Set(['HLT', 'START']),
} as const;

/**
 * Default CPU state configuration
 */
export const DEFAULT_CPU_STATE = {
    /** Default register names (8 registers) */
    REGISTER_NAMES: ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] as const,

    /** Default flag names */
    FLAG_NAMES: ['Z', 'C', 'V', 'O'] as const,

    /** Default register count */
    DEFAULT_REGISTER_COUNT: 8,
} as const;

/**
 * Viewport and positioning constants
 */
export const VIEWPORT = {
    /** Minimum position offset to ensure nodes are visible */
    MIN_POSITION_OFFSET: 20,

    /** Default zoom level */
    DEFAULT_ZOOM: 1,
} as const;
