import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Node, Edge } from "reactflow";
import { CPU } from "@/lib/playground/cpu";
import { VirtualIO } from "@/lib/playground/io";
import {
    parseProgramItems,
    validateProgramItems,
} from "@/lib/playground/parser";
import { buildInstructionMap, executeProgram, executeInstruction } from "@/lib/playground/executor";
import { buildInitialCPUState } from "@/lib/playground/cpu-init";
import { Variable } from "@/components/playground/VariableManager";
import { Assignment } from "@/lib/api/assignment";
import { ProgramItem } from "@/lib/api/playground";

export function usePlaygroundExecution({
    nodes,
    edges,
    variables,
    assignment,
    ioHandlerRef,
    setHighlightedLine,
    setSelectedNode,
}: {
    nodes: Node[];
    edges: Edge[];
    variables: Variable[];
    assignment: Assignment | null;
    ioHandlerRef: React.MutableRefObject<VirtualIO>;
    setHighlightedLine: (line: number | null) => void;
    setSelectedNode: (node: Node | null) => void;
}) {
    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(2); // Hz
    const [waitingForInput, setWaitingForInput] = useState(false);

    // Execution state from BE
    const [execRegisters, setExecRegisters] = useState<Record<string, number>>({});
    const [execFlags, setExecFlags] = useState<Record<string, number>>({});
    const [execMemorySparse, setExecMemorySparse] = useState<Record<string, number>>({});
    const [execPorts, setExecPorts] = useState<Record<number, number>>({});
    const [execOutputLines, setExecOutputLines] = useState<string[]>([]);
    const [execIO, setExecIO] = useState<{ logs: any[]; consoleBuffer: string; sevenSegment: number }>();
    const [currentSP, setCurrentSP] = useState<number>(255);
    const [recentlyAccessedAddresses, setRecentlyAccessedAddresses] = useState<Set<number>>(new Set());

    // Simulation Refs
    const simulationRef = useRef<{
        cpu: CPU | null;
        interval: NodeJS.Timeout | null;
        cachedItems: ProgramItem[] | null;
    }>({
        cpu: null,
        interval: null,
        cachedItems: null,
    });

    const historyRef = useRef<any[]>([]);
    const [historyLength, setHistoryLength] = useState(0);

    const canStepBack = historyLength > 0;

    const handleStepBack = useCallback(() => {
        if (historyRef.current.length === 0 || !simulationRef.current.cpu) {
            return;
        }

        const snapshot: any = historyRef.current.pop();
        if (snapshot) {
            simulationRef.current.cpu.restoreSnapshot(snapshot);

            if (snapshot.ioState) {
                ioHandlerRef.current.restoreSnapshot(snapshot.ioState);
            }

            setHistoryLength(historyRef.current.length);

            const currentCpu = simulationRef.current.cpu;
            setExecRegisters({ ...currentCpu.registers });
            setExecFlags({ ...currentCpu.flags });
            setExecMemorySparse(currentCpu.getMemorySparse());
            setHighlightedLine(currentCpu.pc);

            const ioRestoreState = ioHandlerRef.current.getSnapshot();
            setExecIO({
                logs: ioRestoreState.logs,
                consoleBuffer: ioRestoreState.consoleBuffer,
                sevenSegment: ioRestoreState.sevenSegment,
            });
            setExecOutputLines(ioRestoreState.outputLines || []);

            if (isRunning) {
                setIsRunning(false);
                if (simulationRef.current.interval) {
                    clearInterval(simulationRef.current.interval);
                    simulationRef.current.interval = null;
                }
            }
        }
    }, [isRunning, ioHandlerRef, setHighlightedLine]);

    const handleStep = useCallback(async () => {
        setSelectedNode(null);

        let items: ProgramItem[] | null = simulationRef.current.cachedItems;
        if (!items) {
            items = parseProgramItems(nodes, edges, variables);
            simulationRef.current.cachedItems = items;
        }

        if (!simulationRef.current.cpu) {
            const valErrors = validateProgramItems(items);
            if (valErrors.length) {
                toast.error(valErrors[0]);
                return;
            }

            const initialState = buildInitialCPUState(assignment);
            const computedMemory = [...(initialState.memory || [])];

            variables.forEach(v => {
                const existingIdx = computedMemory.findIndex(m => m.address === v.address);
                if (existingIdx !== -1) {
                    computedMemory[existingIdx].value = v.value;
                } else {
                    computedMemory.push({ address: v.address, value: v.value });
                }
            });
            computedMemory.sort((a, b) => a.address - b.address);
            initialState.memory = computedMemory;

            const fresh = new CPU(initialState);
            const startItem = items.find((i: ProgramItem) => i.instruction?.toUpperCase() === 'START');
            if (startItem) fresh.pc = startItem.id;
            simulationRef.current.cpu = fresh;
        }

        const currentCpu = simulationRef.current.cpu;

        if (!currentCpu || currentCpu.halted) {
            setIsRunning(false);
            if (simulationRef.current.interval) {
                clearInterval(simulationRef.current.interval);
                simulationRef.current.interval = null;
            }
            return;
        }

        try {
            const instructionMap = buildInstructionMap(items);
            const item = instructionMap.get(currentCpu.pc);

            if (!item) {
                currentCpu.halt(`Invalid PC: ${currentCpu.pc}`);
                setExecRegisters({ ...currentCpu.registers });
                setExecFlags({ ...currentCpu.flags });
                return;
            }

            const previousMemoryState = new Uint8Array(currentCpu.memory);
            const previousSP = currentCpu.sp;

            const cpuSnapshot = currentCpu.getSnapshot();
            const ioSnapshot = ioHandlerRef.current.getSnapshot();
            const fullSnapshot = {
                ...cpuSnapshot,
                ioState: ioSnapshot
            };
            historyRef.current.push(fullSnapshot);
            setHistoryLength(historyRef.current.length);

            executeInstruction(currentCpu, item, instructionMap, undefined, ioHandlerRef.current);

            const accessedAddresses = new Set<number>();
            for (let i = 0; i < 256; i++) {
                if (currentCpu.memory[i] !== previousMemoryState[i]) {
                    accessedAddresses.add(i);
                }
            }

            if (currentCpu.sp !== previousSP) {
                const start = Math.min(currentCpu.sp, previousSP);
                const end = Math.max(currentCpu.sp, previousSP);
                for (let addr = start; addr <= end; addr++) {
                    accessedAddresses.add(addr);
                }
                setCurrentSP(currentCpu.sp);
            }

            if (accessedAddresses.size > 0) {
                setRecentlyAccessedAddresses(accessedAddresses);
                setTimeout(() => setRecentlyAccessedAddresses(new Set()), 800);
            }

            const newRegisters = { ...currentCpu.registers };
            setExecRegisters(newRegisters);
            setExecFlags({ ...currentCpu.flags });
            setExecMemorySparse(currentCpu.getMemorySparse());

            if (currentCpu.ports) {
                setExecPorts({ ...currentCpu.ports });
            }

            const ioSnapshotSync = ioHandlerRef.current.getSnapshot();
            setExecIO({
                logs: ioSnapshotSync.logs || [],
                consoleBuffer: ioSnapshotSync.consoleBuffer || "",
                sevenSegment: ioSnapshotSync.sevenSegment || 0,
            });
            setExecOutputLines(ioSnapshotSync.outputLines || []);

            setHighlightedLine(currentCpu.pc);
            setWaitingForInput(false);

            if (currentCpu.halted) {
                setIsRunning(false);
                if (simulationRef.current.interval) {
                    clearInterval(simulationRef.current.interval);
                    simulationRef.current.interval = null;
                }
                toast.success("Halted");
            }
        } catch (e: any) {
            if (e.message === 'INPUT_REQUIRED') {
                setIsRunning(false);
                setWaitingForInput(true);
                if (simulationRef.current.interval) {
                    clearInterval(simulationRef.current.interval);
                    simulationRef.current.interval = null;
                }
                toast("Waiting for input...", {
                    icon: '⌨️',
                    duration: 2000,
                    style: { borderRadius: '10px', background: '#3b82f6', color: '#fff' }
                });
                return;
            }
            setIsRunning(false);
            toast.error(e.message);
            currentCpu.halt(e.message);
        }
    }, [nodes, edges, assignment, variables, ioHandlerRef, setSelectedNode, setHighlightedLine]);

    const runInstant = useCallback(async () => {
        setSelectedNode(null);

        try {
            const items = parseProgramItems(nodes, edges, variables);
            const valErrors = validateProgramItems(items);
            if (valErrors.length) {
                toast.error(`Invalid: ${valErrors[0]}`);
                return;
            }

            const hasInInProgram = items.some((item: ProgramItem) => item.instruction?.toUpperCase() === "IN");
            if (hasInInProgram) {
                toast.error("Input (IN) not supported in Instant Mode. Use Debugger.", {
                    icon: '🚫',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' },
                });
                return;
            }

            const initialState = buildInitialCPUState(assignment);
            const computedMemory = [...(initialState.memory || [])];
            variables.forEach(v => {
                const existingIdx = computedMemory.findIndex(m => m.address === v.address);
                if (existingIdx !== -1) {
                    computedMemory[existingIdx].value = v.value;
                } else {
                    computedMemory.push({ address: v.address, value: v.value });
                }
            });
            computedMemory.sort((a, b) => a.address - b.address);
            initialState.memory = computedMemory;

            const freshCpu = initialState;
            const result = await executeProgram(items, freshCpu, 10000, {}, ioHandlerRef.current);

            setExecRegisters(result.registers);
            setExecFlags(result.flags);
            setExecMemorySparse(result.memory_sparse);
            setExecPorts(result.ports || {});

            if (result.io_state) {
                setExecIO({
                    logs: result.io_state.logs,
                    consoleBuffer: result.io_state.consoleBuffer,
                    sevenSegment: result.io_state.sevenSegment,
                });
                setExecOutputLines(result.io_state.outputLines || []);
            }
            setHighlightedLine(null);
            toast.success("Execution Complete");
        } catch (error: any) {
            toast.error(error.message || "Execution failed");
        }
    }, [nodes, edges, assignment, variables, ioHandlerRef, setSelectedNode, setHighlightedLine]);

    const toggleDebugPlay = useCallback(() => {
        setIsRunning(prev => !prev);
    }, []);

    useEffect(() => {
        const cleanup = () => {
            if (simulationRef.current.interval) {
                clearInterval(simulationRef.current.interval);
                simulationRef.current.interval = null;
            }
        };

        if (isRunning) {
            cleanup();
            simulationRef.current.interval = setInterval(() => {
                handleStep();
            }, 1000 / speed);
        } else {
            cleanup();
        }
        return cleanup;
    }, [isRunning, speed, handleStep]);

    const handleReset = useCallback(() => {
        setIsRunning(false);
        if (simulationRef.current.interval) {
            clearInterval(simulationRef.current.interval);
            simulationRef.current.interval = null;
        }
        simulationRef.current.cpu = null;
        simulationRef.current.cachedItems = null;

        setHistoryLength(0);
        historyRef.current = [];
        setHighlightedLine(null);

        const initial = buildInitialCPUState(assignment);
        const initialMemory: Record<string, number> = {};
        if (initial.memory) {
            initial.memory.forEach((m: any) => {
                initialMemory[m.address] = m.value;
            });
        }

        setExecRegisters(initial.registers);
        setExecFlags(initial.flags);
        setExecMemorySparse(initialMemory);
        setExecPorts(initial.ports);
        setExecIO(undefined);
        setExecOutputLines([]);

        ioHandlerRef.current.reset();
    }, [assignment, ioHandlerRef, setHighlightedLine]);

    return {
        isRunning,
        setIsRunning,
        speed,
        setSpeed,
        waitingForInput,
        setWaitingForInput,
        execRegisters,
        setExecRegisters,
        execFlags,
        setExecFlags,
        execMemorySparse,
        setExecMemorySparse,
        execPorts,
        setExecPorts,
        execOutputLines,
        setExecOutputLines,
        execIO,
        setExecIO,
        currentSP,
        historyLength,
        recentlyAccessedAddresses,
        canStepBack,
        handleStepBack,
        handleStep,
        runInstant,
        toggleDebugPlay,
        handleReset,
        simulationRef,
    };
}
