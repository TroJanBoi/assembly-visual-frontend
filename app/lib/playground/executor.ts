// lib/playground/executor.ts
/**
 * Client-Side Assembly Execution Engine
 * Executes program items without backend dependency
 */

import { ProgramItem, Operand } from '@/lib/api/playground';
import { CPU, CPUState } from './cpu';

export type ExecutionResult = {
    registers: Record<string, number>;
    flags: Record<string, number>;
    memory_sparse: Record<string, number>;
    halted: boolean;
    error: string | null;
    logs?: string[];
};

/**
 * Execute a complete assembly program
 * @param items - Array of program instructions
 * @param initialState - Initial CPU state (registers, memory)
 * @param maxSteps - Maximum execution steps to prevent infinite loops
 * @returns Final execution state
 */
export function executeProgram(
    items: ProgramItem[],
    initialState: CPUState,
    maxSteps: number = 10000
): ExecutionResult {
    const logs: string[] = [];

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
            const currentItem = instructionMap.get(cpu.pc);

            if (!currentItem) {
                cpu.halt(`Invalid PC: ${cpu.pc} (instruction not found)`);
                break;
            }

            const instruction = currentItem.instruction?.toUpperCase() || '';
            logs.push(`[${steps}] PC=${cpu.pc} ${instruction}`);

            // Execute instruction
            try {
                executeInstruction(cpu, currentItem, instructionMap);
            } catch (err: any) {
                cpu.halt(err.message || String(err));
                break;
            }

            steps++;

            // Safety check
            if (steps >= maxSteps) {
                cpu.halt('Maximum execution steps exceeded (possible infinite loop)');
            }
        }

        logs.push(`Execution completed. Halted=${cpu.halted}, Steps=${steps}`);

        // Return final state
        return {
            registers: { ...cpu.registers },
            flags: { ...cpu.flags },
            memory_sparse: cpu.getMemorySparse(),
            halted: cpu.halted,
            error: cpu.error,
            logs,
        };

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

/**
 * Execute a single instruction
 */
function executeInstruction(
    cpu: CPU,
    item: ProgramItem,
    instructionMap: Map<number, ProgramItem>
): void {
    const instruction = item.instruction?.toUpperCase() || '';
    const operands = item.operands || [];

    // Import operation handlers (we'll create these next)
    // For now, implement basic instructions inline

    switch (instruction) {
        case 'START':
            // START just advances to next instruction
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
            cpu.pc = item.next || 0;
            break;

        case 'JMP':
            cpu.pc = item.next || 0;  // JMP always jumps to "next" (which is the label target)
            break;

        case 'JZ':
            cpu.pc = cpu.flags.Z === 1 ? (item.next || 0) : getNextNonJump(item, instructionMap);
            break;

        case 'JNZ':
            cpu.pc = cpu.flags.Z === 0 ? (item.next || 0) : getNextNonJump(item, instructionMap);
            break;

        case 'JC':
            cpu.pc = cpu.flags.C === 1 ? (item.next || 0) : getNextNonJump(item, instructionMap);
            break;

        case 'JNC':
            cpu.pc = cpu.flags.C === 0 ? (item.next || 0) : getNextNonJump(item, instructionMap);
            break;

        case 'JN':
            cpu.pc = cpu.flags.O === 1 ? (item.next || 0) : getNextNonJump(item, instructionMap);
            break;

        case 'PUSH':
            executePUSH(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'POP':
            executePOP(cpu, operands);
            cpu.pc = item.next || 0;
            break;

        case 'LABEL':
            // LABEL is just a marker, advance to next
            cpu.pc = item.next || 0;
            break;

        default:
            throw new Error(`Unknown instruction: ${instruction}`);
    }
}

// Helper: Get next sequential instruction (for failed conditional jumps)
function getNextNonJump(item: ProgramItem, map: Map<number, ProgramItem>): number {
    // For now, just use next field. In graph-based execution, this would find the sequential edge
    return item.next || 0;
}

// ===== Operation Implementations =====

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
    cpu.setFlags(result, result > 255);  // Carry if overflow
}

function executeSUB(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('SUB requires 2 operands');

    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('SUB destination must be a register');

    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue - srcValue;

    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result < 0);  // Carry if borrow
}

function executeINC(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 1) throw new Error('INC requires 1 operand');

    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('INC operand must be a register');

    const value = cpu.getRegister(dest.value);
    const result = value + 1;

    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result > 255);
}

function executeDEC(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 1) throw new Error('DEC requires 1 operand');

    const [dest] = operands;
    if (dest.type !== 'Register') throw new Error('DEC operand must be a register');

    const value = cpu.getRegister(dest.value);
    const result = value - 1;

    cpu.setRegister(dest.value, result);
    cpu.setFlags(result, result < 0);
}

function executeLOAD(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('LOAD requires 2 operands');

    const [dest, src] = operands;
    if (dest.type !== 'Register') throw new Error('LOAD destination must be a register');

    // src should be memory address
    const address = getOperandValue(cpu, src);
    const value = cpu.readMemory(address);

    cpu.setRegister(dest.value, value);
}

function executeSTORE(cpu: CPU, operands: Operand[]): void {
    if (operands.length !== 2) throw new Error('STORE requires 2 operands');

    const [dest, src] = operands;
    if (src.type !== 'Register') throw new Error('STORE source must be a register');

    // dest should be memory address
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
    cpu.setFlags(result, result < 0);  // Set flags without changing registers
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

// ===== Helpers =====

function getOperandValue(cpu: CPU, operand: Operand): number {
    switch (operand.type) {
        case 'Register':
            return cpu.getRegister(operand.value);

        case 'Immediate':
            // Remove '#' prefix if present
            const imm = operand.value.replace('#', '');
            const value = parseInt(imm, 10);
            if (isNaN(value)) throw new Error(`Invalid immediate value: ${operand.value}`);
            return value;

        default:
            throw new Error(`Unsupported operand type: ${operand.type}`);
    }
}
