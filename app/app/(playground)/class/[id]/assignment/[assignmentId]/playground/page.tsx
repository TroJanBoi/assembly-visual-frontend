"use client";
import { getToken, decodeToken } from "@/lib/auth/token";
import { generateUUID } from "@/lib/utils";
import { useState, useCallback, useEffect, useRef, DragEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowInstance,
  NodeTypes,
} from "reactflow";


import { useMemo } from "react";



import PlaygroundNavbar from "@/components/playground/PlaygroundNavbar";
import InstructionNode from "@/components/playground/InstructionNode";
import PlaygroundCanvas from "@/components/playground/PlaygroundCanvas";
import { Variable } from "@/components/playground/VariableManager";

import { getAssignmentById, Assignment } from "@/lib/api/assignment";
import { getClassById } from "@/lib/api/class";

import {
  checkPlayground,
  createPlayground,
  updatePlayground,
  type ExecutionState,
  ProgramItem,
  Operand,
  UIPosition,
} from "@/lib/api/playground";
import { executeProgram, executeInstruction, buildInstructionMap } from "@/lib/playground/executor";
import { VirtualIO } from "@/lib/playground/io";
import { CPU, CPUSnapshot } from "@/lib/playground/cpu";
import { useAutoSave } from "@/hooks/useAutoSave";
import { usePlaygroundDBSave, loadPlaygroundFromDB } from "@/hooks/usePlaygroundDB";
import { saveToLocalStorage, loadFromLocalStorage, migrateLegacyStorage, type PlaygroundLocalData } from "@/lib/storage/playground";
import { ExecutionDeck, ExecutionMode } from "@/components/playground/ExecutionDeck";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

import TestManagerModal from "@/components/playground/test_cases/TestManagerModal";
import SubmissionModal from "@/components/playground/SubmissionModal";
import { TestCase, TestSuite, runTestCase, runTestSuite, TestResult, TestSuiteResult } from '@/lib/playground/test_runner';
import { getTestSuitesForAssignment } from "@/lib/api/test_cases";
import { calculateGrade } from "@/lib/playground/grading";
import {
  submitAssignment,
  SubmissionPayload,
  getSubmissions,
  getMySubmissions,
  Submission,
  getSubmissionById,
} from "@/lib/api/submission";
import { useEditorStore } from "@/hooks/playground/useEditorStore";
import { usePlaygroundExecution } from "@/hooks/playground/usePlaygroundExecution";
import { usePlaygroundHotkeys } from "@/hooks/playground/usePlaygroundHotkeys";
import { parseProgramItems } from "@/lib/playground/parser";
import { CPUState, buildInitialCPUState, enforceRegisterConstraint } from "@/lib/playground/cpu-init";

const nodeTypes: NodeTypes = { instruction: InstructionNode };
const getId = () => generateUUID();
// let id = 0; 
// const getId = () => ...

const getInstr = (n: Node) =>
  String(n.data?.instructionType || "").toUpperCase();

// ===== Types & helpers =====

type AllowedMap = Record<string, 1>;
type AllowedInstructions = {
  [category: string]: AllowedMap | null | undefined;
};

function toLowerSetFromAllowed(
  allowed?: AllowedInstructions | null,
): Set<string> {
  const set = new Set<string>();
  if (!allowed) return set;
  for (const key of Object.keys(allowed)) {
    const value = allowed[key];
    if (typeof value === "object" && value !== null) {
      // Nested structure: { "Arithmetic": { "ADD": 1 } }
      for (const name of Object.keys(value)) {
        set.add(name.toLowerCase());
      }
    } else {
      // Flat structure: { "ADD": 1 }
      set.add(key.toLowerCase());
    }
  }
  return set;
}



function getCurrentUserId(): number | string | undefined {
  try {
    const t = getToken();
    if (!t) return undefined;
    const d = decodeToken(t);
    return (d && (d.user_id ?? d.sub ?? d.id)) as number | string | undefined;
  } catch {
    return undefined;
  }
}

function pickPlaygroundId(...candidates: any[]): number | null {
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}



