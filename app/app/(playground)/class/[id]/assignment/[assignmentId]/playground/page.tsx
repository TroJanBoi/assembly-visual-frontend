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

import PlaygroundNavbar from "@/components/playground/PlaygroundNavbar";
import DraggablePanel from "@/components/playground/DraggablePanel";
import NodePanel from "@/components/playground/NodePanel";
import ProcessorDashboard from "@/components/playground/ProcessorDashboard";
import InstructionNode from "@/components/playground/InstructionNode";
import PlaygroundCanvas from "@/components/playground/PlaygroundCanvas";
import PropertyPanel from "@/components/playground/PropertyPanel";
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
import { executeProgram } from "@/lib/playground/executor";

import BottomTerminal from "@/components/playground/BottomTerminal";

const nodeTypes: NodeTypes = { instruction: InstructionNode };
let id = 0;
const getId = () => `dnd-node_${id++}`;

const getInstr = (n: Node) =>
  String(n.data?.instructionType || "").toUpperCase();

// ===== Types & helpers =====
type CPUState = {
  registers: Record<string, number>;
  flags: Record<string, number>;
  memory: { address: number; value: number }[];
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
  const [loading, setLoading] = useState(true);

  // Assignment-driven controls
  const [cpu, setCpu] = useState<CPUState>(() => buildInitialCPUState(null));
  const [allowed, setAllowed] = useState<Set<string>>(new Set());
  const [maxNodes, setMaxNodes] = useState<number | null>(null);
  const [proximityNode, setProximityNode] = useState<Node | null>(null);
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

  // Execution state from BE
  const [execRegisters, setExecRegisters] = useState<Record<string, number>>(
    {},
  );
  const [execFlags, setExecFlags] = useState<Record<string, number>>({});
  const [execMemorySparse, setExecMemorySparse] = useState<
    Record<string, number>
  >({});

  const playgroundIdRef = useRef<number | null>(null);

  // ===== Property Panel state =====
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick = useCallback((_e: any, node: Node) => {
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
              type: 'default',
              animated: true,
              style: { strokeDasharray: '5 5', stroke: '#9333ea' },
              zIndex: -1,
            });
          }
        }
      }
    });

    setEdges(eds => {
      const regularEdges = eds.filter(e => !e.id.startsWith('label-'));
      return [...regularEdges, ...labelEdges];
    });
  }, [nodes]);

  const onConnect: OnConnect = useCallback((connection) => {
    if (!connection.source || !connection.target) return;

    setEdges((eds) => {
      // Pass handles to allow multi-handle connections (e.g. separate 'out' and 'left' handles)
      if (!canConnectEdge(eds, connection.source!, connection.target!, connection.sourceHandle, connection.targetHandle)) {
        // optionally toast: "Each node can only have one connection."
        return eds;
      }

      const edge = { ...connection };
      return addEdge(edge, eds);
    });
  }, []);

  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      const proximityThreshold = 200;
      let closestNode: Node | null = null;
      let minDistance = Infinity;

      nodes.forEach((n) => {
        if (n.id !== node.id) {
          const dx = n.position.x - node.position.x;
          const dy = n.position.y - node.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < proximityThreshold && distance < minDistance) {
            minDistance = distance;
            closestNode = n;
          }
        }
      });

      setProximityNode(closestNode);
      setNodes((nds) =>
        nds.map((n) => {
          const isProximity = n.id === closestNode?.id;
          return {
            ...n,
            style: {
              ...n.style,
              boxShadow: isProximity
                ? "0 0 20px 5px rgba(6, 182, 212, 0.5)"
                : undefined,
              borderRadius: isProximity ? "10px" : undefined,
              transition: isProximity ? "box-shadow 0.2s ease-in-out" : "none",
            },
          };
        }),
      );
    },
    [nodes],
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (proximityNode) {
        const draggedY = node.position.y;
        const proximityY = proximityNode.position.y;

        // Determine Source/Target based on vertical position
        let sourceId: string;
        let targetId: string;

        if (draggedY < proximityY) {
          sourceId = node.id;
          targetId = proximityNode.id;
        } else {
          sourceId = proximityNode.id;
          targetId = node.id;
        }

        const sourceHandle = "out";
        const targetHandle = "in";

        const isDuplicate = edges.some(e =>
          e.source === sourceId && e.target === targetId
        );

        if (!isDuplicate && canConnectEdge(edges, sourceId, targetId, sourceHandle, targetHandle)) {
          onConnect({
            source: sourceId,
            target: targetId,
            sourceHandle,
            targetHandle,
          });
        }
      }
      // Always clear proximity and highlights
      setProximityNode(null);
      setNodes((nds) =>
        nds.map((n) => {
          const { boxShadow, borderRadius, transition, ...restStyle } =
            n.style || {};
          return { ...n, style: restStyle };
        }),
      );
    },
    [proximityNode, onConnect, edges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;
      const key = type.toLowerCase();

      // allow HLT และ START เสมอ; ที่เหลือเช็คตาม allowed
      const isCore = key === "hlt" || key === "start";
      if (!isCore && allowed.size && !allowed.has(key)) {
        alert(`Instruction "${type}" is not allowed for this assignment.`);
        return;
      }

      if (maxNodes !== null && nodes.length >= maxNodes) {
        alert(`Node limit reached (max ${maxNodes}).`);
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX,
        y: event.clientY,
      });
      setNodes((nds) =>
        nds.concat({
          id: getId(),
          type: "instruction",
          position,
          data: { instructionType: type },
        }),
      );
    },
    [reactFlowInstance, maxNodes, nodes, allowed],
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

    // หา min x,y เพื่อ offset ให้ทุกจุดเป็นบวก
    let minX = Infinity,
      minY = Infinity;
    for (const key of Object.keys(pos)) {
      const p = pos[key];
      if (!p) continue;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
    }

    const offsetX = minX < 0 ? Math.abs(minX) + 20 : 0; // เผื่อระยะ 20 px
    const offsetY = minY < 0 ? Math.abs(minY) + 20 : 0;

    const out: UIPosition = {};
    for (const key of Object.keys(pos)) {
      const p = pos[key];
      out[key] = {
        x: Math.round((p.x ?? 0) + offsetX),
        y: Math.round((p.y ?? 0) + offsetY),
      };
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

  function validateProgramItems(items: ProgramItem[]): string[] {
    const errs: string[] = [];
    for (const it of items) {
      const instr = String(it.instruction || "").toUpperCase();
      const ops = Array.isArray(it.operands) ? it.operands : [];

      const need2 = new Set(["MOV", "LOAD", "STORE", "ADD", "SUB", "CMP"]);
      const zero = new Set(["HLT", "LABEL", "NOP"]);
      const oneJmp = new Set(["JMP", "JZ", "JNZ"]);

      if (need2.has(instr) && ops.length !== 2) {
        errs.push(
          `${instr} at id=${it.id} requires 2 operands, got ${ops.length}`,
        );
      }
      if (zero.has(instr) && ops.length !== 0) {
        errs.push(
          `${instr} at id=${it.id} must have 0 operands, got ${ops.length}`,
        );
      }
      if (oneJmp.has(instr) && ops.length !== 1) {
        errs.push(
          `${instr} at id=${it.id} requires 1 label operand, got ${ops.length}`,
        );
      }

      if (instr === "CMP") {
        if (
          typeof (it as any).next_true !== "number" ||
          typeof (it as any).next_false !== "number"
        ) {
          errs.push(`CMP at id=${it.id} must have next_true and next_false`);
        }
      } else {
        // ที่ไม่ใช่ CMP ต้องไม่มี next_true/next_false
        if (
          (it as any).next_true !== undefined ||
          (it as any).next_false !== undefined
        ) {
          errs.push(
            `${instr} at id=${it.id} must not include next_true/next_false`,
          );
        }
      }

      // กลุ่มห้าม next
      const forbidNext = new Set(["JMP", "JZ", "JNZ", "HLT", "LABEL", "NOP"]);
      if (forbidNext.has(instr) && (it as any).next !== undefined) {
        errs.push(`${instr} at id=${it.id} must not include next`);
      }
    }
    return errs;
  }

  /* start handleRun seccton */
  /* start handleRun seccton */

  const handleRun = async (mode: string) => {
    if (!assignmentId) return;

    // 1) เตรียม nodes และ id mapping
    const nodesToProcess = nodes.filter((n) => getInstr(n) !== "START");
    const nodeMap = new Map(nodesToProcess.map((n, i) => [n.id, i + 1]));

    // 2) แปลงเป็น items
    const items: ProgramItem[] = nodesToProcess.map((node) => {
      const instruction = getInstr(node);
      const outEdges = edges.filter((e) => e.source === node.id);
      const nextEdge = outEdges.find((e) => !e.sourceHandle);
      const nextTrueEdge = outEdges.find((e) => e.sourceHandle === "true");
      const nextFalseEdge = outEdges.find((e) => e.sourceHandle === "false");

      const item: any = {
        id: nodeMap.get(node.id)!,
        instruction,
        label: node.data?.label || "",
        operands: [],
      };

      const forbidNext = new Set(["JMP", "JZ", "JNZ", "HLT", "LABEL", "NOP"]);
      if (instruction === "CMP") {
        item.next_true = nextTrueEdge
          ? (nodeMap.get(nextTrueEdge.target) ?? null)
          : null;
        item.next_false = nextFalseEdge
          ? (nodeMap.get(nextFalseEdge.target) ?? null)
          : null;
      } else if (!forbidNext.has(instruction)) {
        item.next = nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null;
      }

      // operands (ทนต่อหลายชื่อฟิลด์จาก UI)
      const operands: Operand[] = [];
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
        playgroundIdRef.current = pid;
        appendLog(`playground id = ${playgroundIdRef.current}`);
      } else {
        appendLog("no playground id found after save");
        return;
      }

      // 10) Execute (CLIENT-SIDE)
      appendLog("Executing program (client-side)...");
      const execution_state = executeProgram(items, cpu);

      // Log execution results
      if (execution_state.logs) {
        execution_state.logs.forEach((log) => appendLog(`  ${log}`));
      }

      // update real state
      setExecRegisters(execution_state.registers || {});
      setExecFlags(execution_state.flags || {});
      setExecMemorySparse(execution_state.memory_sparse || {});

      appendLog(
        `halted=${execution_state.halted} error=${execution_state.error ?? "null"}`,
      );
      appendLog("registers=" + JSON.stringify(execution_state.registers));
      appendLog("flags=" + JSON.stringify(execution_state.flags));
      appendLog(
        `memory_sparse keys=${Object.keys(execution_state.memory_sparse || {}).length}`,
      );
    } catch (error: any) {
      console.error("Failed to save/run playground:", error);
      appendLog(`execute failed: ${error?.message || String(error)}`);
    }
  };

  /* end handleRun seccton */
  /* end handleRun seccton */

  const handleSubmit = () => {
    /* TODO: submit solution */
  };

  // Navbar wants this symbol; delegate to handleRun("default")
  const handleNavbarRun = () => handleRun("default");

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

  return (
    <div className="w-screen h-screen bg-gray-100 flex flex-col font-sans">
      <PlaygroundNavbar
        assignmentTitle={assignment?.title || "..."}
        onBack={() => router.back()}
        onRun={handleNavbarRun}
        onSubmit={handleSubmit}
      />

      <main className="flex-1 relative" ref={reactFlowWrapper}>
        {/* Node usage badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded border text-sm">
          {limitBadge}
        </div>

        <div className="absolute inset-0 z-0">
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
            nodeTypes={nodeTypes}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
          />
        </div>

        <DraggablePanel title="Instructions" defaultPosition={{ x: 20, y: 20 }}>
          <NodePanel
            allowedInstructions={allowed}
            hideStart={hasStart}
            hideHlt={hasHlt}
          />
        </DraggablePanel>

        <DraggablePanel
          title="Processor Dashboard"
          defaultPosition={rightPanelPos}
        >
          <ProcessorDashboard
            registers={displayRegisters}
            flags={displayFlags}
            memory={displayMemory}
          />
        </DraggablePanel>

        {/* Properties Panel */}
        <PropertyPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          node={selectedNode as any}
          onChange={onPatchNode}
          registers={registerNames}
          labels={labelOptions}
        />
      </main>

      <BottomTerminal
        labName={labName}
        logs={logs}
        onClear={() => setLogs([])}
        defaultOpen={true}
        maxHeightPx={260}
      />
    </div>
  );
}
