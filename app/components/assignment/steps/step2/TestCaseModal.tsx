"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { HiPlus, HiTrash } from "react-icons/hi";
import { Modal } from "@/components/ui/Modal";

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
    let v = String(raw).replace(/\D+/g, "");
    if (v === "") return "";

    v = v.replace(/^0+(?=\d)/, "");
    if (v.length > 3) v = v.slice(0, 3);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 255) return "255";
    return v;
  };

  const { usedRegisters, usedMemory } = useMemo(() => {
    const r = new Set<string>();
    const m = new Set<string>();
    [...localTestCase.initialState, ...localTestCase.expectedState].forEach(
      (c) => {
        if (c.type === "Register" && String(c.location).trim() !== "") {
          r.add(String(c.location));
        }
        if (c.type === "Memory" && String(c.location).trim() !== "") {
          const addr = String(parseInt(String(c.location), 10));
          if (!isNaN(parseInt(addr, 10))) m.add(addr);
        }
      },
    );
    return { usedRegisters: r, usedMemory: m };
  }, [localTestCase]);

  const validateCondition = (cond: TestCondition) => {
    if (cond.type === "Register") {
      if (String(cond.location).trim() === "") {
        return "Select a register.";
      }
      if (!availableRegisterOptions.includes(cond.location)) {
        return `Invalid register "${cond.location}".`;
      }
      const otherUses = [
        ...localTestCase.initialState,
        ...localTestCase.expectedState,
      ].filter(
        (c) =>
          c.id !== cond.id &&
          c.type === "Register" &&
          c.location === cond.location,
      );
      if (otherUses.length > 0)
        return `Register ${cond.location} already used.`;
    } else if (cond.type === "Flag") {
      if (String(cond.location).trim() === "") {
        return "Select a flag.";
      }
      if (!flagOptions.includes(cond.location)) {
        return `Invalid flag "${cond.location}".`;
      }
    } else if (cond.type === "Memory") {
      if (String(cond.location).trim() === "") {
        return "Enter a memory address (0–255).";
      }
      const addr = parseInt(cond.location, 10);
      if (isNaN(addr) || addr < 0 || addr > 255) {
        return "Memory address must be an integer 0–255.";
      }
      const otherUses = [
        ...localTestCase.initialState,
        ...localTestCase.expectedState,
      ].filter(
        (c) =>
          c.id !== cond.id &&
          c.type === "Memory" &&
          String(parseInt(c.location as string, 10)) === String(addr),
      );
      if (otherUses.length > 0) return `Memory address ${addr} already used.`;
    }

    const valStr = String(cond.value).trim();
    if (valStr === "" || cond.value === null || cond.value === undefined) {
      return `Value is required (${cond.type === "Flag" ? "0 or 1" : "0–255"}).`;
    }
    const v = parseInt(valStr, 10);
    if (cond.type === "Flag") {
      if (isNaN(v) || (v !== 0 && v !== 1)) {
        return "Flag value must be 0 or 1.";
      }
    } else {
      if (isNaN(v) || v < 0 || v > 255) {
        return "Value must be an integer 0–255.";
      }
    }
    return null;
  };

  const errors = useMemo(() => {
    const map: Record<string, string | null> = {};
    [...localTestCase.initialState, ...localTestCase.expectedState].forEach(
      (cond) => {
        map[cond.id] = validateCondition(cond);
      },
    );
    return map;
  }, [localTestCase, availableRegisterOptions.join(",")]);

  const hasErrors = useMemo(
    () =>
      Object.values(errors).some((err) => err !== null && err !== undefined),
    [errors],
  );

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
    const invalids = Object.entries(errors).filter(([_, err]) => err);
    if (invalids.length > 0) {
      alert(`Cannot save: ${invalids[0][1]}`);
      return;
    }

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

  const selectStyleBase =
    "h-10 rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-white";
  const inputErrorClass = "border-red-400 ring-red-200";

  const ErrorIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 9v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 17h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Edit Test Case: ${localTestCase.name}`}
    >
      <div className="space-y-6">
        {/* name */}
        <div>
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

        {/* initial */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Initial State</h3>
          <div className="space-y-2">
            {localTestCase.initialState.map((cond, idx) => {
              const err = errors[cond.id];

              const regOptions = availableRegisterOptions.filter(
                (r) => !usedRegisters.has(r) || r === cond.location,
              );

              const datalistId = `mem-${localTestCase.id}-init-${cond.id}`;

              return (
                <div key={cond.id} className="flex items-center gap-2 relative">
                  <span className="text-sm text-gray-500 w-6 text-right">
                    {idx + 1}
                  </span>

                  {/* TYPE select */}
                  <select
                    className={`${selectStyleBase} ${err ? inputErrorClass : ""}`}
                    value={cond.type}
                    onChange={(e) =>
                      updateCondition(
                        "initialState",
                        cond.id,
                        "type",
                        e.target.value as TestCondition["type"],
                      )
                    }
                  >
                    <option value="Register">Register</option>
                    <option value="Memory">Memory</option>
                    <option value="Flag">Flag</option>
                  </select>

                  {/* LOCATION control (depends on type) */}
                  {cond.type === "Register" && (
                    <select
                      className={`${selectStyleBase} ${err ? inputErrorClass : ""}`}
                      value={cond.location}
                      onChange={(e) =>
                        updateCondition(
                          "initialState",
                          cond.id,
                          "location",
                          e.target.value,
                        )
                      }
                    >
                      <option value="" disabled>
                        Select register...
                      </option>
                      {regOptions.length === 0 ? (
                        <option value="" disabled>
                          (no registers available)
                        </option>
                      ) : (
                        regOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))
                      )}
                    </select>
                  )}

                  {cond.type === "Flag" && (
                    <select
                      className={`${selectStyleBase} ${err ? inputErrorClass : ""}`}
                      value={cond.location}
                      onChange={(e) =>
                        updateCondition(
                          "initialState",
                          cond.id,
                          "location",
                          e.target.value,
                        )
                      }
                    >
                      <option value="" disabled>
                        Select flag...
                      </option>
                      {flagOptions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  )}

                  {cond.type === "Memory" && (
                    <>
                      <Input
                        list={datalistId}
                        value={cond.location}
                        onChange={(e) =>
                          updateCondition(
                            "initialState",
                            cond.id,
                            "location",
                            e.target.value,
                          )
                        }
                        placeholder="Address (0-255)"
                        className={`w-28 ${err ? inputErrorClass : ""}`}
                      />
                      <datalist id={datalistId}>
                        <option value="" />
                        {Array.from({ length: 256 })
                          .map((_, i) => String(i))
                          .filter(
                            (a) => !usedMemory.has(a) || a === cond.location,
                          )
                          .map((addr) => (
                            <option key={addr} value={addr} />
                          ))}
                      </datalist>
                    </>
                  )}

                  <span className="text-gray-500 mx-1">:</span>

                  {/* value field + tooltip above it */}
                  <div className="relative flex-1">
                    {cond.type === "Flag" ? (
                      <select
                        className={`${selectStyleBase} ${err ? inputErrorClass : ""} flex-1`}
                        value={cond.value}
                        onChange={(e) =>
                          updateCondition(
                            "initialState",
                            cond.id,
                            "value",
                            e.target.value,
                          )
                        }
                      >
                        <option value="" disabled>
                          Select...
                        </option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                      </select>
                    ) : (
                      <Input
                        value={cond.value}
                        onChange={(e) =>
                          updateCondition(
                            "initialState",
                            cond.id,
                            "value",
                            e.target.value,
                          )
                        }
                        placeholder="Value (0-255)"
                        className={`flex-1 ${err ? inputErrorClass : ""}`}
                        onKeyDown={(ev) => {
                          if (ev.key.length === 1 && !/^[0-9]$/.test(ev.key))
                            ev.preventDefault();
                        }}
                      />
                    )}

                    {/* tooltip above value; absolute so not affect layout */}
                    {err && (
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-red-600 rounded shadow-lg pointer-events-none z-50">
                        {err}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition("initialState", cond.id)}
                  >
                    <HiTrash className="w-5 h-5 text-red-400" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="w-full bg-green-50 text-green-700 hover:bg-green-100 mt-6"
            onClick={() => addCondition("initialState")}
          >
            <HiPlus className="w-5 h-5 mr-1" /> Add Initial Value
          </Button>
        </div>

        {/* expected */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Expected Final State</h3>
          <div className="space-y-2">
            {localTestCase.expectedState.map((cond, idx) => {
              const err = errors[cond.id];

              const regOptions = availableRegisterOptions.filter(
                (r) => !usedRegisters.has(r) || r === cond.location,
              );

              const datalistId = `mem-${localTestCase.id}-exp-${cond.id}`;

              return (
                <div key={cond.id} className="flex items-center gap-2 relative">
                  <span className="text-sm text-gray-500 w-6 text-right">
                    {idx + 1}
                  </span>

                  {/* TYPE select */}
                  <select
                    className={`${selectStyleBase} ${err ? inputErrorClass : ""}`}
                    value={cond.type}
                    onChange={(e) =>
                      updateCondition(
                        "expectedState",
                        cond.id,
                        "type",
                        e.target.value as TestCondition["type"],
                      )
                    }
                  >
                    <option value="Register">Register</option>
                    <option value="Memory">Memory</option>
                    <option value="Flag">Flag</option>
                  </select>

                  {/* LOCATION control */}
                  {cond.type === "Register" && (
                    <select
                      className={`${selectStyleBase} ${err ? inputErrorClass : ""}`}
                      value={cond.location}
                      onChange={(e) =>
                        updateCondition(
                          "expectedState",
                          cond.id,
                          "location",
                          e.target.value,
                        )
                      }
                    >
                      <option value="" disabled>
                        Select register...
                      </option>
                      {regOptions.length === 0 ? (
                        <option value="" disabled>
                          (no registers available)
                        </option>
                      ) : (
                        regOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))
                      )}
                    </select>
                  )}

                  {cond.type === "Flag" && (
                    <select
                      className={`${selectStyleBase} ${err ? inputErrorClass : ""}`}
                      value={cond.location}
                      onChange={(e) =>
                        updateCondition(
                          "expectedState",
                          cond.id,
                          "location",
                          e.target.value,
                        )
                      }
                    >
                      <option value="" disabled>
                        Select flag...
                      </option>
                      {flagOptions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  )}

                  {cond.type === "Memory" && (
                    <>
                      <Input
                        list={datalistId}
                        value={cond.location}
                        onChange={(e) =>
                          updateCondition(
                            "expectedState",
                            cond.id,
                            "location",
                            e.target.value,
                          )
                        }
                        placeholder="Address (0-255)"
                        className={`w-28 ${err ? inputErrorClass : ""}`}
                      />
                      <datalist id={datalistId}>
                        <option value="" />
                        {Array.from({ length: 256 })
                          .map((_, i) => String(i))
                          .filter(
                            (a) => !usedMemory.has(a) || a === cond.location,
                          )
                          .map((addr) => (
                            <option key={addr} value={addr} />
                          ))}
                      </datalist>
                    </>
                  )}

                  <span className="text-gray-500 mx-1">:</span>

                  <div className="relative flex-1">
                    {cond.type === "Flag" ? (
                      <select
                        className={`${selectStyleBase} ${err ? inputErrorClass : ""} flex-1`}
                        value={cond.value}
                        onChange={(e) =>
                          updateCondition(
                            "expectedState",
                            cond.id,
                            "value",
                            e.target.value,
                          )
                        }
                      >
                        <option value="" disabled>
                          Select...
                        </option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                      </select>
                    ) : (
                      <Input
                        value={cond.value}
                        onChange={(e) =>
                          updateCondition(
                            "expectedState",
                            cond.id,
                            "value",
                            e.target.value,
                          )
                        }
                        placeholder="Value (0-255)"
                        className={`flex-1 ${err ? inputErrorClass : ""}`}
                        onKeyDown={(ev) => {
                          if (ev.key.length === 1 && !/^[0-9]$/.test(ev.key))
                            ev.preventDefault();
                        }}
                      />
                    )}

                    {err && (
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-red-600 rounded shadow-lg pointer-events-none z-50">
                        {err}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition("expectedState", cond.id)}
                  >
                    <HiTrash className="w-5 h-5 text-red-400" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="w-full bg-green-50 text-green-700 hover:bg-green-100 mt-6"
            onClick={() => addCondition("expectedState")}
          >
            <HiPlus className="w-5 h-5 mr-1" /> Add Expectation
          </Button>
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
            <Button onClick={handleSave} disabled={hasErrors}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
