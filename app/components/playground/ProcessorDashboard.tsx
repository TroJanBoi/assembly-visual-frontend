"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { HiSearch, HiViewGrid, HiViewList } from "react-icons/hi";
import { cn } from "@/lib/utils";

interface ProcessorDashboardProps {
  registers: { [key: string]: number };
  flags: { [key: string]: number };
  memory: { address: number; value: number }[];
}

const StateCell = ({ label, value }: { label: string; value: number }) => (
  <div className="flex-1 text-center">
    <div className="text-sm font-semibold text-gray-500 border-b pb-1">
      {label}
    </div>
    <div className="pt-1 font-mono text-lg">{value}</div>
  </div>
);

const MemoryListItem = ({
  address,
  value,
}: {
  address: number;
  value: number;
}) => {
  const percentage = (value / 255) * 100;
  const hexAddress = address.toString(16).toUpperCase().padStart(2, "0");

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="font-mono text-gray-500 w-12">0x{hexAddress}</span>
      <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden border">
        <div
          className="h-full bg-indigo-300 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="font-mono font-semibold w-8 text-right">{value}</span>
    </div>
  );
};

const AddressTooltip = ({
  address,
  value,
  x,
  y,
}: {
  address: number;
  value: number | undefined;
  x: number;
  y: number;
}) => {
  const hexAddress = `0x${address.toString(16).toUpperCase().padStart(2, "0")}`;
  const decValue = value ?? "N/A";
  const hexValue =
    value !== undefined
      ? `0x${value.toString(16).toUpperCase().padStart(2, "0")}`
      : "N/A";
  const binValue =
    value !== undefined ? value.toString(2).padStart(8, "0") : "N/A";

  return (
    <div
      className="absolute z-10 p-3 bg-gray-800 text-white rounded-lg shadow-lg text-xs font-mono w-48 pointer-events-none"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="font-bold text-base mb-2 border-b border-gray-600 pb-1">
        {hexAddress}
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-2">
        <span>DEC:</span> <span className="text-right">{decValue}</span>
        <span>HEX:</span> <span className="text-right">{hexValue}</span>
        <span>BIN:</span> <span className="text-right">{binValue}</span>
      </div>
    </div>
  );
};

export default function ProcessorDashboard({
  registers,
  flags,
  memory,
}: ProcessorDashboardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ----- NEW: เก็บพิกัดเมาส์แบบ relative ต่อ container -----
  const rootRef = useRef<HTMLDivElement>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    address: number;
    x: number; // px inside root
    y: number; // px inside root
  } | null>(null);

  const memoryMap = new Map(memory.map((item) => [item.address, item.value]));

  // helper: คำนวณพิกัด tooltip ให้ติดเมาส์และไม่หลุดขอบ
  const computeTooltipPos = (e: React.MouseEvent, pad = 12) => {
    const root = rootRef.current;
    if (!root) return { x: 0, y: 0 };

    const rootRect = root.getBoundingClientRect();
    // ตำแหน่งเมาส์ relative กับ root
    let x = e.clientX - rootRect.left + pad;
    let y = e.clientY - rootRect.top + pad;

    // ขนาด tooltip คร่าว ๆ: w-48 = 12rem = 192px; h ประเมิน ~140px
    const TIP_W = 192;
    const TIP_H = 140;

    // clamp ขอบขวา/ล่าง
    const maxX = rootRect.width - TIP_W - 8;
    const maxY = rootRect.height - TIP_H - 8;
    if (x > maxX) x = Math.max(8, maxX);
    if (y > maxY) y = Math.max(8, maxY);

    return { x, y };
  };

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    address: number,
  ) => {
    const { x, y } = computeTooltipPos(e);
    setHoveredInfo({ address, x, y });
  };
  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    address: number,
  ) => {
    // อัปเดตพิกัดขณะลากเมาส์บนช่องเดิม
    const { x, y } = computeTooltipPos(e);
    setHoveredInfo({ address, x, y });
  };
  const handleMouseLeave = () => setHoveredInfo(null);

  // Dynamic register names (R0..R{n-1})
  const regNames = Object.keys(registers).sort((a, b) => {
    const na = parseInt(a.replace(/\D+/g, "")) || 0;
    const nb = parseInt(b.replace(/\D+/g, "")) || 0;
    return na - nb;
  });
  const regCols = Math.min(4, Math.max(1, regNames.length));

  return (
    <div ref={rootRef} className="p-6 h-full overflow-y-auto bg-white relative">
      {hoveredInfo && (
        <AddressTooltip
          address={hoveredInfo.address}
          value={memoryMap.get(hoveredInfo.address)}
          x={hoveredInfo.x}
          y={hoveredInfo.y}
        />
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Processor Dashboard
      </h2>

      {/* Registers */}
      <section>
        <h3 className="text-base font-semibold text-gray-700 mb-2">
          Registers
        </h3>
        <div
          className="bg-gray-50 border border-gray-200 rounded-lg p-2 gap-2"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${regCols}, minmax(0, 1fr))`,
          }}
        >
          {regNames.length === 0 ? (
            <p className="text-sm text-gray-400 col-span-full">No registers</p>
          ) : (
            regNames.map((reg) => (
              <StateCell key={reg} label={reg} value={registers[reg] ?? 0} />
            ))
          )}
        </div>
      </section>

      {/* Flags */}
      <section className="mt-6">
        <h3 className="text-base font-semibold text-gray-700 mb-2">Flags</h3>
        <div className="flex flex-wrap gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
          {Object.keys(flags).length === 0 ? (
            <p className="text-sm text-gray-400">No flags</p>
          ) : (
            Object.keys(flags).map((f) => (
              <div key={f} className="flex-1 min-w-[60px]">
                <StateCell label={f} value={flags[f] ?? 0} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Memory */}
      <section className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold text-gray-700">Memory</h3>
          <div className="flex items-center gap-1 text-gray-400">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1 rounded-md",
                viewMode === "grid" && "bg-indigo-100 text-indigo-600",
              )}
              aria-label="Grid View"
            >
              <HiViewGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1 rounded-md",
                viewMode === "list" && "bg-indigo-100 text-indigo-600",
              )}
              aria-label="List View"
            >
              <HiViewList className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Input type="text" placeholder="Go to address..." className="pl-8" />
          <HiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {viewMode === "grid" && (
          <div className="mt-4 grid grid-cols-16 border-t border-l border-gray-300 rounded-lg overflow-hidden">
            {Array.from({ length: 256 }).map((_, i) => {
              const hasValue = memoryMap.has(i);
              return (
                <div
                  key={i}
                  onMouseEnter={(e) => handleMouseEnter(e, i)}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    "aspect-square text-[9px] flex items-center justify-center border-r border-b border-gray-200 cursor-pointer",
                    hasValue
                      ? "bg-indigo-200 font-bold text-indigo-800"
                      : "text-gray-400 hover:bg-gray-100",
                  )}
                >
                  {hasValue ? (memoryMap.get(i) as number) : i}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "list" && (
          <div className="mt-4 space-y-2">
            {memory.length > 0 ? (
              memory.map((mem) => (
                <MemoryListItem
                  key={mem.address}
                  address={mem.address}
                  value={mem.value}
                />
              ))
            ) : (
              <p className="text-center text-gray-400 pt-8">Memory is empty.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
