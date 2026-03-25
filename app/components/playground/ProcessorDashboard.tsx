import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { HiSearch, HiViewGrid, HiViewList, HiRefresh } from "react-icons/hi";
import { cn } from "@/lib/utils";
import VariableManager, { Variable } from "./VariableManager";

interface ProcessorDashboardProps {
  registers: { [key: string]: number };
  flags: { [key: string]: number };
  memory: { address: number; value: number }[];

  // Variable Manager Props
  variables?: Variable[];
  onAddVariable?: (name: string, value: number) => void;
  onEditVariable?: (id: string, name: string, value: number) => void;
  onDeleteVariable?: (id: string) => void;

  // Stack and Memory Access Visualization
  sp?: number; // Stack Pointer position
  recentlyAccessedAddresses?: Set<number>; // Addresses accessed recently for animation

  // Memory Reset
  onResetMemory?: () => void;
}

const StateCell = ({ label, value }: { label: string; value: number }) => (
  <div className="flex-1 text-center">
    <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1">
      {label}
    </div>
    <div className="pt-1 font-mono text-lg">{value}</div>
  </div>
);

const MemoryListItem = ({
  address,
  value,
  variableName,
  isHighlighted
}: {
  address: number;
  value: number;
  variableName?: string;
  isHighlighted?: boolean;
}) => {
  const isStack = address >= 224;
  const hexAddress = address.toString(16).toUpperCase().padStart(2, "0");
  const displayAddress = `${address} (0x${hexAddress})`;
  const percentage = (value / 255) * 100;

  return (
    <div
      className={cn(
        "flex items-center gap-4 text-sm transition-all duration-300",
        isHighlighted && "bg-yellow-100 p-1 rounded ring-2 ring-yellow-400"
      )}
      id={`mem-list-item-${address}`}
    >
      <span className={cn("font-mono w-24", isStack ? "text-orange-500 font-bold" : "text-gray-500 dark:text-gray-400")}>
        {displayAddress}
      </span>
      <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-800 rounded-md overflow-hidden border border-gray-200 dark:border-slate-700 relative group">
        <div
          className={cn(
            "h-full transition-all duration-300",
            variableName ? "bg-green-300" : (isStack ? "bg-orange-300" : "bg-indigo-300")
          )}
          style={{ width: `${percentage}%` }}
        />
        {variableName && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-800 opacity-60">
            {variableName}
          </span>
        )}
      </div>
      <span className="font-mono font-semibold w-8 text-right">{value}</span>
    </div>
  );
};

const AddressTooltip = ({
  address,
  value,
  variableName,
  x,
  y,
}: {
  address: number;
  value: number | undefined;
  variableName?: string;
  x: number;
  y: number;
}) => {
  const hexAddress = `0x${address.toString(16).toUpperCase().padStart(2, "0")}`;
  const decValue = value ?? 0; // Default to 0 for uninitialized cells
  const hexValue = `0x${decValue.toString(16).toUpperCase().padStart(2, "0")}`;
  const binValue = decValue.toString(2).padStart(8, "0");

  return (
    <div
      className="absolute z-10 p-3 bg-white text-gray-900 border border-gray-200 rounded-lg shadow-xl text-xs font-mono w-48 pointer-events-none"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="font-bold text-base mb-2 border-b border-gray-200 pb-1 flex justify-between">
        <span>{address} ({hexAddress})</span>
        {variableName && <span className="text-green-400 text-xs ml-2 self-center">{variableName}</span>}
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-2">
        <span>DEC:</span> <span className="text-right">{decValue}</span>
        <span>HEX:</span> <span className="text-right">{hexValue}</span>
        <span>BIN:</span> <span className="text-right">{binValue}</span>
      </div>
    </div>
  );
};

