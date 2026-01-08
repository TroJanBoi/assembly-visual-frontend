// lib/playground/executor.ts
/**
 * Client-Side Assembly Execution Engine
 * Executes program items without backend dependency
 */

import { ProgramItem, Operand } from '@/lib/api/playground';
import { CPU, CPUState } from './cpu';
import { IOHandler, VirtualIO, IOState } from './io';

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
        ledMatrix: number[];
        ledSelectedRow: number;
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
            console.error("❌ [executeProgram] NO START INSTRUCTION FOUND!");
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
        console.log("✅ [executeProgram] Found START at ID:", startId);
        console.log("🔄 [executeProgram] Starting execution loop...");
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
            console.log(`   [Step ${steps}] PC=${cpu.pc} → ${instruction}`);
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

        console.log(`✅ [executeProgram] Loop finished: ${steps} steps, Halted=${cpu.halted}`);
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
                ...snapshot,
                ledMatrix: Array.from(snapshot.ledMatrix)
            }
        };

        console.log("📦 [executeProgram] Returning result:");
        console.log("   - Registers:", finalResult.registers);
        console.log("   - Flags:", finalResult.flags);
        console.log("   - Memory items:", Object.keys(finalResult.memory_sparse).length);
        console.log("   - Halted:", finalResult.halted);

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

    // LOG TYPE: CPU_INTERNAL
    // Format: [PC:xx] Instruction OP1, OP2
    const pcStr = `[0x${cpu.pc.toString(16).toUpperCase().padStart(2, '0')}]`;
    const argsStr = operands.map(formatOperand).join(', ');
    ioHandler.addLog('CPU_INTERNAL', `${pcStr} ${instruction} ${argsStr}`);

    switch (instruction) {
        case 'START':
        case 'NOP':
        case 'LABEL':
            cpu.pc = item.next || 0;
            break;

        case 'HLT':
            cpu.halt();
            break;

        case 'MOV': executeMOV(cpu, operands); cpu.pc = item.next || 0; break;
        case 'ADD': executeADD(cpu, operands); cpu.pc = item.next || 0; break;
        case 'SUB': executeSUB(cpu, operands); cpu.pc = item.next || 0; break;
        case 'INC': executeINC(cpu, operands); cpu.pc = item.next || 0; break;
        case 'DEC': executeDEC(cpu, operands); cpu.pc = item.next || 0; break;
        case 'MUL': executeMUL(cpu, operands); cpu.pc = item.next || 0; break;
        case 'DIV': executeDIV(cpu, operands); cpu.pc = item.next || 0; break;
        case 'AND': executeAND(cpu, operands); cpu.pc = item.next || 0; break;
        case 'OR': executeOR(cpu, operands); cpu.pc = item.next || 0; break;
        case 'XOR': executeXOR(cpu, operands); cpu.pc = item.next || 0; break;
        case 'NOT': executeNOT(cpu, operands); cpu.pc = item.next || 0; break;
        case 'SHL': executeSHL(cpu, operands); cpu.pc = item.next || 0; break;
        case 'SHR': executeSHR(cpu, operands); cpu.pc = item.next || 0; break;

        case 'LOAD': executeLOAD(cpu, operands); cpu.pc = item.next || 0; break;
        case 'STORE': executeSTORE(cpu, operands); cpu.pc = item.next || 0; break;
        case 'PUSH': executePUSH(cpu, operands); cpu.pc = item.next || 0; break;
        case 'POP': executePOP(cpu, operands); cpu.pc = item.next || 0; break;

        case 'IN': executeIN(cpu, operands, logs, ioHandler); cpu.pc = item.next || 0; break;
        case 'OUT': executeOUT(cpu, operands, logs, ioHandler); cpu.pc = item.next || 0; break;

        case 'CMP':
            executeCMP(cpu, operands);
            if (cpu.flags.Z === 1) {
                cpu.pc = (item as any).next_true || 0;
            } else {
                cpu.pc = (item as any).next_false || 0;
            }
            break;

        case 'JMP':
            cpu.pc = resolveJumpTarget(operands, instructionMap) || (item.next || 0);
            break;

        case 'JZ':
            cpu.pc = cpu.flags.Z === 1
                ? (resolveJumpTarget(operands, instructionMap) || (item.next || 0))
                : getNextNonJump(item, instructionMap);
            break;

        case 'JNZ':
            cpu.pc = cpu.flags.Z === 0
                ? (resolveJumpTarget(operands, instructionMap) || (item.next || 0))
                : getNextNonJump(item, instructionMap);
            break;

        case 'JC':
            cpu.pc = cpu.flags.C === 1 ? (item.next || 0) : getNextNonJump(item, instructionMap);
            break;

        case 'JNC':
            cpu.pc = cpu.flags.C === 0 ? (item.next || 0) : getNextNonJump(item, instructionMap);
            break;

        case 'JN':
            cpu.pc = cpu.flags.N === 1 ? (item.next || 0) : getNextNonJump(item, instructionMap);
            break;

        case 'CALL':
            const returnAddress = item.next ?? 0;
            cpu.push(returnAddress);
            cpu.pc = resolveJumpTarget(operands, instructionMap) || 0;
            break;

        case 'RET':
            const retAddr = cpu.pop();
            cpu.pc = retAddr;
            break;

        default:
            throw new Error(`Unknown instruction: ${instruction}`);
    }
}

