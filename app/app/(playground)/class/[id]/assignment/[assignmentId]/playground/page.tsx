"use client";
import { getToken, decodeToken } from "@/lib/auth/token";
import { useState, useCallback, useEffect, useRef, DragEvent } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ExecutionDeck, ExecutionMode } from "@/components/playground/ExecutionDeck";
import toast from "react-hot-toast";

const nodeTypes: NodeTypes = { instruction: InstructionNode };
const getId = () => crypto.randomUUID();
// Removed simplistic ID counter
// let id = 0; 
// const getId = () => ...

const getInstr = (n: Node) =>
  String(n.data?.instructionType || "").toUpperCase();

// ===== Types & helpers =====
type CPUState = {
  registers: Record<string, number>;
  flags: Record<string, number>;
  memory: { address: number; value: number }[];
  ports: Record<number, number>;
};

type AllowedMap = Record<string, 1>;
type AllowedInstructions = {
  [category: string]: AllowedMap | null | undefined;
};

function toLowerSetFromAllowed(
  allowed?: AllowedInstructions | null,
): Set<string> {
  const set = new Set<string>();
  if (!allowed) return set;
  for (const cat of Object.keys(allowed)) {
    const group = allowed[cat];
    if (!group) continue;
    for (const name of Object.keys(group)) {
      set.add(name.toLowerCase());
    }
  }
  return set;
}

