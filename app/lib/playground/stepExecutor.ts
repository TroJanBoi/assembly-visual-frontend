// lib/playground/stepExecutor.ts
/**
 * Step-by-Step Execution Engine
 * Allows users to execute programs one instruction at a time for debugging
 */

import { ProgramItem, Operand } from '@/lib/api/playground';
import { CPU, CPUState } from './cpu';
import { IOHandler, VirtualIO } from './io';

export type StepExecutionState = {
    cpu: CPU;
    currentPC: number;
    currentInstruction: ProgramItem | null;
    halted: boolean;
    error: string | null;
    stepCount: number;
    logs: string[];
    instructionMap: Map<number, ProgramItem>;
    ioHandler: IOHandler;
};

/**
 * Initialize step execution
 */
export function initializeStepExecution(
    items: ProgramItem[],
    initialState: CPUState,
    externalIOHandler?: IOHandler
): StepExecutionState {
    // Build instruction map
    const instructionMap = new Map<number, ProgramItem>();
    let startId: number | null = null;

    for (const item of items) {
        instructionMap.set(item.id, item);
        if (item.instruction?.toUpperCase() === 'START') {
            startId = item.id;
        }
    }

    if (startId === null) {
        throw new Error('No START instruction found');
    }

    // Initialize CPU
    const cpu = new CPU(initialState);
    cpu.pc = startId;

    return {
        cpu,
        currentPC: startId,
        currentInstruction: instructionMap.get(startId) || null,
        halted: false,
        error: null,
        stepCount: 0,
        logs: [`Initialized at instruction ID ${startId}`],
        instructionMap,
        ioHandler: externalIOHandler || new VirtualIO(),
    };
}

/**
 * Execute a single step
 */
export function executeStep(state: StepExecutionState): StepExecutionState {
    if (state.halted) {
        return state; // Already halted, no-op
    }

    const currentItem = state.instructionMap.get(state.cpu.pc);

    if (!currentItem) {
        return {
            ...state,
            halted: true,
            error: `Invalid PC: ${state.cpu.pc} (instruction not found)`,
        };
    }

    const instruction = currentItem.instruction?.toUpperCase() || '';
    const newLogs = [...state.logs, `[${state.stepCount}] PC=${state.cpu.pc} ${instruction}`];

    try {
        // Execute instruction (import from executor.ts)
        // Execute instruction (import from executor.ts)
        executeInstructionStep(state.cpu, currentItem, state.instructionMap, state.ioHandler);

        // Get next instruction
        const nextInstruction = state.instructionMap.get(state.cpu.pc) || null;

        return {
            ...state,
            currentPC: state.cpu.pc,
            currentInstruction: nextInstruction,
            halted: state.cpu.halted,
            error: state.cpu.error,
            stepCount: state.stepCount + 1,
            logs: newLogs,
        };
    } catch (err: any) {
        return {
            ...state,
            halted: true,
            error: err.message || String(err),
            logs: [...newLogs, `Error: ${err.message || String(err)}`],
        };
    }
}

/**
 * Get current CPU state for UI display
 */
export function getCurrentState(state: StepExecutionState) {
    return {
        registers: { ...state.cpu.registers },
        flags: { ...state.cpu.flags },
        memory_sparse: state.cpu.getMemorySparse(),
        halted: state.halted,
        error: state.error,
        currentPC: state.currentPC,
        stepCount: state.stepCount,
    };
}

// ===== Instruction Execution (copied from executor.ts) =====
// We need to import the actual implementation or duplicate it here
// For now, I'll import the logic

