# ARCHITECTURE.md

This document serves as the **"Brain" and "Source of Truth"** for the **Assembly Visual Frontend** project.

## 1. Project Overview

**Visual Assembly Frontend** is a modern, client-side interactive simulator for an 8-bit CPU architecture. It provides an immersive environment for students to write assembly code, visualize execution, debug with "Time Travel," and complete graded assignments.

-   **Stack**: Next.js 14+ (App Router), TypeScript, Tailwind CSS.
-   **Execution Engine**: Pure client-side TypeScript CPU simulator.
-   **Persistence**: Backend API integration (verified `json-server` or Go backend) for saving user progress, classes, and assignments.

## 2. Directory Structure ( The "Where" )

The project follows the standard **Next.js App Router** structure with `src` located at `app/`.

### 2.1 Routes (`app/app/`)
Organized using **Route Groups** to separate layouts and concerns:

-   **(auth)/**: Authentication routes (Login, Signup, etc.).
-   **(pages)/**: Main application dashboard and feature pages:
    -   `home/`: Landing/Dashboard.
    -   `class/`: Classroom management and assignment lists.
    -   `profile/`, `bookmark/`, `calendar/`, `recent/`: User-centric features.
-   **(playground)/**: The core simulator environment.
    -   `/class/[id]/assignment/[assignmentId]/playground`: The main IDE interface.

### 2.2 Core Logic (`app/lib/`)
Contains business logic, utilities, and the CPU engine.

-   **`playground/`**: The heart of the simulator.
    -   `cpu.ts`: Defines `CPU` state, Registers, Flags, and Memory.
    -   `executor.ts` & `stepExecutor.ts`: Handles the fetch-decode-execute cycle.
    -   `instructionDefs.ts`: Instruction set definitions (opcodes, operands).
    -   `io.ts` & `ports.ts`: Virtual I/O device handling (Console, LED Matrix, etc.).
    -   `grader.ts` & `grading.ts`: Logic for verifying student code against test cases.
    -   `test_runner.ts`: Automated test execution engine.
-   **`api/`**: API client and type definitions for backend communication.
-   **`auth/`**: Authentication logic providers.
-   **`storage/`**: Local storage helpers.

### 2.3 UI Components (`app/components/`)
-   **`ui/`**: Reusable design system components (often customized or shadcn-like).
    -   Includes `Button`, `Modal`, `Input`, `ToastAlert`.
    -   Special visual components: `PixelBackground`, `DecryptedText`, `RotatingText`.
-   **`playground/`**: Simulator-specific components.
    -   `io/`: Hardware visualizations (Terminal, LED Matrix).
    -   `nodes/`: Graph-based program visualization nodes.
-   **`assignment/`**, **`class/`**: Feature-specific components.
-   **`layout/`**: Global layout components (Sidebars, Headers).

## 3. Data Flow & Execution Model

### 3.1 The Simulator Loop
1.  **State**: The `CPU` object holds the truth (Registers, RAM, Flags).
2.  **Execution**: `stepExecutor.ts` performs atomic steps. `executor.ts` likely manages the higher-level run loop and "Step Back" history.
3.  **Visualization**: React components subscribe to state changes to render the current CPU state.
4.  **I/O**:
    -   **Input**: Buffered via `VirtualIO` (Keyboard, Gamepad).
    -   **Output**: Written to virtual ports, triggering UI updates (Console logs, LED updates).

### 3.2 Grading System
-   assignments define **Test Cases** (Input/Output pairs).
-   `test_runner.ts` executes the student's code in a sandbox (headless CPU or accelerated mode).
-   `grader.ts` compares actual outputs against expected outputs to generate a score.

## 4. Design Guidelines

-   **Aesthetic**: Modern, "Tech-Forward" SaaS. Uses dark modes, glassmorphism, and pixel-art inspired accents (`PixelBackground`).
-   **UX**: Fast, responsive, and intuitive. "Time Travel" debugging is a key feature.
-   **Code Quality**:
    -   **Strict Separation**: No React calls in `lib/playground/`. CPU logic must remain pure TS.
    -   **Type Safety**: Comprehensive TypeScript definitions for all instructions and API responses.

## 5. Current Features & Status

-   **CPU**: 8-bit architecture with Reg-Reg, Reg-Imm ops, and Stack support.
-   **I/O**: Console (ASCII/Numeric), LED Matrix (Ports 1-3), Gamepad (Port 4), RNG (Port 5).
-   **IDE**: Code editor with syntax highlighting, graph visualization, and "Step" debugging.
-   **Education**: Classrooms, Assignments, and Automated Grading.
-   **Auth**: User accounts and Google integration (implied by `controller` names in backend).
