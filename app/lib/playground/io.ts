/**
 * I/O Interface and Virtual Devices
 * Handles communication between CPU and virtual peripherals
 */

export interface IOHandler {
    onWrite(port: number, value: number): void;
    onRead(port: number): number;
    getSnapshot(): IOState;
}

export type IOState = {
    consoleOutput: string;
    sevenSegment: number;
    ledMatrix: Uint8Array; // 8 rows, each byte is a row pattern
    ledSelectedRow: number;
    gamepadState: number;
};

export class VirtualIO implements IOHandler {
    state: IOState;

    constructor(initialState?: Partial<IOState>) {
        this.state = {
            consoleOutput: "",
            sevenSegment: 0,
            ledMatrix: new Uint8Array(8),
            ledSelectedRow: 0,
            gamepadState: 0,
            ...initialState
        };
    }

    private keyBuffer: number[] = [];

    receiveInput(key: string): void {
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

        // Allow all single characters (including Space, symbols)
        if (key.length === 1) {
            const ascii = key.charCodeAt(0);
            this.keyBuffer.push(ascii);
        }
    }

    onWrite(port: number, value: number): void {
        const val = value & 0xFF; // Ensure 8-bit

        switch (port) {
            case 0: // Console Output
                if (val === 8) {
                    // Backspace: Remove last character
                    this.state.consoleOutput = this.state.consoleOutput.slice(0, -1);
                } else if (val === 10 || val === 13) {
                    // Newline: Append \n
                    this.state.consoleOutput += "\n";
                } else {
                    // Append ASCII character
                    this.state.consoleOutput += String.fromCharCode(val);
                }
                break;

            case 1: // 7-Segment Display
                this.state.sevenSegment = val;
                break;

            case 2: // LED Matrix Row Select
                this.state.ledSelectedRow = val % 8;
                break;

            case 3: // LED Matrix Row Data
                this.state.ledMatrix[this.state.ledSelectedRow] = val;
                break;

            default:
                // Unknown port, ignore or log
                break;
        }
    }

    onRead(port: number): number {
        switch (port) {
            case 0: // Console Input (Keyboard)
                if (this.keyBuffer.length > 0) {
                    return this.keyBuffer.shift()!;
                }
                return 0;

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
            consoleOutput: "",
            sevenSegment: 0,
            ledMatrix: new Uint8Array(8),
            ledSelectedRow: 0,
            gamepadState: 0,
        };
        // We do NOT clear keyBuffer here to allow pre-typing before Run.
        // User can clear manually only if page refreshes or we add a "Clear Buffer" button.
        // But implicitly, maybe we should clear it? 
        // "Type ahead" feature usually implies keeping it.
    }

    getSnapshot(): IOState {
        // Return a copy to avoid mutation issues in UI
        return {
            consoleOutput: this.state.consoleOutput,
            sevenSegment: this.state.sevenSegment,
            ledMatrix: new Uint8Array(this.state.ledMatrix),
            ledSelectedRow: this.state.ledSelectedRow,
            gamepadState: this.state.gamepadState,
        };
    }
}
