// lib/playground/cpu.ts
/**
 * CPU Simulator for Assembly Visual
 * Manages registers, flags, memory, and stack state
 */

export type CPUState = {
    registers: Record<string, number>;
    flags: Record<string, number>;
    memory: { address: number; value: number }[];
};

export class CPU {
    // Registers (R0-R7 or as configured)
    registers: Record<string, number>;

    // Flags: Z (Zero), C (Carry), V (Overflow), O (Sign/Negative)
    flags: { Z: number; C: number; V: number; O: number };

    // Memory (256 bytes, 0-255)
    memory: Uint8Array;

    // Stack (grows downward from 255)
    sp: number;  // Stack pointer

    // Program execution state
    pc: number;  // Program counter (current instruction ID)
    halted: boolean;
    error: string | null;

    constructor(initialState: CPUState) {
        // Initialize registers
        this.registers = { ...initialState.registers };

        // Initialize flags
        this.flags = { Z: 0, C: 0, V: 0, O: 0 };

        // Initialize memory (256 bytes)
        this.memory = new Uint8Array(256);

        // Load initial memory values
        if (initialState.memory && Array.isArray(initialState.memory)) {
            for (const { address, value } of initialState.memory) {
                if (address >= 0 && address < 256) {
                    this.memory[address] = value & 0xFF;  // Ensure 8-bit value
                }
            }
        }

        // Initialize stack pointer (starts at top of memory, grows down)
        this.sp = 255;

        // Execution state
        this.pc = 0;
        this.halted = false;
        this.error = null;
    }

    /**
     * Get register value
     */
    getRegister(name: string): number {
        const value = this.registers[name];
        if (value === undefined) {
            throw new Error(`Register ${name} does not exist`);
        }
        return value;
    }

    /**
     * Set register value (clamps to 8-bit: 0-255)
     */
    setRegister(name: string, value: number): void {
        if (this.registers[name] === undefined) {
            throw new Error(`Register ${name} does not exist`);
        }
        // Clamp to 8-bit unsigned (0-255)
        this.registers[name] = value & 0xFF;
    }

    /**
     * Read from memory
     */
    readMemory(address: number): number {
        if (address < 0 || address > 255) {
            throw new Error(`Invalid memory address: ${address}`);
        }
        return this.memory[address];
    }

    /**
     * Write to memory
     */
    writeMemory(address: number, value: number): void {
        if (address < 0 || address > 255) {
            throw new Error(`Invalid memory address: ${address}`);
        }
        this.memory[address] = value & 0xFF;
    }

    /**
     * Update flags based on result
     * @param result - The result value to evaluate
     * @param carry - Explicit carry flag (for arithmetic operations)
     * @param overflow - Explicit overflow flag (for signed operations)
     */
    setFlags(result: number, carry?: boolean, overflow?: boolean): void {
        // Zero flag: set if result is 0
        this.flags.Z = (result & 0xFF) === 0 ? 1 : 0;

        // Carry flag
        if (carry !== undefined) {
            this.flags.C = carry ? 1 : 0;
        }

        // Overflow flag (for signed arithmetic)
        if (overflow !== undefined) {
            this.flags.V = overflow ? 1 : 0;
        }

        // Sign/Negative flag: set if bit 7 is 1 (for signed interpretation)
        this.flags.O = (result & 0x80) !== 0 ? 1 : 0;
    }

    /**
     * Push value onto stack
     */
    push(value: number): void {
        if (this.sp < 224) {  // Stack overflow (224-255 is stack region)
            throw new Error('Stack overflow');
        }
        this.memory[this.sp] = value & 0xFF;
        this.sp--;
    }

    /**
     * Pop value from stack
     */
    pop(): number {
        if (this.sp >= 255) {  // Stack underflow
            throw new Error('Stack underflow');
        }
        this.sp++;
        return this.memory[this.sp];
    }

    /**
     * Get memory as sparse object (only non-zero values)
     */
    getMemorySparse(): Record<string, number> {
        const sparse: Record<string, number> = {};
        for (let i = 0; i < 256; i++) {
            if (this.memory[i] !== 0) {
                sparse[i.toString()] = this.memory[i];
            }
        }
        return sparse;
    }

    /**
     * Halt execution with optional error
     */
    halt(error?: string): void {
        this.halted = true;
        if (error) {
            this.error = error;
        }
    }
}
