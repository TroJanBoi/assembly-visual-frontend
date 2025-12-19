import { describe, it, expect, beforeEach } from 'vitest';
import { executeProgram } from '@/lib/playground/executor';
import { ProgramItem } from '@/lib/api/playground';
import { CPUState } from '@/lib/playground/cpu';
import { VirtualIO } from '@/lib/playground/io';

describe('Headless Program Execution', () => {

    // Helper to generate a minimal valid program structure
    const createItem = (id: number, instruction: string, operands: any[], next: number | null): ProgramItem => ({
        id,
        instruction,
        operands,
        next,
        type: 'instruction',
        position: { x: 0, y: 0 },
        data: {}
    });

    it('Scenario A: Math Sequence (5 + 5)', async () => {
        // MOV R0, 5 -> ADD R0, 5 -> OUT 0, R0 -> HLT
        const items: ProgramItem[] = [
            { ...createItem(1, 'START', [], 2), instruction: 'START' },
            createItem(2, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '5' }], 3),
            createItem(3, 'ADD', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '5' }], 4),
            createItem(4, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R0' }], 5),
            createItem(5, 'HLT', [], null)
        ];

        const initialState: CPUState = {
            registers: { R0: 0, R1: 0, R2: 0, R3: 0 },
            flags: { Z: 0, C: 0, V: 0, N: 0 },
            memory: []
        };
        const io = new VirtualIO();

        const result = await executeProgram(items, initialState, 100, undefined, io);

        // Assert registers
        expect(result.registers['R0']).toBe(10);
        expect(result.halted).toBe(true);

        // Assert Output Log
        // We look at the logs in the result or the IO state
        // The logs array in execution result contains system logs + output logs
        // But let's check the IO handler's logs for structured output if possible.
        // executeProgram returns `logs` which are strings.
        const outputLogs = result.logs?.filter(l => l.includes('> OUT Port 0: 10'));
        expect(outputLogs?.length).toBeGreaterThan(0);

        // Check IO state snapshot for structured logs (VirtualIO specific)
        const ioLogs = result.io_state?.logs || [];
        // Note: result.io_state.logs are LogEntry objects
        // The VirtualIO adds a log with type 'OUTPUT' and content '10' (after buffer flush or direct write depending on recent changes)
        // With recent changes, OUT writes to consoleBuffer. A newline (10) is needed to flush to logs.
        // OR the legacy `executeOUT` function explicitly pushes to the `logs` string array returned by executeProgram.
        // Let's rely on the string logs returned by executeProgram for this integration test as it captures "debug" traces.
    });

    it('Scenario B: Loop (Count down)', async () => {
        // 1: MOV R0, 3
        // 2: LABEL Loop
        // 3: DEC R0
        // 4: CMP R0, 0
        // 5: JNZ Loop
        // 6: HLT

        // IDs:
        // 1: START -> 2
        // 2: MOV -> 3
        // 3: LABEL (Loop) -> 4
        // 4: DEC -> 5
        // 5: CMP -> 6
        // 6: JNZ (Loop=3) -> 7 (if taken), else -> 7
        //    Wait, JNZ goes to Target if Z=0. If Z=1 (R0=0), goes to next (7).
        // 7: HLT

        const items: ProgramItem[] = [
            { ...createItem(1, 'START', [], 2), instruction: 'START' },
            createItem(2, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '3' }], 3),

            // Label is mostly a marker, but JNZ needs to target it.
            // Our executor resolves JNZ target by looking up LABEL iteratatively or by ID?
            // Executor uses `resolveJumpTarget(operands)`.
            { ...createItem(3, 'LABEL', [{ type: 'Label', value: 'Loop' }], 4), label: 'Loop' },

            createItem(4, 'DEC', [{ type: 'Register', value: 'R0' }], 5),

            {
                ...createItem(5, 'CMP', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '0' }], 6),
                next_true: 6,
                next_false: 6
            } as any,

            // JNZ: If Z=0, Jump to "Loop". Else Next.
            // Note: executor logic for JNZ: `resolveJumpTarget` finds ID of LABEL 'Loop' -> 3.
            createItem(6, 'JNZ', [{ type: 'Label', value: 'Loop' }], 7),

            createItem(7, 'HLT', [], null)
        ];

        const initialState: CPUState = {
            registers: { R0: 0, R1: 0, R2: 0, R3: 0 },
            flags: { Z: 0, C: 0, V: 0, N: 0 },
            memory: []
        };

        const result = await executeProgram(items, initialState, 100);

        expect(result.registers['R0']).toBe(0);
        expect(result.halted).toBe(true);
        // 3 -> 2 -> 1 -> 0.
        // Loops:
        // R0=3. DEC->2. CMP->Z=0. JNZ->Jump.
        // R0=2. DEC->1. CMP->Z=0. JNZ->Jump.
        // R0=1. DEC->0. CMP->Z=1. JNZ->NoJump.
        // HLT.
    });
});
