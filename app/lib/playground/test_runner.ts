
import { CPUState } from './cpu';
import { ProgramItem } from '@/lib/api/playground';
import { executeProgram } from './executor';
import { VirtualIO } from './io';

export type TestLocationType = 'Register' | 'Memory' | 'Flag' | 'Output' | 'Input';

export interface TestCondition {
    id: string;
    type: TestLocationType;
    location: string; // "R0", "10", "Z"
    value: string; // "15", "0x0F", "1"
}

export interface TestCase {
    id: string;
    name: string;
    initialState: TestCondition[];
    expectedState: TestCondition[];
    isHidden?: boolean; // True for grading test cases hidden from students
}

export interface TestSuite {
    id: string;
    name: string;
    cases: TestCase[];
    locked?: boolean; // For teacher-provided suites
}

export interface TestResult {
    caseId: string;
    passed: boolean;
    actualState: CPUState;
    failedConditions: {
        condition: TestCondition;
        actualValue: string;
    }[];
    error?: string;
}

// --- Result Types ---

export interface TestSuiteResult {
    suiteId: string;
    results: TestResult[];
    timestamp: number;
}

// --- Helpers ---

export function createEmptyTestCase(): TestCase {
    return {
        id: crypto.randomUUID(),
        name: "New Test Case",
        initialState: [],
        expectedState: []
    };
}

export function createEmptyTestSuite(): TestSuite {
    return {
        id: crypto.randomUUID(),
        name: "New Test Suite",
        cases: []
    };
}

/**
 * Converts a TestCase IntialState definitions into a concrete CPUState
 * Merges with default state.
 */
export function buildInitialStateFromTest(testCase: TestCase, defaultState: CPUState): CPUState {
    const state: CPUState = JSON.parse(JSON.stringify(defaultState)); // Deep copy

    for (const cond of testCase.initialState) {
        const val = parseValue(cond.value);

        switch (cond.type) {
            case 'Register':
                if (state.registers.hasOwnProperty(cond.location)) {
                    state.registers[cond.location] = val;
                }
                break;
            case 'Memory':
                const addr = parseInt(cond.location);
                if (!isNaN(addr)) {
                    // Update or Add memory entry
                    const idx = state.memory.findIndex(m => m.address === addr);
                    if (idx !== -1) {
                        state.memory[idx].value = val;
                    } else {
                        state.memory.push({ address: addr, value: val });
                    }
                }
                break;
            case 'Flag':
                if (state.flags.hasOwnProperty(cond.location)) {
                    state.flags[cond.location] = val ? 1 : 0;
                }
                break;
        }
    }

    // Sort memory for consistency
    state.memory.sort((a, b) => a.address - b.address);
    return state;
}

/**
 * Runs a single Test Case against a program.
 */
export async function runTestCase(
    testCase: TestCase,
    program: ProgramItem[],
    defaultState: CPUState
): Promise<TestResult> {

    // 1. Setup Input & IO
    const initialState = buildInitialStateFromTest(testCase, defaultState);
    const io = new VirtualIO();

    // Pre-fill IO state from 'Input' conditions
    testCase.initialState.filter(c => c.type === 'Input').forEach(cond => {
        const port = parseInt(cond.location);
        const val = parseValue(cond.value);

        if (port === 0) {
            // Port 0: Keyboard Buffer (ASCII characters)
            // If value is a number (e.g. 65), push it. If string "A", convert.
            // parseValue handles numbers. For string input, we might need a better parser 
            // but for now let's assume raw values or char codes.
            // Actually, if user types "A", parseValue returns NaN (unless 0xA).
            // Let's handle string inputs more gracefully in the UI or here.

            // If the user inputs a string in the UI like "A", we want ASCII 65.
            // If checks are number-based, we push the number.
            // Let's push the parsed value for now.
            io.state.keyBuffer.push(val);
        } else if (port === 4) {
            // Port 4: Gamepad state
            io.state.gamepadState = val;
        }
    });

    // 2. Execute
    const result = await executeProgram(program, initialState, 1000, undefined, io); // 1000 step limit

    // 3. Verify
    // Convert ExecutionResult (sparse memory) back to CPUState (array memory)
    const finalMemory: { address: number; value: number }[] = [];
    Object.entries(result.memory_sparse).forEach(([addr, val]) => {
        finalMemory.push({ address: parseInt(addr), value: val });
    });
    finalMemory.sort((a, b) => a.address - b.address);

    const finalState: CPUState = {
        registers: result.registers,
        flags: result.flags,
        memory: finalMemory,
        ports: result.ports
    };

    const failedConditions: { condition: TestCondition; actualValue: string; }[] = [];

    if (result.error) {
        return {
            caseId: testCase.id,
            passed: false,
            actualState: finalState,
            failedConditions: [],
            error: result.error
        };
    }

    // Check Expected States
    for (const cond of testCase.expectedState) {
        let passed = false;
        let actual = "N/A";

        switch (cond.type) {
            case 'Register':
                const regVal = finalState.registers[cond.location];
                actual = regVal !== undefined ? regVal.toString() : "Undefined";
                passed = regVal === parseValue(cond.value);
                break;

            case 'Memory':
                const addr = parseInt(cond.location);
                const memVal = finalState.memory.find(m => m.address === addr)?.value ?? 0;
                actual = memVal.toString();
                passed = memVal === parseValue(cond.value);
                break;

            case 'Flag':
                const flagVal = finalState.flags[cond.location];
                actual = flagVal !== undefined ? flagVal.toString() : "Undefined";
                passed = flagVal === (parseValue(cond.value) ? 1 : 0);
                break;

            case 'Output':

                const logs = io.getSnapshot().logs.filter(l => l.type === 'OUTPUT').map(l => l.content);
                const safeVal = cond.value.trim();
                passed = logs.includes(safeVal);
                actual = logs.join(", ");
                break;
        }

        if (!passed) {
            failedConditions.push({
                condition: cond,
                actualValue: actual
            });
        }
    }

    return {
        caseId: testCase.id,
        passed: failedConditions.length === 0,
        actualState: finalState,
        failedConditions
    };
}

/**
 * Runs an entire Test Suite
 */
export async function runTestSuite(
    suite: TestSuite,
    program: ProgramItem[],
    defaultState: CPUState
): Promise<TestSuiteResult> {
    const results: TestResult[] = [];

    for (const testCase of suite.cases) {
        const result = await runTestCase(testCase, program, defaultState);
        results.push(result);
    }

    return {
        suiteId: suite.id,
        results,
        timestamp: Date.now()
    };
}

function parseValue(val: string): number {
    if (val.startsWith("0x")) return parseInt(val, 16);
    return parseInt(val, 10);
}
