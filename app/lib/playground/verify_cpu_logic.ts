
// Self-contained verification script for CPU logic

type Operand = { type: 'Register' | 'Immediate'; value: string };
type CPUState = { registers: Record<string, number>; flags: { Z: number, C: number, V: number, O: number } };

class MockCPU {
    registers: Record<string, number> = { R0: 0, R1: 0 };
    flags = { Z: 0, C: 0, V: 0, O: 0 };

    getRegister(name: string) { return this.registers[name] || 0; }
    setRegister(name: string, val: number) { this.registers[name] = val & 0xFF; }
    setFlags(result: number, carry: boolean, overflow: boolean) {
        this.flags.Z = (result & 0xFF) === 0 ? 1 : 0;
        this.flags.C = carry ? 1 : 0;
        this.flags.V = overflow ? 1 : 0;
        this.flags.O = (result & 0x80) !== 0 ? 1 : 0;
    }
}

function getOperandValue(cpu: MockCPU, op: Operand): number {
    if (op.type === 'Immediate') return parseInt(op.value.replace('#', ''));
    return cpu.getRegister(op.value);
}

// --- COPIED LOGIC (from stepExecutor.ts) ---

function executeADD(cpu: MockCPU, operands: Operand[]): void {
    const [dest, src] = operands;
    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue + srcValue;

    cpu.setRegister(dest.value, result);
    // Carry: result > 255
    const overflow = ((destValue ^ result) & (srcValue ^ result) & 0x80) !== 0;
    cpu.setFlags(result, result > 255, overflow);
}

function executeSUB(cpu: MockCPU, operands: Operand[]): void {
    const [dest, src] = operands;
    const destValue = cpu.getRegister(dest.value);
    const srcValue = getOperandValue(cpu, src);
    const result = destValue - srcValue;

    cpu.setRegister(dest.value, result);
    // Carry (Borrow): result < 0
    const overflow = ((destValue ^ srcValue) & (destValue ^ result) & 0x80) !== 0;
    cpu.setFlags(result, result < 0, overflow);
}

// --- CHECKS ---
const cpu = new MockCPU();

// 1. ADD Overflow: 127 + 1 = 128 (-128)
cpu.registers['R0'] = 127;
executeADD(cpu, [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '#1' }]);
if (cpu.flags.V !== 1) console.error("FAIL: ADD Overflow check failed");

// 2. SUB Overflow: -128 - 1 = -129 (+127)
cpu.registers['R0'] = 128; // -128 in 8-bit unsigned is 128
executeSUB(cpu, [{ type: 'Register', value: 'R0' }, { type: 'Immediate', value: '#1' }]);
if (cpu.flags.V !== 1) console.error("FAIL: SUB Overflow check failed");

// 3. Reg-Reg ADD
cpu.registers['R0'] = 10;
cpu.registers['R1'] = 20;
executeADD(cpu, [{ type: 'Register', value: 'R0' }, { type: 'Register', value: 'R1' }]);
if (cpu.registers['R0'] !== 30) console.error("FAIL: Reg-Reg ADD failed");
