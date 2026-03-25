import { generateUUID } from "@/lib/utils";

/**
 * I/O Interface and Virtual Devices
 * Handles communication between CPU and virtual peripherals
 */

export type LogType = 'SYSTEM' | 'OUTPUT' | 'INPUT' | 'ERROR' | 'CPU_INTERNAL' | 'IO_VISUAL' | 'IO_TEXT';

export interface LogEntry {
    id: string;
    timestamp: number;
    type: LogType;
    content: string;
}

export interface IOHandler {
    onWrite(port: number, value: number): void;
    onRead(port: number): number | null; // BUG FIX #6: Return null for blocking I/O
    getSnapshot(): IOState;
    addLog(type: LogType, message: string): void;
}

export type IOState = {
    logs: LogEntry[];
    consoleBuffer: string; // Expose partial lines
    sevenSegment: number;

    keyBuffer: number[]; // For time travel: save input buffer state
    outputLines: string[]; // Dual-Channel: Clean Output separate from Logs
};

export class VirtualIO implements IOHandler {
    state: IOState;

    constructor(initialState?: Partial<IOState>) {
        this.state = {
            logs: [],
            consoleBuffer: "",
            sevenSegment: 0,

            keyBuffer: [], // Initialize key buffer
            outputLines: [], // Init Output
            ...initialState
        };
    }

    // Helper to add logs cleanly
    addLog(type: LogType, content: string) {
        // Prevent massive log arrays
        if (this.state.logs.length > 200) {
            this.state.logs.shift();
        }

        this.state.logs.push({
            id: generateUUID(),
            timestamp: Date.now(),
            type,
            content
        });
    }

    receiveInput(key: string): void {
        // Echo input to logs for feedback
        // But only meaningful characters, or maybe just when line is submitted?
        // For now, let's log the key press only if it's special or maybe rely on the UI to log the full line.
        // Actually, users prefer to see what they type.
        // We will let the Terminal UI handle the visual "echo" while typing, 
        // and only log the "Submitted" input here if needed?
        // Wait, the prompt says: "User hits Enter -> Value is sent to CPU -> Log as `Input: [Value]`"

        // So `receiveInput` simply buffers the key for the CPU to read.
        // We do NOT log every keystroke here.

        // Special Case: Backspace -> ASCII 8
        if (key === "Backspace") {
            this.state.keyBuffer.push(8);
            return;
        }

        // Special Case: Enter -> ASCII 10 (Line Feed)
        if (key === "Enter") {
            this.state.keyBuffer.push(10);
            return;
        }

        if (key.length === 1) {
            const ascii = key.charCodeAt(0);
            // Strict ASCII Mode: Only accept standard ASCII (0-127)
            if (ascii >= 0 && ascii <= 127) {
                this.state.keyBuffer.push(ascii);
            }
        }
    }

    private handleConsoleWrite(val: number) {
        // Backspace
        if (val === 8) {
            this.state.consoleBuffer = this.state.consoleBuffer.slice(0, -1);
            return;
        }

        // Newline triggers a log commit
        if (val === 10 || val === 13) {
            if (this.state.consoleBuffer.length > 0) {
                // 1. Log to System (Debug) as IO_TEXT
                this.addLog('IO_TEXT', `Console Output: "${this.state.consoleBuffer}"`);
                // 2. Commit to Clean Output
                this.state.outputLines.push(this.state.consoleBuffer);

                this.state.consoleBuffer = "";
            }
            return;
        }

        // Standard Char
        this.state.consoleBuffer += String.fromCharCode(val);
    }

    private formatValue(val: number): string {
        const v = val & 0xFF;
        const hex = v.toString(16).toUpperCase().padStart(2, '0');

        // Spaced binary nibbles (e.g. 0000 0000)
        const binRaw = v.toString(2).padStart(8, '0');
        const bin = `${binRaw.slice(0, 4)} ${binRaw.slice(4)}`;

        // Hex-to-Char mapping (showing each hex digit as char)
        const hexChars = hex.split('').map(c => `'${c}'`).join(', ');

        return `${v} (0x${hex}, 0b${bin}, ${hexChars})`;
    }

    onWrite(port: number, value: number): void {
        const val = value & 0xFF; // Ensure 8-bit

        switch (port) {
            case 0: // Console Output (ASCII)

                this.handleConsoleWrite(val);
                break;

            case 1: // Console Output (Number)
                const numStr = val.toString();
                this.addLog('IO_TEXT', `Console Output (Num): ${numStr}`);
                this.state.outputLines.push(numStr);
                break;

            case 2: // 7-Segment Display
                this.state.sevenSegment = val;
                break;

            case 3: // LED Panel
                // Store value for state capture (cpu.ports is also updated by executor)
                this.addLog('IO_VISUAL', `LED Panel: ${this.formatValue(val)}`);
                break;



            default:
                // Unknown port, ignore or log
                this.addLog('SYSTEM', `Unmapped Port Write: ${port} -> ${this.formatValue(val)}`);
                break;
        }
    }


    onRead(port: number): number | null {
        switch (port) {
            case 0: // Console Input (Keyboard)
                if (this.state.keyBuffer.length > 0) {
                    const k = this.state.keyBuffer.shift()!;
                    // If we just read a newline, maybe log it as INPUT?
                    // For now, let the frontend handle input echoing to avoid dupes.
                    return k;
                }
                // BUG FIX #6: Return null when buffer empty (blocking I/O)
                return null;



            default:
                return 0;
        }
    }

    reset(): void {
        this.state = {
            logs: [],
            consoleBuffer: "",
            sevenSegment: 0,

            keyBuffer: [], // Reset key buffer
            outputLines: [],
        };
        // Initial System Log
        this.addLog('SYSTEM', 'System Reset. Ready.');
    }

    getSnapshot(): IOState {
        // Return a deep copy to avoid mutation issues in UI
        return {
            logs: [...this.state.logs],
            consoleBuffer: this.state.consoleBuffer,
            sevenSegment: this.state.sevenSegment,

            keyBuffer: [...this.state.keyBuffer], // Include input buffer for time travel
            outputLines: [...this.state.outputLines],
        };
    }

    // Time Travel: Restore IO state from snapshot
    restoreSnapshot(snapshot: IOState): void {
        this.state = {
            logs: [...snapshot.logs],
            consoleBuffer: snapshot.consoleBuffer,
            sevenSegment: snapshot.sevenSegment,

            keyBuffer: [...snapshot.keyBuffer],
            outputLines: [...(snapshot.outputLines || [])],
        };
    }
}