// Helper: Get next sequential instruction
function getNextNonJump(item: ProgramItem, map: Map<number, ProgramItem>): number {
    return item.next || 0;
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
            console.log('Target Address:', addr);
            // cpu.memory is sparse map in simulation? No, cpu.readMemory accesses cpu.memory array in CPU class?
            // Checking CPU class interface... assuming cpu.getMemorySparse() or similar is available for debug?
            // Or just logging the value found.
            console.log('Value Found:', rawValue);
            console.groupEnd();

            return rawValue;
        default:
            throw new Error(`Unsupported operand type: ${operand.type}`);
    }
}

// ===== Operation Handlers =====

function executeMOV(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 2) throw new Error('MOV requires 2 operands');
    const [dest, src] = operands;
    // Note: getOperandValue works for Src. Dest must be validated.
    if (dest.type !== 'Register') throw new Error('MOV destination must be a register');
    cpu.setRegister(dest.value, getOperandValue(cpu, src));
}

function executeADD(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 2) throw new Error('ADD requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('ADD destination must be a register');

    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue + srcValue;

    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result > MAX_UINT8, calculateOverflow(destValue, srcValue, result, false));
}

function executeSUB(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 2) throw new Error('SUB requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('SUB destination must be a register');

    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue - srcValue;

    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result < 0, calculateOverflow(destValue, srcValue, result, true));
}

function executeINC(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 1) throw new Error('INC requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('INC operand must be a register');

    const value = cpu.getRegister(dest.value);
    const result = value + 1;
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result > MAX_UINT8);
}

function executeDEC(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 1) throw new Error('DEC requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('DEC operand must be a register');

    const value = cpu.getRegister(dest.value);
    const result = value - 1;
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result < 0);
}

function executeCMP(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 2) throw new Error('CMP requires 2 operands');
    const [op1, op2] = operands;
    const val1 = getOperandValue(cpu, op1);
    const val2 = getOperandValue(cpu, op2);
    const result = val1 - val2;
    // CMP acts like SUB but discards result. Preserve V flag logic.
    cpu.setFlags(result, result < 0, calculateOverflow(val1, val2, result, true));
}

function executeMUL(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 2) throw new Error('MUL requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('MUL destination must be a register');

    const val1 = cpu.getRegister(dest.value);
    const val2 = getOperandValue(cpu, src);
    const result = val1 * val2;

    cpu.setRegister(dest.value, result & UINT8_MASK);
    cpu.setFlags(result & UINT8_MASK, result > MAX_UINT8);
}

function executeDIV(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 2) throw new Error('DIV requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('DIV destination must be a register');

    const val1 = cpu.getRegister(dest.value);
    const val2 = getOperandValue(cpu, src);
    if (val2 === 0) throw new Error('Division by zero');

    const result = Math.floor(val1 / val2);
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, false);
}

