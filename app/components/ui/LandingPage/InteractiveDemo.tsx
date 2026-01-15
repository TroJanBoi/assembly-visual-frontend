"use client";

import React, { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  NodeTypes,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
// Use the real InstructionNode from the playground
import InstructionNode from "@/components/playground/InstructionNode";

// Map 'instruction' type to the InstructionNode component
const nodeTypes: NodeTypes = {
  instruction: InstructionNode,
};

const initialNodes: Node[] = [
  {
    id: "demo-1",
    type: "instruction", // Matches nodeTypes key
    position: { x: 100, y: 100 },
    data: {
      // Data structure expected by InstructionNode
      instructionType: "MOV",
      dest: "R1",
      srcMode: "imm",
      srcImm: "50",
      // Optional/Default props to ensure it renders nicely
      isProximity: false,
      isActiveExec: false,
    },
  },
  {
    id: "demo-2",
    type: "instruction",
    position: { x: 450, y: 200 }, // Slightly adjusted position for better layout
    data: {
      instructionType: "ADD",
      dest: "R1", // "ADD R1, 75" implies R1 is dest usually? Or src? ADD dest, src -> dest += src. So dest=R1, src=75.
      srcMode: "imm",
      srcImm: "75",
      isProximity: false,
      isActiveExec: false,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "demo-1",
    target: "demo-2",
    animated: true,
    style: { stroke: "#6366f1", strokeWidth: 2 }, // Indigo-500
  },
];

export default function InteractiveDemo() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full bg-slate-50/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        connectionLineType={ConnectionLineType.Bezier}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
