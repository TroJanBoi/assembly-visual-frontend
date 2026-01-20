"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { HiPlus, HiSearch, HiOutlineChip } from "react-icons/hi";
import { cn } from "@/lib/utils";

import { AssignmentFormData } from "@/types/assignment";
import { MEMORY_CONFIG } from "@/lib/constants/playground";

interface SectionMemoryProps {
  formData: AssignmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AssignmentFormData>>;
}

export default function SectionMemory({
  formData,
  setFormData,
}: SectionMemoryProps) {
  const [selectedAddress, setSelectedAddress] = useState<number>(0);
  const [searchValue, setSearchValue] = useState<string>("0");
  const [currentValue, setCurrentValue] = useState<string>("");

  useEffect(() => {
    const memoryEntry = formData.initialMemory.find(
      (m) => m.address === selectedAddress,
    );
    setSearchValue(selectedAddress.toString());
    setCurrentValue(memoryEntry ? memoryEntry.value.toString() : "");
  }, [selectedAddress, formData.initialMemory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      setSelectedAddress(num);
    }
  };

  const handleSetValue = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(currentValue, 10);
    if (isNaN(value) || value < 0 || value > 255) {
      setFormData((prev) => ({
        ...prev,
        initialMemory: prev.initialMemory.filter(
          (m) => m.address !== selectedAddress,
        ),
      }));
    } else {
      setFormData((prev) => {
        const existing = prev.initialMemory.filter(
          (m) => m.address !== selectedAddress,
        );
        return {
          ...prev,
          initialMemory: [
            ...existing,
            { address: selectedAddress, value: value },
          ],
        };
      });
    }
  };

  const currentMemoryEntry = formData.initialMemory.find(
    (m) => m.address === selectedAddress,
  );
  const hexAddress = selectedAddress
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <HiOutlineChip className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Memory Initialization</h3>
            <p className="text-sm text-gray-600">Set initial values for memory addresses</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-gray-600 mb-6">
          Define initial memory values for specific addresses. Essential for providing input data like arrays or variables.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Memory Grid */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Memory Map</span>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                  <span className="text-gray-600">Set Value</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                  <span className="text-gray-600">Stack Reserved</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-16 border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
              {Array.from({ length: 256 }).map((_, i) => {
                const isStack = i >= MEMORY_CONFIG.STACK_START;
                const isSet = formData.initialMemory.some((m) => m.address === i);
                const isSelected = selectedAddress === i;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isStack}
                    onClick={() => setSelectedAddress(i)}
                    className={cn(
                      "w-full aspect-square text-[9px] font-medium border-r border-b border-gray-200 transition-all duration-150",
                      isStack
                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-blue-50 cursor-pointer",
                      isSet && !isStack && "bg-green-200 text-green-900 font-bold",
                      isSelected && "ring-2 ring-inset ring-blue-500 z-10 relative bg-blue-100",
                    )}
                    title={
                      isStack
                        ? `Address ${i} (Stack Reserved)`
                        : `Address ${i} (0x${i
                          .toString(16)
                          .toUpperCase()
                          .padStart(2, "0")})`
                    }
                  >
                    {isSet && !isStack
                      ? formData.initialMemory.find((m) => m.address === i)?.value
                      : isStack
                        ? ""
                        : i}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-gray-200 p-5 space-y-4 sticky top-4">
              <div className="text-center pb-3 border-b border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Selected Address</div>
                <div className="text-3xl font-bold text-indigo-600">0x{hexAddress}</div>
                {selectedAddress >= MEMORY_CONFIG.STACK_START && (
                  <span className="inline-block mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">
                    Stack Reserved
                  </span>
                )}
              </div>

              <form onSubmit={handleSetValue} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Jump to Address
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="223"
                      placeholder="0-223"
                      value={searchValue}
                      onChange={handleSearchChange}
                      className="block w-full pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg
                               hover:border-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                               transition-all duration-200 outline-none"
                    />
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2 py-3 px-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Current Value (DEC):</span>
                    <span className="font-bold text-gray-900">
                      {currentMemoryEntry ? currentMemoryEntry.value : "Empty"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Set Value (0-255)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    placeholder="Enter value or leave empty"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="block w-full px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg
                             hover:border-gray-400 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 
                             transition-all duration-200 outline-none"
                  />
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                  <HiPlus className="w-4 h-4" />
                  Set Value
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
