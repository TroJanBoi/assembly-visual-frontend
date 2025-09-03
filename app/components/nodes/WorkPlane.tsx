// WorkPlane.tsx (แก้/วางทับไฟล์เดิม)
"use client";

import React, { useCallback, useRef } from "react";
import NodeToolbox from "@components/nodes/NodeToolbox";
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
import CustomNode from "@components/nodes/CustomNode";

import {
  Circle,
  CircleStop,
  ArrowRightLeft,
  Download,
  Upload,
  Plus,
  Minus,
  X,
  Divide,
  Equal,
  CircleDot,
  CircleDashed,
  ArrowUpRight,
} from "lucide-react";

// map name -> component (ต้องรวมทุกไอคอนที่ส่งมาจาก NodeToolbox.iconName)
const ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Circle,
  CircleStop,
  ArrowRightLeft,
  Download,
  Upload,
  Plus,
  Minus,
  X,
  Divide,
  Equal,
  CircleDot,
  CircleDashed,
  ArrowUpRight,
};

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

  // onConnect: สร้าง edge และใส่ style จาก source node (ถ้ามี) หรือ fallback
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      setEdges((eds: Edge[]) =>
        addEdge(
          {
            ...params,
            // ถ้า source มี strokeColor ใน data ให้ใช้ค่านั้น
            style: {
              stroke:
                nodes.find((n) => n.id === (params as Connection).source)
                  ?.data?.strokeColor || "#60A5FA",
              strokeWidth: 2,
            },
          } as any,
          eds
        )
      );
    },
    [setEdges, nodes]
  );

  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const rfInstance = useRef<any>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // onDrop: parse payload (จาก NodeToolbox) → map iconName -> Icon component
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

      // map iconName -> actual icon component (fallback to Circle)
      const IconComponent =
        (nodeDef.iconName && ICONS[nodeDef.iconName]) || Circle;

      const newNode: Node = {
        id,
        type: "custom",
        position,
        data: {
          label: nodeDef.label,
          icon: IconComponent,
          textColor: nodeDef.textColor,
          borderColor: nodeDef.borderColor,
          bgColor: nodeDef.bgColor,
          iconBgColor: nodeDef.iconBgColor,
          // new fields:
          hasValueCount: nodeDef.hasValueCount ?? 1,
          value: nodeDef.value ?? "",
          strokeColor: nodeDef.strokeColor ?? "#60A5FA",
        },
      };

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
          nodeTypes={{ custom: CustomNode }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          onInit={(rfi) => (rfInstance.current = rfi)}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <Background />
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
