
import { ProgramItem } from '@/lib/api/playground';
import { executeProgram } from './executor';
import { IOState, VirtualIO } from './io';
import { CPUState } from './cpu';

export interface TestCase {
    id: string;
    input: string[];  // Inputs to feed into the console/IO
    expectedOutput: string[]; // Expected OUTPUT logs
    maxSteps?: number;
}

export interface GradingResult {
    success: boolean;
    results: {
        testCaseId: string;
        passed: boolean;
        actualOutput: string[];
        error?: string;
    }[];
    totalPassed: number;
    totalTests: number;
}

export async function validateSubmission(
    submission: ProgramItem[],
    testCases: TestCase[]
): Promise<GradingResult> {
    const results = [];
    let totalPassed = 0;

    for (const testCase of testCases) {
        // Setup IO with pre-fed input
        // Since VirtualIO receives input char-by-char or string, checks implementation.
        // VirtualIO.receiveInput(key) -> buffers it.
        // We need a custom IO handler or just preload the buffer?
        // VirtualIO doesn't support preloading input queue easily in current implementation.
        // Let's modify VirtualIO or subclass it for testing.

        class TestIO extends VirtualIO {
            private inputQueue: string[] = [];

            constructor(inputs: string[]) {
                super();
                // Split inputs into characters or keep as lines?
                // The current IN instruction reads char code.
                // If input is ["10"], it likely means user typed "1", "0", "Enter".
                // We should simulate that.
                for (const line of inputs) {
                    for (const char of line) {
                        this.inputQueue.push(char);
                    }
                    this.inputQueue.push('\n'); // Enter
                }
            }

            // Override receiveInput or just use onRead?
            // CPU calls onRead(0).
            onRead(port: number): number | null {
                if (port === 0) {
                    if (this.inputQueue.length > 0) {
                        const char = this.inputQueue.shift()!;
                        return char.charCodeAt(0);
                    }
                    return 0; // EOF
                }
                return super.onRead(port);
            }
        }

        const io = new TestIO(testCase.input);
        const initialState: CPUState = {
            registers: { R0: 0, R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0 },
            flags: { Z: 0, C: 0, V: 0, N: 0 },
            memory: []
        };

        const execResult = await executeProgram(
            submission,
            initialState,
            testCase.maxSteps || 1000,
            undefined,
            io
        );

        // Collect OUTPUT logs
        // result.logs is mixed system/debug/io.
        // We want strict user output.
        // Let's filter result.logs for lines starting with "> OUT Port 0:" (from executor.ts)
        // Or better, check io.getSnapshot().logs with type 'OUTPUT'.

        // Wait, VirtualIO adds to logs array.
        const snapshot = io.getSnapshot();
        const actualOutput = snapshot.logs
            .filter(l => l.type === 'OUTPUT')
            .map(l => l.content);

        // Flush pending buffer if any
        if (snapshot.consoleBuffer) {
            actualOutput.push(snapshot.consoleBuffer);
        }

        // Verify
        // Loose equality check (ignoring whitespace) or strict?
        // Let's do strict equality of lines.

        // The expectedOutput is array of strings.
        const passed = JSON.stringify(actualOutput) === JSON.stringify(testCase.expectedOutput);

        if (passed) totalPassed++;

        results.push({
            testCaseId: testCase.id,
            passed,
            actualOutput,
            error: execResult.error || undefined
        });
    }

    return {
        success: totalPassed === testCases.length,
        results,
        totalPassed,
        totalTests: testCases.length
    };
}
