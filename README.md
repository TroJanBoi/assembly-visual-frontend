<div align="center">
  <h1 align="center">Visual Assembly Frontend</h1>
  <p align="center">
    A Modern, Client-Side Interactive Simulator for 8-bit CPU Architecture
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Zustand-5.0-brown?style=for-the-badge" alt="Zustand" />
    <img src="https://img.shields.io/badge/Vitest-3.2-729B1B?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  </p>
</div>

<br />

## Project Overview

Visual Assembly Frontend is a comprehensive web-based platform designed to make learning assembly language intuitive and interactive. Operating as a pure client-side TypeScript CPU simulator, it provides an immersive environment for computer science students to write 8-bit assembly code, visualize the execution process in real-time, debug logic, and complete automated graded assignments.

Built with a focus on modern web performance and user experience, the system leverages Next.js App Router and a robust TypeScript execution engine to process the fetch-decode-execute cycle seamlessly within the browser.

## Key Features

- **Interactive CPU Simulator**: A pure TypeScript implementation of an 8-bit architecture supporting Reg-Reg, Reg-Imm operations, and Stack management.
- **Time Travel Debugging**: Advanced step-execution debugging capabilities allowing users to step forward and backward through their program's history.
- **Hardware Visualization**: Virtual I/O device rendering including an ASCII/Numeric Console, LED Matrix representations, Gamepad inputs, and Hardware RNG.
- **Visual Program Graph**: Graph-based code visualization using React Flow for tracing execution paths and logic flow.
- **Automated Grading System**: Built-in test runner evaluating student code against predefined test cases (Input/Output pairs) with an automated scoring mechanism.
- **Modern UI/UX**: "Tech-Forward" aesthetic featuring dark mode, glassmorphism, pixel-art inspired backgrounds, and highly responsive components.

## Technical Architecture

The project maintains a strict separation of concerns, ensuring the CPU logic remains pure TypeScript without React dependencies, guaranteeing high performance and reliability.

### Core Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **UI Components**: Radix UI primitives, Framer Motion, lucide-react
- **State Management**: Zustand
- **Visualization**: React Flow (Node graphs), ECharts, Three.js / OGL
- **Testing Engine**: Vitest (Unit), Playwright (E2E), k6 (Performance)

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/assembly-visual-frontend.git
cd assembly-visual-frontend
```

2. Navigate to the application directory
```bash
cd app
```

3. Install dependencies
```bash
npm install
```

4. Configure environment variables
```bash
cp .env.example .env
```

5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Testing Suite

The platform includes a comprehensive testing infrastructure to ensure simulator accuracy and UI performance.

- **Unit Tests**: `npm run test` (Powered by Vitest)
- **Performance Testing (UI)**: `npm run test:perf:ui` (Powered by Playwright)
- **Load Testing**: `npm run test:perf:load` (Powered by k6)

## Repository Structure

The core application code is located in the `app/` directory.

- `app/app/`: Next.js App Router definitions, including authentication, classroom, and the main playground IDE.
- `app/lib/playground/`: The core CPU simulator engine, instruction definitions, virtual I/O handlers, and the automated grading logic.
- `app/components/`: Reusable UI elements, including specialized hardware visualization components (`app/components/playground/io/`).
- `app/tests/`: Performance and load testing scripts.

*(Note: Documentation like API schemas are maintained securely and optionally ignored to keep the repository focused on frontend application source code)*

## License

This project is licensed under the KMITL License. Please see the LICENSE file for more information.

## Acknowledgments

- King Mongkut's Institute of Technology Ladkrabang