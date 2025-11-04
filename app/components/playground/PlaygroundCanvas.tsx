"use client";

import React, { DragEvent } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

export type PlaygroundCanvasProps = {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  onInit: (instance: ReactFlowInstance) => void;

  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;

  /** NEW: forward node click to open Properties Panel */
  onNodeClick?: (e: any, node: Node) => void;
  onNodeDrag?: (e: any, node: Node) => void;
  onNodeDragStop?: (e: any, node: Node) => void;
};

export default function PlaygroundCanvas({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  onDrop,
  onDragOver,
  onNodeClick, // NEW
  onNodeDrag,
  onNodeDragStop,
}: PlaygroundCanvasProps) {
  return (
    <div className="w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <Background gap={16} size={1} />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}
