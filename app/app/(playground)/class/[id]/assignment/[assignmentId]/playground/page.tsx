"use client";

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
import { getAssignmentById, Assignment } from "@/lib/api/assignment";

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

export default function AssignmentPlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // start node helpers
  const isStartNode = (n: Node) =>
    (n.data?.instructionType || "").toUpperCase() === "START";

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

  const [rightPanelPos, setRightPanelPos] = useState({ x: 0, y: 20 });
  useEffect(() => {
    const xPos = window.innerWidth - 384 - 20;
    setRightPanelPos({ x: xPos > 0 ? xPos : 0, y: 20 });
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [],
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

      // allow START/HLT always; otherwise enforce allowed set
      const isCore = key === "start" || key === "hlt";
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
        a.add("hlt"); // <-- always allow HLT
        setAllowed(a);

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

  const handleRun = (mode: string) => {
    /* TODO: run/debug and update CPU */
  };
  const handleSubmit = () => {
    /* TODO: submit solution */
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // ---------- Badge counts EXCLUDING START ----------
  const used = nodes.length;
  const limitBadge =
    maxNodes !== null ? `${used}/${maxNodes} nodes used` : `${used} nodes used`;

  const hasStart = nodes.some((n) => getInstr(n) === "START");
  const hasHlt = nodes.some((n) => getInstr(n) === "HLT");

  return (
    <div className="w-screen h-screen bg-gray-100 flex flex-col font-sans">
      <PlaygroundNavbar
        assignmentTitle={assignment?.title || "..."}
        onBack={() => router.back()}
        onRun={handleRun}
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
            nodeTypes={nodeTypes}
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
            registers={cpu.registers}
            flags={cpu.flags}
            memory={cpu.memory}
          />
        </DraggablePanel>
      </main>
    </div>
  );
}
