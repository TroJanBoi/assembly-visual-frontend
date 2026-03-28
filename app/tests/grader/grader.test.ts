
import { describe, it, expect } from 'vitest';
import { validateSubmission, TestCase } from '@/lib/playground/grader';
import { ProgramItem } from '@/lib/api/playground';

describe('Grader System', () => {

    const helperCreate = (id: number, instruction: string, operands: any[], next: number | null): ProgramItem => ({
        id, instruction, operands, next, label: '', next_true: null, next_false: null
    });

    it('should validate a correct solution', async () => {
        // Program: Echo Input
        // 1. IN R0, 0
        // 2. OUT 0, R0
        // 3. HLT
        // Input: "A" -> Output: "A"

        const validSolution: ProgramItem[] = [
            { ...helperCreate(1, 'START', [], 2), instruction: 'START' },
            helperCreate(2, 'IN', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '0' }], 3),
            helperCreate(3, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R0' }], 4),
            helperCreate(4, 'HLT', [], null)
        ];

        const testCases: TestCase[] = [
            { id: '1', input: ['A'], expectedOutput: ['A'] }, // Note: Our grader simulates Input + Enter. IN reads Char.
            // Wait, standard IN reads one char. "A\n" -> 'A', then '\n'.
            // Program above reads ONE char and prints it.
            // If we input "A", queue is ['A', '\n'].
            // IN reads 'A'.
            // OUT prints 'A'.
            // Program HALTs.
            // Output log should be ['A'].
        ];

        const result = await validateSubmission(validSolution, testCases);

        expect(result.success).toBe(true);
        expect(result.totalPassed).toBe(1);
    });

    it('should fail an invalid solution', async () => {
        // Program: Prints "X" regardless of input
        const invalidSolution: ProgramItem[] = [
            { ...helperCreate(1, 'START', [], 2), instruction: 'START' },
            helperCreate(2, 'MOV', [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '88' }], 3), // 88 = 'X'
            helperCreate(3, 'OUT', [{ type: 'Immediate', value: '0' }, { type: 'Register', value: 'R0' }], 4),
            helperCreate(4, 'HLT', [], null)
        ];

        const testCases: TestCase[] = [
            { id: '1', input: ['A'], expectedOutput: ['A'] }
        ];

        const result = await validateSubmission(invalidSolution, testCases);

        expect(result.success).toBe(false);
        expect(result.results[0].passed).toBe(false);
        expect(result.results[0].actualOutput).toContain('X');
    });
});
