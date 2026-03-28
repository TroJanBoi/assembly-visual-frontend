import { Assignment } from "@/lib/api/assignment";

export type CPUState = {
    registers: Record<string, number>;
    flags: Record<string, number>;
    memory: { address: number; value: number }[];
    ports: Record<number, number>;
};

export function buildInitialCPUState(assignment: Assignment | null): CPUState {
    const defaults: CPUState = {
        registers: { R0: 0, R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0 },
        flags: { Z: 0, C: 0, V: 0, O: 0 },
        memory: [],
        ports: { 3: 0 },
    };
    if (!assignment) return defaults;

    const cond: any = assignment.condition || {};
    let initState = cond.initial_state;
    // Fallback: Check if initial_state is nested inside execution_constraints (Backwards compatibility/Type definition mismatch)
    if (!initState && cond.execution_constraints?.initial_state) {
        initState = cond.execution_constraints.initial_state;
    }
    initState = initState || {};

    const execConstraints = cond.execution_constraints || {};

    // 1. Build Registers based on register_count (default 8)
    const regCount = typeof execConstraints.register_count === 'number' ? execConstraints.register_count : 8;
    const registers: Record<string, number> = {};

    // Initialize R0..Rn-1 with 0
    for (let i = 0; i < regCount; i++) {
        registers[`R${i}`] = 0;
    }

    // Overlay defined initial values from DB
    if (initState.registers) {
        // Ensure keys are upper case to match R0, R1...
        for (const [k, v] of Object.entries(initState.registers)) {
            registers[k.toUpperCase()] = Number(v);
        }
    }

    // 2. Read memory from initial_state.memory
    const initMem = initState.memory;
    const memory: { address: number; value: number }[] = Array.isArray(initMem)
        ? initMem
        : [];

    return {
        registers,
        flags: { Z: 0, C: 0, V: 0, O: 0 },
        memory,
        ports: { 3: 0 },
    };
}

export function enforceRegisterConstraint(cpu: CPUState, assignment: Assignment): CPUState {
    if (!assignment) return cpu;
    const defaults = buildInitialCPUState(assignment);
    // defaults has correct keys based on assignment setting 

    const newRegs: Record<string, number> = {};

    // Iterate strictly over DEFAULT keys (the source of truth for count)
    for (const key of Object.keys(defaults.registers)) {
        // Keep existing value if key exists in saved state, else use default
        if (Object.prototype.hasOwnProperty.call(cpu.registers, key)) {
            newRegs[key] = cpu.registers[key];
        } else {
            newRegs[key] = defaults.registers[key];
        }
    }

    return { ...cpu, registers: newRegs };
}
