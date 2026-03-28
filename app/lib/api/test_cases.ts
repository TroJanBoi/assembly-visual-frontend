import { apiFetch, post, put, del } from "@/lib/api/client";
import { TestCase, TestSuite } from "@/lib/playground/test_runner";
import { generateUUID } from "@/lib/utils";

// API Types (Back-end representation)
export interface APITestSuite {
    id: number;
    assignment_id: number;
    name: string;
    created_at?: string;
}

export interface APITestCase {
    id: number;
    test_suite_id: number;
    name: string;
    init: any;   // JSONB in DB
    assert: any; // JSONB in DB
    created_at?: string;
    _meta?: {
        hidden?: boolean;
    };
}

// Fetch all suites for an assignment (and their cases)
export async function getTestSuitesForAssignment(classId: number, assignmentId: number): Promise<TestSuite[]> {
    try {
        // 1. Fetch Suites
        const suites = await apiFetch<APITestSuite[]>(`/api/v2/classroom/${classId}/assignment/${assignmentId}/test-suite`);

        const fullSuites: TestSuite[] = [];

        if (!suites) return [];

        for (const s of suites) {
            try {
                const cases = await apiFetch<APITestCase[]>(`/api/v2/classroom/${classId}/assignment/${assignmentId}/test-suite/${s.id}/test-case/`);

                fullSuites.push({
                    id: s.id.toString(),
                    name: s.name,
                    cases: (cases || []).map(c => ({
                        id: c.id.toString(),
                        name: c.name,
                        initialState: parseInitToFrontend(c.init),
                        expectedState: parseAssertToFrontend(c.assert),
                        // Fix 1: _meta is nested inside init in the JSON response
                        isHidden: c.init?._meta?.hidden === true || c._meta?.hidden === true
                    })),
                    locked: false
                });
            } catch (error) {
                // If fetching cases fails for this suite, add suite with empty cases
                console.warn(`[API] Failed to fetch test cases for suite ${s.id}, adding suite with empty cases`, error);
                fullSuites.push({
                    id: s.id.toString(),
                    name: s.name,
                    cases: [],
                    locked: false
                });
            }
        }

        return fullSuites;

    } catch (e) {
        console.error("[API] Failed to get test suites", e);
        return [];
    }
}


function parseInitToFrontend(init: any): any[] {
    const conditions: any[] = [];
    if (!init) return conditions;
    // Fix 2: Check for 'register' (singular) which backend sends, fallback to 'registers'
    const regs = init.register || init.registers;
    if (regs) Object.entries(regs).forEach(([reg, val]) => conditions.push({ id: generateUUID(), type: 'Register', location: reg, value: String(val) }));
    if (init.memory) Object.entries(init.memory).forEach(([addr, val]) => conditions.push({ id: generateUUID(), type: 'Memory', location: addr, value: String(val) }));
    if (init.flags) Object.entries(init.flags).forEach(([flag, val]) => conditions.push({ id: generateUUID(), type: 'Flag', location: flag, value: String(val) }));
    if (init.io_input) Object.entries(init.io_input).forEach(([port, val]) => conditions.push({ id: generateUUID(), type: 'Input', location: port, value: String(val) }));
    return conditions;
}

function parseAssertToFrontend(assert: any): any[] {
    const conditions: any[] = [];
    if (!assert) return conditions;
    // Fix 3: Check for 'register' (singular)
    const regs = assert.register || assert.registers;
    if (regs) Object.entries(regs).forEach(([reg, val]) => conditions.push({ id: generateUUID(), type: 'Register', location: reg, value: String(val) }));
    if (assert.memory) Object.entries(assert.memory).forEach(([addr, val]) => conditions.push({ id: generateUUID(), type: 'Memory', location: addr, value: String(val) }));
    if (assert.flags) Object.entries(assert.flags).forEach(([flag, val]) => conditions.push({ id: generateUUID(), type: 'Flag', location: flag, value: String(val) }));
    if (assert.io_output) Object.entries(assert.io_output).forEach(([port, val]) => conditions.push({ id: generateUUID(), type: 'Output', location: port, value: String(val) }));
    return conditions;
}


