// lib/playground/executor.ts
/**
 * Client-Side Assembly Execution Engine
 * Executes program items without backend dependency
 */

import { ProgramItem, Operand } from '@/lib/api/playground';
import { CPU, CPUState } from './cpu';
import { IOHandler, VirtualIO, IOState } from './io';
import { VIRTUAL_PORTS } from './ports';

// --- Constants ---
const UINT8_MASK = 0xFF;
const SIGN_BIT_MASK = 0x80;
const MAX_UINT8 = 255;

// Helper to format operands for logging
function formatOperand(op: Operand): string {
    if (!op) return '';
    if (typeof op === 'string') return op;
    if (typeof op === 'number') return String(op);

    // Handle the Operand object structure
    switch (op.type) {
        case 'Register': return op.value;
        case 'Immediate': return `${op.value}`; // Usually includes # or not depending on parser
        case 'Memory': return `[${op.value}]`;
        case 'Label': return op.value;
        default:
            // Fallback for any other structure
            return (op as any).value || JSON.stringify(op);
    }
}

// Helper for educational value formatting
function formatFullValue(val: number): string {
    const v = val & 0xFF;
    const hex = v.toString(16).toUpperCase().padStart(2, '0');

    // Spaced binary nibbles (e.g. 0000 0000)
    const binRaw = v.toString(2).padStart(8, '0');
    const bin = `${binRaw.slice(0, 4)} ${binRaw.slice(4)}`;

    // Hex-to-Char mapping (showing each hex digit as char)
    const hexChars = hex.split('').map(c => `'${c}'`).join(', ');

    // ASCII (32-126) - Only show if unique from hex chars
    let ascii = '';

    // Check if the hex chars already explain the output to avoid "doubled" confusion
    // E.g. 55 -> 0x37 -> '3', '7'. ASCII for 55 is '7'. This is confusing.
    // E.g. 65 -> 0x41 -> '4', '1'. ASCII for 65 is 'A'. This is useful.
    if (v >= 32 && v <= 126) {
        const char = String.fromCharCode(v);
        // Only show ASCII if it provides NEW information (not just repeating a hex digit)
        // AND it's not a common confusing overlap.
        // Simple heuristic: If the ASCII char is exactly one of the hex digits, skip it.
        if (!hexChars.includes(`'${char}'`)) {
            ascii = `, '${char}'`;
        }
    }

    return `${v} (0x${hex}, 0b${bin}, ${hexChars}${ascii})`;
}

export type ExecutionResult = {
    registers: Record<string, number>;
    flags: Record<string, number>;
    memory_sparse: Record<string, number>;
    ports?: Record<number, number>;
    halted: boolean;
    error: string | null;
    logs?: string[];
    io_state?: {
        logs: import('./io').LogEntry[];
        consoleBuffer: string;
        sevenSegment: number;
        outputLines: string[];
    };
};

