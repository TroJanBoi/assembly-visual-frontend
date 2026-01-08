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
    ledMatrix: Uint8Array;
    ledSelectedRow: number;
    gamepadState: number;
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
            ledMatrix: new Uint8Array(8),
            ledSelectedRow: 0,
            gamepadState: 0,
            keyBuffer: [], // Initialize key buffer
            outputLines: [], // Init Output
            ...initialState
        };
        this.keyBuffer = initialState?.keyBuffer ? [...initialState.keyBuffer] : [];
    }

    private keyBuffer: number[] = [];

    // Helper to add logs cleanly
    addLog(type: LogType, content: string) {
        // Prevent massive log arrays
        if (this.state.logs.length > 200) {
            this.state.logs.shift();
        }

        this.state.logs.push({
            id: crypto.randomUUID(),
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
            this.keyBuffer.push(8);
            return;
        }

        // Special Case: Enter -> ASCII 10 (Line Feed)
        if (key === "Enter") {
            this.keyBuffer.push(10);
            return;
        }

        if (key.length === 1) {
            const ascii = key.charCodeAt(0);
            this.keyBuffer.push(ascii);
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

    onWrite(port: number, value: number): void {
        const val = value & 0xFF; // Ensure 8-bit

        switch (port) {
            case 0: // Console Output (ASCII)
                // We need to buffer this char-by-char if we want to print words...
                // OR adapt the standardized CPU to write whole strings? 
                // The current CPU writes char by char (INT output).
                // If we log every char as a new line, it will be spammy.
                // WE NEED A BUFFER FOR PARTIAL OUTPUT lines.

                // Hack: For now, let's treat every char as a potential append to the LAST log if it's OUTPUT type?
                // Or perform internal buffering.
                this.handleConsoleWrite(val);
                break;

            case 1: // Console Output (Number)
                const numStr = val.toString();
                this.addLog('IO_TEXT', `Console Output (Num): ${numStr}`);
                this.state.outputLines.push(numStr);
                break;

            case 2: // 7-Segment Display
                this.state.sevenSegment = val;
                this.addLog('IO_VISUAL', `7-Seg Update: ${val}`);
                break;

            case 3: // LED Matrix Row Select
                this.state.ledSelectedRow = val % 8;
                // this.addLog('IO_VISUAL', `LED Row Select: ${this.state.ledSelectedRow}`); // Too verbose?
                break;

            case 4: // LED Matrix Row Data
                this.state.ledMatrix[this.state.ledSelectedRow] = val;
                this.addLog('IO_VISUAL', `LED Matrix Update Row ${this.state.ledSelectedRow}: ${val.toString(2).padStart(8, '0')}`);
                break;

            default:
                // Unknown port, ignore or log
                this.addLog('SYSTEM', `Unmapped Port Write: ${port} -> ${val}`);
                break;
        }
    }


    onRead(port: number): number | null {
        switch (port) {
            case 0: // Console Input (Keyboard)
                if (this.keyBuffer.length > 0) {
                    const k = this.keyBuffer.shift()!;
                    // If we just read a newline, maybe log it as INPUT?
                    // For now, let the frontend handle input echoing to avoid dupes.
                    return k;
                }
                // BUG FIX #6: Return null when buffer empty (blocking I/O)
                return null;

            case 4: // Gamepad (Mock)
                return this.state.gamepadState;

            case 5: // RNG
                return Math.floor(Math.random() * 256);

            default:
                return 0;
        }
    }

    reset(): void {
        this.state = {
            logs: [],
            consoleBuffer: "",
            sevenSegment: 0,
            ledMatrix: new Uint8Array(8),
            ledSelectedRow: 0,
            gamepadState: 0,
            keyBuffer: [], // Reset key buffer
            outputLines: [],
        };
        this.keyBuffer = []; // Clear the input buffer
        // Initial System Log
        this.addLog('SYSTEM', 'System Reset. Ready.');
    }

    getSnapshot(): IOState {
        // Return a deep copy to avoid mutation issues in UI
        return {
            logs: [...this.state.logs],
            consoleBuffer: this.state.consoleBuffer,
            sevenSegment: this.state.sevenSegment,
            ledMatrix: new Uint8Array(this.state.ledMatrix),
            ledSelectedRow: this.state.ledSelectedRow,
            gamepadState: this.state.gamepadState,
            keyBuffer: [...this.keyBuffer], // Include input buffer for time travel
            outputLines: [...this.state.outputLines],
        };
    }

    // Time Travel: Restore IO state from snapshot
    restoreSnapshot(snapshot: IOState): void {
        this.state = {
            logs: [...snapshot.logs],
            consoleBuffer: snapshot.consoleBuffer,
            sevenSegment: snapshot.sevenSegment,
            ledMatrix: new Uint8Array(snapshot.ledMatrix),
            ledSelectedRow: snapshot.ledSelectedRow,
            gamepadState: snapshot.gamepadState,
            keyBuffer: [...snapshot.keyBuffer],
            outputLines: [...(snapshot.outputLines || [])],
        };
        this.keyBuffer = [...snapshot.keyBuffer]; // Restore input buffer
    }
}
