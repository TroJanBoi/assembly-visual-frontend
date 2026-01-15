"use client";

import React, { useEffect } from 'react';
import ReactFlow, {
  Background,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import InstructionNode from '@/components/playground/InstructionNode';

const nodeTypes = {
  instruction: InstructionNode,
};

// Data structure matching InstructionNode expectations
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'instruction',
    position: { x: 100, y: 50 },
    data: { instructionType: 'START' },
  },
  {
    id: '2',
    type: 'instruction',
    position: { x: 100, y: 150 }, // Spacing
    data: { instructionType: 'MOV', dest: 'R0', srcMode: 'imm', srcImm: 5 },
  },
  {
    id: '3',
    type: 'instruction',
    position: { x: 100, y: 250 },
    data: { instructionType: 'ADD', dest: 'R1', srcMode: 'imm', srcImm: 10 },
  },
  {
    id: '4',
    type: 'instruction',
    position: { x: 100, y: 350 },
    data: { instructionType: 'HLT' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
];

export default function AuthDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Subtle breathing animation for nodes
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          position: {
            x: node.position.x + (Math.random() - 0.5) * 1.5,
            y: node.position.y + (Math.random() - 0.5) * 1.5,
          },
        }))
      );
    }, 2500);
    return () => clearInterval(interval);
  }, [setNodes]);

  return (
    <div className="w-full h-full min-h-screen bg-slate-50 backdrop-blur-sm overflow-hidden relative group">
      {/* Decorative Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        proOptions={{ hideAttribution: true }}
        panOnScroll={false}
        zoomOnScroll={false}
        minZoom={0.6}
        maxZoom={1.5}
        preventScrolling={true}
      >
        <Background color="#94a3b8" gap={25} size={1} className="opacity-20" />
      </ReactFlow>

      {/* Overlay Text */}
      <div className="absolute bottom-8 left-8 right-8 z-10 pointer-events-none">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 p-4 rounded-xl shadow-2xl inline-block">
             <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-200 tracking-wider">LIVE PREVIEW</span>
            </div>
            <p className="text-sm text-slate-300 font-medium">
                Visual Assembly Programming. <br/><span className="text-slate-400 text-xs">No more black box execution.</span>
            </p>
        </div>
      </div>
    </div>
  );
}