export async function executeProgram(
    items: ProgramItem[],
    initialState: CPUState,
    maxSteps: number = 10000,
    initialIO?: Partial<IOState>,
    externalIOHandler?: IOHandler
): Promise<ExecutionResult> {
    const logs: string[] = [];
    // Use provided handler or create new one
    const ioHandler = externalIOHandler || new VirtualIO(initialIO);

    try {
        // Build instruction map: ID -> ProgramItem
        const instructionMap = new Map<number, ProgramItem>();
        let startId: number | null = null;

        for (const item of items) {
            instructionMap.set(item.id, item);
            if (item.instruction?.toUpperCase() === 'START') {
                startId = item.id;
            }
        }

        // Validate START exists
        if (startId === null) {
            console.error("[executeProgram] NO START INSTRUCTION FOUND!");
            return {
                registers: initialState.registers,
                flags: { Z: 0, C: 0, V: 0, O: 0 },
                memory_sparse: {},
                halted: true,
                error: 'No START instruction found',
                logs,
            };
        }

        // Initialize CPU
        const cpu = new CPU(initialState);
        cpu.pc = startId;
        logs.push(`Starting execution at instruction ID ${startId}`);

        // Execution loop
        let steps = 0;
        while (!cpu.halted && steps < maxSteps) {
            // Yield to event loop every 20 steps to allow UI updates (keyboard input)
            if (steps % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            const currentItem = instructionMap.get(cpu.pc);

            if (!currentItem) {
                console.error(`❌ [executeProgram] Invalid PC: ${cpu.pc} - instruction not found`);
                cpu.halt(`Invalid PC: ${cpu.pc} (instruction not found)`);
                break;
            }

            const instruction = currentItem.instruction?.toUpperCase() || '';
            logs.push(`[${steps}] PC=${cpu.pc} ${instruction}`);

            // Execute instruction
            try {
                executeInstruction(cpu, currentItem, instructionMap, logs, ioHandler);
            } catch (err: any) {
                console.error(`   ❌ [executeProgram] Error executing ${instruction}:`, err.message);
                cpu.halt(err.message || String(err));
                break;
            }

            steps++;

            // Safety check
            if (steps >= maxSteps) {
                console.error(`❌ [executeProgram] Max steps (${maxSteps}) exceeded!`);
                cpu.halt('Maximum execution steps exceeded (possible infinite loop)');
            }
        }
        logs.push(`Execution completed. Halted=${cpu.halted}, Steps=${steps}`);

        const snapshot = ioHandler.getSnapshot();
        // Return final state
        const finalResult = {
            registers: { ...cpu.registers },
            flags: { ...cpu.flags },
            memory_sparse: cpu.getMemorySparse(),
            ports: { ...cpu.ports },
            halted: cpu.halted,
            error: cpu.error,
            logs,
            io_state: {
                ...snapshot
            }
        };
        return finalResult;

    } catch (err: any) {
        logs.push(`Fatal error: ${err.message || String(err)}`);
        return {
            registers: initialState.registers,
            flags: { Z: 0, C: 0, V: 0, O: 0 },
            memory_sparse: {},
            halted: true,
            error: err.message || String(err),
            logs,
        };
    }
}

export function buildInstructionMap(items: ProgramItem[]): Map<number, ProgramItem> {
    const map = new Map<number, ProgramItem>();
    for (const item of items) {
        map.set(item.id, item);
    }
    return map;
}

/**
 * Execute a single instruction
 */
export function executeInstruction(
    cpu: CPU,
    item: ProgramItem,
    instructionMap: Map<number, ProgramItem>,
    logs: string[] = [],
    ioHandler: IOHandler
): void {
    const instruction = item.instruction?.toUpperCase() || '';
    const operands = item.operands || [];

    // 🔥 DEBUG LOG REQUESTED BY USER
    // console.log('🔥 EXECUTE:', instruction, 'ARGS:', JSON.stringify(operands));

    const pcStr = `[0x${cpu.pc.toString(16).toUpperCase().padStart(2, '0')}]`;
    const argsStr = operands.map(formatOperand).join(', ');
    const rawInstruction = `${instruction} ${argsStr}`;

    // Initial log of raw instruction
    ioHandler.addLog('CPU_INTERNAL', `${pcStr} ${rawInstruction}`);

    let narrative = "";

    switch (instruction) {
        case 'START':
        case 'NOP':
        case 'LABEL':
            cpu.pc = item.next || 0;
            break;

        case 'HLT':
            cpu.halt();
            break;

        case 'MOV': narrative = executeMOV(cpu, operands); cpu.pc = item.next || 0; break;
        case 'ADD': narrative = executeADD(cpu, operands); cpu.pc = item.next || 0; break;
        case 'SUB': narrative = executeSUB(cpu, operands); cpu.pc = item.next || 0; break;
        case 'INC': narrative = executeINC(cpu, operands); cpu.pc = item.next || 0; break;
        case 'DEC': narrative = executeDEC(cpu, operands); cpu.pc = item.next || 0; break;
        case 'MUL': narrative = executeMUL(cpu, operands); cpu.pc = item.next || 0; break;
        case 'DIV': narrative = executeDIV(cpu, operands); cpu.pc = item.next || 0; break;
        case 'AND': narrative = executeAND(cpu, operands); cpu.pc = item.next || 0; break;
        case 'OR': narrative = executeOR(cpu, operands); cpu.pc = item.next || 0; break;
        case 'XOR': narrative = executeXOR(cpu, operands); cpu.pc = item.next || 0; break;
        case 'NAND': narrative = executeNAND(cpu, operands); cpu.pc = item.next || 0; break;
        case 'NOR': narrative = executeNOR(cpu, operands); cpu.pc = item.next || 0; break;
        case 'XNOR': narrative = executeXNOR(cpu, operands); cpu.pc = item.next || 0; break;
        case 'NOT': narrative = executeNOT(cpu, operands); cpu.pc = item.next || 0; break;
        case 'SHL': narrative = executeSHL(cpu, operands); cpu.pc = item.next || 0; break;
        case 'SHR': narrative = executeSHR(cpu, operands); cpu.pc = item.next || 0; break;

        case 'LOAD': narrative = executeLOAD(cpu, operands); cpu.pc = item.next || 0; break;
        case 'STORE': narrative = executeSTORE(cpu, operands); cpu.pc = item.next || 0; break;
        case 'PUSH': narrative = executePUSH(cpu, operands); cpu.pc = item.next || 0; break;
        case 'POP': narrative = executePOP(cpu, operands); cpu.pc = item.next || 0; break;

        case 'IN': narrative = executeIN(cpu, operands, logs, ioHandler); cpu.pc = item.next || 0; break;
        case 'OUT': narrative = executeOUT(cpu, operands, logs, ioHandler); cpu.pc = item.next || 0; break;

        case 'CMP':
            narrative = executeCMP(cpu, operands);
            cpu.pc = getNextNonJump(item, instructionMap);
            break;

        case 'JMP': {
            // Visual mode: use pre-compiled next_true wire. Fallback to label resolution.
            const jmpTarget = (item as any).next_true ?? resolveJumpTarget(operands, instructionMap) ?? (item.next ?? 0);
            cpu.pc = jmpTarget;
            narrative = `Jumping to ${operands[0]?.value ?? '?'}`;
            break;
        }

        case 'JZ':
            if (cpu.flags.Z === 1) {
                // TRUE: jump via pre-compiled wire, or fall back to label resolution
                const jzTrue = (item as any).next_true ?? resolveJumpTarget(operands, instructionMap) ?? (item.next ?? 0);
                cpu.pc = jzTrue;
                narrative = `Zero flag is set (Z=1). Jumping to ${operands[0]?.value ?? '?'}`;
            } else {
                cpu.pc = getNextNonJump(item, instructionMap);
                narrative = `Zero flag is not set (Z=0). No jump.`;
            }
            break;

        case 'JNZ':
            if (cpu.flags.Z === 0) {
                const jnzTrue = (item as any).next_true ?? resolveJumpTarget(operands, instructionMap) ?? (item.next ?? 0);
                cpu.pc = jnzTrue;
                narrative = `Zero flag is clear (Z=0). Jumping to ${operands[0]?.value ?? '?'}`;
            } else {
                cpu.pc = getNextNonJump(item, instructionMap);
                narrative = `Zero flag is set (Z=1). No jump.`;
            }
            break;

        case 'JC':
            if (cpu.flags.C === 1) {
                const jcTrue = (item as any).next_true ?? resolveJumpTarget(operands, instructionMap) ?? (item.next ?? 0);
                cpu.pc = jcTrue;
                narrative = `Carry flag is set (C=1). Jumping to ${operands[0]?.value ?? '?'}`;
            } else {
                cpu.pc = getNextNonJump(item, instructionMap);
                narrative = `Carry flag is not set (C=0). No jump.`;
            }
            break;

        case 'JNC':
            if (cpu.flags.C === 0) {
                const jncTrue = (item as any).next_true ?? resolveJumpTarget(operands, instructionMap) ?? (item.next ?? 0);
                cpu.pc = jncTrue;
                narrative = `Carry flag is clear (C=0). Jumping to ${operands[0]?.value ?? '?'}`;
            } else {
                cpu.pc = getNextNonJump(item, instructionMap);
                narrative = `Carry flag is set (C=1). No jump.`;
            }
            break;

        case 'JN':
            if (cpu.flags.N === 1) {
                const jnTrue = (item as any).next_true ?? resolveJumpTarget(operands, instructionMap) ?? (item.next ?? 0);
                cpu.pc = jnTrue;
                narrative = `Negative flag is set (N=1). Jumping to ${operands[0]?.value ?? '?'}`;
            } else {
                cpu.pc = getNextNonJump(item, instructionMap);
                narrative = `Negative flag is not set (N=0). No jump.`;
            }
            break;

        case 'CALL':
            const returnAddress = item.next ?? 0;
            cpu.push(returnAddress);
            cpu.pc = resolveJumpTarget(operands, instructionMap) || 0;
            narrative = `Calling subroutine at ${operands[0].value}. Return address ${returnAddress} pushed to stack.`;
            break;

        case 'RET':
            const retAddr = cpu.pop();
            cpu.pc = retAddr;
            narrative = `Returning from subroutine to address ${retAddr}.`;
            break;

        default:
            throw new Error(`Unknown instruction: ${instruction}`);
    }

    // Log the narrative if available
    if (narrative) {
        ioHandler.addLog('SYSTEM', `↳ ${narrative}`);
    }
}

// Helper: Get next sequential instruction
function getNextNonJump(item: ProgramItem, map: Map<number, ProgramItem>): number {
    // Branching nodes map their 'False' wire termination to next_false.
    return item.next ?? (item as any).next_false ?? 0;
}

// Helper: Resolve jump target from label operand
function resolveJumpTarget(operands: Operand[], instructionMap: Map<number, ProgramItem>): number | null {
    const labelOperand = operands.find(op => op.type === 'Label');
    if (!labelOperand) return null;

    const labelName = labelOperand.value;
    for (const [id, item] of instructionMap.entries()) {
        if (item.instruction?.toUpperCase() === 'LABEL' && item.label === labelName) {
            return id;
        }
    }
    throw new Error(`Label not found: ${labelName}`);
}

// ===== Logic Helpers =====

/**
 * Calculates Signed Overflow Flag (V)
 * Formula: ((Dest XOR Result) AND (Src XOR Result) AND 0x80) !== 0
 * Used for ADD. For SUB, Src is inverted.
 */
function calculateOverflow(dest: number, src: number, result: number, isSub: boolean = false): boolean {
    const truncated = result & UINT8_MASK;
    if (isSub) {
        // Subtraction Overflow: (A ^ B) & (A ^ R) & 0x80
        return ((dest ^ src) & (dest ^ truncated) & SIGN_BIT_MASK) !== 0;
    } else {
        // Addition Overflow: (A ^ R) & (B ^ R) & 0x80
        return ((dest ^ truncated) & (src ^ truncated) & SIGN_BIT_MASK) !== 0;
    }
}

function getOperandValue(cpu: CPU, operand: Operand): number {
    switch (operand.type) {
        case 'Register':
            return cpu.getRegister(operand.value);
        case 'Immediate':
            const imm = operand.value.replace('#', '');
            const value = parseInt(imm, 10);
            if (isNaN(value)) throw new Error(`Invalid immediate value: ${operand.value}`);
            return value;
        case 'Memory':
            const addr = parseInt(operand.value, 10);
            if (isNaN(addr)) throw new Error(`Invalid memory address: ${operand.value}`);
            const rawValue = cpu.readMemory(addr);

            // Debug Logging requested by User
            console.group(`🔍 Debugging Fetch: Memory[${addr}]`);
            // cpu.memory is sparse map in simulation? No, cpu.readMemory accesses cpu.memory array in CPU class?
            // Checking CPU class interface... assuming cpu.getMemorySparse() or similar is available for debug?
            // Or just logging the value found.
            console.groupEnd();

            return rawValue;
        default:
            throw new Error(`Unsupported operand type: ${operand.type}`);
    }
}

// ===== Operation Handlers =====

function executeMOV(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 2) throw new Error('MOV requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('MOV destination must be a register');
    const val = getOperandValue(cpu, src);
    cpu.setRegister(dest.value, val);
    return `${dest.value} <- ${formatFullValue(val)} (Copy ${val} to ${dest.value})`;
}

function executeADD(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 2) throw new Error('ADD requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('ADD destination must be a register');

    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue + srcValue;

    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result > MAX_UINT8, calculateOverflow(destValue, srcValue, result, false));
    return `Add ${srcValue} to ${destValue}, result ${formatFullValue(result)} stored in ${dest.value}`;
}