function buildInitialCPUState(assignment: Assignment | null): CPUState {
  const defaults: CPUState = {
    registers: { R0: 0, R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0 },
    flags: { Z: 0, C: 0, V: 0, O: 0 },
    memory: [],
    ports: { 5: 0 },
  };
  if (!assignment) return defaults;

  const cond: any = assignment.condition || {};
  const exec = cond.execution_constraints || {};
  const regCount: number = Math.max(0, Number(exec.register_count ?? 0));

  const registers: Record<string, number> = {};
  for (let i = 0; i < regCount; i++) registers[`R${i}`] = 0;

  // latest schema: initial_state at condition.initial_state
  const initState = cond.initial_state || {};
  const initMem = initState.memory;
  const memory: { address: number; value: number }[] = Array.isArray(initMem)
    ? initMem
    : [];

  return {
    registers: Object.keys(registers).length ? registers : defaults.registers,
    flags: { Z: 0, C: 0, V: 0, O: 0 },
    memory,
    ports: { 5: 0 },
  };
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

  const { id: classId, assignmentId } = params as {
    id: string;
    assignmentId: string;
  };

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  // --- State for Execution Modes ---
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("debug");
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Execution Control State
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2); // Hz
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  // Execution state from BE
  const [execRegisters, setExecRegisters] = useState<Record<string, number>>(
    {},
  );
  const [execFlags, setExecFlags] = useState<Record<string, number>>({});
  const [execMemorySparse, setExecMemorySparse] = useState<
    Record<string, number>
  >({});
  const [execPorts, setExecPorts] = useState<Record<number, number>>({});
  const [execOutputLines, setExecOutputLines] = useState<string[]>([]); // Clean Output Stream
  // IO State (Console, 7-Seg, LED Matrix) is managed in VirtualIO but reflected here
  const [execIO, setExecIO] = useState<
    {
      logs: any[];
      consoleBuffer: string;
      sevenSegment: number;
      ledMatrix: number[];
      ledSelectedRow: number;
    }
    | undefined
  >(undefined);

  // ===== Auto Save =====
  const onAutoSaveLoad = useCallback((savedNodes: Node[], savedEdges: Edge[], savedMemory: Record<string, number>) => {
    setNodes(savedNodes);
    setEdges(savedEdges);
    setExecMemorySparse(savedMemory);
  }, []);

  const { resetSave } = useAutoSave(nodes, edges, execMemorySparse, onAutoSaveLoad);

  // Assignment-driven controls
  const [cpu, setCpu] = useState<CPUState>(() => buildInitialCPUState(null));
  const [allowed, setAllowed] = useState<Set<string>>(new Set());
  const [maxNodes, setMaxNodes] = useState<number | null>(null);
  // const [proximityNode, setProximityNode] = useState<Node | null>(null); // Removed as part of strict logic
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
  const [gamepadState, setGamepadState] = useState<number>(0);

  // Persistent IO Handler for Keyboard Buffer
  const ioHandlerRef = useRef(new VirtualIO());

  const playgroundIdRef = useRef<number | null>(null);

  // ===== Interactive Execution State =====
  // ===== Interactive Execution State =====
  const simulationRef = useRef<{
    interval: NodeJS.Timeout | null;
    cpu: CPU | null;
    cachedItems: ProgramItem[] | null; // BUG FIX #7: Cache parsed items
  }>({
    interval: null,
    cpu: null,
    cachedItems: null
  });
  const historyRef = useRef<CPUSnapshot[]>([]);
  const [historyLength, setHistoryLength] = useState(0);
  const canStepBack = historyLength > 0;

  // BUG FIX #5: Track isRunning in ref for fresh reads (avoid stale closure)
  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Track if CPU is waiting for input (for auto-resume on Enter)
  const [waitingForInput, setWaitingForInput] = useState(false);

  // ===== Variables Manager State =====
  const [variables, setVariables] = useState<Variable[]>([]);

  // Helper to sync variable changes to memory
  // Helper to sync variable changes to memory
  const syncVariableToMemory = (address: number, value: number | null) => {
    // 1. Update Initial CPU State (so Reset restores it)
    setCpu((prev) => {
      const mem = [...prev.memory];
      const idx = mem.findIndex((m) => m.address === address);

      if (value === null) {
        // Deletion: Remove entry
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

    // 2. Update Exec State (Immediate visibility + Persistence via AutoSave)
    setExecMemorySparse((prev) => {
      if (value === null) {
        const next = { ...prev };
        delete next[address];
        return next;
      }
      return { ...prev, [address]: value };
    });
  };

  // ===== PERSISTENCE: Variables & Memory =====
  // 1. Auto-Load on Mount
  // 1. Auto-Load on Mount
  useEffect(() => {
    try {
      const savedVarsStr = localStorage.getItem("asm_variables");
      const savedMemStr = localStorage.getItem("asm_memory");

      let loadedVars: Variable[] = [];
      if (savedVarsStr) {
        loadedVars = JSON.parse(savedVarsStr);
        setVariables(loadedVars);
      }

      let memList: { address: number; value: number }[] = [];
      if (savedMemStr) {
        memList = JSON.parse(savedMemStr);
      }

      // HYDRATION FIX: Ensure Variables are written to Memory
      // Even if memory was saved, we enforce consistency with variables on load.
      if (loadedVars.length > 0) {
        const memMap = new Map<number, number>();
        // 1. Load existing memory into Map
        memList.forEach(m => memMap.set(m.address, m.value));

        // 2. Overwrite/Ensure Variable values
        loadedVars.forEach(v => {
          memMap.set(v.address, v.value);
        });

        // 3. Rebuild List
        memList = [];
        memMap.forEach((value, address) => {
          memList.push({ address, value });
        });
        memList.sort((a, b) => a.address - b.address);
      }

      // Commit to State
      setCpu((prev) => ({ ...prev, memory: memList }));

      // Rebuild Exec Memory Sparse
      const sparse: Record<string, number> = {};
      memList.forEach((m) => {
        sparse[m.address] = m.value;
      });
      setExecMemorySparse(sparse);

    } catch (e) {
      console.error("Failed to load persistence:", e);
    }
  }, []);

  // 2. Auto-Save on Change
  useEffect(() => {
    const memList = cpu?.memory || [];
    localStorage.setItem("asm_variables", JSON.stringify(variables));
    localStorage.setItem("asm_memory", JSON.stringify(memList));
  }, [variables, cpu?.memory]);

  const handleAddVariable = (name: string, value: number) => {
    // Auto-Addressing: First-Fit Strategy (Fill Gaps)
    let newAddress = 0;
    const usedAddresses = new Set(variables.map((v) => v.address));
    while (usedAddresses.has(newAddress)) {
      newAddress++;
    }

    const newVar: Variable = {
      id: crypto.randomUUID(),
      name,
      value,
      address: newAddress,
    };
    setVariables((prev) => [...prev, newVar]);
    syncVariableToMemory(newAddress, value);
  };


  const handleEditVariable = (id: string, name: string, value: number) => {
    setVariables((prev) => {
      const target = prev.find((v) => v.id === id);
      if (target && target.value !== value) {
        syncVariableToMemory(target.address, value);
      }
      return prev.map((v) => (v.id === id ? { ...v, name, value } : v));
    });
  };

  const handleDeleteVariable = (id: string) => {
    setVariables((prev) => {
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

  // ===== Property Panel state =====
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick = useCallback((_e: any, node: Node) => {
    setSelectedNode(node);
    // Removed setPanelOpen(true) to prevent opening on single click
  }, []);

  const onNodeDoubleClick = useCallback((_e: any, node: Node) => {
    setSelectedNode(node);
    setPanelOpen(true);
  }, []);

  const onPatchNode = (nodeId: string, patch: Record<string, any>) => {
    setNodes((nds) =>
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

  // ===== ReactFlow handlers =====
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

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
  }, [nodes]);

  const onConnect: OnConnect = useCallback((params) => {
    setEdges((eds) => {
      // 1. Filter out ANY existing edge that comes from the same Source Node + Source Handle
      const cleanEdges = eds.filter((e) => {
        const isSameSource = e.source === params.source;
        if (!isSameSource) return true;

        // Strict Handle Matching with Legacy Support
        // New Handle ID: "source-bottom"
        // Legacy IDs: "out", null, undefined
        // "left" is distinct and should NOT be replaced by "source-bottom"

        const pHandle = params.sourceHandle;
        const eHandle = e.sourceHandle;

        const isBottomParam = pHandle === 'source-bottom' || pHandle === 'out' || !pHandle;
        const isBottomEdge = eHandle === 'source-bottom' || eHandle === 'out' || !eHandle;

        // If both are "Bottom" group, they conflict -> Remove Edge (Return false)
        if (isBottomParam && isBottomEdge) {
          console.log(`Replacing bottom connection: ${e.id} with new ${params.source}->${params.target}`);
          return false;
        }

        // If specific handles match exactly (e.g. left === left), Remove Edge
        if (pHandle === eHandle) return false;

        return true; // Keep edge
      });

      // 2. Add the new connection to the cleaned list
      console.log(`🔌 Connected: ${params.source} -> ${params.target}`);
      const newEdge = {
        ...params,
        type: 'default',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      };
      return addEdge(newEdge, cleanEdges);
    });
  }, [setEdges]);

  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      // Logic copied from onNodeDragStop but for visual feedback ONLY
      const NODE_WIDTH = node.width ?? 150;
      const NODE_HEIGHT = node.height ?? 80;

      const inputHandle = { x: node.position.x + NODE_WIDTH / 2, y: node.position.y };
      const outputHandle = { x: node.position.x + NODE_WIDTH / 2, y: node.position.y + NODE_HEIGHT };
      const CONNECT_THRESHOLD = 50;

      let foundTargetId: string | null = null;

      // 1. Check PREDECESSOR (Other -> This)
      if (getInstr(node) !== "START") { // START can't be a target of predecessor
        for (const other of nodes) {
          if (other.id === node.id) continue;
          const otherW = other.width ?? 150;
          const otherH = other.height ?? 80;
          const otherOut = { x: other.position.x + otherW / 2, y: other.position.y + otherH };

          const dist = Math.sqrt(Math.pow(otherOut.x - inputHandle.x, 2) + Math.pow(otherOut.y - inputHandle.y, 2));

          if (dist < CONNECT_THRESHOLD) {
            const exists = edges.some(e => e.source === other.id && e.target === node.id);
            const targetOccupied = edges.some(e => e.target === node.id && e.targetHandle === "in");

            if (!exists && !targetOccupied) {
              foundTargetId = other.id; // Highlight the SOURCE (Other) to show it connects TO this
              break;
            }
          }
        }
      }

      // 2. Check SUCCESSOR (This -> Other)
      if (!foundTargetId && getInstr(node) !== "HLT") {
        for (const other of nodes) {
          if (other.id === node.id) continue;
          const otherW = other.width ?? 150;
          const otherIn = { x: other.position.x + otherW / 2, y: other.position.y };

          const dist = Math.sqrt(Math.pow(outputHandle.x - otherIn.x, 2) + Math.pow(outputHandle.y - otherIn.y, 2));

          if (dist < CONNECT_THRESHOLD) {
            const exists = edges.some(e => e.source === node.id && e.target === other.id);
            const targetOccupied = edges.some(e => e.target === other.id && e.targetHandle === "in");

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
    [nodes, edges, highlightedTargetId]
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
          alert(`Instruction "${type}" is not allowed for this assignment.`);
          return;
        }

        if (maxNodes !== null && nodes.length >= maxNodes) {
          alert(`Node limit reached (max ${maxNodes}).`);
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
      console.log(`[AutoConnect] DragStop: ${node.id} (${getInstr(node)})`, { inputHandle, outputHandle });

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
          console.log(` Checking Predecessor ${other.id} -> ${node.id}: Dist=${dist.toFixed(1)}`);
        }

        if (dist < CONNECT_THRESHOLD) {
          const targetStart = getInstr(node) === "START";
          if (targetStart) continue;

          const exists = edges.some(e => e.source === other.id && e.target === node.id);
          const targetOccupied = edges.some(e => e.target === node.id && e.targetHandle === "in");

          if (!exists && !targetOccupied) {
            console.log(" >> Connecting Predecessor!");
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
                  console.log(`[AutoConnect] Removing conflicting edge from ${other.id}`);
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
            console.log(` Checking Successor ${node.id} -> ${other.id}: Dist=${dist.toFixed(1)}`);
          }

          if (dist < CONNECT_THRESHOLD) {
            const thisHlt = getInstr(node) === "HLT";
            if (thisHlt) continue;

            const exists = edges.some(e => e.source === node.id && e.target === other.id);
            const targetOccupied = edges.some(e => e.target === other.id && e.targetHandle === "in");

            if (!exists && !targetOccupied) {
              console.log(" >> Connecting Successor!");
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
                    console.log(`✂️ [AutoConnect] Removing conflicting edge from ${node.id}`);
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
      setNodes((nds) => nds.map((n) => {
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
    [nodes, edges, setEdges]
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
        setCpu(buildInitialCPUState(data));

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

  // Clean items only: remove nulls/unexpected fields but do not modify top-level
  // payload shape. This returns a cleaned array of items for sending to BE.
  function cleanItems(items: any[]): any[] {
    if (!Array.isArray(items)) return [];

    const forbidNext = new Set(["JMP", "JZ", "JNZ", "HLT", "LABEL", "NOP"]);

    return items.map((rawItem) => {
      const item = JSON.parse(JSON.stringify(rawItem || {}));

      // remove backend-unexpected fields
      if ("stat" in item) delete item.stat;

      const instr = String(item.instruction || "").toUpperCase();

      // NEXT fields: CMP uses next_true/next_false; others use next
      if (instr === "CMP") {
        // CMP ใช้แต่ next_true/next_false
        delete item.next;
        if (item.next_true === null || item.next_true === undefined)
          delete item.next_true;
        if (item.next_false === null || item.next_false === undefined)
          delete item.next_false;
      } else if (forbidNext.has(instr)) {
        delete item.next;
        delete item.next_true;
        delete item.next_false;
      } else {
        // คำสั่งทั่วไป: ใช้ได้เฉพาะ next
        delete item.next_true;
        delete item.next_false;
        if (item.next === null || item.next === undefined) delete item.next;
      }

      // Ensure operands is an array (do not inject defaults)
      item.operands = Array.isArray(item.operands) ? item.operands : [];

      // Clean nested nulls
      return removeNulls(item);
    });
  }

  function parseProgramItems(nds: Node[], eds: Edge[], vars: Variable[] = []): ProgramItem[] {
    console.log("🔍 [parseProgramItems] Starting - Total nodes:", nds.length);

    // BUG FIX #4: Only parse nodes reachable from START (ignore unconnected nodes)
    // Step 1: Find START node
    const startNode = nds.find(n => getInstr(n) === "START");
    if (!startNode) {
      console.error("❌ [parseProgramItems] No START node found");
      return [];
    }
    console.log("✅ [parseProgramItems] Found START node:", startNode.id);

    // Step 2: Traverse from START to find all reachable nodes
    const reachableNodeIds = new Set<string>();
    const queue: string[] = [startNode.id];

    // Phase 1: Global Label Indexing (Wireless Support)
    // Map Label Name -> Node ID
    const labelMap = new Map<string, string>();
    for (const n of nds) {
      const instr = getInstr(n);
      if (instr === "LABEL" && n.data?.label) {
        labelMap.set(n.data.label, n.id);
      }
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (reachableNodeIds.has(currentId)) continue;
      reachableNodeIds.add(currentId);

      // Find all outgoing edges from this node
      const outEdges = eds.filter(e => e.source === currentId);

      // Add all target nodes to queue (Physical Connections)
      outEdges.forEach(edge => {
        if (!reachableNodeIds.has(edge.target)) {
          queue.push(edge.target);
        }
      });

      // Phase 2: Enhanced Traversal (Wireless Jumps)
      // If current node is a Jump/Call, add the target label to queue
      const currentNode = nds.find(n => n.id === currentId);
      if (currentNode) {
        const instr = getInstr(currentNode);
        // implicit connection instructions
        if (["JMP", "JZ", "JNZ", "CALL"].includes(instr)) {
          const targetLabel = currentNode.data?.label;
          if (targetLabel && labelMap.has(targetLabel)) {
            const targetId = labelMap.get(targetLabel)!;
            if (!reachableNodeIds.has(targetId)) {
              console.log(`📡 [Wireless] Jumping from ${instr} to LABEL ${targetLabel} (${targetId})`);
              queue.push(targetId);
            }
          }
        }
      }
    }

    console.log("✅ [parseProgramItems] Reachable nodes:", reachableNodeIds.size, "of", nds.length);
    console.log("   Reachable IDs:", Array.from(reachableNodeIds));

    // Step 3: Filter to only reachable nodes and create ID mapping
    const reachableNodes = nds.filter(n => reachableNodeIds.has(n.id));
    const nodeMap = new Map(reachableNodes.map((n, i) => [n.id, i + 1]));

    // Step 4: Parse only reachable nodes
    return reachableNodes.map((node) => {
      const instruction = getInstr(node);
      const outEdges = eds.filter((e) => e.source === node.id);

      const nextEdge = outEdges.find((e) => !e.sourceHandle || e.sourceHandle === "out" || e.sourceHandle === "source-bottom");
      const nextTrueEdge = outEdges.find((e) => e.sourceHandle === "true");
      const nextFalseEdge = outEdges.find((e) => e.sourceHandle === "false");

      const item: any = {
        id: nodeMap.get(node.id)!,
        instruction,
        label: node.data?.label || "",
        operands: [],
        sourceNodeId: node.id, // Map for UI highlighting
      };

      if (instruction === "CMP") {
        item.next_true = nextTrueEdge
          ? (nodeMap.get(nextTrueEdge.target) ?? null)
          : (nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null);
        item.next_false = nextFalseEdge
          ? (nodeMap.get(nextFalseEdge.target) ?? null)
          : (nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null);
      } else if (instruction === "HLT") {
      } else if (instruction === "NOP") {
        item.next = nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null;
      } else if (instruction === "LABEL") {
        item.next = nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null;
      } else {
        item.next = nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null;
      }

      const operands: Operand[] = [];

      // Variables Lookup Helper
      const resolveVariable = (val: string | number): { value: string; type: "Immediate" | "Memory" } => {
        // 1. Priority Check: Is it a Variable? (Case-Insensitive)
        const valStr = String(val).trim();
        const foundVar = vars.find((v) => v.name.toLowerCase() === valStr.toLowerCase());

        if (foundVar) {
          console.log(`🔍 [Parser] Resolved Variable '${valStr}' -> Address ${foundVar.address} (Memory Access)`);
          return { value: String(foundVar.address), type: "Memory" };
        }

        // 2. Number Check (Fallthrough)
        // If it's not a variable, but is a number, treat as Immediate
        if (!isNaN(Number(val))) {
          return { value: String(val), type: "Immediate" };
        }

        // 3. Fallback
        return { value: String(val), type: "Immediate" };
      };

      if (instruction === "LOAD" || instruction === "STORE") {
        const memMode = node.data?.memMode ?? "imm";
        const memImm = node.data?.memImm;
        const memReg = node.data?.memReg;

        if (instruction === "LOAD") {
          const dest = node.data?.dest ?? node.data?.dst ?? node.data?.register ?? node.data?.reg;
          if (dest) operands.push({ type: "Register", value: String(dest) });

          if (memMode === "imm" && memImm !== undefined && memImm !== null && memImm !== "") {
            // Memory Address for LOAD is always treated as Immediate/Direct Address
            const resolved = resolveVariable(memImm);
            operands.push({ type: "Immediate", value: resolved.value });
          } else if (memMode === "reg" && memReg) {
            operands.push({ type: "Register", value: String(memReg) });
          }
        } else if (instruction === "STORE") {
          if (memMode === "imm" && memImm !== undefined && memImm !== null && memImm !== "") {
            // Memory Address for STORE is always treated as Immediate/Direct Address
            const resolved = resolveVariable(memImm);
            operands.push({ type: "Immediate", value: resolved.value });
          } else if (memMode === "reg" && memReg) {
            operands.push({ type: "Register", value: String(memReg) });
          }

          const srcReg = node.data?.srcReg ?? node.data?.src ?? node.data?.reg2 ?? node.data?.rSrc;
          if (srcReg) operands.push({ type: "Register", value: String(srcReg) });
        }
      } else if (instruction === "OUT") {
        const port = node.data?.memImm;
        if (port !== undefined && port !== null && port !== "") {
          operands.push({ type: "Immediate", value: String(port) });
        }

        let pushedSrc = false;
        const immRaw = node.data?.srcImm ?? node.data?.imm ?? node.data?.value ?? node.data?.val;
        if (immRaw !== undefined && immRaw !== null && immRaw !== "") {
          const resolved = resolveVariable(immRaw);
          if (resolved.type === "Memory") {
            operands.push({ type: "Memory", value: resolved.value });
          } else {
            operands.push({ type: "Immediate", value: `#${resolved.value}` });
          }
          pushedSrc = true;
        }
        if (!pushedSrc) {
          const srcReg = node.data?.srcReg ?? node.data?.src ?? node.data?.reg2 ?? node.data?.rSrc;
          if (srcReg) operands.push({ type: "Register", value: String(srcReg) });
        }
      } else {
        const destReg = node.data?.dest ?? node.data?.dst ?? node.data?.register ?? node.data?.reg;
        if (destReg) operands.push({ type: "Register", value: String(destReg) });

        let pushedSrc = false;
        const immRaw = node.data?.srcImm ?? node.data?.imm ?? node.data?.value ?? node.data?.val;
        if (immRaw !== undefined && immRaw !== null && immRaw !== "") {
          const resolved = resolveVariable(immRaw);
          if (resolved.type === "Memory") {
            operands.push({ type: "Memory", value: resolved.value });
          } else {
            operands.push({ type: "Immediate", value: `#${resolved.value}` });
          }
          pushedSrc = true;
        }
        if (!pushedSrc) {
          const srcReg = node.data?.srcReg ?? node.data?.src ?? node.data?.reg2 ?? node.data?.rSrc;
          if (srcReg) operands.push({ type: "Register", value: String(srcReg) });
        }
        // Handle direct memory address if applicable (e.g. MOV R0, [100]) - depends on UI node data structure
        // If there's a specific 'memAddr' field for non-load/store instructions?
        // Current UI structure seems to use 'srcImm' for immediates.
      }

      if ((instruction === "JMP" || instruction === "JZ" || instruction === "JNZ" || instruction === "CALL") && node.data?.label) {
        operands.push({ type: "Label", value: String(node.data.label) });
      }

      item.operands = operands;
      return item as ProgramItem;
    });
  }

  function validateProgramItems(items: ProgramItem[]): string[] {
    const errs: string[] = [];
    for (const it of items) {
      const instr = String(it.instruction || "").toUpperCase();
      const ops = Array.isArray(it.operands) ? it.operands : [];

      const need2 = new Set(["MOV", "LOAD", "STORE", "ADD", "SUB", "CMP", "MUL", "DIV", "AND", "OR", "XOR", "SHL", "SHR", "IN", "OUT"]);
      const need1 = new Set(["INC", "DEC", "PUSH", "POP", "NOT"]);
      const zero = new Set(["HLT", "START", "NOP"]);

      if (need2.has(instr) && ops.length !== 2) {
        errs.push(
          `${instr} at id=${it.id} requires 2 operands, got ${ops.length}`,
        );
      }

      if (need1.has(instr) && ops.length !== 1) {
        errs.push(
          `${instr} at id=${it.id} requires 1 operand, got ${ops.length}`,
        );
      }

      if (zero.has(instr) && ops.length > 0) {
        errs.push(
          `${instr} at id=${it.id} should have no operands, got ${ops.length}`,
        );
      }

      // LABEL needs a label name
      if (instr === "LABEL" && !it.label) {
        errs.push(`LABEL at id=${it.id} must have a label name`);
      }

      // Jump instructions need a label operand or next field pointing to target
      if ((instr === "JMP" || instr === "JZ" || instr === "JNZ") && ops.length === 0 && !(it as any).next) {
        errs.push(`${instr} at id=${it.id} must have a label operand or next field`);
      }
    }
    return errs;
  }

  /* start handleRun seccton */
  /* start handleRun seccton */

  /* start handleRun section (Actually handleSubmit logic) */
  const handleSubmit = useCallback(async () => {
    if (!assignmentId) return;

    // 1) เตรียม nodes และ id mapping - รวม START ด้วย!
    const nodesToProcess = nodes; // ไม่กรอง START ออก
    const nodeMap = new Map(nodesToProcess.map((n, i) => [n.id, i + 1]));

    // 2) แปลงเป็น items
    const items: ProgramItem[] = nodesToProcess.map((node) => {
      const instruction = getInstr(node);
      const outEdges = edges.filter((e) => e.source === node.id);
      // Accept edges with no sourceHandle OR sourceHandle = "out" / "source-bottom" as next edge
      const nextEdge = outEdges.find((e) => !e.sourceHandle || e.sourceHandle === "out" || e.sourceHandle === "source-bottom");
      const nextTrueEdge = outEdges.find((e) => e.sourceHandle === "true");
      const nextFalseEdge = outEdges.find((e) => e.sourceHandle === "false");

      const item: any = {
        id: nodeMap.get(node.id)!,
        instruction,
        label: node.data?.label || "",
        operands: [],
      };

      // Set next field based on instruction type and edges
      if (instruction === "CMP") {
        // CMP uses next_true and next_false for conditional branching
        // Fall back to nextEdge (out) for both if no specific edges exist
        item.next_true = nextTrueEdge
          ? (nodeMap.get(nextTrueEdge.target) ?? null)
          : (nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null);
        item.next_false = nextFalseEdge
          ? (nodeMap.get(nextFalseEdge.target) ?? null)
          : (nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null);
      } else if (instruction === "HLT") {
        // HLT doesn't need next (terminates execution)
      } else if (instruction === "NOP") {
        // NOP falls through to next instruction
        item.next = nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null;
      } else if (instruction === "LABEL") {
        // LABEL is just a marker and falls through to next instruction
        item.next = nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null;
      } else {
        // All other instructions (START, MOV, ADD, JMP, JZ, etc.) use next field
        item.next = nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null;
      }

      // operands (ทนต่อหลายชื่อฟิลด์จาก UI)
      const operands: Operand[] = [];

      // LOAD/STORE: Check for memory address operands
      if (instruction === "LOAD" || instruction === "STORE") {
        const memMode = node.data?.memMode ?? "imm"; // "imm" or "reg"
        const memImm = node.data?.memImm; // number (0-255)
        const memReg = node.data?.memReg; // string (R0-R7)

        if (instruction === "LOAD") {
          // LOAD: Register first, then address
          const dest = node.data?.dest ?? node.data?.dst ?? node.data?.register ?? node.data?.reg;
          if (dest) {
            operands.push({ type: "Register", value: String(dest) });
          }

          // Memory address operand
          if (memMode === "imm" && memImm !== undefined && memImm !== null && memImm !== "") {
            operands.push({ type: "Immediate", value: String(memImm) });
          } else if (memMode === "reg" && memReg) {
            operands.push({ type: "Register", value: String(memReg) });
          }
        } else if (instruction === "STORE") {
          // STORE: Address first, then register
          if (memMode === "imm" && memImm !== undefined && memImm !== null && memImm !== "") {
            operands.push({ type: "Immediate", value: String(memImm) });
          } else if (memMode === "reg" && memReg) {
            operands.push({ type: "Register", value: String(memReg) });
          }

          // Source register
          // Source register
          const srcReg = node.data?.srcReg ?? node.data?.src ?? node.data?.reg2 ?? node.data?.rSrc;
          if (srcReg) {
            operands.push({ type: "Register", value: String(srcReg) });
          }
        }
      } else if (instruction === "OUT") {
        // OUT: Port (memImm), Value (srcReg/srcImm)
        const port = node.data?.memImm;
        if (port !== undefined && port !== null && port !== "") {
          operands.push({ type: "Immediate", value: String(port) });
        }

        // Src Value
        let pushedSrc = false;
        const immRaw = node.data?.srcImm ?? node.data?.imm ?? node.data?.value ?? node.data?.val;
        if (immRaw !== undefined && immRaw !== null && immRaw !== "") {
          operands.push({ type: "Immediate", value: `#${String(immRaw)}` });
          pushedSrc = true;
        }
        if (!pushedSrc) {
          const srcReg = node.data?.srcReg ?? node.data?.src ?? node.data?.reg2 ?? node.data?.rSrc;
          if (srcReg) operands.push({ type: "Register", value: String(srcReg) });
        }
      } else {
        // Regular operand parsing for other instructions
        const destReg =
          node.data?.dest ??
          node.data?.dst ??
          node.data?.register ??
          node.data?.reg;
        if (destReg) operands.push({ type: "Register", value: String(destReg) });

        let pushedSrc = false;
        const immRaw =
          node.data?.srcImm ??
          node.data?.imm ??
          node.data?.value ??
          node.data?.val;
        if (immRaw !== undefined && immRaw !== null && immRaw !== "") {
          operands.push({ type: "Immediate", value: `#${String(immRaw)}` });
          pushedSrc = true;
        }
        if (!pushedSrc) {
          const srcReg =
            node.data?.srcReg ??
            node.data?.src ??
            node.data?.reg2 ??
            node.data?.rSrc;
          if (srcReg) operands.push({ type: "Register", value: String(srcReg) });
        }
      }

      if (
        (instruction === "JMP" ||
          instruction === "JZ" ||
          instruction === "JNZ") &&
        node.data?.label
      ) {
        operands.push({ type: "Label", value: String(node.data.label) });
      }


      item.operands = operands;
      return item as ProgramItem;
    });

    // 3) validate ทั้งก้อน
    const valErrors = validateProgramItems(items);
    if (valErrors.length) {
      alert("Invalid program:\n" + valErrors.join("\n"));
      return;
    }

    // 4) UI positions + viewport (pan/zoom)
    const uiPosition: UIPosition = nodesToProcess.reduce((acc, node) => {
      acc[nodeMap.get(node.id)!] = { x: node.position.x, y: node.position.y };
      return acc;
    }, {} as UIPosition);

    const uiPositionFixed = normalizePositions(uiPosition);

    const vp = getViewportSafe(reactFlowInstance); // { pan:{x,y}, zoom }

    try {
      // 5) เช็คว่ามี playground แล้วหรือยัง (ครั้งเดียว)
      const existingPlayground = await checkPlayground(Number(assignmentId));

      // 6) meta_data: ใช้ของเดิมถ้ามี; ไม่งั้นสร้างใหม่ + author_id จาก JWT
      const authorId = getCurrentUserId();
      const metaDataFinal = existingPlayground?.item?.meta_data ?? {
        ...(authorId ? { author_id: authorId } : {}),
        program_name: assignment?.title || "Untitled Program",
        timestamp: new Date().toISOString(),
      };

      // 7) clean items แล้วประกอบ payloadตามสเปก BE
      const cleanedItems = cleanItems(items as any[]);
      const attemptNo = (existingPlayground as any)?.attempt_no ?? 1;

      const payload: any = {
        assignment_id: Number(assignmentId),
        item: {
          items: cleanedItems,
          meta_data: metaDataFinal,
          ui: {
            pan: vp.pan,
            position: uiPositionFixed,
            zoom: Math.round(vp.zoom),
          },
        },
        status: "in_progress",
        attempt_no: attemptNo,
      };

      // 8) create/update
      let result: any;
      if (existingPlayground) {
        result = await updatePlayground(payload);
        appendLog("playground updated");
      } else {
        result = await createPlayground(payload);
        appendLog("playground created");
      }

      // 9) set playground id for execute
      const pid = pickPlaygroundId(
        result?.Data?.id,
        result?.id,
        result?.playground_id,
        result?.item?.id,
        existingPlayground?.Data?.id,
        existingPlayground?.id,
      );

      if (pid) {
        // Optionally update ref
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Save failed: " + e.message);
    }
  }, [nodes, edges, assignment, appendLog]);

  // 1. Instant Run
  const runInstant = useCallback(async () => {
    console.log("\n\n");
    console.log("═══════════════════════════════════════════════════════");
    console.log("🚀🚀🚀 [INSTANT RUN] EXECUTION STARTED 🚀🚀🚀");
    console.log("═══════════════════════════════════════════════════════");
    console.log("📊 Input Data:");
    console.log("   - Nodes count:", nodes.length);
    console.log("   - Edges count:", edges.length);
    console.log("   - Nodes:", nodes);
    console.log("   - Edges:", edges);

    // Clear selection to show Processor Dashboard
    setSelectedNode(null);

    try {
      console.log("\n📝 Step 1: Parsing nodes to program items...");
      const items = parseProgramItems(nodes, edges, variables);
      console.log("   ✅ Parsed", items.length, "items");
      console.log("   📋 Items:", items);

      console.log("\n🔍 Step 2: Validating program...");
      const valErrors = validateProgramItems(items);
      if (valErrors.length) {
        console.error("   ❌ VALIDATION FAILED:");
        console.error("   Errors:", valErrors);
        toast.error(`Invalid: ${valErrors[0]}`);
        return;
      }
      console.log("   ✅ Validation passed");

      // BUG FIX #1: Check for IN instruction in COMPILED instructions only (not all canvas nodes)
      console.log("\n🔒 Step 2.5: Checking for IN instruction in compiled program...");
      const hasInInProgram = items.some(item => item.instruction?.toUpperCase() === "IN");
      if (hasInInProgram) {
        console.error("   ❌ INSTANT RUN BLOCKED: IN instruction found in program flow");
        toast.error("Input (IN) not supported in Instant Mode. Use Debugger.", {
          icon: '🚫',
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
        return;
      }
      console.log("   ✅ No IN instruction in program flow");

      console.log("\n🗺️ Step 3: Building instruction map...");
      const instructionMap = buildInstructionMap(items);
      console.log("   ✅ Map size:", instructionMap.size);

      console.log("\n💾 Step 4: Initializing CPU...");
      const initialState = buildInitialCPUState(assignment);

      // FIX: Inject Variables into Instant Run Memory
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
      console.log("   Initial state with vars:", freshCpu);

      console.log("\n⚙️ Step 5: EXECUTING PROGRAM...");
      const result = await executeProgram(items, freshCpu, 10000, {}, ioHandlerRef.current);
      console.log("   ✅ EXECUTION COMPLETE!");
      console.log("   📊 Result:", result);

      console.log("\n🔄 Step 6: Updating React state...");
      console.log("   - Registers:", result.registers);
      console.log("   - Flags:", result.flags);
      console.log("   - Memory:", result.memory_sparse);
      console.log("   - Ports:", result.ports);

      setExecRegisters(result.registers);
      setExecFlags(result.flags);
      setExecMemorySparse(result.memory_sparse);
      setExecPorts(result.ports || {});

      // Update IO State (Debug Logs + Clean Output)
      if (result.io_state) {
        setExecIO({
          logs: result.io_state.logs,
          consoleBuffer: result.io_state.consoleBuffer,
          sevenSegment: result.io_state.sevenSegment,
          ledMatrix: Array.from(result.io_state.ledMatrix),
          ledSelectedRow: result.io_state.ledSelectedRow,
        });
        setExecOutputLines(result.io_state.outputLines || []);
      }
      console.log("   ✅ State update functions called");

      // Sync IO State from execution result
      if (result.io_state) {
        console.log("\n📺 Step 7: Updating IO state...");
        console.log("   IO State:", result.io_state);
        setExecIO({
          logs: result.io_state.logs || [],
          consoleBuffer: result.io_state.consoleBuffer || "",
          sevenSegment: result.io_state.sevenSegment || 0,
          ledMatrix: result.io_state.ledMatrix || [0, 0, 0, 0, 0, 0, 0, 0],
          ledSelectedRow: result.io_state.ledSelectedRow || 0,
        });
        console.log("   ✅ IO state updated");
      }

      // Handle logs (legacy - kept for backward compatibility)
      if (result.logs) {
        result.logs.forEach(l => appendLog(l));
      }

      // Highlight end
      setHighlightedLine(null);

      toast.success("Execution Complete!", { position: "bottom-center" });

      console.log("\n═══════════════════════════════════════════════════════");
      console.log("🎉🎉🎉 [EXECUTE] COMPLETED SUCCESSFULLY 🎉🎉🎉");
      console.log("═══════════════════════════════════════════════════════\n\n");

    } catch (e: any) {
      console.log("\n═══════════════════════════════════════════════════════");
      console.error("💥💥💥 [EXECUTE] ERROR 💥💥💥");
      console.log("═══════════════════════════════════════════════════════");
      console.error("Error details:", e);
      console.error("Stack trace:", e.stack);
      toast.error(`Error: ${e.message}`);
      appendLog(`[ERROR] ${e.message}`);
    }
  }, [nodes, edges, assignment, appendLog, variables]);

  // 1.5 Step Back
  const handleStepBack = useCallback(() => {
    console.log("⏮️ [handleStepBack] Attempting step back. History length:", historyRef.current.length);

    if (historyRef.current.length === 0 || !simulationRef.current.cpu) {
      console.log("❌ [handleStepBack] Cannot step back - no history or no CPU");
      return;
    }

    const snapshot: any = historyRef.current.pop();
    if (snapshot) {
      console.log("✅ [handleStepBack] Restoring snapshot. PC:", snapshot.pc);

      // Restore CPU state
      simulationRef.current.cpu.restoreSnapshot(snapshot);

      // Restore IO state if present
      if (snapshot.ioState) {
        console.log("🔄 [handleStepBack] Restoring IO state. Logs:", snapshot.ioState.logs.length, "KeyBuf:", snapshot.ioState.keyBuffer.length);
        ioHandlerRef.current.restoreSnapshot(snapshot.ioState);
      }

      setHistoryLength(historyRef.current.length);

      // Sync UI
      const currentCpu = simulationRef.current.cpu;
      console.log("🔄 [handleStepBack] Syncing UI - Registers:", currentCpu.registers);
      setExecRegisters({ ...currentCpu.registers });
      setExecFlags({ ...currentCpu.flags });
      setExecMemorySparse(currentCpu.getMemorySparse());
      setHighlightedLine(currentCpu.pc);

      // Sync IO UI
      const ioRestoreState = ioHandlerRef.current.getSnapshot();
      setExecIO({
        logs: ioRestoreState.logs,
        consoleBuffer: ioRestoreState.consoleBuffer,
        sevenSegment: ioRestoreState.sevenSegment,
        ledMatrix: Array.from(ioRestoreState.ledMatrix),
        ledSelectedRow: ioRestoreState.ledSelectedRow,
      });
      setExecOutputLines(ioRestoreState.outputLines || []);

      // Auto-pause if running
      if (isRunning) {
        setIsRunning(false);
        if (simulationRef.current.interval) {
          clearInterval(simulationRef.current.interval);
          simulationRef.current.interval = null;
        }
      }

      console.log("✅ [handleStepBack] Step back completed. New history length:", historyRef.current.length);
    }
  }, [isRunning]);

  // 2. Debug Run (Step / Play) using existing simulationRef structure
  const handleStep = useCallback(async () => {
    console.log(" [handleStep] Starting step...");

    // Clear selection to show results
    setSelectedNode(null);

    // BUG FIX #7: Use cached items instead of re-parsing every step
    let items = simulationRef.current.cachedItems;
    if (!items) {
      console.log("📝 [handleStep] Parsing items (first time)...");
      items = parseProgramItems(nodes, edges, variables);
      simulationRef.current.cachedItems = items;
      console.log("✅ [handleStep] Cached", items.length, "items");
    } else {
      console.log("♻️ [handleStep] Using cached items:", items.length);
    }

    if (!simulationRef.current.cpu) {
      console.log("🆕 [handleStep] Initializing new CPU...");

      // Init CPU if needed
      const valErrors = validateProgramItems(items);
      if (valErrors.length) {
        toast.error(valErrors[0]);
        return;
      }

      // CRITICAL FIX: Ensure Variables Interop!
      // 'assignment' defines the template, but 'variables' (React State) holds the *current* user definitions.
      // We must merge the current variables into the fresh CPU memory.
      const initialState = buildInitialCPUState(assignment);

      // Initialize memory array if needed (assumes max size 256 or similar from CPU default)
      // We'll create a sparse map or array approach depending on CPU constructor expectations.
      // Assuming CPU handles an array of {address, value} or a raw array.
      // Let's force it to be an array that includes our variables.

      const computedMemory = [...(initialState.memory || [])]; // Start with assignment defaults

      // Inject Variables (Source of Truth)
      // This fixes the issue where cpu.memory might be empty on first load.
      variables.forEach(v => {
        // Find if this address already has a value in initial state, if so overwrite, else add
        const existingIdx = computedMemory.findIndex(m => m.address === v.address);
        if (existingIdx !== -1) {
          computedMemory[existingIdx].value = v.value;
        } else {
          computedMemory.push({ address: v.address, value: v.value });
        }
      });
      // Sort for cleanliness (optional but good for debugging)
      computedMemory.sort((a, b) => a.address - b.address);

      initialState.memory = computedMemory;

      const fresh = new CPU(initialState);
      // Find START
      const startItem = items.find(i => i.instruction?.toUpperCase() === 'START');
      if (startItem) fresh.pc = startItem.id;
      simulationRef.current.cpu = fresh;
      console.log("✅ [handleStep] CPU initialized at PC:", fresh.pc);

      // LOG MEMORY STATE
      console.log("🔍 [handleStep] Fresh CPU Memory State:", fresh.memory);
    }

    const currentCpu = simulationRef.current.cpu;

    // BUG FIX #3: Stop the interval immediately if CPU is halted (prevent zombie loop)
    if (!currentCpu || currentCpu.halted) {
      console.log("⏸️ [handleStep] CPU halted or missing - STOPPING INTERVAL");

      // Stop the play interval
      setIsRunning(false);
      if (simulationRef.current.interval) {
        clearInterval(simulationRef.current.interval);
        simulationRef.current.interval = null;
        console.log("✅ [handleStep] Interval cleared");
      }

      return;
    }

    try {
      const instructionMap = buildInstructionMap(items);
      const item = instructionMap.get(currentCpu.pc);

      console.log("🎯 [handleStep] Executing PC:", currentCpu.pc, "Instruction:", item?.instruction);

      if (!item) {
        currentCpu.halt(`Invalid PC: ${currentCpu.pc}`);
        // Sync UI one last time
        const newRegisters = { ...currentCpu.registers };
        setExecRegisters(newRegisters);
        setExecFlags({ ...currentCpu.flags });
        return;
      }

      // Save Snapshot for Time Travel BEFORE execution (CPU + IO State)
      const cpuSnapshot = currentCpu.getSnapshot();
      const ioSnapshot = ioHandlerRef.current.getSnapshot();
      const fullSnapshot = {
        ...cpuSnapshot,
        ioState: ioSnapshot
      };
      historyRef.current.push(fullSnapshot);
      setHistoryLength(historyRef.current.length);
      console.log("📸 [handleStep] Saved snapshot. PC:", cpuSnapshot.pc, "IO Logs:", ioSnapshot.logs.length, "History:", historyRef.current.length);

      executeInstruction(currentCpu, item, instructionMap, undefined, ioHandlerRef.current);

      // Sync UI
      const newRegisters = { ...currentCpu.registers };
      console.log("🔄 [handleStep] Updating registers:", newRegisters);
      setExecRegisters(newRegisters);
      setExecFlags({ ...currentCpu.flags });
      setExecMemorySparse(currentCpu.getMemorySparse());

      // FIX: Update Ports State
      if (currentCpu.ports) {
        setExecPorts({ ...currentCpu.ports });
        console.log("🔌 [handleStep] Ports Updated:", currentCpu.ports);
      }

      // Sync IO State from handler
      const ioSnapshotSync = ioHandlerRef.current.getSnapshot();
      setExecIO({
        logs: ioSnapshotSync.logs || [],
        consoleBuffer: ioSnapshotSync.consoleBuffer || "",
        sevenSegment: ioSnapshotSync.sevenSegment || 0,
        ledMatrix: Array.from(ioSnapshotSync.ledMatrix) || [0, 0, 0, 0, 0, 0, 0, 0],
        ledSelectedRow: ioSnapshotSync.ledSelectedRow || 0,
      });
      setExecOutputLines(ioSnapshotSync.outputLines || []);

      // Highlight
      setHighlightedLine(currentCpu.pc);

      // Clear waiting flag on successful execution
      setWaitingForInput(false);

      if (currentCpu.halted) {
        console.log("✅ [handleStep] CPU halted - stopping execution");
        setIsRunning(false);

        // Clear the interval to prevent further step calls
        if (simulationRef.current.interval) {
          clearInterval(simulationRef.current.interval);
          simulationRef.current.interval = null;
          console.log("✅ [handleStep] Interval cleared on halt");
        }

        toast.success("Halted");
      }
    } catch (e: any) {
      // BUG FIX #6: Handle blocking I/O (INPUT_REQUIRED exception)
      if (e.message === 'INPUT_REQUIRED') {
        console.log("⏸️ [handleStep] INPUT_REQUIRED - pausing for input");
        setIsRunning(false);
        setWaitingForInput(true); // Set flag for auto-resume

        // Clear interval to stop continuous stepping
        if (simulationRef.current.interval) {
          clearInterval(simulationRef.current.interval);
          simulationRef.current.interval = null;
        }


        toast("Waiting for input...", {
          icon: '⌨️',
          duration: 2000,
          style: { borderRadius: '10px', background: '#3b82f6', color: '#fff' }
        });


        // Don't halt CPU - just pause. PC remains on IN instruction.
        // When user types and hits Step/Play again, it will retry the IN.
        return;
      }

      // Other errors: halt execution
      console.error("💥 [handleStep] Error:", e);
      setIsRunning(false);
      toast.error(e.message);
      currentCpu.halt(e.message);
    }
  }, [nodes, edges, assignment, variables]);

  const toggleDebugPlay = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (simulationRef.current.interval) {
        clearInterval(simulationRef.current.interval);
        simulationRef.current.interval = null;
      }
    } else {
      setIsRunning(true);
      simulationRef.current.interval = setInterval(() => {
        handleStep();
      }, 1000 / speed); // Use state speed
    }
  }, [isRunning, handleStep, speed]);

  // VISUAL HIGHLIGHT: execution pop effect
  useEffect(() => {
    // 1. Identify active node
    const items = simulationRef.current.cachedItems;

    // If no execution context, clear all
    if (!items || highlightedLine === null) {
      setNodes((nds) => nds.map(n => {
        // Always sanitize to be safe
        const s = { ...n.style };
        if (s.transform) delete s.transform;
        if (s.zIndex) delete s.zIndex;
        if (s.border) delete s.border;
        if (s.boxShadow) delete s.boxShadow;
        if (s.transition) delete s.transition;

        if (n.data?.isActiveExec) {
          return { ...n, style: s, data: { ...n.data, isActiveExec: false } };
        }
        // Even if not active, return sanitized style
        return { ...n, style: s };
      }));
      return;
    }

    const activeItem = items.find(i => i.id === highlightedLine);
    const activeNodeId = activeItem?.sourceNodeId;

    if (!activeNodeId) return;

    setNodes((nds) => nds.map((n) => {
      const isTarget = n.id === activeNodeId;
      const wasActive = n.data?.isActiveExec;

      if (isTarget && wasActive) return n; // No change
      if (!isTarget && !wasActive) return n; // No change

      if (isTarget) {
        // Apply Pop Flag
        return {
          ...n,
          data: { ...n.data, isActiveExec: true }
        };
      } else {
        // Clear Pop Flag AND sanitize styles (legacy cleanup)
        const s = { ...n.style };
        if (s.transform) delete s.transform;
        if (s.zIndex) delete s.zIndex;
        if (s.border) delete s.border;
        if (s.boxShadow) delete s.boxShadow;
        if (s.transition) delete s.transition;
        return { ...n, style: s, data: { ...n.data, isActiveExec: false } };
      }
    }));

  }, [highlightedLine, setNodes]);

  // Update interval when speed changes
  useEffect(() => {
    if (isRunning && simulationRef.current.interval) {
      clearInterval(simulationRef.current.interval);
      simulationRef.current.interval = setInterval(() => {
        handleStep();
      }, 1000 / speed);
    }
  }, [speed, isRunning, handleStep]);


  // 3. Test Suite (Mock)
  const runTests = useCallback(async () => {
    setTestStatus("running");

    // Simulate Delay
    await new Promise(r => setTimeout(r, 1500));

    toast.success("All Tests Passed!");
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    if (simulationRef.current.interval) {
      clearInterval(simulationRef.current.interval);
      simulationRef.current.interval = null;
    }
    simulationRef.current.cpu = null;

    // BUG FIX #7: Clear cached items on reset
    simulationRef.current.cachedItems = null;
    console.log("🗑️ [handleReset] Cleared cached items");

    setLogs([]);
    setLogs([]);
    setTestStatus(null);
    setHighlightedLine(null);

    // Clear History
    historyRef.current = [];
    setHistoryLength(0);

    // Reset UI State
    const initial = buildInitialCPUState(assignment);

    // FIX: Re-hydrate UI Memory from Variables (Reset to Initial with Vars)
    const initialMemory: Record<string, number> = {};
    console.log("🧹 [handleReset] Resetting... CPU State found:", !!cpu);
    if (cpu?.memory) {
      console.log("💧 [handleReset] Hydrating from cpu.memory:", cpu.memory);
      cpu.memory.forEach(m => {
        initialMemory[m.address] = m.value;
      });
    } else {
      console.warn("⚠️ [handleReset] cpu.memory is missing! Variables will not be loaded.");
    }
    console.log("📦 [handleReset] Final Initial Memory:", initialMemory);

    setExecRegisters(initial.registers);
    setExecFlags(initial.flags);
    setExecMemorySparse(initialMemory);
    setExecPorts(initial.ports);
    setExecIO(undefined);
    setExecOutputLines([]);

    ioHandlerRef.current.reset();
  }, [assignment, cpu]);

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
    <div className="h-screen w-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
      {/* 1. Navbar (Top) */}
      <PlaygroundNavbar
        assignmentTitle={assignment?.title || "..."}
        onBack={() => router.back()}
        mode={executionMode}
        onRun={setExecutionMode}
        onSubmit={() => toast("Submit feature coming soon!")}
        onReset={handleReset}
      />

      {/* 2. Main Workspace (Flex Row) */}
      <div className="flex-1 flex overflow-hidden">

        {/* 2.1 Left: Slim Toolbar */}
        <SlimToolbar
          allowedInstructions={allowed}
          hideStart={hasStart}
          hideHlt={hasHlt}
        />

        {/* 2.2 Center: Canvas & Bottom Deck */}
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Canvas Area */}
          <div className="flex-1 relative bg-gray-100" ref={reactFlowWrapper}>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded border text-sm shadow-sm pointer-events-none">
              {limitBadge}
            </div>

            <PlaygroundCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              nodeTypes={nodeTypes}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
            />

            {/* Properties Panel has been moved to RightInspector context */}
          </div>

          {/* Bottom Deck with Embedded Execution Controls */}
          <BottomDeck
            logs={execIO?.logs ?? []}
            consoleBuffer={execIO?.consoleBuffer ?? ""}
            onConsoleInput={(key: string) => {
              console.log("⌨️ [Console Input] Key:", JSON.stringify(key), "Code:", key.charCodeAt(0), "waitingForInput:", waitingForInput);
              ioHandlerRef.current.receiveInput(key);
              // Auto-resume with Play mode if waiting for input and user pressed Enter
              // Terminal sends "Enter" string, not '\n'
              if (waitingForInput && key === 'Enter') {
                console.log("✅ [Auto-Resume] Conditions met! Starting Play mode");
                setWaitingForInput(false);
                toggleDebugPlay(); // Start continuous play instead of single step
              } else {
                console.log("❌ [Auto-Resume] Conditions not met:", {
                  waitingForInput,
                  isEnter: key === 'Enter',
                  keyCode: key.charCodeAt(0)
                });
              }
            }}
            sevenSegment={execIO?.sevenSegment ?? 0}
            ledMatrix={execIO?.ledMatrix ?? [0, 0, 0, 0, 0, 0, 0, 0]}
            ledPanelValue={execPorts[5] || 0}
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
          onNodeChange={onPatchNode}
          onCloseInspector={() => setPanelOpen(false)}
          availableRegisters={registerNames}
          availableLabels={labelOptions}
          variables={variables}
          onAddVariable={handleAddVariable}
          onEditVariable={handleEditVariable}
          onDeleteVariable={handleDeleteVariable}
        />
      </div>
    </div>
  );
}