export default React.memo(function ProcessorDashboard({
  registers,
  flags,
  memory,
  variables = [],
  onAddVariable,
  onEditVariable,
  onDeleteVariable,
  sp,
  recentlyAccessedAddresses = new Set(),
  onResetMemory,
}: ProcessorDashboardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedAddress, setHighlightedAddress] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    address: number;
    variableName?: string;
    x: number; // px inside root
    y: number; // px inside root
  } | null>(null);

  const memoryMap = new Map(memory.map((item) => [item.address, item.value]));

  // Helper to get value from Memory Map OR Variable
  const getEffectiveValue = (address: number): number | undefined => {
    if (memoryMap.has(address)) return memoryMap.get(address);
    const v = variables.find(v => v.address === address);
    return v ? v.value : undefined;
  };

  // Auto-scroll logic for List View
  useEffect(() => {
    if (viewMode === 'list' && highlightedAddress !== null) {
      const el = document.getElementById(`mem-list-item-${highlightedAddress}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedAddress, viewMode]);

  // Search Handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val) {
      setHighlightedAddress(null);
      return;
    }

    let addr = -1;
    // Hex format: 0x...
    if (val.toLowerCase().startsWith('0x')) {
      addr = parseInt(val, 16);
    }
    // Decimal 0-255 or generic number
    else if (!isNaN(Number(val))) {
      addr = Number(val);
    }

    if (addr >= 0 && addr <= 255) {
      setHighlightedAddress(addr);
    } else {
      setHighlightedAddress(null);
    }
  };


  // helper: คำนวณพิกัด tooltip ให้ติดเมาส์และไม่หลุดขอบ
  // Modified to show TOP-RIGHT of cursor
  const computeTooltipPos = (e: React.MouseEvent, pad = 12) => {
    const root = rootRef.current;
    if (!root) return { x: 0, y: 0 };

    const rootRect = root.getBoundingClientRect();
    // ตำแหน่งเมาส์ relative กับ root
    const mouseX = e.clientX - rootRect.left;
    const mouseY = e.clientY - rootRect.top;

    // ขนาด tooltip คร่าว ๆ
    const TIP_W = 192;
    const TIP_H = 140;

    // Default: Top-Right of cursor
    // X: mouseX + pad
    // Y: mouseY - TIP_H - pad (Above)
    let x = mouseX + pad;
    let y = mouseY - TIP_H - pad;

    // Clamp X (Right edge)
    if (x + TIP_W > rootRect.width) {
      // Flip to Left if no space on Right
      x = mouseX - TIP_W - pad;
    }

    // Clamp Y (Top edge)
    if (y < 0) {
      // Flip to Bottom if no space on Top
      y = mouseY + pad;
    }

    // Ensure it doesn't go off left edge either
    if (x < 0) x = 8;

    return { x, y };
  };

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    address: number,
  ) => {
    const { x, y } = computeTooltipPos(e);
    const v = variables.find(v => v.address === address);
    setHoveredInfo({ address, variableName: v?.name, x, y });
  };
  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    address: number,
  ) => {
    // อัปเดตพิกัดขณะลากเมาส์บนช่องเดิม
    const { x, y } = computeTooltipPos(e);
    const v = variables.find(v => v.address === address);
    setHoveredInfo({ address, variableName: v?.name, x, y });
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
    <div ref={rootRef} className="w-full p-6 h-full overflow-y-auto bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 relative">
      {hoveredInfo && (
        <AddressTooltip
          address={hoveredInfo.address}
          value={getEffectiveValue(hoveredInfo.address)}
          variableName={hoveredInfo.variableName}
          x={hoveredInfo.x}
          y={hoveredInfo.y}
        />
      )}



      {/* Registers */}
      <section>
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Registers
        </h3>
        <div
          className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2 gap-2"
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
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Flags</h3>
        <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2">
          {Object.keys(flags).length === 0 ? (
            <p className="text-sm text-gray-400">No flags</p>
          ) : (
            Object.keys(flags).map((f) => (
              <div key={f} className="flex-1 w-full">
                <StateCell label={f} value={flags[f] ?? 0} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Variables Manager */}
      {onAddVariable && onEditVariable && onDeleteVariable && (
        <VariableManager
          variables={variables}
          onAdd={onAddVariable}
          onEdit={onEditVariable}
          onDelete={onDeleteVariable}
        />
      )}

      {/* Memory */}
      <section className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">Memory</h3>
          <div className="flex items-center gap-1 text-gray-400">
            {onResetMemory && (
              <button
                onClick={onResetMemory}
                className="p-1 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label="Reset Memory"
                title="Reset memory to initial values"
              >
                <HiRefresh className="w-5 h-5" />
              </button>
            )}
            <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-0.5" />
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
          <Input
            type="text"
            placeholder="Go to address (e.g., 10, 0x0A)"
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
          <HiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {viewMode === "grid" && (
          <div className="mt-4 grid grid-cols-16 border-t border-l border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden">
            {Array.from({ length: 256 }).map((_, i) => {
              const variable = variables.find(v => v.address === i);
              const val = getEffectiveValue(i);
              const hasValue = val !== undefined;
              const displayVal = val ?? i;

              const isStack = i >= 224;
              const isHighlighted = highlightedAddress === i;
              const isSP = sp !== undefined && i === sp;
              const isRecentlyAccessed = recentlyAccessedAddresses.has(i);

              return (
                <div
                  key={i}
                  onMouseEnter={(e) => handleMouseEnter(e, i)}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    "aspect-square text-[9px] flex items-center justify-center border-r border-b cursor-pointer transition-all relative",

                    // Stack region special border - ONLY if has value
                    isStack && hasValue && "border-orange-400 dark:border-orange-600",
                    !(isStack && hasValue) && "border-gray-200 dark:border-slate-700",

                    // Search Highlighting (Highest Priority)
                    isHighlighted && "bg-yellow-300 animate-pulse z-10 ring-2 ring-yellow-500",

                    // Memory Access Animation (High Priority)
                    !isHighlighted && isRecentlyAccessed && "animate-pulse ring-2 ring-blue-400 z-[5]",

                    // Stack Pointer Marker (Medium-High Priority)
                    !isHighlighted && isSP && "ring-2 ring-red-500 shadow-lg z-[4]",

                    // Normal State
                    !isHighlighted && !isRecentlyAccessed && (
                      // Priority: Variable > Value > Empty
                      variable
                        ? "bg-green-100 font-bold text-green-700 border-green-200" // Variable Reserved
                        : hasValue
                          ? isStack
                            ? "bg-amber-200 font-bold text-amber-900" // Stack Value
                            : "bg-indigo-200 font-bold text-indigo-800" // Heap/Code Value
                          : isStack
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" // Stack Empty (Gray Zone)
                            : "text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800" // Heap/Code Empty
                    )
                  )}
                  title={variable ? `Var: ${variable.name}` : isSP ? `SP (Stack Pointer)` : undefined}
                >
                  {/* SP Badge */}
                  {isSP && !isHighlighted && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white flex items-center justify-center text-[6px] text-white font-bold z-10">
                      SP
                    </div>
                  )}

                  {hasValue ? (
                    val
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "list" && (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 256 }, (_, i) => i).filter(i => getEffectiveValue(i) !== undefined || variables.some(v => v.address === i)).length > 0 ? (
              // Combine memoryMap keys and variables to show all relevant cells
              Array.from(new Set([...Array.from(memoryMap.keys()), ...variables.map(v => v.address)]))
                .sort((a, b) => a - b)
                .map((addr) => (
                  <MemoryListItem
                    key={addr}
                    address={addr}
                    value={getEffectiveValue(addr) ?? 0}
                    variableName={variables.find(v => v.address === addr)?.name}
                    isHighlighted={highlightedAddress === addr}
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
});