function executeSUB(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 2) throw new Error('SUB requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('SUB destination must be a register');

    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue - srcValue;

    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result < 0, calculateOverflow(destValue, srcValue, result, true));
    return `Subtract ${srcValue} from ${destValue}, result ${formatFullValue(result)} stored in ${dest.value}`;
}

function executeINC(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 1) throw new Error('INC requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('INC operand must be a register');

    const value = cpu.getRegister(dest.value);
    const result = value + 1;
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result > MAX_UINT8);
    return `Increment ${dest.value} by 1, result is ${formatFullValue(result)}`;
}

function executeDEC(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 1) throw new Error('DEC requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('DEC operand must be a register');

    const value = cpu.getRegister(dest.value);
    const result = value - 1;
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result < 0);
    return `Decrement ${dest.value} by 1, result is ${formatFullValue(result)}`;
}

function executeCMP(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 2) throw new Error('CMP requires 2 operands');
    const [op1, op2] = operands;
    const val1 = getOperandValue(cpu, op1);
    const val2 = getOperandValue(cpu, op2);
    const result = val1 - val2;
    cpu.setFlags(result, result < 0, calculateOverflow(val1, val2, result, true));

    let relation = "equal to";
    if (val1 > val2) relation = "greater than";
    if (val1 < val2) relation = "less than";

    return `Comparing ${val1} and ${val2}: ${val1} is ${relation} ${val2}. (Z=${cpu.flags.Z}, C=${cpu.flags.C})`;
}

