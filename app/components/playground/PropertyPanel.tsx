// app/components/playground/PropertyPanel.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  instructionCategories,
  type InstructionDef,
} from "@/lib/playground/instructionDefs";
import { VIRTUAL_PORTS, VirtualPort } from "@/lib/playground/ports";

type AddressMode = "imm" | "reg";
type SrcMode = "imm" | "reg";

export type PanelProps = {
  open: boolean;
  onClose: () => void;
  node: { id: string; type: string; data: any } | null;
  onChange: (nodeId: string, patch: Record<string, any>) => void;
  registers: string[]; // ["R0","R1",...]
  labels: string[]; // ["LOOP","END",...]
};

const defs = instructionCategories.flatMap((c) => c.instructions);
const findDef = (name?: string): InstructionDef | undefined =>
  defs.find((d) => d.name.toUpperCase() === String(name || "").toUpperCase());

export default React.memo(function PropertyPanel({
  open,
  onClose,
  node,
  onChange,
  registers,
  labels,
}: PanelProps) {
  const [data, setData] = useState(node?.data || {});
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setData(node?.data || {});
  }, [node?.id]);

  // Close on ESC for convenience
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const def = useMemo(
    () => findDef(data?.instructionType),
    [data?.instructionType],
  );
  if (!open || !node || !def) return null;

  const patch = (p: Record<string, any>) => {
    const newData = { ...data, ...p };
    setData(newData);
    onChange(node.id, p);
  };

  // Shared UI widgets ---------------------------------------------------------
  const L = ({ children }: { children: React.ReactNode }) => (
    <div className="font-semibold mb-1">{children}</div>
  );

  const SelectRegister = ({
    value,
    onChange,
    disabledOption,
  }: {
    value?: string;
    onChange: (v: string) => void;
    disabledOption?: string;
  }) => (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 rounded-md border px-2 bg-white"
    >
      <option value="" disabled>
        Select Register
      </option>
      {registers.map((r) => (
        <option key={r} value={r} disabled={disabledOption === r}>
          {r}
          {disabledOption === r ? " (in use)" : ""}
        </option>
      ))}
    </select>
  );

  const InputByte = ({
    value,
    onChange,
    placeholder = "0–255",
  }: {
    value?: number;
    onChange: (v: number | undefined) => void; // commit only on blur/Enter
    placeholder?: string;
  }) => {
    const [text, setText] = useState(value?.toString() ?? "");
    const [error, setError] = useState<string | null>(null);

    // sync from parent when it changes externally (e.g., switching nodes)
    useEffect(() => {
      const next = value == null ? "" : String(value);
      setText(next);
      setError(null);
    }, [value]);

    const validate = (t: string) => {
      if (t === "") return { ok: true, num: undefined as number | undefined };
      if (!/^\d{1,3}$/.test(t)) return { ok: false, num: undefined };
      const n = Number(t);
      if (n < 0 || n > 255) return { ok: false, num: n };
      return { ok: true, num: n };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = e.target.value;

      // อนุญาตเว้นว่าง/พิมพ์ทีละหลักได้โดยไม่ commit
      if (t === "" || /^\d{0,3}$/.test(t)) {
        setText(t);
        const { ok } = validate(t);
        setError(ok ? null : "Enter a value between 0 and 255.");
      }
      // ถ้าเป็นตัวอักษรอื่นนอกเหนือจากตัวเลข จะไม่อัปเดต (กันกระพริบ)
    };

    const commit = () => {
      const { ok, num } = validate(text);
      if (ok) {
        setError(null);
        onChange(num); // commit ครั้งเดียวที่นี่
      } else {
        // revert กลับค่าล่าสุดจาก parent เพื่อความชัดเจน
        const lastValid = value == null ? "" : String(value);
        setText(lastValid);
        setError(null);
        // ไม่ส่ง onChange ในกรณี revert
      }
    };

    const handleBlur = () => commit();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
        // พยายามคงโฟกัสไว้เพื่อพิมพ์ต่อ/แท็บต่อ
        (e.currentTarget as HTMLInputElement).select?.();
      }
    };

    return (
      <div className="space-y-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={text}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={!!error}
          className={cn(
            "w-full h-10 rounded-md border px-2 bg-white",
            error ? "border-red-500 focus:outline-red-500" : "",
          )}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  };

  const Toggle = ({
    left,
    right,
    active,
    onLeft,
    onRight,
  }: {
    left: string;
    right: string;
    active: "left" | "right";
    onLeft: () => void;
    onRight: () => void;
  }) => (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onLeft}
        className={cn(
          "px-3 h-8 rounded-full border text-xs",
          active === "left"
            ? "bg-violet-600 text-white border-violet-600"
            : "bg-white",
        )}
      >
        {left}
      </button>
      <button
        type="button"
        onClick={onRight}
        className={cn(
          "px-3 h-8 rounded-full border text-xs",
          active === "right"
            ? "bg-violet-600 text-white border-violet-600"
            : "bg-white",
        )}
      >
        {right}
      </button>
    </div>
  );

  // Helpers to prevent choosing same register for dest/src
  const setDest = (v: string) => {
    const patchObj: any = { dest: v };
    if ((data.srcMode ?? "imm") === "reg" && data.srcReg === v)
      patchObj.srcReg = "";
    if ((data.memMode ?? "imm") === "reg" && data.memReg === v)
      patchObj.memReg = "";
    patch(patchObj);
  };
  const setSrcReg = (v: string) => {
    if (v === data.dest) return; // block same register
    patch({ srcReg: v });
  };
  const setMemReg = (v: string) => {
    if (v === data.dest) return; // avoid [dest] when dest is same reg
    patch({ memReg: v });
  };



  const SelectPort = ({
    value,
    onChange,
    type,
  }: {
    value?: number;
    onChange: (v: number) => void;
    type: "INPUT" | "OUTPUT";
  }) => (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") return;
        onChange(Number(val));
      }}
      className="w-full h-10 rounded-md border px-2 bg-white"
    >
      <option value="" disabled>
        Select Port
      </option>
      {VIRTUAL_PORTS.filter((p) => p.type === type || p.type === "INOUT").map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
      <option disabled>──────────</option>
      <option value="-1">Custom (Type in...)</option>
    </select>
  );

  // Pattern routing -----------------------------------------------------------
  const NAME = def.name;
  const isZero = def.layout === "zero" && NAME !== "LABEL";
  const isLabelDef = NAME === "LABEL";
  const isJump = def.layout === "label" && NAME !== "LABEL";
  const isLoad = NAME === "LOAD";
  const isStore = NAME === "STORE";
  const isCmp = NAME === "CMP";
  const isUnary = ["INC", "DEC", "NOT", "SHL", "SHR", "PUSH", "POP"].includes(NAME);
  const hasSrcValueOrReg = ["MOV", "ADD", "SUB", "MUL", "DIV", "AND", "OR", "XOR"].includes(NAME); // DST <- (Value|Reg)
  const isIn = NAME === "IN";   // REG <- PORT
  const isOut = NAME === "OUT"; // PORT <- (Value|Reg)

  // CMP policy — allow immediate constants for SRC (common in ISAs)
  const allowCmpImm = true;

  // Source modes
  const srcMode: SrcMode =
    data.srcMode ?? (isCmp && allowCmpImm ? "reg" : "imm");
  const memMode: AddressMode = data.memMode ?? "imm";

  // Render -----------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 ">
      <div
        ref={panelRef}
        className="w-[320px] relative top-48 rounded-2xl bg-white shadow-xl p-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Properties</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div className="text-xl font-extrabold">{NAME}</div>
          <div className="text-gray-500">Instruction Description</div>
        </div>

        {/* 6) Zero-operand */}
        {isZero && (
          <div className="text-gray-600">
            This instruction does not require any input.
          </div>
        )}

        {/* 5) LABEL naming */}
        {isLabelDef && (
          <div className="space-y-1">
            <L>Label Name</L>
            <input
              className="w-full h-10 rounded-md border px-2 bg-white"
              placeholder="Label name..."
              value={data.label ?? ""}
              onChange={(e) => patch({ label: e.target.value })}
            />
          </div>
        )}

        {/* 4) Jumps */}
        {isJump && (
          <div className="space-y-1">
            <L>Jump to Label</L>
            <select
              className="w-full h-10 rounded-md border px-2 bg-white"
              value={data.label ?? ""}
              onChange={(e) => patch({ label: e.target.value })}
            >
              <option value="" disabled>
                Select Label
              </option>
              {labels.map((lb) => (
                <option key={lb} value={lb}>
                  {lb}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* LOAD: REG <- [ADDR] */}
        {isLoad && (
          <div className="space-y-4">
            <div>
              <L>Destination</L>
              <SelectRegister value={data.dest} onChange={setDest} />
            </div>

            <div>
              <L>Memory Address</L>
              <Toggle
                left="[Value]"
                right="[Register]"
                active={memMode === "imm" ? "left" : "right"}
                onLeft={() => patch({ memMode: "imm", memReg: "" })}
                onRight={() => patch({ memMode: "reg", memImm: undefined })}
              />
              <div className="mt-2">
                {memMode === "imm" ? (
                  <InputByte
                    value={data.memImm}
                    onChange={(v) => patch({ memImm: v })}
                  />
                ) : (
                  <SelectRegister
                    value={data.memReg}
                    onChange={setMemReg}
                    disabledOption={data.dest}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* STORE: [ADDR] <- REG */}
        {isStore && (
          <div className="space-y-4">
            <div>
              <L>Source</L>
              <SelectRegister
                value={data.srcReg}
                onChange={setSrcReg}
                disabledOption={data.dest}
              />
            </div>

            <div>
              <L>Destination Address</L>
              <Toggle
                left="[Value]"
                right="[Register]"
                active={memMode === "imm" ? "left" : "right"}
                onLeft={() => patch({ memMode: "imm", memReg: "" })}
                onRight={() => patch({ memMode: "reg", memImm: undefined })}
              />
              <div className="mt-2">
                {memMode === "imm" ? (
                  <InputByte
                    value={data.memImm}
                    onChange={(v) => patch({ memImm: v })}
                  />
                ) : (
                  <SelectRegister
                    value={data.memReg}
                    onChange={setMemReg}
                    disabledOption={data.srcReg}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* IN: REG <- PORT */}
        {isIn && (
          <div className="space-y-4">
            <div>
              <L>Destination Register</L>
              <SelectRegister value={data.dest} onChange={setDest} />
            </div>
            <div>
              <L>Port Number</L>
              <SelectPort
                value={data.srcImm}
                onChange={(v) => patch({ srcImm: v })}
                type="INPUT"
              />
              {data.srcImm === -1 && (
                <div className="mt-2">
                  <InputByte
                    value={undefined}
                    onChange={(v) => patch({ srcImm: v })}
                    placeholder="Port (0-255)"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* OUT: PORT <- (Value|Reg) */}
        {isOut && (
          <div className="space-y-4">
            <div>
              <L>Port Number</L>
              <SelectPort
                value={data.memImm}
                onChange={(v) => patch({ memImm: v })}
                type="OUTPUT"
              />
              {data.memImm === -1 && (
                <div className="mt-2">
                  <InputByte
                    value={undefined}
                    onChange={(v) => patch({ memImm: v })}
                    placeholder="Port (0-255)"
                  />
                </div>
              )}
            </div>
            <div>
              <L>Value to Send</L>
              <Toggle
                left="Value"
                right="Register"
                active={srcMode === "imm" ? "left" : "right"}
                onLeft={() => patch({ srcMode: "imm", srcReg: "" })}
                onRight={() => patch({ srcMode: "reg", srcImm: undefined })}
              />
              <div className="mt-2">
                {srcMode === "imm" ? (
                  <InputByte
                    value={data.srcImm}
                    onChange={(v) => patch({ srcImm: v })}
                  />
                ) : (
                  <SelectRegister
                    value={data.srcReg}
                    onChange={setSrcReg}
                    disabledOption=""
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* CMP: REG , (REG | IMM) */}
        {isCmp && (
          <div className="space-y-4">
            <div>
              <L>Destination</L>
              <SelectRegister value={data.dest} onChange={setDest} />
            </div>

            <div>
              <L>Source</L>
              <Toggle
                left="Value"
                right="Register"
                active={srcMode === "imm" ? "left" : "right"}
                onLeft={() => patch({ srcMode: "imm", srcReg: "" })}
                onRight={() => patch({ srcMode: "reg", srcImm: undefined })}
              />
              <div className="mt-2">
                {srcMode === "imm" ? (
                  <InputByte
                    value={data.srcImm}
                    onChange={(v) => patch({ srcImm: v })}
                  />
                ) : (
                  <SelectRegister
                    value={data.srcReg}
                    onChange={setSrcReg}
                    disabledOption={data.dest}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Unary (INC/DEC/NOT/PUSH/POP): REG */}
        {isUnary && (
          <div className="space-y-1">
            <L>Target</L>
            <SelectRegister value={data.dest} onChange={setDest} />
          </div>
        )}

        {/* MOV/ADD/SUB/MUL/DIV/AND/OR/XOR: REG <- (Value|Reg) */}
        {hasSrcValueOrReg && (
          <div className="space-y-4">
            <div>
              <L>Destination</L>
              <SelectRegister value={data.dest} onChange={setDest} />
            </div>

            <div>
              <L>Source</L>
              <Toggle
                left="Value"
                right="Register"
                active={srcMode === "imm" ? "left" : "right"}
                onLeft={() => patch({ srcMode: "imm", srcReg: "" })}
                onRight={() => patch({ srcMode: "reg", srcImm: undefined })}
              />
              <div className="mt-2">
                {srcMode === "imm" ? (
                  <InputByte
                    value={data.srcImm}
                    onChange={(v) => patch({ srcImm: v })}
                  />
                ) : (
                  <SelectRegister
                    value={data.srcReg}
                    onChange={setSrcReg}
                    disabledOption={data.dest}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