function executeInstructionStep(
    cpu: CPU,
    item: ProgramItem,
    instructionMap: Map<number, ProgramItem>,
    ioHandler: IOHandler
): void {
    const instruction = item.instruction?.toUpperCase() || '';
    const operands = item.operands || [];

    switch (instruction) {
        case 'START':
            cpu.pc = item.next || 0;
            break;

        case 'HLT':
            cpu.halt();
            break;

        case 'NOP':
            cpu.pc = item.next || 0;
            break;

        case 'MOV':
            executeMOV(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'ADD':
            executeADD(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'SUB':
            executeSUB(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'INC':
            executeINC(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'DEC':
            executeDEC(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'LOAD':
            executeLOAD(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'STORE':
            executeSTORE(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'CMP':
            executeCMP(cpu, operands);
            // CMP uses next_true (if equal) or next_false (if not equal)
            if (cpu.flags.Z === 1) {
                cpu.pc = (item as any).next_true || 0;
            } else {
                cpu.pc = (item as any).next_false || 0;
            }
            break;

        case 'JMP':
            // JMP resolves label operand to find target instruction
            cpu.pc = resolveJumpTarget(operands, instructionMap) || (item.next || 0);
            break;

        case 'JZ':
            if (cpu.flags.Z === 1) {
                cpu.pc = resolveJumpTarget(operands, instructionMap) || (item.next || 0);
            } else {
                cpu.pc = getNextNonJump(item);
            }
            break;

        case 'JNZ':
            if (cpu.flags.Z === 0) {
                cpu.pc = resolveJumpTarget(operands, instructionMap) || (item.next || 0);
            } else {
                cpu.pc = getNextNonJump(item);
            }
            break;

        case 'JC':
            cpu.pc = cpu.flags.C === 1 ? (item.next || 0) : getNextNonJump(item);
            break;

        case 'JNC':
            cpu.pc = cpu.flags.C === 0 ? (item.next || 0) : getNextNonJump(item);
            break;

        case 'MUL':
            executeMUL(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'DIV':
            executeDIV(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'IN':
            executeIN(cpu, operands, ioHandler);
            cpu.pc = item.next || 0;
            break;

        case 'OUT':
            executeOUT(cpu, operands, ioHandler);
            cpu.pc = item.next || 0;
            break;

        case 'JN':
            cpu.pc = cpu.flags.N === 1 ? (item.next || 0) : getNextNonJump(item);
            break;

        case 'PUSH':
            executePUSH(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'POP':
            executePOP(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'AND':
            executeAND(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'OR':
            executeOR(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'XOR':
            executeXOR(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'NOT':
            executeNOT(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'SHL':
            executeSHL(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'SHR':
            executeSHR(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'LABEL':
            cpu.pc = item.next || 0;
            break;

        default:
            throw new Error(`Unknown instruction: ${instruction}`);
    }
}

function getNextNonJump(item: ProgramItem): number {
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

// Operation implementations (same as executor.ts)
function executeMOV(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('MOV requires 2 operands');
    const [dest, src] = operands;
    const value = getOperandValue(cpu, src);
    if (dest.type !== 'Register') throw new Error('MOV destination must be a register');
    cpu.setRegister(dest.value, value);
}

function executeADD(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('ADD requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('ADD destination must be a register');
    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue + srcValue;
    cpu.setRegister(dest.value, result);
    // Carry: result > 255
    // Overflow: (Op1^Res)&(Op2^Res)&0x80
    // Simplified: same sign operands -> different sign result
    const overflow = ((destValue ^ result) & (srcValue ^ result) & 0x80) !== 0;
    cpu.setFlags(result, result > 255, overflow);
}

function executeSUB(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('SUB requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('SUB destination must be a register');
    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue - srcValue;
    cpu.setRegister(dest.value, result);
    // Carry (Borrow): result < 0
    // Overflow: (Op1^Op2)&(Op1^Res)&0x80
    // Simplified: different sign operands -> sign of result != sign of dest
    const overflow = ((destValue ^ srcValue) & (destValue ^ result) & 0x80) !== 0;
    cpu.setFlags(result, result < 0, overflow);
}

function executeINC(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 1) throw new Error('INC requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('INC operand must be a register');
    const value = cpu.getRegister(dest.value);
    const result = value + 1;
    cpu.setRegister(dest.value, result);
    // INC only affects Z, O, V usually. C is debated but x86 INC does NOT set carry. 
    // Here we seemingly set Carry in existing code. We will keep checking result > 255.
    // Overflow: 127 + 1 = 128 (-128) -> Overflow
    const overflow = (value === 0x7F);
    cpu.setFlags(result, result > 255, overflow);
}

function executeDEC(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 1) throw new Error('DEC requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('DEC operand must be a register');
    const value = cpu.getRegister(dest.value);
    const result = value - 1;
    cpu.setRegister(dest.value, result);
    // DEC does not set carry on x86.
    // Overflow: -128 - 1 = -129 (+127) -> Overflow
    const overflow = (value === 0x80);
    cpu.setFlags(result, result < 0, overflow);
}

function executeLOAD(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('LOAD requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('LOAD destination must be a register');
    const address = getOperandValue(cpu, src);
    const value = cpu.readMemory(address);
    cpu.setRegister(dest.value, value);
}

function executeSTORE(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('STORE requires 2 operands');
    const [dest, src] = operands;
    if (src.type !== 'Register') throw new Error('STORE source must be a register');
    const address = getOperandValue(cpu, dest);
    const value = cpu.getRegister(src.value);
    cpu.writeMemory(address, value);
}

function executeCMP(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('CMP requires 2 operands');
    const [op1, op2] = operands;
    const value1 = getOperandValue(cpu, op1);
    const value2 = getOperandValue(cpu, op2);
    const result = value1 - value2;
    // CMP is essentially SUB but discard result
    const overflow = ((value1 ^ value2) & (value1 ^ result) & 0x80) !== 0;
    cpu.setFlags(result, result < 0, overflow);
}

function executePUSH(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 1) throw new Error('PUSH requires 1 operand');
    const [src] = operands;
    const value = getOperandValue(cpu, src);
    cpu.push(value);
}

function executePOP(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 1) throw new Error('POP requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('POP destination must be a register');
    const value = cpu.pop();
    cpu.setRegister(dest.value, value);
}

function executeMUL(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('MUL requires 2 operands');

    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('MUL destination must be a register');

    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue * srcValue;

    cpu.setRegister(dest.value, result & 0xFF);
    cpu.setFlags(result & 0xFF, result > 255);
}

function executeDIV(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('DIV requires 2 operands');

    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('DIV destination must be a register');

    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);

    if (srcValue === 0) throw new Error('Division by zero');

    const result = Math.floor(destValue / srcValue);
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, false);
}

function executeIN(cpu: CPU, operands: Operand[], ioHandler: IOHandler): void {
    if (operands.length !== 2) throw new Error('IN requires 2 operands');

    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('IN destination must be a register');

    // src is port number (immediate)
    const port = getOperandValue(cpu, src);
    const value = ioHandler.onRead(port);

    cpu.setRegister(dest.value, value);
}

function executeOUT(cpu: CPU, operands: Operand[], ioHandler: IOHandler): void {
    if (operands.length !== 2) throw new Error('OUT requires 2 operands');

    const [portOp, valOp] = operands;
    const port = getOperandValue(cpu, portOp);
    const value = getOperandValue(cpu, valOp);

    ioHandler.onWrite(port, value);
}

function executeAND(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('AND requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('AND destination must be a register');
    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue & srcValue;
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, false);
}

function executeOR(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('OR requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('OR destination must be a register');
    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue | srcValue;
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, false);
}

function executeXOR(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('XOR requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('XOR destination must be a register');
    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue ^ srcValue;
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, false);
}

function executeNOT(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 1) throw new Error('NOT requires 1 operand');
    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('NOT operand must be a register');
    const value = cpu.getRegister(dest.value);
    const result = (~value) & 0xFF; // Ensure 8-bit
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, false);
}

function executeSHL(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('SHL requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('SHL destination must be a register');
    const value = cpu.getRegister(dest.value);
    const shift = getOperandValue(cpu, src);
    const result = (value << shift) & 0xFF;
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, false);
}

function executeSHR(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('SHR requires 2 operands');
    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('SHR destination must be a register');
    const value = cpu.getRegister(dest.value);
    const shift = getOperandValue(cpu, src);
    const result = (value >>> shift) & 0xFF;
    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, false);
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
        default:
            throw new Error(`Unsupported operand type: ${operand.type}`);
    }
}