function executeMUL(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 2) throw new Error('MUL requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('MUL destination must be a register');

    const val1 = cpu.getRegister(dest.value);
    const val2 = getOperandValue(cpu, src);
    const result = val1 * val2;

    cpu.setRegister(dest.value, result & UINT8_MASK);
    cpu.setFlags(result & UINT8_MASK, result > MAX_UINT8);
    return `Multiply ${val1} by ${val2}, result ${formatFullValue(result)} stored in ${dest.value}`;
}

function executeDIV(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 2) throw new Error('DIV requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('DIV destination must be a register');

    const val1 = cpu.getRegister(dest.value);
    const val2 = getOperandValue(cpu, src);
    if (val2 === 0) throw new Error('Division by zero');

    const result = Math.floor(val1 / val2);
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, false);
    return `Divide ${val1} by ${val2}, result ${formatFullValue(result)} stored in ${dest.value}`;
}

function executeAND(cpu: CPU, operands: Operand[]): string {
    return bitwiseOp(cpu, operands, (a, b) => a & b, 'AND');
}
function executeOR(cpu: CPU, operands: Operand[]): string {
    return bitwiseOp(cpu, operands, (a, b) => a | b, 'OR');
}
function executeXOR(cpu: CPU, operands: Operand[]): string {
    return bitwiseOp(cpu, operands, (a, b) => a ^ b, 'XOR');
}
function executeNAND(cpu: CPU, operands: Operand[]): string {
    return bitwiseOp(cpu, operands, (a, b) => ~(a & b) & UINT8_MASK, 'NAND');
}
function executeNOR(cpu: CPU, operands: Operand[]): string {
    return bitwiseOp(cpu, operands, (a, b) => ~(a | b) & UINT8_MASK, 'NOR');
}
function executeXNOR(cpu: CPU, operands: Operand[]): string {
    return bitwiseOp(cpu, operands, (a, b) => ~(a ^ b) & UINT8_MASK, 'XNOR');
}
function bitwiseOp(cpu: CPU, operands: Operand[], op: (a: number, b: number) => number, name: string): string {
    if (operands.length !== 2) throw new Error(`${name} requires 2 operands`);
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('Destination must be register');
    const val1 = cpu.getRegister(dest.value);
    const val2 = getOperandValue(cpu, src);
    const res = op(val1, val2);
    cpu.setRegister(dest.value, res);
    cpu.setFlags(res, false);
    return `Perform ${name} on ${val1} and ${val2}, result ${formatFullValue(res)} stored in ${dest.value}`;
}

