"use client";

import React, { useCallback, useRef } from "react";
import NodeToolbox from "./NodeToolbox";
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

  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const rfInstance = useRef<any>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const data = event.dataTransfer.getData("application/reactflow");
      if (!data) return;

      let nodeDef: any;
      try {
        nodeDef = JSON.parse(data);
      } catch {
        return;
      }

      const clientX = event.clientX;
      const clientY = event.clientY;

      const position = rfInstance.current?.project
        ? rfInstance.current.project({
            x: clientX - reactFlowBounds.left,
            y: clientY - reactFlowBounds.top,
          })
        : {
            x: clientX - reactFlowBounds.left,
            y: clientY - reactFlowBounds.top,
          };

      const id = `${nodeDef.id}-${Date.now()}`;
      const newNode: Node = { id, data: { label: nodeDef.label }, position };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const containerStyle: React.CSSProperties = {
    height: "100%",
    width: "100%",
    backgroundColor: "var(--color-bg, #ffffff)",
  };

  return (
    <div className="w-full h-full flex">
      <div
        ref={reactFlowWrapper}
        className="w-full h-full relative"
        style={{ ...containerStyle, height: "100%" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          onInit={(rfi) => (rfInstance.current = rfi)}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <Background  />
          <MiniMap zoomable={true} pannable={true} />
          <Controls />
        </ReactFlow>

        {/* render children on top so pages can provide UI overlays */}
        <div className="absolute inset-0 pointer-events-none">{children}</div>

        {/* Floating toolbox */}
        <NodeToolbox />
      </div>
    </div>
  );
}
