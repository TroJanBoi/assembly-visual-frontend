"use client";

import React, { memo } from "react";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  ReactFlowInstance,
} from "reactflow";

interface PlaygroundCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onInit: (instance: ReactFlowInstance) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  nodeTypes: NodeTypes;
}

const PlaygroundCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  onDrop,
  onDragOver,
  nodeTypes,
}: PlaygroundCanvasProps) => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      onDrop={onDrop}
      onDragOver={onDragOver}
      nodeTypes={nodeTypes}
      fitView
      className="bg-dots w-full h-full"
    >
      <Controls />
      <MiniMap />
      <Background color="#ccc" />
    </ReactFlow>
  );
};

export default memo(PlaygroundCanvas);
