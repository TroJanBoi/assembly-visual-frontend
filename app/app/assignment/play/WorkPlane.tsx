"use client";

import React, { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

type WorkPlaneProps = {
  children?: React.ReactNode;
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "Start" },
    position: { x: 250, y: 5 },
  },
  { id: "2", data: { label: "Node A" }, position: { x: 250, y: 160 } },
];

const initialEdges: Edge[] = [];

export default function WorkPlane({ children }: WorkPlaneProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setEdges((eds: Edge[]) => addEdge(params as any, eds)),
    [setEdges]
  );

  const containerStyle: React.CSSProperties = {
    height: "100%",
    width: "100%",
    backgroundColor: "var(--color-bg, #ffffff)",
  };

  return (
    <div className="w-full h-screen">
      <div className="w-full h-full" style={containerStyle}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <MiniMap zoomable={true} pannable={true} />
          <Controls />
        </ReactFlow>

        {/* render children on top so pages can provide UI overlays */}
        <div className="absolute inset-0 pointer-events-none">{children}</div>
      </div>
    </div>
  );
}