function toBackendInit(conditions: any[], hidden?: boolean) {
    const init: any = { register: {}, memory: {}, flags: {} };
    const io_input: any = {};

    (conditions || []).forEach(c => {
        const val = c.value;
        switch (c.type) {
            case 'Register': init.register[c.location] = parseInt(val) || 0; break;
            case 'Memory': init.memory[c.location] = parseInt(val) || 0; break;
            case 'Flag': init.flags[c.location] = parseInt(val) || 0; break;
            case 'Input': io_input[c.location] = val; break;
        }
    });

    // Only add io_input if it has content
    if (Object.keys(io_input).length > 0) {
        init.io_input = io_input;
    }

    // Add metadata inside init. Always send it to be explicit.
    init._meta = {
        hidden: !!hidden
    };

    // Do NOT delete empty keys as backend requires them
    return init;
}

function toBackendAssert(conditions: any[]) {
    const assert: any = { register: {}, memory: {}, flags: {}, halted: false };
    const io_output: any = {};

    (conditions || []).forEach(c => {
        const val = c.value;
        switch (c.type) {
            case 'Register': assert.register[c.location] = parseInt(val) || 0; break;
            case 'Memory': assert.memory[c.location] = parseInt(val) || 0; break;
            case 'Flag': assert.flags[c.location] = parseInt(val) || 0; break;
            case 'Output': io_output[c.location] = val; break;
        }
    });

    // Only add io_output if it has content
    if (Object.keys(io_output).length > 0) {
        assert.io_output = io_output;
    }

    // Do NOT delete empty keys
    return assert;
}

// --- CRUD Operations ---

export async function createTestSuite(classId: number, assignmentId: number, name: string): Promise<number> {
    const body = {
        assignment_id: assignmentId,
        name,
        created_at: new Date().toISOString()
    };
    const res = await post<APITestSuite>(`/api/v2/classroom/${classId}/assignment/${assignmentId}/test-suite`, body);
    return res.id;
}

export async function updateTestSuite(classId: number, assignmentId: number, id: number, name: string) {
    const old = await apiFetch<APITestSuite>(`/api/v2/classroom/${classId}/assignment/${assignmentId}/test-suite/${id}`);
    await put<APITestSuite>(`/api/v2/classroom/${classId}/assignment/${assignmentId}/test-suite/${id}`, { ...old, name });
}

export async function deleteTestSuite(classId: number, assignmentId: number, id: number) {
    await del(`/api/v2/classroom/${classId}/assignment/${assignmentId}/test-suite/${id}`);
}

export async function createTestCase(classId: number, assignmentId: number, suiteId: number, testCase: TestCase): Promise<number> {
    const body = {
        name: testCase.name,
        init: toBackendInit(testCase.initialState, testCase.isHidden),
        assert: toBackendAssert(testCase.expectedState)
    };
    const res = await post<APITestCase>(`/api/v2/classroom/${classId}/assignment/${assignmentId}/test-suite/${suiteId}/test-case/`, body);
    return res.id;
}

export async function updateTestCase(classId: number, assignmentId: number, suiteId: number, id: number, testCase: TestCase) {
    const body = {
        name: testCase.name,
        init: toBackendInit(testCase.initialState, testCase.isHidden),
        assert: toBackendAssert(testCase.expectedState)
    };
    await put<APITestCase>(`/api/v2/classroom/${classId}/assignment/${assignmentId}/test-suite/${suiteId}/test-case/${id}`, body);
}

export async function deleteTestCase(classId: number, assignmentId: number, suiteId: number, id: number) {
    await del(`/api/v2/classroom/${classId}/assignment/${assignmentId}/test-suite/${suiteId}/test-case/${id}`);
}
