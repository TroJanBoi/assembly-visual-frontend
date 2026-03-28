import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CPU } from '@/lib/playground/cpu';
import { executeInstruction, executeProgram } from '@/lib/playground/executor';
import { ProgramItem, Operand } from '@/lib/api/playground';
import { VirtualIO } from '@/lib/playground/io';

describe('CPU Core: Deep Dive & Reliability Tests', () => {
    let cpu: CPU;
    let io: VirtualIO;
    let instructionMap: Map<number, ProgramItem>;

    beforeEach(() => {
        cpu = new CPU({
            registers: { R0: 0, R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0 },
            flags: { Z: 0, C: 0, V: 0, N: 0 },
            memory: []
        });
        io = new VirtualIO();
        instructionMap = new Map();
    });

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

    describe('Vector A: Instruction Set Integrity', () => {
        describe('Arithmetic Overflow (Signed)', () => {
            // Formula for Overflow (V):
            // ADD: (Op1 ^ Result) & (Op2 ^ Result) & 0x80
            // SUB: (Op1 ^ Op2) & (Op1 ^ Result) & 0x80

            it('ADD: Positive + Positive = Negative (Overflow)', () => {
                // 127 (0x7F) + 1 (0x01) = 128 (0x80)
                // Signed: (127) + (1) = (-128). Overflow!
                run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '127' }]);
                run('ADD', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '1' }]);

                expect(cpu.getRegister('R0')).toBe(128);
                expect(cpu.flags.N).toBe(1); // 0x80 has MSB set -> Negative
                expect(cpu.flags.V).toBe(1); // Should be set!
                expect(cpu.flags.C).toBe(0); // No Carry (result < 256)
            });

            it('ADD: Negative + Negative = Positive (Overflow)', () => {
                // -128 (0x80) + -1 (0xFF) = -129... wraps to 127 (0x7F) + Carry 1 (256+127 -> 383? No.)
                // 0x80 (128) + 0xFF (255) = 0x17F (383).
                // 8-bit result: 0x7F (127).
                // Signed: (-128) + (-1) = -129. Result 127 is Positive. Overflow!
                run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '128' }]); // 128 is -128 signed
                run('ADD', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '255' }]); // 255 is -1 signed

                expect(cpu.getRegister('R0')).toBe(127);
                expect(cpu.flags.N).toBe(0); // 0x7F -> Positive
                expect(cpu.flags.V).toBe(1); // Overflow!
                expect(cpu.flags.C).toBe(1); // Carry! (383 > 255)
            });

            it('SUB: Negative - Positive = Positive (Overflow)', () => {
                // -128 (0x80) - 1 (0x01) = -129... 
                // 0x80 - 0x01 = 0x7F (127).
                // Signed result 127. Overflow!
                run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '128' }]);
                run('SUB', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '1' }]);

                expect(cpu.getRegister('R0')).toBe(127);
                expect(cpu.flags.V).toBe(1);
            });
        });

        describe('Division Safety', () => {
            it('DIV by Zero should throw error', () => {
                run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '10' }]);
                expect(() => {
                    run('DIV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '0' }]);
                }).toThrow(/Division by zero/);
            });
        });

        describe('Logic Gates', () => {
            it('XOR self should zero register and set Z flag', () => {
                run('MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '255' }]);
                run('XOR', [{ type: 'Register', value: 'R0' }, { type: 'Register', value: 'R0' }]);
                expect(cpu.getRegister('R0')).toBe(0);
                expect(cpu.flags.Z).toBe(1);
            });
        });
    });

    describe('Vector B: Memory & Stack Stability', () => {
        it('Stack Overflow Detection', () => {
            // Stack starts at 255. Limit 224. Size 32.
            // Pushing 33 times should fail.
            expect(() => {
                for (let i = 0; i < 33; i++) {
                    cpu.push(i);
                }
            }).toThrow(/Stack overflow/);
        });

        it('Stack Underflow Detection', () => {
            expect(() => {
                cpu.pop();
            }).toThrow(/Stack underflow/);
        });

        it('Memory Access Violation (Negative)', () => {
            expect(() => {
                cpu.readMemory(-1);
            }).toThrow(/Invalid memory address/);
        });

        it('Memory Access Violation (Out of Bounds)', () => {
            expect(() => {
                cpu.writeMemory(256, 10);
            }).toThrow(/Invalid memory address/);
        });
    });

    describe('Vector C: Control Flow & Halting', () => {
        const createItem = (id: number, instruction: string, operands: any[], next: number | null): ProgramItem => ({
            id, instruction, operands, next, label: '', next_true: null, next_false: null,
        });

        it('Infinite Loop Detection (Max Steps)', async () => {
            // 1: JMP 1 (Infinite)
            const items: ProgramItem[] = [
                { ...createItem(1, 'START', [], 2), instruction: 'START' },
                createItem(2, 'JMP', [{ type: 'Label', value: 'Start' }], 2),
                { ...createItem(2, 'LABEL', [{ type: 'Label', value: 'Start' }], 2), label: 'Start' }
            ];
            // Fix loop: 2 (JMP) -> 2 (LABEL via resolve) (?) 
            // LABEL ID 2. JMP resolves 'Start' to ID 2.
            // Items need unique IDs generally for lookup maps.
            // Let's make it cleaner:
            // 1: START -> 2.
            // 2: LABEL Loop -> 3.
            // 3: JMP Loop -> 2.
            const loopItems: ProgramItem[] = [
                { ...createItem(1, 'START', [], 2), instruction: 'START' },
                { ...createItem(2, 'LABEL', [{ type: 'Label', value: 'Loop' }], 3), label: 'Loop' },
                createItem(3, 'JMP', [{ type: 'Label', value: 'Loop' }], 2),
            ];

            const result = await executeProgram(loopItems, { registers: cpu.registers, flags: cpu.flags, memory: [] }, 50, undefined, io); // Max 50 steps

            expect(result.halted).toBe(true);
            expect(result.error).toMatch(/Maximum execution steps exceeded/);
        });

        it('Conditional Jump (JZ) - False case', async () => {
            // MOV R0, 5; CMP R0, 0; JZ Target; MOV R1, 1; HLT; Label Target; MOV R1, 2; HLT
            // R0=5 != 0. Z=0. Should NOT jump. R1 should be 1.

            // 1: START -> 2
            // 2: MOV R0, 5 -> 3
            // 3: CMP R0, 0 -> 4
            // 4: JZ Target -> 5 (if no jump), Target(6) (if jump). Correct logic uses resolve.
            // 5: MOV R1, 1 -> 8 (HLT)
            // 6: LABEL Target -> 7
            // 7: MOV R1, 2 -> 8 (HLT)
            // 8: HLT

            const items: ProgramItem[] = [
                { ...createItem(1, 'START', [], 2), instruction: 'START' },
                createItem(2, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '5' }], 3),
                {
                    ...createItem(3, 'CMP', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '0' }], 4),
                    next_true: 6, next_false: 4 // Explicit paths for graph executor
                } as any,
                createItem(4, 'JZ', [{ type: 'Label', value: 'Target' }], 5),
                createItem(5, 'MOV', [{ type: 'Register', value: 'R1' }, { type: 'Immediate', value: '1' }], 8),
                { ...createItem(6, 'LABEL', [{ type: 'Label', value: 'Target' }], 7), label: 'Target' },
                createItem(7, 'MOV', [{ type: 'Register', value: 'R1' }, { type: 'Immediate', value: '2' }], 8),
                createItem(8, 'HLT', [], null)
            ];

            const result = await executeProgram(items, { registers: cpu.registers, flags: cpu.flags, memory: [] }, 100);
            expect(result.registers['R1']).toBe(1); // Failed jump, executed sequential
        });
    });
});