function executeNOT(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 1) throw new Error('NOT requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('NOT operand must be register');
    const val = cpu.getRegister(dest.value);
    const res = (~val) & UINT8_MASK;
    cpu.setRegister(dest.value, res);
    cpu.setFlags(res, false);
    return `Invert bits of ${val} (NOT), result ${formatFullValue(res)} stored in ${dest.value}`;
}

function executeSHL(cpu: CPU, operands: Operand[]): string {
    return shiftOp(cpu, operands, (a, b) => (a << b) & UINT8_MASK, 'SHL');
}
function executeSHR(cpu: CPU, operands: Operand[]): string {
    return shiftOp(cpu, operands, (a, b) => (a >>> b) & UINT8_MASK, 'SHR');
}
function shiftOp(cpu: CPU, operands: Operand[], op: (a: number, b: number) => number, name: string): string {
    if (operands.length !== 2) throw new Error(`${name} requires 2 operands`);
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('Destination must be register');
    const val = cpu.getRegister(dest.value);
    const shift = getOperandValue(cpu, src);
    const res = op(val, shift);
    cpu.setRegister(dest.value, res);
    cpu.setFlags(res, false);
    return `Shift ${val} ${name === 'SHL' ? 'left' : 'right'} by ${shift} bits, result ${formatFullValue(res)} stored in ${dest.value}`;
}

