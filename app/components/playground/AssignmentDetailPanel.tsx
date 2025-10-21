"use client";

import { useState, useCallback, useEffect, useRef, DragEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactFlow, {
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  MiniMap,
  ReactFlowInstance,
  NodeTypes,
} from "reactflow";

import PlaygroundNavbar from "@/components/playground/PlaygroundNavbar";
import DraggablePanel from "@/components/playground/DraggablePanel";
import NodePanel from "@/components/playground/NodePanel";
import ProcessorDashboard from "@/components/playground/ProcessorDashboard";
import InstructionNode from "@/components/playground/InstructionNode";
import { getAssignmentById, Assignment } from "@/lib/api/assignment";

const nodeTypes: NodeTypes = {
  instruction: InstructionNode,
};

let id = 0;
const getId = () => `dnd-node_${id++}`;

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

  // Mock data for ProcessorDashboard
  const mockRegisters = {
    R0: 10,
    R1: 5,
    R2: 0,
    R3: 0,
    R4: 0,
    R5: 0,
    R6: 0,
    R7: 0,
  };
  const mockFlags = { Z: 1, C: 0, V: 0, O: 0 };
  const mockMemory = [
    { address: 100, value: 5 },
    { address: 101, value: 10 },
  ];

  const [rightPanelPos, setRightPanelPos] = useState({ x: 0, y: 20 });
  useEffect(() => {
    // 384px is the width of the panel (w-96), 20px is margin
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
      if (typeof type === "undefined" || !type) return;

      const position = reactFlowInstance.project({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type: "instruction",
        position,
        data: { instructionType: type },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
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
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignmentData();
  }, [classId, assignmentId]);

  const handleRun = (mode: string) => {
    /* ... */
  };
  const handleSubmit = () => {
    /* ... */
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-gray-100 flex flex-col font-sans">
      <PlaygroundNavbar
        assignmentTitle={assignment?.title || "..."}
        onBack={() => router.back()}
        onRun={handleRun}
        onSubmit={handleSubmit}
      />

      <main className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-dots"
        >
          <Controls />
          <MiniMap />
          <Background color="#ccc" />
        </ReactFlow>

        <DraggablePanel title="Instructions" defaultPosition={{ x: 20, y: 20 }}>
          <NodePanel />
        </DraggablePanel>

        <DraggablePanel
          title="Processor Dashboard"
          defaultPosition={rightPanelPos}
        >
          <ProcessorDashboard
            registers={mockRegisters}
            flags={mockFlags}
            memory={mockMemory}
          />
        </DraggablePanel>
      </main>
    </div>
  );
}
