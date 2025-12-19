# Code Audit Report

## 1. UI Usage Audit (Orphaned Components)
The following components exist in `app/components/playground/io/` but are **NOT** rendered in the main playground page (`app/app/(playground)/class/[id]/assignment/[assignmentId]/playground/page.tsx`).

-   `IOContainer.tsx`
-   `LEDMatrix.tsx`
-   `NumberDisplay.tsx`
-   `TerminalOutput.tsx`

**Status**: 🟡 **Confirmed Orphans**. These components are "dead code" until wired into the main UI.

## 2. Instruction Logic Completeness Check
I reviewed `app/lib/playground/stepExecutor.ts` and `cpu.ts`.

-   **Implemented Instructions**: `START`, `HLT`, `NOP`, `MOV`, `ADD`, `SUB`, `INC`, `DEC`, `LOAD`, `STORE`, `CMP`, `JMP`, `JZ`, `JNZ`, `JC`, `JNC`, `JN`, `PUSH`, `POP`, `MUL`, `DIV`, `IN`, `OUT`, `LABEL`.
-   **Stack Safety**: `cpu.ts` correctly enforces stack bounds (Overflow < 224, Underflow > 255).
-   **Arithmetic Flags**:
    -   `ADD`/`SUB`/`CMP`/`INC`/`DEC`: Correctly calculate Signed Overflow (V).
    -   `MUL`: Sets Carry (C) if result > 255. Does *not* explicitly set Overflow (V), which is acceptable for simple 8-bit unsigned models, but worth noting.
    -   `DIV`: Handles divide-by-zero.

**Status**: 🟢 **Logic seems complete and robust**.

## 3. I/O Wiring Check
-   **Logic Layer**: `stepExecutor.ts` correctly delegations `IN`/`OUT` to `ioHandler`.
-   **UI Layer**: The main `page.tsx` **does not** retrieve the `ioHandler` state (snapshot) from the executor, nor does it pass it to any UI components.
-   **Result**: Executing `OUT 1, 10` updates the internal VIO state, but the user sees **nothing**.

**Status**: 🔴 **Critical Wiring Gap**.

# Fix List (Prioritized)

1.  🔴 **Critial: Wire I/O to UI**
    -   Update `page.tsx` to read `ioHandler` from `stepExecutionState`.
    -   Render `IOContainer` and its children (`LEDMatrix`, `Terminal`, `NumberDisplay`).
    -   Pass real-time state prop to these components.

2.  🟡 **Warning: Resolve Orphans**
    -   This is implicitly resolved by fixing item #1.

3.  🟢 **Suggestion: Refactor Page Layout**
    -   The `page.tsx` is likely large and handling too much. Moving the "Dashboard" layout including the new I/O rack into a separate `PlaygroundLayout` component would be cleaner.

**Waiting for confirmation to proceed with Fix #1.**
