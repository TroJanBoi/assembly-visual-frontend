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
  ConnectionLineType,
} from "reactflow";
import CircuitLoopEdge from "./edges/CircuitLoopEdge";

const edgeTypes = {
  circuitLoop: CircuitLoopEdge,
};

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
  onNodeDoubleClick?: (e: any, node: Node) => void;
  onNodeDrag?: (e: any, node: Node) => void;
  onNodeDragStop?: (e: any, node: Node) => void;
};

export default React.memo(function PlaygroundCanvas({
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
  onNodeDoubleClick,
  onNodeDrag,
  onNodeDragStop,
}: PlaygroundCanvasProps) {
  return (
    <div className="w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        deleteKeyCode='Delete'
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        snapToGrid={true}
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
        }}
        connectionLineType={ConnectionLineType.Bezier}
        fitView
      >
        <Background gap={16} size={1} />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
});
