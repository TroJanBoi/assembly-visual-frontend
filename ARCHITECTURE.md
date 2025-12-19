# ARCHITECTURE.md

This document serves as the "Brain" and "Source of Truth" for the 8-bit Assembly Simulator project.

## 1. Project Overview
**Visual Assembly Frontend** is a client-side simulator for an 8-bit CPU architecture. It allows users to write assembly code, visualize execution (step-by-step), and interact with virtual hardware via I/O instructions.

-   **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS.
-   **Execution Model:** Fully client-side execution engine (no backend dependency for running code).
-   **API:** Uses a mock API (`json-server`) for persistence (saving code, assignments) in development.

## 2. Directory Map (The "Where")

### Core Logic (`app/lib/playground/`)
Contains the execution engine and CPU definition. Logic here is framework-agnostic (pure TypeScript).
-   `cpu.ts`: Defines the `CPU` class, Registers (`R0`...`R3`), Flags (`Z`, `C`, `V`, `O`), and Memory (`256 bytes`).
-   `stepExecutor.ts`: The main execution loop. Handles fetching instructions, decoding, and updating CPU state.
-   `instructionDefs.ts`: Definitions for the Assembler/UI (e.g., valid operands for `MOV`, `ADD`).
-   `io.ts`: Defines the `IOHandler` interface and `VirtualIO` class (Port logic).
-   `ports.ts`: Constants for Virtual Ports definitions (IDs and Names).

### UI Components (`app/components/playground/`)
React components for visualization.
-   `io/`: I/O specific components (`LEDMatrix`, `NumberDisplay`, `TerminalOutput`, `IOContainer`).
-   `nodes/`: Visual nodes for the program graph.
-   `NodePanel.tsx`: The panel showing available instructions.

### Pages (`app/app/`)
-   `app/(playground)/class/[id]/assignment/[assignmentId]/playground/page.tsx`: The main entry point for the simulator. Orchestrates state between the `CPU` and the UI.

### Types (`app/lib/api/`)
-   `playground.ts`: core types for the graph and program (`ProgramItem`, `Operand`).

## 3. Data Flow & Architecture (The "How")

### Execution Engine -> UI
1.  **State Management**: The `page.tsx` maintains the `StepExecutionState`, which contains the `cpu`, `memory`, and `ioHandler`.
2.  **Stepping**: When the user clicks "Step", the `executeStep` function (from `stepExecutor.ts`) is called.
3.  **IOHandler**: The `VirtualIO` instance is persistent and passed to `executeStep` or `executeProgram`.
4.  **Async "Run"**: The `executeProgram` function is **async** and yields to the event loop (via `setTimeout(0)`) every 20 steps. This allows the browser to process UI events (like keyboard input) while the simulation runs in a loop.
5.  **Re-render**: After each step or yield, the state updates to filter down to UI components.

### I/O System
-   **Port 0 (Console)**:
    -   **Output**: CPU writes -> `VirtualIO` appends to `consoleOutput` string.
    -   **Input**: `VirtualIO` maintains a **Key Buffer**. Typing in the UI pushes to this buffer. `IN R0, 0` reads from it (FIFO). Returns 0 if empty.
-   **Ports 1-3 (Displays)**: Updates `sevenSegment` and `ledMatrix` state.
-   **Port 4 (Gamepad)**: Reads immediate state from UI Gamepad buttons.
-   **Port 5 (RNG)**: Returns random 8-bit integer.
-   **Configuration**: Users select ports via a dropdown in the Property Panel, mapped to `VIRTUAL_PORTS` constants.

## 4. Development Rules (The "Laws")

### Rule 1: Separation of Logic and UI
-   **Do not** put React code (hooks, JSX) inside `lib/playground/`.
-   **Do not** put CPU execution logic inside React Components. Components should only *display* data passed via props.

### Rule 2: The Ripple Effect
If you add or modify an instruction (e.g. `MUL`):
1.  **Update `instructionDefs.ts`**: To let the UI/Assembler know about it (valid operands).
2.  **Update `stepExecutor.ts`**: To implement the execution logic (`executeMUL`).
3.  **Update `cpu.ts`**: If it affects flags or registers in a new way.

### Rule 3: Design System
-   **Style**: Modern SaaS Dashboard.
-   **Colors**: Slate (backgrounds/text), Indigo/Violet (accents/active states), Emerald (success/terminal).
-   **Shapes**: Rounded corners (`rounded-lg`, `rounded-xl`), subtle borders (`border-slate-200`), soft shadows (`shadow-sm`).
-   **Avoid**: "Retro/Pixel-art" styles. Keep it clean and professional.

## 5. Current Status
-   **CPU**: 8-bit architecture fully verified. Supports Reg-Reg and Reg-Imm operations.
-   **Memory**: 256-byte linear memory space.
-   **Instructions**: 
    -   System: `START`, `HLT`
    -   Data: `MOV`, `LOAD`, `STORE`, `PUSH`, `POP`
    -   Arithmetic: `ADD`, `SUB`, `INC`, `DEC`, `MUL`, `DIV`
    -   Bitwise: `AND`, `OR`, `XOR`, `NOT`, `SHL`, `SHR`
    -   Control Flow: `JMP`, `JZ`, `JNZ`, `CALL`, `RET`, `CMP`
-   **I/O**: Implemented `IN`/`OUT` with Virtual Device handlers:
    -   Output: Console, 7-Segment, LED Matrix.
    -   Input: Console (Keyboard Buffer), Gamepad (Port 4), RNG (Port 5).
-   **UI**: I/O Components created, including Gamepad. Main graph editor supports configured instruction sets.
-   **API**: Mock server (`json-server`) configured with public classes support.
