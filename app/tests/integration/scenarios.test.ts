
import { describe, it, expect, beforeEach } from 'vitest';
import { executeProgram } from '@/lib/playground/executor';
import { ProgramItem } from '@/lib/api/playground';
import { CPUState } from '@/lib/playground/cpu';
import { VirtualIO } from '@/lib/playground/io';

describe('Real Educational Programs Scenarios', () => {

    // IO Class that buffers input for IN usage
    class ScenarioIO extends VirtualIO {
        private inputQueue: number[] = [];

        constructor(inputs: number[]) {
            super();
            this.inputQueue = inputs;
        }

        onRead(port: number): number {
            if (port === 0 && this.inputQueue.length > 0) {
                return this.inputQueue.shift()!;
            }
            return 0;
        }
    }

    // Helper to run a program
    const runScenario = async (items: ProgramItem[], inputs: number[] = [], maxSteps = 1000) => {
        const io = new ScenarioIO(inputs);
        const initialState: CPUState = {
            registers: { R0: 0, R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0 },
            flags: { Z: 0, C: 0, V: 0, N: 0 },
            memory: []
        };
        const result = await executeProgram(items, initialState, maxSteps, undefined, io);

        // Extract OUTPUT logs (content only)
        // Check logs from io.state.logs OR result.logs (which are debug strings)
        // The prompt says "Console logs: >> 10". 
        // VirtualIO logs have types.
        const logs = io.getSnapshot().logs
            .filter(l => l.type === 'OUTPUT')
            .map(l => l.content);

        // Also capture consoleBuffer
        if (io.getSnapshot().consoleBuffer) {
            logs.push(io.getSnapshot().consoleBuffer);
        }

        return { result, logs };
    };

    // Item Factory
    const create = (id: number, instruction: string, operands: any[], next: number | null, label?: string): ProgramItem => ({
        id, instruction, operands, next, label: label || '', next_true: null, next_false: null
    });

    it('Scenario 1: Hello Input (Input/Output Basics)', async () => {
        // 1. IN R0, 0
        // 2. IN R1, 0
        // 3. OUT 0, R1
        // 4. OUT 0, R0
        const items: ProgramItem[] = [
            { ...create(1, 'START', [], 2), instruction: 'START' },
            create(2, 'IN', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '0' }], 3),
            create(3, 'IN', [{ type: 'Register', value: 'R1' }, { type: 'Immediate', value: '0' }], 4),
            create(4, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R1' }], 5),
            create(5, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R0' }], 6),
            create(6, 'HLT', [], null)
        ];

        // Input 5, 10
        const { logs } = await runScenario(items, [5, 10]);
        // Note: OUT prints integers as characters? 
        // VirtualIO.onWrite -> handleConsoleWrite -> String.fromCharCode(val)
        // If I OUT 10, it prints '\n'. If I OUT 5, it prints '\x05'.
        // Wait, standard OUT usually prints ASCII.
        // If the assignment implies printing "Numbers" (e.g. "10"), then we need an IntToAscii routine OR the OUT instruction handles formatting.
        // Inspecting executor.ts: `ioHandler.onWrite(portVal, value)`.
        // Inspecting io.ts: `this.state.consoleBuffer += String.fromCharCode(val)`.
        // So it treats input as ASCII char code. 
        // To print "5", we must OUT 53 ('5').
        // If the prompt implies "Simulate user typing 5" (which is ASCII 53), then '5' is stored in register.
        // If we want logs `>> 10` (two chars '1','0' -> 49, 48), we need 2 OUTs or a Number conversion routine.

        // HOWEVER, maybe the prompt assumes a high-level "Print Number" behavior seen in some simulators?
        // Let's assume for this integration test that we check the RAW VALUES in registers, 
        // OR we conform to the "Char-based" IO.
        // Prompt says: "Expectation: Console logs: >> 10, then >> 5".
        // This likely implies the internal IO or Executor was expected to print strings.
        // But `executor.ts` logs debug lines: `> OUT Port 0: 10`.
        // I will use `executeProgram` debug logs to verify numeric "10", because simple ASM can't easily print "10" without a loop.

        // Re-inspection of executor.ts shows it adds `> OUT Port 0: ${value}` to `logs`.
        // I'll check `result.logs` for that debug output!

        const { result } = await runScenario(items, [5, 10]);
        const outLogs = result.logs?.filter(l => l.includes('> OUT Port 0:'));
        expect(outLogs?.[0]).toContain('10');
        expect(outLogs?.[1]).toContain('5');
    });

    it('Scenario 2: The Countdown (Loop & Conditional)', async () => {
        // 1. MOV R0, 5 (Small count for speed)
        // 2. LABEL LOOP
        // 3. OUT 0, R0
        // 4. DEC R0
        // 5. CMP R0, 0
        // 6. JNZ LOOP (If R0 != 0, Jump Loop)
        // 7. OUT 0, 0 (Final)
        // 8. HLT

        // Note: Using loop 5 down to 1 for brevity in test
        const items: ProgramItem[] = [
            { ...create(1, 'START', [], 2), instruction: 'START' },
            create(2, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '3' }], 3), // Start 3
            { ...create(3, 'LABEL', [{ type: 'Label', value: 'LOOP' }], 4), label: 'LOOP' },
            create(4, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R0' }], 5),
            create(5, 'DEC', [{ type: 'Register', value: 'R0' }], 6),

            // CMP/JNZ Logic
            { ...create(6, 'CMP', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '0' }], 7), next_true: 7, next_false: 7 } as any,

            // JNZ: If Z=0 (Not Zero), Jump LOOP(3). Else Next(8).
            create(7, 'JNZ', [{ type: 'Label', value: 'LOOP' }], 8),

            create(8, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Immediate', value: '0' }], 9),
            create(9, 'HLT', [], null)
        ];

        const { result } = await runScenario(items, [], 100);
        const outLogs = result.logs?.filter(l => l.includes('> OUT Port 0:')) || [];
        // 3, 2, 1, 0
        expect(outLogs[0]).toContain('3');
        expect(outLogs[1]).toContain('2');
        expect(outLogs[2]).toContain('1');
        expect(outLogs[3]).toContain('0');
    });

    it('Scenario 3: The Accumulator (Memory & Math)', async () => {
        // Sum 1..5 = 15.
        // R0 = 5. R1 = 0.
        // LOOP:
        // ADD R1, R0
        // DEC R0
        // CMP R0, 0
        // JNZ LOOP
        // OUT R1
        const items: ProgramItem[] = [
            { ...create(1, 'START', [], 2), instruction: 'START' },
            create(2, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '5' }], 3),
            create(3, 'MOV', [{ type: 'Register', value: 'R1' }, { type: 'Immediate', value: '0' }], 4),

            { ...create(4, 'LABEL', [{ type: 'Label', value: 'LOOP' }], 5), label: 'LOOP' },

            create(5, 'ADD', [{ type: 'Register', value: 'R1' }, { type: 'Register', value: 'R0' }], 6),
            create(6, 'DEC', [{ type: 'Register', value: 'R0' }], 7),

            { ...create(7, 'CMP', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '0' }], 8), next_true: 8, next_false: 8 } as any,
            create(8, 'JNZ', [{ type: 'Label', value: 'LOOP' }], 9),

            create(9, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R1' }], 10),
            create(10, 'HLT', [], null)
        ];

        const { result } = await runScenario(items, [], 200);
        const outLogs = result.logs?.filter(l => l.includes('> OUT Port 0:')) || [];
        expect(outLogs[0]).toContain('15');
    });

    it('Scenario 4: The Factorial (Algorithm)', async () => {
        // 5! = 120.
        // R0 = 5. R1 = 1.
        // LOOP:
        // MUL R1, R0
        // DEC R0
        // CMP R0, 1
        // JG LOOP (Greater than 1). 
        //   -> Since JG not exists, USE: 
        //      if R0 == 1 -> Z=1. Stop.
        //      if R0 < 1  -> N=1. Stop.
        //      Else Jump.
        // OUT R1

        const items: ProgramItem[] = [
            { ...create(1, 'START', [], 2), instruction: 'START' },
            create(2, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '5' }], 3),
            create(3, 'MOV', [{ type: 'Register', value: 'R1' }, { type: 'Immediate', value: '1' }], 4),

            { ...create(4, 'LABEL', [{ type: 'Label', value: 'LOOP' }], 5), label: 'LOOP' },

            create(5, 'MUL', [{ type: 'Register', value: 'R1' }, { type: 'Register', value: 'R0' }], 6),
            create(6, 'DEC', [{ type: 'Register', value: 'R0' }], 7),

            // CMP R0, 1
            { ...create(7, 'CMP', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '1' }], 8), next_true: 8, next_false: 8 } as any,

            // JZ (Equal 1) -> Exit (10)
            create(8, 'JZ', [{ type: 'Label', value: 'EXIT' }], 9),

            // JMP LOOP (Otherwise continue)
            create(9, 'JMP', [{ type: 'Label', value: 'LOOP' }], 4), // Wait, infinite logic if neg? (0 < 1). 
            // Correct loop check: While R0 > 1.
            // If R0=1, JZ->EXIT. Correct.
            // If R0=0, JZ is False. JMP LOOP. MUL x 0 = 0. Incorrect.

            // Simplest: CMP R0, 1. JZ EXIT.
            // We know R0 decrements 5,4,3,2,1. 
            // At 1, we stop.

            { ...create(10, 'LABEL', [{ type: 'Label', value: 'EXIT' }], 11), label: 'EXIT' },
            create(11, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R1' }], 12),
            create(12, 'HLT', [], null)
        ];

        const { result } = await runScenario(items, [], 200);
        const outLogs = result.logs?.filter(l => l.includes('> OUT Port 0:')) || [];
        expect(outLogs[0]).toContain('120');
    });

    it('Scenario 5: Stack Reverse (LIFO)', async () => {
        // PUSH 1, 2, 3. POP -> 3, 2, 1.
        const items: ProgramItem[] = [
            { ...create(1, 'START', [], 2), instruction: 'START' },
            create(2, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '1' }], 3),
            create(3, 'PUSH', [{ type: 'Register', value: 'R0' }], 4),

            create(4, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '2' }], 5),
            create(5, 'PUSH', [{ type: 'Register', value: 'R0' }], 6),

            create(6, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '3' }], 7),
            create(7, 'PUSH', [{ type: 'Register', value: 'R0' }], 8),

            // POP -> R1 (Use R1 to show different reg)
            create(8, 'POP', [{ type: 'Register', value: 'R1' }], 9),
            create(9, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R1' }], 10),

            create(10, 'POP', [{ type: 'Register', value: 'R1' }], 11),
            create(11, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R1' }], 12),

            create(12, 'POP', [{ type: 'Register', value: 'R1' }], 13),
            create(13, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R1' }], 14),

            create(14, 'HLT', [], null)
        ];

        const { result } = await runScenario(items, [], 100);
        const outLogs = result.logs?.filter(l => l.includes('> OUT Port 0:')) || [];
        expect(outLogs[0]).toContain('3');
        expect(outLogs[1]).toContain('2');
        expect(outLogs[2]).toContain('1');
    });
});
