"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HiPlus, HiTrash } from "react-icons/hi";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import ModernDropdown from "@/components/ui/ModernDropdown";

import {
  AssignmentFormData,
  TestCase,
  TestCondition,
} from "@/types/assignment";

interface TestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  suiteId: string;
  testCase: TestCase;
  setFormData: React.Dispatch<React.SetStateAction<AssignmentFormData>>;
  registerCount: number;
}

export default function TestCaseModal({
  isOpen,
  onClose,
  suiteId,
  testCase,
  setFormData,
  registerCount,
}: TestCaseModalProps) {
  const [localTestCase, setLocalTestCase] = useState<TestCase>(() =>
    JSON.parse(JSON.stringify(testCase)),
  );

  useEffect(() => {
    if (isOpen) {
      setLocalTestCase(JSON.parse(JSON.stringify(testCase)));
    }
  }, [isOpen, testCase]);

  const availableRegisterOptions = Array.from(
    { length: Math.max(0, registerCount) },
    (_, i) => `R${i}`,
  );

  const flagOptions = ["Z", "C", "N", "V"];

  const sanitizeNumber = (raw: string) => {
    let v = String(raw).replace(/\\D+/g, "");
    if (v === "") return "";

    v = v.replace(/^0+(?=\\d)/, "");
    if (v.length > 3) v = v.slice(0, 3);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 255) return "255";
    return v;
  };

  const addCondition = (target: "initialState" | "expectedState") => {
    const newCond: TestCondition = {
      id: `cond-${Date.now()}`,
      type: "Register",
      location: "",
      value: "0",
    };
    setLocalTestCase((prev) => ({
      ...prev,
      [target]: [...prev[target], newCond],
    }));
  };

  const updateCondition = (
    target: "initialState" | "expectedState",
    condId: string,
    field: keyof TestCondition,
    value: string,
  ) => {
    setLocalTestCase((prev) => ({
      ...prev,
      [target]: prev[target].map((c) => {
        if (c.id !== condId) return c;

        const updated: TestCondition = { ...c } as TestCondition;

        if (field === "type") {
          updated.type = value as TestCondition["type"];
          updated.location = "";
          updated.value = "0";
          return updated;
        }

        if (field === "location") {
          if (updated.type === "Memory") {
            updated.location = sanitizeNumber(value);
            return updated;
          }
          if (updated.type === "Register") {
            updated.location = availableRegisterOptions.includes(value)
              ? value
              : "";
            return updated;
          }
          if (updated.type === "Flag") {
            updated.location = value;
            return updated;
          }
        }

        if (field === "value") {
          if (updated.type === "Flag") {
            updated.value = value === "1" ? "1" : "0";
            return updated;
          } else {
            updated.value = sanitizeNumber(value);
            return updated;
          }
        }

        return updated;
      }),
    }));
  };

  const removeCondition = (
    target: "initialState" | "expectedState",
    condId: string,
  ) => {
    setLocalTestCase((prev) => ({
      ...prev,
      [target]: prev[target].filter((c) => c.id !== condId),
    }));
  };

  const handleSave = () => {
    const final = JSON.parse(JSON.stringify(localTestCase));

    const normalizeCond = (cond: TestCondition) => ({
      ...cond,
      location:
        cond.type === "Memory"
          ? String(parseInt(cond.location as string, 10))
          : cond.location,
      value: String(parseInt(String(cond.value), 10)),
    });

    final.initialState = final.initialState.map(normalizeCond);
    final.expectedState = final.expectedState.map(normalizeCond);

    setFormData((prev) => ({
      ...prev,
      testSuites: (prev.testSuites || []).map((s) =>
        s.id === suiteId
          ? {
            ...s,
            testCases: s.testCases.map((tc) =>
              tc.id === final.id ? final : tc,
            ),
          }
          : s,
      ),
    }));

    onClose();
  };

  const handleReset = () => {
    setLocalTestCase(JSON.parse(JSON.stringify(testCase)));
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Edit Test Case: ${localTestCase.name}`}
    >
      <div className="space-y-6">
        {/* name and type toggle */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test case name
            </label>
            <Input
              value={localTestCase.name}
              onChange={(e) =>
                setLocalTestCase((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <button
              type="button"
              onClick={() => setLocalTestCase(p => ({ ...p, hidden: !p.hidden }))}
              className={`w-full h-10 px-3 py-2 rounded-md text-sm font-semibold transition-all ${localTestCase.hidden
                ? 'bg-amber-100 text-amber-700 border-2 border-amber-300 hover:bg-amber-200'
                : 'bg-blue-100 text-blue-700 border-2 border-blue-300 hover:bg-blue-200'
                }`}
            >
              {localTestCase.hidden ? '🔒 Graded' : '👁 Visible'}
            </button>
          </div>
        </div>

        {/* initial */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Initial State</h3>
            <button
              onClick={() => addCondition("initialState")}
              className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-indigo-600 border border-dashed border-gray-300 hover:border-indigo-300 rounded-md transition-colors bg-white"
            >
              <HiPlus className="w-3.5 h-3.5" /> Add Value
            </button>
          </div>

          {/* Table Header */}
          {localTestCase.initialState.length > 0 && (
            <div className="grid grid-cols-12 gap-3 mb-2 text-xs font-semibold text-gray-500 px-2">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-3">Target / Address</div>
              <div className="col-span-4">Value</div>
            </div>
          )}

          <div className="space-y-1">
            {localTestCase.initialState.map((cond, idx) => (
              <ConditionRow
                key={cond.id}
                index={idx + 1}
                condition={cond}
                onChange={(f, v) => updateCondition("initialState", cond.id, f, v)}
                onRemove={() => removeCondition("initialState", cond.id)}
                availableRegisters={availableRegisterOptions}
                flagOptions={flagOptions}
              />
            ))}
          </div>

          {localTestCase.initialState.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
              No initial conditions set
            </div>
          )}
        </div>

        {/* expected */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Expected Final State</h3>
            <button
              onClick={() => addCondition("expectedState")}
              className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-indigo-600 border border-dashed border-gray-300 hover:border-indigo-300 rounded-md transition-colors bg-white"
            >
              <HiPlus className="w-3.5 h-3.5" /> Add Expectation
            </button>
          </div>

          {/* Table Header */}
          {localTestCase.expectedState.length > 0 && (
            <div className="grid grid-cols-12 gap-3 mb-2 text-xs font-semibold text-gray-500 px-2">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-3">Target / Address</div>
              <div className="col-span-4">Value</div>
            </div>
          )}

          <div className="space-y-1">
            {localTestCase.expectedState.map((cond, idx) => (
              <ConditionRow
                key={cond.id}
                index={idx + 1}
                condition={cond}
                onChange={(f, v) => updateCondition("expectedState", cond.id, f, v)}
                onRemove={() => removeCondition("expectedState", cond.id)}
                availableRegisters={availableRegisterOptions}
                flagOptions={flagOptions}
              />
            ))}
          </div>

          {localTestCase.expectedState.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
              No expectations set
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ConditionRow({
  index,
  condition,
  onChange,
  onRemove,
  availableRegisters,
  flagOptions,
}: {
  index: number;
  condition: TestCondition;
  onChange: (field: keyof TestCondition, value: string) => void;
  onRemove: () => void;
  availableRegisters: string[];
  flagOptions: string[];
}) {
  const OUT_PORTS = [
    { label: '0: Console (ASCII)', value: '0' },
    { label: '1: Console (Num)', value: '1' },
    { label: '2: 7-Segment', value: '2' },
    { label: '3: LED Select', value: '3' },
    { label: '4: LED Data', value: '4' },
  ];

  const IN_PORTS = [
    { label: '0: Keyboard', value: '0' },
    { label: '4: Gamepad', value: '4' },
    { label: '5: RNG', value: '5' },
  ];

  const renderLocationInput = () => {
    switch (condition.type) {
      case "Register":
        return (
          <ModernDropdown
            value={condition.location}
            onChange={(v) => onChange("location", String(v))}
            options={availableRegisters.map(r => ({ label: r, value: r }))}
            placeholder="Register"
          />
        );
      case "Flag":
        return (
          <ModernDropdown
            value={condition.location}
            onChange={(v) => onChange("location", String(v))}
            options={flagOptions.map(f => ({ label: f, value: f }))}
            placeholder="Flag"
          />
        );
      case "Output":
        return (
          <ModernDropdown
            value={condition.location}
            onChange={(v) => onChange("location", String(v))}
            options={OUT_PORTS}
            placeholder="Port"
          />
        );
      case "Input":
        return (
          <ModernDropdown
            value={condition.location}
            onChange={(v) => onChange("location", String(v))}
            options={IN_PORTS}
            placeholder="Port"
          />
        );
      case "Memory":
      default:
        return (
          <input
            type="number"
            min="0"
            max="255"
            value={condition.location}
            onChange={(e) => onChange("location", e.target.value)}
            placeholder="Address"
            className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        );
    }
  };

  const renderValueInput = () => {
    if (condition.type === "Flag") {
      return (
        <ModernDropdown
          value={condition.value}
          onChange={(v) => onChange("value", String(v))}
          options={[
            { label: "0", value: "0" },
            { label: "1", value: "1" },
          ]}
          placeholder="Value"
        />
      );
    }

    return (
      <input
        type="text"
        value={condition.value}
        onChange={(e) => onChange("value", e.target.value)}
        placeholder="Value"
        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
      />
    );
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-center p-2 rounded-lg hover:bg-gray-50 group border border-transparent hover:border-gray-200 transition-colors">
      {/* Index */}
      <div className="col-span-1 text-xs text-gray-400 font-mono text-center">
        {index}
      </div>

      {/* Type Selector */}
      <div className="col-span-3">
        <ModernDropdown
          value={condition.type}
          onChange={(v) => onChange("type", v as any)}
          options={[
            { label: "Register", value: "Register" },
            { label: "Memory", value: "Memory" },
            { label: "Flag", value: "Flag" },
            { label: "Output", value: "Output" },
            { label: "Input", value: "Input" },
          ]}
          placeholder="Type"
        />
      </div>

      {/* Location / Address */}
      <div className="col-span-3">
        {renderLocationInput()}
      </div>

      {/* Value Input */}
      <div className="col-span-4">
        {renderValueInput()}
      </div>

      {/* Actions */}
      <div className="col-span-1 flex justify-center">
        <button
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
          title="Remove Condition"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
