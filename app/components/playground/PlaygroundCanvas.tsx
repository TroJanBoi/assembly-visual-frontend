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
  MarkerType,
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
  onNodeDragStart?: (e: any, node: Node) => void;
  onNodeDrag?: (e: any, node: Node) => void;
  onNodeDragStop?: (e: any, node: Node) => void;
  readOnly?: boolean;
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
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  readOnly = false,
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
        onNodeClick={onNodeClick} // NEW PROPS
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStart={onNodeDragStart}
        deleteKeyCode={readOnly ? null : 'Delete'}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        snapToGrid={true}
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#64748b',
          },
        }}
        connectionLineType={ConnectionLineType.Bezier}
      >
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            {/* Modern arrow marker for regular edges */}
            <marker
              id="arrow-default"
              markerWidth="20"
              markerHeight="20"
              refX="10"
              refY="10"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M 0 0 L 20 10 L 0 20 L 5 10 z"
                fill="#64748b"
                strokeWidth="0"
              />
            </marker>

            {/* Modern arrow marker for circuit loop edges */}
            <marker
              id="arrow-loop"
              markerWidth="20"
              markerHeight="20"
              refX="10"
              refY="10"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M 0 0 L 20 10 L 0 20 L 5 10 z"
                fill="#60a5fa"
                strokeWidth="0"
              />
            </marker>
          </defs>
        </svg>

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
