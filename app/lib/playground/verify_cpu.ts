
import { CPU } from './cpu';
import { executeProgram } from './stepExecutor_template';
import { ProgramItem } from '../api/playground';

console.log("Starting CPU Verification...");

const safeExecute = (name: string, items: ProgramItem[], initialRegs: Record<string, number> = {}) => {
    console.log(`\nTesting: ${name}`);
    const cpuState = {
        registers: { R0: 0, R1: 0, R2: 0, ...initialRegs },
        flags: { Z: 0, C: 0, V: 0, O: 0 },
        memory: []
    };

    // Add START instruction
    const fullItems = [
        { id: 0, instruction: 'START', next: 1, operands: [] },
        ...items,
        { id: 99, instruction: 'HLT', operands: [] }
    ];

    const result = executeProgram(fullItems as any, cpuState);
    if (result.error) {
        console.error(`ERROR: ${result.error}`);
    } else {
        console.log(`Registers:`, result.registers);
        console.log(`Flags:`, result.flags);
    }
    return result;
};

// 1. Test MOV Reg, Reg
safeExecute("MOV R1, R0 (Reg-Reg)", [
    { id: 1, instruction: 'MOV', operands: [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '#10' }], next: 2 },
    { id: 2, instruction: 'MOV', operands: [{ type: 'Register', value: 'R1' }, { type: 'Register', value: 'R0' }], next: 99 } // R1 = R0
]);

// 2. Test ADD Overflow (Positive + Positive = Negative)
// 127 + 1 = 128 (0x80, -128) -> Overflow
safeExecute("ADD Overflow (127 + 1)", [
    { id: 1, instruction: 'MOV', operands: [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '#127' }], next: 2 },
    { id: 2, instruction: 'ADD', operands: [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '#1' }], next: 99 }
]);

// 3. Test SUB Overflow (Negative - Positive = Positive)
// -128 - 1 = -129 -> 127 (0x7F) -> Overflow
safeExecute("SUB Overflow (-128 - 1)", [
    { id: 1, instruction: 'MOV', operands: [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '#128' }], next: 2 }, // 128 is -128 in 8-bit? No, 128 is 10000000. interpreted as unsigned 128. Signed -128.
    { id: 2, instruction: 'SUB', operands: [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '#1' }], next: 99 }
]);

// 4. Test CMP Logic
safeExecute("CMP R0, R1 (Equal)", [
    { id: 1, instruction: 'MOV', operands: [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '#50' }], next: 2 },
    { id: 2, instruction: 'MOV', operands: [{ type: 'Register', value: 'R1' }, { type: 'Immediate', value: '#50' }], next: 3 },
    { id: 3, instruction: 'CMP', operands: [{ type: 'Register', value: 'R0' }, { type: 'Register', value: 'R1' }], next: 99 }
]);
