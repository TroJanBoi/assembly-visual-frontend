import { apiFetch, post, put, del } from "@/lib/api/client";
import { TestCase, TestSuite } from "@/lib/playground/test_runner";

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
export async function getTestSuitesForAssignment(assignmentId: number): Promise<TestSuite[]> {
    try {
        // 1. Fetch Suites
        const suites = await apiFetch<APITestSuite[]>(`/api/v2/test_suite?assignment_id=${assignmentId}`);


        const fullSuites: TestSuite[] = [];

        for (const s of suites) {
            const cases = await apiFetch<APITestCase[]>(`/api/v2/test_case?test_suite_id=${s.id}`);

            fullSuites.push({
                id: s.id.toString(), // Convert to string for Frontend
                name: s.name,
                cases: cases.map(c => ({
                    id: c.id.toString(),
                    name: c.name,
                    initialState: parseInitToFrontend(c.init),
                    expectedState: parseAssertToFrontend(c.assert),
                    isHidden: c._meta?.hidden === true // Map from top-level _meta
                })),
                locked: false // TODO: Add logic for locked suites if needed (e.g. from a separate list or property)
            });
        }

        return fullSuites;

    } catch (e) {
        console.error("[API] Failed to get test suites", e);
        return [];
    }
}

// Helpers to map Backend JSON -> Frontend TestConditions
// NOTE: We need to match the structure from `test_runner.ts` / `db.json`
/*
  Frontend: 
  initialState: [{ id: "...", type: "Register", location: "R0", value: "10" }]
  
  Backend (db.json):
  init: { registers: { "R0": 10 }, memory: {}, ... }
*/

function parseInitToFrontend(init: any): any[] {
    const conditions: any[] = [];
    if (!init) return conditions;

    // Registers
    if (init.registers) {
        Object.entries(init.registers).forEach(([reg, val]) => {
            conditions.push({
                id: crypto.randomUUID(),
                type: 'Register',
                location: reg,
                value: String(val)
            });
        });
    }

    // Memory
    if (init.memory) {
        Object.entries(init.memory).forEach(([addr, val]) => {
            conditions.push({
                id: crypto.randomUUID(),
                type: 'Memory',
                location: addr,
                value: String(val)
            });
        });
    }

    // Flags
    if (init.flags) {
        Object.entries(init.flags).forEach(([flag, val]) => {
            conditions.push({
                id: crypto.randomUUID(),
                type: 'Flag',
                location: flag,
                value: String(val)
            });
        });
    }

    // Input
    if (init.io_input) {
        Object.entries(init.io_input).forEach(([port, val]) => {
            conditions.push({
                id: crypto.randomUUID(),
                type: 'Input',
                location: port,
                value: String(val)
            });
        });
    }

    return conditions;
}

function parseAssertToFrontend(assert: any): any[] {
    const conditions: any[] = [];
    if (!assert) return conditions;

    // Registers
    if (assert.registers) {
        Object.entries(assert.registers).forEach(([reg, val]) => {
            conditions.push({ id: crypto.randomUUID(), type: 'Register', location: reg, value: String(val) });
        });
    }
    // Memory
    if (assert.memory) {
        Object.entries(assert.memory).forEach(([addr, val]) => {
            conditions.push({ id: crypto.randomUUID(), type: 'Memory', location: addr, value: String(val) });
        });
    }
    // Flags
    if (assert.flags) {
        Object.entries(assert.flags).forEach(([flag, val]) => {
            conditions.push({ id: crypto.randomUUID(), type: 'Flag', location: flag, value: String(val) });
        });
    }
    // Output
    if (assert.io_output) {
        Object.entries(assert.io_output).forEach(([port, val]) => {
            conditions.push({ id: crypto.randomUUID(), type: 'Output', location: port, value: String(val) });
        });
    }

    return conditions;
}

// --- Parse Frontend to Backend ---

