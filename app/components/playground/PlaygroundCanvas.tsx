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
import { useTheme } from "next-themes";

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
  const { resolvedTheme } = useTheme();

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900" onDrop={onDrop} onDragOver={onDragOver}>
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
        <Background
          gap={16}
          size={1}
          color={resolvedTheme === 'dark' ? '#475569' : '#94a3b8'}
        />
        <MiniMap
          pannable
          zoomable
          className="dark:bg-slate-800 dark:border-slate-700"
          maskColor={resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(240, 242, 243, 0.6)'}
        />
        <Controls className="dark:bg-slate-800 dark:border-slate-700 dark:fill-white dark:text-white [&>button]:dark:bg-slate-800 [&>button]:dark:border-slate-700 [&>button:hover]:dark:bg-slate-700" />
      </ReactFlow>
    </div>
  );
});
