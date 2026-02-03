import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '@/lib/playground/cpu';
import { executeInstruction } from '@/lib/playground/executor';
import { ProgramItem, Operand } from '@/lib/api/playground';
import { VirtualIO } from '@/lib/playground/io';

describe('CPU Core Logic', () => {
    let cpu: CPU;
    let io: VirtualIO;
    let instructionMap: Map<number, ProgramItem>;

    beforeEach(() => {
        cpu = new CPU({
            registers: { R0: 0, R1: 0, R2: 0, R3: 0 },
            flags: { Z: 0, C: 0, V: 0, N: 0 },
            memory: []
        });
        io = new VirtualIO();
        instructionMap = new Map();
    });

    // Helper to run a single instruction
    const run = (instruction: string, operands: Operand[]) => {
        const item: ProgramItem = {
            id: 1,
            instruction,
            operands,
            label: '',
            next: null,
            next_true: null,
            next_false: null
        };
        instructionMap.set(1, item);
        executeInstruction(cpu, item, instructionMap, [], io);
    };

    describe('Data Movement', () => {
        it('MOV should move value into register', () => {
            run('MOV', [
                { type: 'Register', value: 'R0' },
                { type: 'Immediate', value: '10' }
            ]);
            expect(cpu.getRegister('R0')).toBe(10);
        });

        it('MOV should copy register to register', () => {
            // Setup R1
            run('MOV', [
                { type: 'Register', value: 'R1' },
                { type: 'Immediate', value: '55' }
            ]);
            // Copy R1 -> R0
            run('MOV', [
                { type: 'Register', value: 'R0' },
                { type: 'Register', value: 'R1' }
            ]);
            expect(cpu.getRegister('R0')).toBe(55);
        });

        it('LOAD should read from memory', () => {
            cpu.writeMemory(100, 42); // Setup memory
            run('LOAD', [
                { type: 'Register', value: 'R0' },
                { type: 'Immediate', value: '100' }
            ]);
            expect(cpu.getRegister('R0')).toBe(42);
        });

        it('STORE should write to memory', () => {
            run('MOV', [
                { type: 'Register', value: 'R0' },
                { type: 'Immediate', value: '99' }
            ]);
            run('STORE', [
                { type: 'Immediate', value: '50' },
                { type: 'Register', value: 'R0' }
            ]);
            expect(cpu.readMemory(50)).toBe(99);
        });
    });

    describe('Arithmetic', () => {
        it('ADD should sum values', () => {
            run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '5' }]);
            run('ADD', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '3' }]);
            expect(cpu.getRegister('R0')).toBe(8);
        });

        it('ADD should overflow correctly (8-bit)', () => {
            run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '255' }]);
            run('ADD', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '1' }]);
            expect(cpu.getRegister('R0')).toBe(0); // Wrapped
            // Verify Overflow/Carry
            // The current implementation sets C flag on wrap
        });

        it('SUB should subtract values', () => {
            run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '10' }]);
            run('SUB', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '4' }]);
            expect(cpu.getRegister('R0')).toBe(6);
        });

        it('SUB should handle underflow (negative result)', () => {
            run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '0' }]);
            run('SUB', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '1' }]);
            expect(cpu.getRegister('R0')).toBe(255); // -1 in 8-bit unsigned is 255
        });
    });

    describe('Logic', () => {
        it('AND should perform bitwise AND', () => {
            // 1100 (12) AND 1010 (10) = 1000 (8)
            run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '12' }]);
            run('AND', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '10' }]);
            expect(cpu.getRegister('R0')).toBe(8);
        });

        it('OR should perform bitwise OR', () => {
            // 1100 (12) OR 1010 (10) = 1110 (14)
            run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '12' }]);
            run('OR', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '10' }]);
            expect(cpu.getRegister('R0')).toBe(14);
        });
    });
});