function executeAND(cpu: CPU, operands: Operand[]) {
    bitwiseOp(cpu, operands, (a, b) => a & b);
}
function executeOR(cpu: CPU, operands: Operand[]) {
    bitwiseOp(cpu, operands, (a, b) => a | b);
}
function executeXOR(cpu: CPU, operands: Operand[]) {
    bitwiseOp(cpu, operands, (a, b) => a ^ b);
}
function bitwiseOp(cpu: CPU, operands: Operand[], op: (a: number, b: number) => number) {
    if (operands.length !== 2) throw new Error('Bitwise Op requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('Destination must be register');
    const val1 = cpu.getRegister(dest.value);
    const val2 = getOperandValue(cpu, src);
    const res = op(val1, val2);
    cpu.setRegister(dest.value, res);
    cpu.setFlags(res, false);
}

function executeNOT(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 1) throw new Error('NOT requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('NOT operand must be register');
    const val = cpu.getRegister(dest.value);
    const res = (~val) & UINT8_MASK;
    cpu.setRegister(dest.value, res);
    cpu.setFlags(res, false);
}

function executeSHL(cpu: CPU, operands: Operand[]) {
    shiftOp(cpu, operands, (a, b) => (a << b) & UINT8_MASK);
}
function executeSHR(cpu: CPU, operands: Operand[]) {
    shiftOp(cpu, operands, (a, b) => (a >>> b) & UINT8_MASK);
}
function shiftOp(cpu: CPU, operands: Operand[], op: (a: number, b: number) => number) {
    if (operands.length !== 2) throw new Error('Shift Op requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('Destination must be register');
    const val = cpu.getRegister(dest.value);
    const shift = getOperandValue(cpu, src);
    const res = op(val, shift);
    cpu.setRegister(dest.value, res);
    cpu.setFlags(res, false);
}

function executeLOAD(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 2) throw new Error('LOAD requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('LOAD destination must be a register');

    const address = getOperandValue(cpu, src);
    if (address >= 224) {
        throw new Error(`Access Violation: Cannot read from Stack Memory (${address})`);
    }

    cpu.setRegister(dest.value, cpu.readMemory(address));
}

function executeSTORE(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 2) throw new Error('STORE requires 2 operands');
    const [dest, src] = operands;
    if (src.type !== 'Register') throw new Error('STORE source must be a register');

    const address = getOperandValue(cpu, dest);
    if (address >= 224) {
        throw new Error(`Access Violation: Cannot write to Stack Memory (${address})`);
    }

    cpu.writeMemory(address, cpu.getRegister(src.value));
}

function executePUSH(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 1) throw new Error('PUSH requires 1 operand');
    cpu.push(getOperandValue(cpu, operands[0]));
}

function executePOP(cpu: CPU, operands: Operand[]) {
    if (operands.length !== 1) throw new Error('POP requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('POP destination must be a register');
    cpu.setRegister(dest.value, cpu.pop());
}

function executeIN(cpu: CPU, operands: Operand[], logs: string[], io: IOHandler) {
    if (operands.length !== 2) throw new Error('IN requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('IN destination must be a register');
    const port = getOperandValue(cpu, src);
    const value = io.onRead(port);

    // BUG FIX #6: Blocking I/O - throw exception if no input available
    if (value === null) {
        throw new Error('INPUT_REQUIRED');
    }

    if (logs) logs.push(`> Input from port ${port}: ${value}`);
    cpu.setRegister(dest.value, value);
}

function executeOUT(cpu: CPU, operands: Operand[], logs: string[], io: IOHandler) {
    if (operands.length !== 2) throw new Error('OUT requires 2 operands');
    const [portOp, valOp] = operands;
    const portVal = getOperandValue(cpu, portOp);
    const value = getOperandValue(cpu, valOp);

    // 1. Virtual IO (Side Effects like Console)
    io.onWrite(portVal, value);

    // 2. Port State Update (Persistent Hardware State)
    if (!cpu.ports) cpu.ports = {};
    cpu.ports[portVal] = value & 0xFF; // Ensure 8-bit

    if (logs) logs.push(`> OUT Port ${portVal}: ${value}`);
}