function executeLOAD(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 2) throw new Error('LOAD requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('LOAD destination must be a register');

    const address = getOperandValue(cpu, src);
    if (address >= 224) {
        throw new Error(`Access Violation: Cannot read from Stack Memory (${address})`);
    }

    const val = cpu.readMemory(address);
    cpu.setRegister(dest.value, val);
    return `Load value from Memory Address ${address} into ${dest.value}. Value is ${formatFullValue(val)}`;
}

function executeSTORE(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 2) throw new Error('STORE requires 2 operands');
    const [dest, src] = operands;
    if (src.type !== 'Register') throw new Error('STORE source must be a register');

    const address = getOperandValue(cpu, dest);
    if (address >= 224) {
        throw new Error(`Access Violation: Cannot write to Stack Memory (${address})`);
    }

    const val = cpu.getRegister(src.value);
    cpu.writeMemory(address, val);
    return `Store value from ${src.value} (${formatFullValue(val)}) into Memory Address ${address}`;
}

function executePUSH(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 1) throw new Error('PUSH requires 1 operand');
    const val = getOperandValue(cpu, operands[0]);
    cpu.push(val);
    return `Pushed ${formatFullValue(val)} to stack. SP is now ${cpu.sp}`;
}

function executePOP(cpu: CPU, operands: Operand[]): string {
    if (operands.length !== 1) throw new Error('POP requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('POP destination must be a register');
    const val = cpu.pop();
    cpu.setRegister(dest.value, val);
    return `Popped ${formatFullValue(val)} from stack into ${dest.value}. SP is now ${cpu.sp}`;
}

function executeIN(cpu: CPU, operands: Operand[], logs: string[], io: IOHandler): string {
    if (operands.length !== 2) throw new Error('IN requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('IN destination must be a register');
    const port = getOperandValue(cpu, src);
    const value = io.onRead(port);

    if (value === null) {
        throw new Error('INPUT_REQUIRED');
    }

    if (logs) logs.push(`> Input from port ${port}: ${value}`);
    cpu.setRegister(dest.value, value);

    const portName = VIRTUAL_PORTS.find(p => p.id === port)?.name || `Port ${port}`;
    return `Read value from ${portName} into ${dest.value}. Value is ${formatFullValue(value)}`;
}

function executeOUT(cpu: CPU, operands: Operand[], logs: string[], io: IOHandler): string {
    if (operands.length !== 2) throw new Error('OUT requires 2 operands');
    const [portOp, valOp] = operands;
    const portVal = getOperandValue(cpu, portOp);
    const value = getOperandValue(cpu, valOp);

    io.onWrite(portVal, value);

    if (!cpu.ports) cpu.ports = {};
    cpu.ports[portVal] = value & 0xFF;

    if (logs) logs.push(`> OUT Port ${portVal}: ${value}`);

    const portName = VIRTUAL_PORTS.find(p => p.id === portVal)?.name || `Port ${portVal}`;
    return `Output ${formatFullValue(value)} to ${portName}`;
}