export default function AssignmentPlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const isReadOnly = !!submissionId;

  // Modal states
  const [testManagerOpen, setTestManagerOpen] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);

  const { id: classId, assignmentId } = params as {
    id: string;
    assignmentId: string;
  };

  const [assignment, setAssignment] = useState<Assignment | null>(null);

  // ==========================================
  // Global Editor State (Zustand)
  // ==========================================
  const {
    nodes, edges, variables,
    setNodes, setEdges, setVariables,
    onNodesChange, onEdgesChange, onConnect,
    loadFromSave, takeSnapshot, undo, redo, canUndo, canRedo
  } = useEditorStore();

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  // State missing from extraction + passed directly to usePlaygroundExecution
  const ioHandlerRef = useRef<VirtualIO>(new VirtualIO());

  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("debug");
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // New Hook Integration
  const {
    isRunning,
    setIsRunning,
    speed,
    setSpeed,
    waitingForInput,
    setWaitingForInput,
    execRegisters,
    setExecRegisters,
    execFlags,
    execMemorySparse,
    setExecMemorySparse,
    execPorts,
    execOutputLines,
    execIO,
    currentSP,
    recentlyAccessedAddresses,
    historyLength,
    canStepBack,
    handleStep,
    runInstant,
    handleStepBack,
    handleReset,
    toggleDebugPlay,
    simulationRef
  } = usePlaygroundExecution({
    nodes,
    edges,
    variables,
    assignment,
    ioHandlerRef,
    setHighlightedLine,
    setSelectedNode
  });

  const [userId, setUserId] = useState<number>(() => {
    // Initial fetch from token if available
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      return decoded?.user_id || 0; // 0 or -1 indicates "no user" / guest
    }
    return 0;
  });

  // Animation hook for currently executing node
  useEffect(() => {
    const items = simulationRef.current?.cachedItems;

    // If no execution context, clear all
    if (!items || highlightedLine === null) {
      setNodes((nds) => nds.map(n => {
        const s = { ...n.style };
        if (s.transform) delete s.transform;
        if (s.zIndex) delete s.zIndex;
        if (s.border) delete s.border;
        if (s.boxShadow) delete s.boxShadow;
        if (s.transition) delete s.transition;

        if (n.data?.isActiveExec) {
          return { ...n, style: s, data: { ...n.data, isActiveExec: false } };
        }
        return { ...n, style: s };
      }));
      return;
    }

    const activeItem = items.find((i: any) => i.id === highlightedLine);
    const activeNodeId = activeItem?.sourceNodeId;

    if (!activeNodeId) return;

    setNodes((nds) => nds.map((n) => {
      const isTarget = n.id === activeNodeId;
      const wasActive = n.data?.isActiveExec;

      if (isTarget && wasActive) return n;
      if (!isTarget && !wasActive) return n;

      if (isTarget) {
        return {
          ...n,
          data: { ...n.data, isActiveExec: true }
        };
      } else {
        const s = { ...n.style };
        if (s.transform) delete s.transform;
        if (s.zIndex) delete s.zIndex;
        if (s.border) delete s.border;
        if (s.boxShadow) delete s.boxShadow;
        if (s.transition) delete s.transition;
        return { ...n, style: s, data: { ...n.data, isActiveExec: false } };
      }
    }));
  }, [highlightedLine, setNodes, simulationRef]);

  const [isOwner, setIsOwner] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Page Load State
  const [loading, setLoading] = useState(true);
  const [playgroundLoaded, setPlaygroundLoaded] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (assignmentId && userId) {
      try {
        const data = await getMySubmissions(Number(assignmentId));
        setSubmissions(data || []);
      } catch (e) {
        console.error("Failed to fetch submissions", e);
        setSubmissions([]);
      }
    }
  }, [assignmentId, userId]);

  // Load Test Suites & Submissions
  useEffect(() => {
    if (assignmentId) {
      getTestSuitesForAssignment(Number(classId), Number(assignmentId)).then(setTestSuites).catch(console.error);

      // Check Ownership
      const checkOwnership = async () => {
        try {
          const classData = await getClassById(classId);
          const currentUserId = getCurrentUserId();
          if (classData && currentUserId) {
            setIsOwner(classData.owner_id === Number(currentUserId));
          }
        } catch (e) {
          console.error("Failed to fetch class details for ownership check", e);
        }
      };
      checkOwnership();

      fetchSubmissions();
    }
  }, [assignmentId, classId, fetchSubmissions]);

  // Effect to update userId if token changes (e.g. login/logout)
  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded?.user_id) setUserId(decoded.user_id);
    } else {
      setUserId(0);
    }
  }, []);

  // Assignment-driven controls
  const [cpu, setCpu] = useState<CPUState>(() => buildInitialCPUState(null));
  const [allowed, setAllowed] = useState<Set<string>>(new Set());
  const [maxNodes, setMaxNodes] = useState<number | null>(null);
  const [highlightedTargetId, setHighlightedTargetId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const [rightPanelPos, setRightPanelPos] = useState({ x: 0, y: 20 });
  useEffect(() => {
    const xPos = window.innerWidth - 384 - 20;
    setRightPanelPos({ x: xPos > 0 ? xPos : 0, y: 20 });
  }, []);

  // ===== terminal Panel state =====
  const labName = assignment?.title ?? "undefined_lab";

  // Terminal logs (view-only)
  const [logs, setLogs] = useState<string[]>([]);
  const appendLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  // IO State


  // Persistent IO Handler for Keyboard Buffer
  // ioHandlerRef is already defined from line 226
  const playgroundIdRef = useRef<number | null>(null);

  // Track if CPU is waiting for input (for auto-resume on Enter)
  const [waitingForInputState, setWaitingForInputState] = useState(false);



  // Helper to sync variable changes to memory
  const syncVariableToMemory = (address: number, value: number | null) => {
    setCpu((prev) => {
      const mem = [...prev.memory];
      const idx = mem.findIndex((m) => m.address === address);

      if (value === null) {
        if (idx !== -1) mem.splice(idx, 1);
      } else {
        if (idx !== -1) {
          mem[idx] = { ...mem[idx], value };
        } else {
          mem.push({ address, value });
          mem.sort((a, b) => a.address - b.address);
        }
      }
      return { ...prev, memory: mem };
    });

    // Note: execMemorySparse is updated automatically during execution.
    // Manual variable edits only update the initial CPU state block.
  };



  // ===== Auto Save =====
  const onAutoSaveLoad = useCallback((savedNodes: Node[], savedEdges: Edge[], savedMemory: Record<string, number>) => {
    // Only used for sparse memory now, nodes/edges handled by DB load mostly
    setExecMemorySparse(savedMemory);
  }, []);

  // Create unique storage key for this assignment + user
  const storageKey = useMemo(() => `playground-${assignmentId}-${userId}`, [assignmentId, userId]);

  const { resetSave } = useAutoSave(nodes, edges, cpu.memory.reduce((acc: any, cur: any) => { acc[cur.address] = cur.value; return acc; }, {}), onAutoSaveLoad, storageKey);

  // 1. Load on Mount (Priority: DB → LocalStorage → Legacy)
  useEffect(() => {
    const loadPlayground = async () => {
      // WAIT for assignment to be loaded first (to establish defaults), then overlay saved data
      if (!assignmentId || playgroundLoaded || !assignment) return;

      try {
        const numAssignmentId = parseInt(assignmentId);

        // --- Read-Only Submission Load ---
        if (isReadOnly && submissionId) {
          try {
            const submission = await getSubmissionById(parseInt(submissionId));
            if (submission && submission.item_snapshot) {
              const content = submission.item_snapshot;
              loadFromSave(
                content.react_flow?.nodes || [],
                content.react_flow?.edges || [],
                content.cpu_state?.variables || []
              );

              if (content.react_flow?.viewport && reactFlowInstance) {
                const { x, y, zoom } = content.react_flow.viewport;
                reactFlowInstance.setViewport({ x, y, zoom }, { duration: 400 });
              } else if (reactFlowInstance) {
                setTimeout(() => reactFlowInstance.fitView(), 100);
              }

              if (content.cpu_state) {
                setCpu(prev => {
                  const merged = { ...prev, registers: content.cpu_state.registers, memory: content.cpu_state.memory };
                  return enforceRegisterConstraint(merged, assignment!);
                });
                const sparse: Record<string, number> = {};
                (content.cpu_state.memory || []).forEach((m: any) => sparse[m.address] = m.value);
                setExecMemorySparse(sparse);
              }
            }
          } catch (e) {
            console.error('[Hybrid Load] Failed to load submission:', e);
            toast.error("Failed to load submission data.");
          }
          setPlaygroundLoaded(true);
          return;
        }

        // Step 1: Try loading from Database
        const playground = await loadPlaygroundFromDB(numAssignmentId);

        if (playground && playground.item) {
          const content = playground.item;
          // Set Playground ID Ref
          const pid = playground.id || (playground.Data as any)?.id;
          if (pid) {
            playgroundIdRef.current = pid;
          }

          // Restore React Flow state to Zustand
          loadFromSave(
            content.react_flow?.nodes || [],
            content.react_flow?.edges || [],
            content.cpu_state?.variables || []
          );

          // Restore Viewport
          if (content.react_flow?.viewport && reactFlowInstance) {
            const { x, y, zoom } = content.react_flow.viewport;
            reactFlowInstance.setViewport({ x, y, zoom }, { duration: 400 });
          } else if (reactFlowInstance) {
            setTimeout(() => reactFlowInstance.fitView(), 100);
          }

          // Restore CPU state
          if (content.cpu_state) {
            setCpu(prev => {
              const merged = {
                ...prev,
                registers: content.cpu_state.registers || prev.registers,
                memory: content.cpu_state.memory || prev.memory,
              };
              return enforceRegisterConstraint(merged, assignment!);
            });

            // Rebuild exec memory sparse
            const sparse: Record<string, number> = {};
            (content.cpu_state.memory || []).forEach((m: any) => {
              sparse[m.address] = m.value;
            });
            setExecMemorySparse(sparse);
          }

          // Save to LocalStorage for offline fallback
          saveToLocalStorage(numAssignmentId, userId, content);
          setPlaygroundLoaded(true);
          return;
        }

        // =========================================================
        // Step 2: DB Not Found -> Explicit Create Logic as requested
        // =========================================================
        // 2a. Check LocalStorage (Offline Sync Scenario)
        const localData = loadFromLocalStorage(numAssignmentId, userId);
        let initialPayload;

        if (localData && localData.cpu_state) {
          // Use LocalData to seed the new playground
          initialPayload = {
            assignment_id: numAssignmentId,
            item: localData,
            status: 'in_progress'
          };

          // Hydrate UI State immediately from LocalStorage
          loadFromSave(
            localData.react_flow?.nodes || [],
            localData.react_flow?.edges || [],
            localData.cpu_state?.variables || []
          );

          if (localData.cpu_state) {
            setCpu(prev => {
              const merged = {
                ...prev,
                memory: localData.cpu_state?.memory || prev.memory,
                registers: localData.cpu_state?.registers || prev.registers, // Sync registers too from Local
              };
              return enforceRegisterConstraint(merged, assignment!);
            });

            const sparse: Record<string, number> = {};
            (localData.cpu_state.memory || []).forEach((m: any) => {
              sparse[m.address] = m.value;
            });
            setExecMemorySparse(sparse);
          }

        } else {
          // Use Assignment Init to seed
          // Note: CPU State is already correctly set by fetchAssignmentData via buildInitialCPUState
          // So we just need to send that state to DB.

          // Re-derive initial CPU state to be sure we sending clean state
          const initialCpuStr = buildInitialCPUState(assignment);

          initialPayload = {
            assignment_id: numAssignmentId,
            item: {
              react_flow: {
                nodes: [],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 1 }
              },
              cpu_state: {
                registers: initialCpuStr.registers,
                memory: initialCpuStr.memory,
                variables: []
              },
              meta_data: {
                version: '1.0',
                last_saved: new Date().toISOString()
              }
            },
            status: 'in_progress'
          };
        }

        // 2b. Call Create API
        try {
          const created = await createPlayground(initialPayload) as any;

          // Set Playground ID
          const pid = created.id || (created.Data as any)?.id;
          if (pid) {
            playgroundIdRef.current = pid;
          }

          // Save to LocalStorage to keep sync
          if (initialPayload.item) {
            const localItem: any = { ...initialPayload.item };
            if (localItem.meta_data) {
              localItem.meta = {
                last_saved: localItem.meta_data.last_saved,
                version: localItem.meta_data.version
              };
              delete localItem.meta_data;
            }
            saveToLocalStorage(numAssignmentId, userId, localItem);
          }

        } catch (createErr) {
          console.error('[Hybrid Load] Failed to create initial playground:', createErr);
        }

        setPlaygroundLoaded(true);
      } catch (e) {
        console.error('[Hybrid Load] Failed:', e);
        setPlaygroundLoaded(true);
      }
    };

    loadPlayground();
  }, [assignmentId, playgroundLoaded, userId, assignment, reactFlowInstance]);


  // 2. Real-time LocalStorage Save (Debounced)
  // We debounce the ENTIRE object to avoid frequent writes during dragging
  const rawPlaygroundData = useMemo(() => ({
    react_flow: {
      nodes,
      edges,
      viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 },
    },
    cpu_state: {
      registers: cpu.registers,
      memory: cpu.memory,
      variables,
    },
  }), [nodes, edges, cpu, variables, reactFlowInstance]);

  const debouncedPlaygroundData = useDebounce(rawPlaygroundData, 1000); // 1s debounce

  useEffect(() => {
    if (!assignmentId || !playgroundLoaded || isReadOnly) return;

    const numAssignmentId = parseInt(assignmentId);
    saveToLocalStorage(numAssignmentId, userId, debouncedPlaygroundData);
  }, [debouncedPlaygroundData, assignmentId, playgroundLoaded, userId, isReadOnly]);


  // 3. Debounced Database Save (3 seconds after last change)
  // 3. Debounced Database Save (3 seconds after last change)
  const programItems = useMemo<ProgramItem[]>(() => {
    // Optimization: Use debounced nodes/edges to prevent expensive parsing on every drag frame
    // We prioritize the debounced data if available.
    const currentNodes = debouncedPlaygroundData?.react_flow?.nodes || [];
    const currentEdges = debouncedPlaygroundData?.react_flow?.edges || [];
    const currentVars = debouncedPlaygroundData?.cpu_state?.variables || [];

    // If debounced data is empty (initial load), fallback to current state to ensure we have something
    // (Though initial load usually has empty nodes anyway)
    if (currentNodes.length === 0 && nodes.length > 0) {
      return parseProgramItems(nodes, edges, variables);
    }

    return parseProgramItems(currentNodes, currentEdges, currentVars);
  }, [debouncedPlaygroundData]);

  // 3. Debounced Database Save (3 seconds after last change)
  const playgroundDataForDB = useMemo(() => ({
    items: programItems,
    react_flow: {
      nodes,
      edges,
      viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 },
    },
    cpu_state: {
      registers: cpu.registers,
      memory: cpu.memory,
      variables,
    },
    meta_data: {
      last_saved: new Date().toISOString(),
      version: '1.0',
    },
  }), [nodes, edges, cpu, variables, programItems, reactFlowInstance]);

  const { saveImmediately } = usePlaygroundDBSave(
    playgroundDataForDB,
    assignmentId ? parseInt(assignmentId) : undefined,
    {
      delay: 3000,
      enabled: playgroundLoaded && !isReadOnly,
      onSave: (result) => {
        const pid = result?.id || result?.Data?.id;
        if (pid && pid !== playgroundIdRef.current) {
          playgroundIdRef.current = pid;
        }
      },
    }
  );


  // Multi-tab Sync: Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only react to changes for THIS assignment's LocalStorage key
      const ourKey = `playground_${assignmentId}_${userId}`;
      if (e.key !== ourKey || !e.newValue || !playgroundLoaded || isReadOnly) return;

      try {
        const data = JSON.parse(e.newValue) as PlaygroundLocalData;
        // Reload React Flow state via Zustand
        loadFromSave(
          data.react_flow?.nodes || nodes,
          data.react_flow?.edges || edges,
          data.cpu_state?.variables || variables
        );

        if (data.cpu_state) {
          setCpu(prev => ({
            ...prev,
            registers: data.cpu_state?.registers || prev.registers,
            memory: data.cpu_state?.memory || prev.memory,
          }));
        }
      } catch (err) {
        console.error('[Multi-tab] Failed to parse storage change:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [assignmentId, userId, playgroundLoaded]);

  // Create a stable ref for saveImmediately to avoid effect re-runs
  const saveImmediatelyRef = useRef(saveImmediately);
  useEffect(() => {
    saveImmediatelyRef.current = saveImmediately;
  }, [saveImmediately]);

  // Save immediately on unmount (navigation away)
  // Dependency is [] so this effect ONLY cleans up on strict unmount
  useEffect(() => {
    return () => {
      // Only trigger if data is actually loaded and populated to avoid saving empty state over DB
      if (playgroundLoaded && !isReadOnly) {
        saveImmediatelyRef.current?.();
      }
    };
  }, [playgroundLoaded]); // Re-bind unmount handler only when loaded status changes (usually once)

  // Save before browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playgroundLoaded && !isReadOnly) {
        saveImmediatelyRef.current?.();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [playgroundLoaded]);


  const handleAddVariable = (name: string, value: number) => {
    // Auto-Addressing: First-Fit Strategy (Fill Gaps)
    // Must check BOTH existing variables AND defined memory (from assignment init)
    const usedAddresses = new Set<number>();
    variables.forEach((v) => usedAddresses.add(v.address));
    cpu.memory.forEach((m) => usedAddresses.add(m.address));

    let newAddress = 0;
    while (usedAddresses.has(newAddress)) {
      newAddress++;
    }

    const newVar: Variable = {
      id: generateUUID(),
      name,
      value,
      address: newAddress,
    };
    setVariables((prev) => [...prev, newVar]);
    syncVariableToMemory(newAddress, value);
  };


  const handleEditVariable = (id: string, name: string, value: number) => {
    setVariables((prev: Variable[]) => {
      const target = prev.find((v) => v.id === id);
      if (target && target.value !== value) {
        syncVariableToMemory(target.address, value);
      }
      return prev.map((v) => (v.id === id ? { ...v, name, value } : v));
    });
  };

  const handleDeleteVariable = (id: string) => {
    setVariables((prev: Variable[]) => {
      const target = prev.find((v) => v.id === id);
      if (target) {
        // Option: clear memory or leave it. 
        // Clearing it (null) ensures UI shows it as empty
        syncVariableToMemory(target.address, null);
        return prev.filter((v) => v.id !== id);
      }
      return prev;
    });
  };

  // Resets cpu.memory (and the visual execMemorySparse) back to the assignment's initial values.
  const handleResetMemory = () => {
    const initialCpu = buildInitialCPUState(assignment);
    setCpu((prev) => ({ ...prev, memory: initialCpu.memory }));
    // Also reset the execution-memory sparse map so the display is consistent
    const sparse: Record<string, number> = {};
    initialCpu.memory.forEach((m) => { sparse[m.address] = m.value; });
    setExecMemorySparse(sparse);
    toast.success("Memory reset to initial values");
  };


  const handleRunTestCase = async (testCase: TestCase): Promise<TestResult> => {
    // 1. Prepare Program
    const nodeMap = new Map<string, number>();
    nodes.forEach((node, index) => {
      nodeMap.set(node.id, index);
    });

    const program: ProgramItem[] = [];
    const edgesMap = new Map<string, { next?: string, nextTrue?: string, nextFalse?: string }>();

    edges.forEach(edge => {
      const source = edge.source;
      const target = edge.target;
      const existing = edgesMap.get(source) || {};

      // React Flow handles: 
      // - branch condition true = 'left' or 'true'
      // - sequential fallback = 'source-bottom' or 'false'

      if (edge.sourceHandle === 'true' || edge.sourceHandle === 'left') {
        existing.nextTrue = target;
      } else if (edge.sourceHandle === 'false') {
        existing.nextFalse = target;
      } else {
        // 'source-bottom' or null/undefined resolves to the standard 'next' edge.
        // For JZ/JNZ, getNextNonJump() checks item.next, so this maps perfectly.
        existing.next = target;
      }

      edgesMap.set(source, existing);
    });

    nodes.forEach((node) => {
      const numericId = nodeMap.get(node.id)!;
      const links = edgesMap.get(node.id);

      const nextId = links?.next ? (nodeMap.get(links.next) ?? null) : null;
      const nextTrueId = links?.nextTrue ? (nodeMap.get(links.nextTrue) ?? null) : null;
      const nextFalseId = links?.nextFalse ? (nodeMap.get(links.nextFalse) ?? null) : null;

      // Extract operands based on instruction type and node data
      const type = node.data.instructionType;
      const d = node.data;
      const operands: any[] = [];

      // Debug log (keep for verification)
      if (type === 'MOV') {
      }

      // 1. Jump/Label Instructions
      if (['JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN', 'CALL'].includes(type) || type === 'LABEL') {
        if (d.label) operands.push({ type: 'Label', value: d.label });
      }
      // 2. LOAD (Reg, Addr)
      else if (type === 'LOAD') {
        operands.push({ type: 'Register', value: d.dest || 'R0' });
        if (d.memMode === 'reg') {
          operands.push({ type: 'Register', value: d.memReg || 'R0' });
        } else {
          operands.push({ type: 'Immediate', value: String(d.memImm || 0) });
        }
      }
      // 3. STORE (Addr, Reg) - Note: executor expects [Dest(Addr), Src(Val)]
      else if (type === 'STORE') {
        if (d.memMode === 'reg') {
          operands.push({ type: 'Register', value: d.memReg || 'R0' });
        } else {
          operands.push({ type: 'Immediate', value: String(d.memImm || 0) });
        }
        operands.push({ type: 'Register', value: d.srcReg || 'R0' });
      }
      // 4. IN (Reg, Port)
      else if (type === 'IN') {
        operands.push({ type: 'Register', value: d.dest || 'R0' });
        operands.push({ type: 'Immediate', value: String(d.srcImm || 0) }); // Port ID is in srcImm
      }
      // 5. OUT (Port, Val)
      else if (type === 'OUT') {
        operands.push({ type: 'Immediate', value: String(d.memImm || 0) }); // Port ID is in memImm (per InstructionNode logic)
        if (d.srcMode === 'reg') {
          operands.push({ type: 'Register', value: d.srcReg || 'R0' });
        } else {
          operands.push({ type: 'Immediate', value: String(d.srcImm || 0) });
        }
      }
      // 6. Standard 2-Operand (MOV, ADD, SUB, etc.)
      else if (['MOV', 'ADD', 'SUB', 'MUL', 'DIV', 'AND', 'OR', 'XOR', 'SHL', 'SHR', 'CMP'].includes(type)) {
        operands.push({ type: 'Register', value: d.dest || 'R0' });
        if (d.srcMode === 'reg') {
          operands.push({ type: 'Register', value: d.srcReg || 'R0' });
        } else {
          operands.push({ type: 'Immediate', value: String(d.srcImm || 0) });
        }
      }
      // 7. Standard 1-Operand (INC, DEC, PUSH, POP, NOT)
      else if (['INC', 'DEC', 'PUSH', 'POP', 'NOT'].includes(type)) {
        operands.push({ type: 'Register', value: d.dest || 'R0' });
      }

      program.push({
        id: numericId,
        instruction: type,
        label: d.label,
        operands: operands,
        next: nextId,
        next_true: nextTrueId,
        next_false: nextFalseId
      });
    });
    program.sort((a, b) => a.id - b.id);

    // 2. Run Test — use a fresh CPU (reset memory to init) so each run is deterministic
    const freshCpu = buildInitialCPUState(assignment);
    const result = await runTestCase(testCase, program, freshCpu);

    // 3. Feedback
    if (result.passed) {
      toast.success(`Test '${testCase.name}' Passed!`);
    } else {
      toast.error(`Test '${testCase.name}' Failed`);
    }

    return result;
  };

  const handleRunTestSuite = async (suite: TestSuite): Promise<TestSuiteResult> => {
    // 1. Compiler Logic
    const nodeMap = new Map<string, number>();
    nodes.forEach((node, index) => nodeMap.set(node.id, index));

    const program: ProgramItem[] = [];
    const edgesMap = new Map<string, { next?: string, nextTrue?: string, nextFalse?: string }>();
    edges.forEach(edge => {
      const source = edge.source;
      const target = edge.target;
      const existing = edgesMap.get(source) || {};
      if (edge.sourceHandle === 'true') existing.nextTrue = target;
      else if (edge.sourceHandle === 'false') existing.nextFalse = target;
      else existing.next = target;
      edgesMap.set(source, existing);
    });
    nodes.forEach((node) => {
      const numericId = nodeMap.get(node.id)!;
      const links = edgesMap.get(node.id);

      // Extract operands based on instruction type (Duplicated logic from handleRunTestCase)
      const type = node.data.instructionType;
      const d = node.data;
      const operands: any[] = [];

      if (['JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN', 'CALL'].includes(type) || type === 'LABEL') {
        if (d.label) operands.push({ type: 'Label', value: d.label });
      } else if (type === 'LOAD') {
        operands.push({ type: 'Register', value: d.dest || 'R0' });
        operands.push(d.memMode === 'reg' ? { type: 'Register', value: d.memReg || 'R0' } : { type: 'Immediate', value: String(d.memImm || 0) });
      } else if (type === 'STORE') {
        operands.push(d.memMode === 'reg' ? { type: 'Register', value: d.memReg || 'R0' } : { type: 'Immediate', value: String(d.memImm || 0) });
        operands.push({ type: 'Register', value: d.srcReg || 'R0' });
      } else if (type === 'IN') {
        operands.push({ type: 'Register', value: d.dest || 'R0' });
        operands.push({ type: 'Immediate', value: String(d.srcImm || 0) });
      } else if (type === 'OUT') {
        operands.push({ type: 'Immediate', value: String(d.memImm || 0) });
        operands.push(d.srcMode === 'reg' ? { type: 'Register', value: d.srcReg || 'R0' } : { type: 'Immediate', value: String(d.srcImm || 0) });
      } else if (['MOV', 'ADD', 'SUB', 'MUL', 'DIV', 'AND', 'OR', 'XOR', 'SHL', 'SHR', 'CMP'].includes(type)) {
        operands.push({ type: 'Register', value: d.dest || 'R0' });
        operands.push(d.srcMode === 'reg' ? { type: 'Register', value: d.srcReg || 'R0' } : { type: 'Immediate', value: String(d.srcImm || 0) });
      } else if (['INC', 'DEC', 'PUSH', 'POP', 'NOT'].includes(type)) {
        operands.push({ type: 'Register', value: d.dest || 'R0' });
      }

      program.push({
        id: numericId,
        instruction: type,
        label: d.label,
        operands: operands,
        next: links?.next ? (nodeMap.get(links.next) ?? null) : null,
        next_true: links?.nextTrue ? (nodeMap.get(links.nextTrue) ?? null) : null,
        next_false: links?.nextFalse ? (nodeMap.get(links.nextFalse) ?? null) : null
      });
    });
    program.sort((a, b) => a.id - b.id);

    // 2. Run Suite — use a fresh CPU (reset memory to init) so each run is deterministic
    const freshCpu = buildInitialCPUState(assignment);
    const result = await runTestSuite(suite, program, freshCpu);

    return result;
  };



  // (Duplicate removed)


  const { handleKeyDown } = usePlaygroundHotkeys({
    reactFlowInstance,
    setNodes,
    setEdges,
    canUndo,
    canRedo,
    undo,
    redo,
    takeSnapshot,
    getId
  });

  const onNodeDoubleClick = useCallback((_e: any, node: Node) => {
    setSelectedNode(node);
    setPanelOpen(true);
  }, []);

  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    // Smart Connect (Option 1)
    if (_e.ctrlKey || _e.metaKey) {
      setSelectedNode((prevSelected) => {
        if (prevSelected && prevSelected.id !== node.id) {
          const newEdge: Edge = {
            id: `e${prevSelected.id}-${node.id}`,
            source: prevSelected.id,
            target: node.id,
            sourceHandle: "source-bottom",
            targetHandle: "in",
            type: 'default',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
          };

          setEdges((eds) => {
            // Remove existing out edges from prevSelected out handle to allow only 1
            const cleanEdges = eds.filter(e => {
              if (e.source !== prevSelected.id) return true;
              const h = e.sourceHandle;
              if (h === 'source-bottom' || h === 'out' || !h) {
                return false;
              }
              return true;
            });
            return addEdge(newEdge, cleanEdges);
          });

          // Return the new node so subsequent Ctrl+clicks keep chaining
          return node;
        }
        return node;
      });
    } else {
      setSelectedNode(node);
    }
  }, [setEdges]);

  const onPatchNode = (nodeId: string, patch: Record<string, any>) => {
    // Snapshot before modifying properties
    takeSnapshot();
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    );
  };

  const registerNames = Object.keys(cpu.registers); // e.g., ["R0","R1",...]
  const labelOptions = nodes
    .filter((n) => getInstr(n) === "LABEL")
    .map((n) => n.data?.label)
    .filter(Boolean) as string[];

  // Note: onNodesChange and onEdgesChange are now provided by Zustand store,
  // we just pass them directly to ReactFlow.

  // Auto-generate dashed edges for label jumps
  useEffect(() => {
    const branchInstructions = new Set(['JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN']);
    const labelEdges: Edge[] = [];

    nodes.forEach(node => {
      const instr = getInstr(node);
      if (branchInstructions.has(instr)) {
        const labelName = node.data?.label;
        if (labelName) {
          const targetLabel = nodes.find(n =>
            getInstr(n) === 'LABEL' && n.data?.label === labelName
          );
          if (targetLabel) {
            labelEdges.push({
              id: `label-${node.id}-${targetLabel.id}`,
              source: node.id,
              target: targetLabel.id,
              sourceHandle: 'left',
              targetHandle: 'left',
              type: 'circuitLoop',
              animated: true,
              style: { strokeDasharray: '5 5', stroke: '#9333ea' },
              zIndex: -1,
            });
          }
        }
      }
    });

    setEdges(eds => {
      // Force all regular edges to use smoothstep type
      const regularEdges = eds
        .filter(e => !e.id.startsWith('label-'))
        .map(e => ({ ...e, type: 'default' }));
      return [...regularEdges, ...labelEdges];
    });
  }, [nodes, setEdges]);

  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    // Take snapshot for Undo/Redo before dragging starts
    takeSnapshot();

    // ALT-DRAG (Figma style duplication)
    if (event.altKey && reactFlowInstance) {
      // Find all currently selected nodes. If dragging an unselected node, just duplicate that one.
      const selectedNodes = reactFlowInstance.getNodes().filter(n => n.selected);
      const isDraggingSelected = selectedNodes.some(n => n.id === node.id);
      const nodesToClone = isDraggingSelected ? selectedNodes : [node];

      const idMap = new Map<string, string>();

      // Original Nodes stay behind. WE become the duplicated nodes currently attached to the cursor.
      // We do this by duplicating the nodes but making the NEW nodes become the originals visually in State, 
      // while we drag the OLD (cursor attached) ones forward. 
      // Actually, ReactFlow simplifies this: Duplicate the nodes AT original position, unselect them,
      // and let the user continue dragging the original ones that were already grabbed by the cursor.

      const leftBehindClones = nodesToClone.map((n) => {
        const newId = getId();
        idMap.set(n.id, newId);
        return {
          ...n,
          id: newId,
          selected: false,
          dragging: false, // Drop them strictly at spawn point
          position: n.position
        };
      });

      // Handle completely internal edges of the cloned group
      const selectedEdges = reactFlowInstance.getEdges().filter(
        (e) => nodesToClone.some((n) => n.id === e.source) && nodesToClone.some((n) => n.id === e.target)
      );

      const cloneEdges = selectedEdges.map(e => {
        return {
          ...e,
          id: `e${idMap.get(e.source)}-${idMap.get(e.target)}`,
          source: idMap.get(e.source) || e.source,
          target: idMap.get(e.target) || e.target,
          selected: false,
        };
      });

      setNodes((nds: Node[]) => [...nds, ...leftBehindClones]);
      setEdges((eds: Edge[]) => [...eds, ...cloneEdges]);
    }
  }, [reactFlowInstance, setNodes, setEdges, takeSnapshot]);


  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      // Optimization: Access nodes/edges via instance to avoid dependency churning
      if (!reactFlowInstance) return;

      const currentNodes = reactFlowInstance.getNodes();
      const currentEdges = reactFlowInstance.getEdges();

      // Logic copied from onNodeDragStop but for visual feedback ONLY
      const NODE_WIDTH = node.width ?? 150;
      const NODE_HEIGHT = node.height ?? 80;

      const inputHandle = { x: node.position.x + NODE_WIDTH / 2, y: node.position.y };
      const outputHandle = { x: node.position.x + NODE_WIDTH / 2, y: node.position.y + NODE_HEIGHT };
      const CONNECT_THRESHOLD = 50;

      let foundTargetId: string | null = null;

      // 1. Check PREDECESSOR (Other -> This)
      if (getInstr(node) !== "START") { // START can't be a target of predecessor
        for (const other of currentNodes) {
          if (other.id === node.id) continue;
          const otherW = other.width ?? 150;
          const otherH = other.height ?? 80;
          const otherOut = { x: other.position.x + otherW / 2, y: other.position.y + otherH };

          const dist = Math.sqrt(Math.pow(otherOut.x - inputHandle.x, 2) + Math.pow(otherOut.y - inputHandle.y, 2));

          if (dist < CONNECT_THRESHOLD) {
            const exists = currentEdges.some(e => e.source === other.id && e.target === node.id);
            const targetOccupied = currentEdges.some(e => e.target === node.id && e.targetHandle === "in");

            if (!exists && !targetOccupied) {
              foundTargetId = other.id; // Highlight the SOURCE (Other) to show it connects TO this
              break;
            }
          }
        }
      }

      // 2. Check SUCCESSOR (This -> Other)
      if (!foundTargetId && getInstr(node) !== "HLT") {
        for (const other of currentNodes) {
          if (other.id === node.id) continue;
          const otherW = other.width ?? 150;
          const otherIn = { x: other.position.x + otherW / 2, y: other.position.y };

          const dist = Math.sqrt(Math.pow(outputHandle.x - otherIn.x, 2) + Math.pow(outputHandle.y - otherIn.y, 2));

          if (dist < CONNECT_THRESHOLD) {
            const exists = currentEdges.some(e => e.source === node.id && e.target === other.id);
            const targetOccupied = currentEdges.some(e => e.target === other.id && e.targetHandle === "in");

            if (!exists && !targetOccupied) {
              foundTargetId = other.id;
              break;
            }
          }
        }
      }

      // 3. Update State Efficiently
      if (foundTargetId !== highlightedTargetId) {
        setHighlightedTargetId(foundTargetId);
        setNodes((nds) => nds.map((n) => {
          // Clear old highlight
          if (n.data?.isProximity) {
            return {
              ...n,
              data: { ...n.data, isProximity: false },
              style: { ...n.style, boxShadow: undefined } // clear legacy
            };
          }
          // Set new highlight
          if (n.id === foundTargetId) {
            return {
              ...n,
              data: { ...n.data, isProximity: true }
            };
          }
          return n;
        }));
      }
    },
    [reactFlowInstance, highlightedTargetId, setHighlightedTargetId, setNodes]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      try {
        if (!reactFlowWrapper.current || !reactFlowInstance) return;

        const type = event.dataTransfer.getData("application/reactflow");
        if (!type) return;
        const key = type.toLowerCase();

        // 1. Validation
        const isCore = key === "hlt" || key === "start";
        if (!isCore && allowed.size && !allowed.has(key)) {
          toast.error(`Instruction "${type}" is not allowed for this assignment.`);
          return;
        }

        if (maxNodes !== null && nodes.length >= maxNodes) {
          toast.error(`Node limit reached (max ${maxNodes}).`);
          return;
        }

        // 2. Coordinate Calculation
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // 3. Overlap Detection & Offset
        // Check if there's any node extremely close to the drop point
        const overlapThreshold = 50;
        const isOverlapping = nodes.some(n =>
          Math.abs(n.position.x - position.x) < overlapThreshold &&
          Math.abs(n.position.y - position.y) < overlapThreshold
        );

        if (isOverlapping) {
          position.x += 20;
          position.y += 20;
        }

        // 4. Safe State Update + Unique ID
        const newNode: Node = {
          id: getId(),
          type: "instruction",
          position,
          data: { instructionType: type },
        };

        setNodes((prevNodes) => [...prevNodes, newNode]);

      } catch (error) {
        console.error("Drop failed:", error);
        // State remains unchanged if error occurs before setNodes
      }
    },
    [reactFlowInstance, maxNodes, nodes, allowed],
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      // 1. Get Node Dimensions (Safely)
      const NODE_WIDTH = node.width ?? 150;
      const NODE_HEIGHT = node.height ?? 80;

      // 2. Define Handle Positions
      // Top Handle (Input)
      const inputHandle = {
        x: node.position.x + NODE_WIDTH / 2,
        y: node.position.y
      };

      // Bottom Handle (Output)
      const outputHandle = {
        x: node.position.x + NODE_WIDTH / 2,
        y: node.position.y + NODE_HEIGHT
      };

      // 3. Increased Threshold
      const CONNECT_THRESHOLD = 50;

      let connectionMade = false;

      // --- Debug Log ---
      // Check PREDECESSOR (Other -> This)
      for (const other of nodes) {
        if (other.id === node.id) continue;

        const otherW = other.width ?? 150;
        const otherH = other.height ?? 80;

        // Other's Output (Bottom)
        const otherOut = {
          x: other.position.x + otherW / 2,
          y: other.position.y + otherH
        };

        const dist = Math.sqrt(
          Math.pow(otherOut.x - inputHandle.x, 2) +
          Math.pow(otherOut.y - inputHandle.y, 2)
        );

        // Debug Log
        if (dist < 100) {
        }

        if (dist < CONNECT_THRESHOLD) {
          const targetStart = getInstr(node) === "START";
          if (targetStart) continue;

          const exists = edges.some(e => e.source === other.id && e.target === node.id);
          const targetOccupied = edges.some(e => e.target === node.id && e.targetHandle === "in");

          if (!exists && !targetOccupied) {
            const newEdge = {
              id: `e${other.id}-${node.id}`,
              source: other.id,
              target: node.id,
              sourceHandle: "source-bottom",
              targetHandle: "in",
              type: 'default',
              animated: false,
              style: { stroke: '#94a3b8', strokeWidth: 2 },
            };
            setEdges((eds) => {
              // Filter existing "bottom" edges from the Source (other.id)
              const cleanEdges = eds.filter(e => {
                if (e.source !== other.id) return true;
                const h = e.sourceHandle;
                // Remove if handle is source-bottom, out, or null
                if (h === 'source-bottom' || h === 'out' || !h) {
                  return false;
                }
                return true;
              });
              return addEdge(newEdge, cleanEdges);
            });
            connectionMade = true;
            break;
          }
        }
      }

      if (!connectionMade) {
        // Check SUCCESSOR (This -> Other)
        for (const other of nodes) {
          if (other.id === node.id) continue;

          const otherW = other.width ?? 150;

          // Other's Input (Top)
          const otherIn = {
            x: other.position.x + otherW / 2,
            y: other.position.y
          };

          const dist = Math.sqrt(
            Math.pow(outputHandle.x - otherIn.x, 2) +
            Math.pow(outputHandle.y - otherIn.y, 2)
          );

          // Debug Log
          if (dist < 100) {
          }

          if (dist < CONNECT_THRESHOLD) {
            const thisHlt = getInstr(node) === "HLT";
            if (thisHlt) continue;

            const exists = edges.some(e => e.source === node.id && e.target === other.id);
            const targetOccupied = edges.some(e => e.target === other.id && e.targetHandle === "in");

            if (!exists && !targetOccupied) {
              const newEdge = {
                id: `e${node.id}-${other.id}`,
                source: node.id,
                target: other.id,
                sourceHandle: "source-bottom",
                targetHandle: "in",
                type: 'default',
                animated: false,
                style: { stroke: '#94a3b8', strokeWidth: 2 },
              };
              setEdges((eds) => {
                // Filter existing "bottom" edges from the Source (node.id)
                const cleanEdges = eds.filter(e => {
                  if (e.source !== node.id) return true;
                  const h = e.sourceHandle;
                  // Remove if handle is source-bottom, out, or null
                  if (h === 'source-bottom' || h === 'out' || !h) {
                    return false;
                  }
                  return true;
                });
                return addEdge(newEdge, cleanEdges);
              });
              break;
            }
          }
        }
      }

      // Cleanup Highlights
      setHighlightedTargetId(null);
      setNodes((nds: Node[]) => nds.map((n) => {
        if (n.data?.isProximity) {
          return {
            ...n,
            data: { ...n.data, isProximity: false },
            style: { ...n.style, boxShadow: undefined } // clear legacy
          };
        }
        return n;
      }));
    },
    [nodes, edges, setEdges, setNodes]
  );

  // ===== Fetch assignment =====
  useEffect(() => {
    if (!classId || !assignmentId) {
      setLoading(false);
      return;
    }
    const fetchAssignmentData = async () => {
      try {
        setLoading(true);
        const data = await getAssignmentById(classId, assignmentId);
        setAssignment(data);

        // CPU init
        const initialCpu = buildInitialCPUState(data);
        setCpu(initialCpu);
        setExecRegisters(initialCpu.registers);

        // Init execMemorySparse
        const sparse: Record<string, number> = {};
        initialCpu.memory.forEach(m => {
          sparse[m.address] = m.value;
        });
        setExecMemorySparse(sparse);

        // Allowed instructions & max_nodes
        const cond: any = data.condition || {};
        const a = toLowerSetFromAllowed(cond.allowed_instructions);
        a.add("hlt"); // ให้ HLT เสมอ
        setAllowed(a); // ไม่บังคับ START อีกต่อไป

        const exec = cond.execution_constraints || {};
        setMaxNodes(
          Number.isFinite(exec.max_nodes) ? Number(exec.max_nodes) : null,
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignmentData();
  }, [classId, assignmentId]);

  // ===== sanitizer: remove nulls / drop unexpected keys / ensure operands =====
  function removeNulls(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(removeNulls).filter((v) => v !== null && v !== undefined);
    }
    if (obj && typeof obj === "object") {
      const out: any = {};
      for (const k of Object.keys(obj)) {
        const v = removeNulls(obj[k]);
        if (v !== null && v !== undefined) out[k] = v;
      }
      return out;
    }
    return obj;
  }

  // --- quantize positions to integers (with small deterministic jitter) ---
  function _hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h | 0;
  }
  function _jitter(key: string, axis: "x" | "y"): number {
    // -2 .. +2 แบบคงที่ต่อ key/axis
    const r = _hash(`${key}:${axis}`);
    return (r % 5) - 2;
  }

  // --- Normalize positions: round + make all positive ---
  function normalizePositions(pos: UIPosition): UIPosition {
    if (!pos) return {};

    // Find min x,y to offset
    let minX = Infinity,
      minY = Infinity;
    for (const key of Object.keys(pos)) {
      const p = pos[Number(key)];
      if (!p) continue;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
    }

    const offsetX = minX < 0 ? Math.abs(minX) + 20 : 0; // Padding 20px
    const offsetY = minY < 0 ? Math.abs(minY) + 20 : 0;

    const out: UIPosition = {};
    for (const key of Object.keys(pos)) {
      const p = pos[Number(key)];
      if (p) {
        out[Number(key)] = {
          x: Math.round((p.x ?? 0) + offsetX),
          y: Math.round((p.y ?? 0) + offsetY),
        };
      }
    }

    return out;
  }

  /* start handleRun section */













  // 3. Test Suite (Mock)
  const runTests = useCallback(async () => {
    if (!assignment) return;
    setTestStatus("running");

    try {
      const allSuites = await getTestSuitesForAssignment(parseInt(classId), parseInt(assignmentId));
      let allResults: TestResult[] = [];

      const initialState = buildInitialCPUState(assignment);
      const programItems = parseProgramItems(nodes, edges, variables);

      for (const suite of allSuites) {
        const result = await runTestSuite(suite, programItems, initialState);
        allResults = allResults.concat(result.results);
      }

      const passedCount = allResults.filter(r => r.passed).length;
      const totalCount = allResults.length;

      if (passedCount === totalCount) {
        toast.success(`Passed ${passedCount}/${totalCount} tests!`);
      } else {
        toast.error(`Passed ${passedCount}/${totalCount} tests.`);
      }
    } catch (e) {
      console.error('[RunTests] Error:', e);
      toast.error('Failed to run tests');
    } finally {
      setTestStatus(null);
    }
  }, [assignment, assignmentId, classId, nodes, edges, variables]);

  const handleSubmit = useCallback(async () => {
    if (!assignment) {
      toast.error("Sign in and select an assignment to submit.");
      return;
    }
    setSubmissionModalOpen(true);
  }, [assignment]);

  // Compute dense memory array for LedPanel (Address 0-255)
  // MOVED UP to prevent Hook Order Violation (must be called before conditional return)
  const displayMemoryArray = useMemo(() => {
    const arr = new Array(256).fill(0);

    // 1. Fill from execMemorySparse if active (Execution Mode)
    if (Object.keys(execMemorySparse).length > 0) {
      for (const [addrStr, val] of Object.entries(execMemorySparse)) {
        const addr = Number(addrStr);
        if (addr >= 0 && addr < 256) arr[addr] = val;
      }
    }
    // 2. Fallback to CPU memory (Edit Mode / Initial State)
    else if (cpu.memory && Array.isArray(cpu.memory)) {
      cpu.memory.forEach(m => {
        if (m.address >= 0 && m.address < 256) arr[m.address] = m.value;
      });
    }

    return arr;
  }, [execMemorySparse, cpu?.memory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // Usage badge (count ALL nodes)
  const used = nodes.length;
  const limitBadge =
    maxNodes !== null ? `${used}/${maxNodes} nodes used` : `${used} nodes used`;

  // START/HLT visibility in NodePanel
  const hasStart = nodes.some((n) => getInstr(n) === "START");
  const hasHlt = nodes.some((n) => getInstr(n) === "HLT");

  function canConnectEdge(
    eds: Edge[],
    source: string,
    target: string,
    sourceHandle?: string | null,
    targetHandle?: string | null,
    opts: { oneOutgoing?: boolean; oneIncoming?: boolean } = {},
  ) {
    const { oneOutgoing = true, oneIncoming = true } = opts;

    if (!source || !target) return false;
    if (source === target) return false; // no self-loop

    // no duplicate (source→target) edges
    if (
      eds.some(
        (e) =>
          e.source === source &&
          e.target === target &&
          (sourceHandle ? e.sourceHandle === sourceHandle : true) &&
          (targetHandle ? e.targetHandle === targetHandle : true),
      )
    ) {
      return false;
    }

    if (
      sourceHandle &&
      eds.some((e) => e.source === source && e.sourceHandle === sourceHandle)
    ) {
      return false;
    }

    if (
      oneOutgoing &&
      eds.some(
        (e) =>
          e.source === source &&
          (sourceHandle ? e.sourceHandle === sourceHandle : true), // Only block if same handle
      )
    )
      return false;
    if (
      oneIncoming &&
      eds.some(
        (e) =>
          e.target === target &&
          (targetHandle ? e.targetHandle === targetHandle : true), // Only block if same handle
      )
    )
      return false;

    return true;
  }

  function getViewportSafe(reactFlowInstance: ReactFlowInstance | null) {
    try {
      const vp = (reactFlowInstance as any)?.getViewport?.();
      if (vp && typeof vp === "object") {
        return {
          pan: { x: Math.round(vp.x ?? 0), y: Math.round(vp.y ?? 0) },
          zoom: Number(vp.zoom ?? 1),
        };
      }
    } catch { }
    return { pan: { x: 0, y: 0 }, zoom: 1 };
  }

  // ======== Display selection: prefer exec state if available ========
  const displayRegisters =
    Object.keys(execRegisters).length > 0 ? execRegisters : cpu.registers;
  const displayFlags =
    Object.keys(execFlags).length > 0 ? execFlags : cpu.flags;
  const displayMemory =
    Object.keys(execMemorySparse).length > 0
      ? Object.entries(execMemorySparse)
        .map(([addr, val]) => ({
          address: Number(addr),
          value: Number(val),
        }))
        .sort((a, b) => a.address - b.address)
      : cpu.memory;



  // New Layout Imports (Dynamic imports might be better but direct is fine for now)
  const SlimToolbar = require("@/components/playground/layout/SlimToolbar").default;
  const BottomDeck = require("@/components/playground/layout/BottomDeck").default;
  const RightInspector = require("@/components/playground/layout/RightInspector").default;

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* 1. Navbar (Top) */}
      <PlaygroundNavbar
        assignmentTitle={isReadOnly ? `${labName} (Submission View)` : labName}
        onBack={() => router.back()}
        mode={executionMode}
        onRun={setExecutionMode}
        onSubmit={handleSubmit}
        onOpenTestManager={() => setTestManagerOpen(true)}
        isOwner={isOwner || isReadOnly}
      />

      {/* 2. Main Workspace (Flex Row) */}
      <div className="flex-1 flex overflow-hidden">

        {/* 2.1 Left: Slim Toolbar */}
        {!isReadOnly && (
          <SlimToolbar
            allowedInstructions={allowed}
            hideStart={nodes.some((n) => getInstr(n) === "START")}
            hideHlt={nodes.some((n) => getInstr(n) === "HLT")}
          />
        )}

        {/* 2.2 Center: Canvas & Bottom Deck */}
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Canvas Area */}
          <div
            className="flex-1 relative bg-gray-100 dark:bg-black/20 focus:outline-none"
            ref={reactFlowWrapper}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded border dark:border-slate-800 text-sm shadow-sm pointer-events-none text-slate-700 dark:text-slate-300">
              {limitBadge}
            </div>

            <PlaygroundCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={isReadOnly ? () => {} : onNodesChange}
              onEdgesChange={isReadOnly ? () => {} : onEdgesChange}
              onConnect={isReadOnly ? () => {} : onConnect}
              onInit={setReactFlowInstance}
              onDrop={isReadOnly ? () => {} : onDrop}
              onDragOver={isReadOnly ? () => {} : onDragOver}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              nodeTypes={nodeTypes}
              onNodeDragStart={onNodeDragStart}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
              readOnly={isReadOnly}
            />
          </div>

          {/* Bottom Deck with Embedded Execution Controls */}
          <BottomDeck
            logs={execIO?.logs ?? []}
            consoleBuffer={execIO?.consoleBuffer ?? ""}
            onConsoleInput={(key: string) => {
              ioHandlerRef.current.receiveInput(key);
              if (waitingForInput && key === 'Enter') {
                setWaitingForInput(false);
                toggleDebugPlay();
              }
            }}
            sevenSegment={execIO?.sevenSegment ?? 0}
            ledPanelValue={execPorts[3] || 0}
            memory={displayMemoryArray}
            outputLines={execOutputLines}
            headerControls={
              <ExecutionDeck
                mode={executionMode}
                isPlaying={isRunning}
                isRunning={isRunning || testStatus === "running"}
                speed={speed}
                setSpeed={setSpeed}
                onRunInstant={runInstant}
                onStep={handleStep}
                onStepBack={handleStepBack}
                canStepBack={canStepBack}
                onPause={() => { setIsRunning(false); }}
                onPlay={toggleDebugPlay}
                onReset={handleReset}
                onRunTests={runTests}
                testStatus={testStatus}
                embedded={true}
              />
            }
          />
        </div>

        {/* 2.3 Right: Inspector */}
        <RightInspector
          registers={displayRegisters}
          flags={displayFlags}
          memory={displayMemory}
          selectedNode={panelOpen ? selectedNode : null}
          onNodeChange={isReadOnly ? () => {} : onPatchNode}
          onCloseInspector={() => setPanelOpen(false)}
          availableRegisters={registerNames}
          availableLabels={labelOptions}
          variables={variables}
          onAddVariable={isReadOnly ? () => toast.error("Read-only mode") : handleAddVariable}
          onEditVariable={isReadOnly ? () => toast.error("Read-only mode") : handleEditVariable}
          onDeleteVariable={isReadOnly ? () => toast.error("Read-only mode") : handleDeleteVariable}
          assignment={assignment}
          sp={currentSP}
          recentlyAccessedAddresses={recentlyAccessedAddresses}
          onResetMemory={handleResetMemory}
        />
      </div>

      {/* Modals */}
      <TestManagerModal
        isOpen={testManagerOpen}
        onClose={() => setTestManagerOpen(false)}
        onRunTestCase={handleRunTestCase}
        onRunTestSuite={handleRunTestSuite}
        availableRegisters={registerNames}
        assignmentId={Number(assignmentId)}
        classId={Number(classId)}
        isOwner={isOwner}
      />

      {assignment && userId > 0 && (
        <SubmissionModal
          isOpen={submissionModalOpen}
          onClose={() => setSubmissionModalOpen(false)}
          assignment={assignment}
          testSuites={testSuites}
          program={programItems}
          defaultCpuState={buildInitialCPUState(assignment)}
          userId={userId}
          playgroundId={playgroundIdRef.current || undefined}
          onSubmissionComplete={() => {
            fetchSubmissions();
            toast.success("Assignment submitted successfully!");
          }}
          rawPlaygroundData={rawPlaygroundData}
        />
      )}
    </div>
  );
}