function toBackendInit(conditions: any[]) {
    const init: any = { registers: {}, memory: {}, flags: {}, io_input: {} };
    conditions.forEach(c => {
        const val = c.value; // Store as string or parsed number? DB uses numbers for regs/mem
        // Helper to guess type? 
        // For Registers/Memory/Flags -> usually integers. For IO -> String?

        switch (c.type) {
            case 'Register':
                init.registers[c.location] = parseInt(val) || 0;
                break;
            case 'Memory':
                init.memory[c.location] = parseInt(val) || 0;
                break;
            case 'Flag':
                init.flags[c.location] = parseInt(val) || 0;
                break;
            case 'Input':
                init.io_input[c.location] = val; // Keep string for IO
                break;
        }
    });
    // Cleanup empty objects
    if (Object.keys(init.registers).length === 0) delete init.registers;
    if (Object.keys(init.memory).length === 0) delete init.memory;
    if (Object.keys(init.flags).length === 0) delete init.flags;
    if (Object.keys(init.io_input).length === 0) delete init.io_input;

    return init;
}

function toBackendAssert(conditions: any[]) {
    const assert: any = { registers: {}, memory: {}, flags: {}, io_output: {} };
    conditions.forEach(c => {
        const val = c.value;
        switch (c.type) {
            case 'Register':
                assert.registers[c.location] = parseInt(val) || 0;
                break;
            case 'Memory':
                assert.memory[c.location] = parseInt(val) || 0;
                break;
            case 'Flag':
                assert.flags[c.location] = parseInt(val) || 0;
                break;
            case 'Output':
                assert.io_output[c.location] = val;
                break;
        }
    });
    if (Object.keys(assert.registers).length === 0) delete assert.registers;
    if (Object.keys(assert.memory).length === 0) delete assert.memory;
    if (Object.keys(assert.flags).length === 0) delete assert.flags;
    if (Object.keys(assert.io_output).length === 0) delete assert.io_output;
    return assert;
}


// --- CRUD Operations ---

export async function createTestSuite(assignmentId: number, name: string): Promise<number> {
    const body = {
        assignment_id: assignmentId,
        name,
        created_at: new Date().toISOString()
    };
    const res = await post<APITestSuite>(`/api/v2/test_suite`, body);
    return res.id;
}

export async function updateTestSuite(id: number, name: string) {
    // Need to fetch first to preserve other fields if PUT replaces all? 
    // JSON-server PUT replaces the item. PATCH updates. Client.ts has PUT. 
    // Let's assume we can just patch or we need full object.
    // For safety, let's fetch then put, or simpler: just use what we know.
    // Ideally we implement PATCH in client.ts, but `put` is usually available.
    // NOTE: json-server allow PATCH. client.ts doesn't export it. 

    // Workaround: We only have name to update usually.
    // Let's rely on the fact that we might need to fetch old one or just sending ID + changed fields (if API supports partial update via PUT - unlikely for standard REST, but Json Server might behave).
    // Actually json-server PUT replaces. So we MUST fetch.
    const old = await apiFetch<APITestSuite>(`/api/v2/test_suite/${id}`);
    await put<APITestSuite>(`/api/v2/test_suite/${id}`, { ...old, name });
}

export async function deleteTestSuite(id: number) {
    // Cascade delete cases? JSON-server doesn't do cascade. We must manual delete cases.
    const cases = await apiFetch<APITestCase[]>(`/api/v2/test_case?test_suite_id=${id}`);
    for (const c of cases) {
        await del(`/api/v2/test_case/${c.id}`);
    }
    await del(`/api/v2/test_suite/${id}`);
}

export async function createTestCase(suiteId: number, testCase: TestCase): Promise<number> {
    const body = {
        test_suite_id: suiteId,
        name: testCase.name,
        init: toBackendInit(testCase.initialState),
        assert: toBackendAssert(testCase.expectedState),
        _meta: testCase.isHidden ? { hidden: true } : {},
        created_at: new Date().toISOString()
    };
    const res = await post<APITestCase>(`/api/v2/test_case`, body);
    return res.id;
}

export async function updateTestCase(id: number, testCase: TestCase, suiteId: number) {
    const body = {
        id, // Persistence of ID
        test_suite_id: suiteId,
        name: testCase.name,
        init: toBackendInit(testCase.initialState),
        assert: toBackendAssert(testCase.expectedState),
        _meta: testCase.isHidden ? { hidden: true } : {},
        created_at: new Date().toISOString() // Or keep old?
    };
    await put<APITestCase>(`/api/v2/test_case/${id}`, body);
}

export async function deleteTestCase(id: number) {
    await del(`/api/v2/test_case/${id}`);
}
