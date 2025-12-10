"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { HiPlus, HiSearch } from "react-icons/hi";
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
    <div>
      <h3 className="text-lg font-semibold">Initial Memory Value</h3>
      <p className="text-sm text-gray-500 mb-4">
        Set initial values for specific memory addresses. This is essential for
        providing input data, such as arrays or key variables, for the student's
        program to process.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-16 border border-gray-300 rounded-lg">
            {Array.from({ length: 256 }).map((_, i) => {
              const isStack = i >= MEMORY_CONFIG.STACK_START; // 0xE0 - 0xFF
              const isSet = formData.initialMemory.some((m) => m.address === i);
              const isSelected = selectedAddress === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isStack}
                  onClick={() => setSelectedAddress(i)}
                  className={cn(
                    "w-full aspect-square text-[9px] border-r border-b border-gray-200",
                    isStack
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : "text-gray-400",
                    isSet && !isStack && "bg-green-200 text-green-800",
                    isSelected && "ring-2 ring-blue-500 z-10 relative",
                    !isSet && !isStack && "hover:bg-gray-100",
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
        <div className="md:col-span-1">
          <form onSubmit={handleSetValue} className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Search memory address
              </label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  min="0"
                  max="223"
                  placeholder="0-223"
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
                <HiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="text-sm space-y-1">
              <p>
                Address : <strong className="text-base">0x{hexAddress}</strong>
                {selectedAddress >= MEMORY_CONFIG.STACK_START && (
                  <span className="text-red-500 text-xs ml-2">
                    (Stack Reserved)
                  </span>
                )}
              </p>
              <p>
                Value (DEC) :{" "}
                <strong className="text-base">
                  {currentMemoryEntry ? currentMemoryEntry.value : "Empty"}
                </strong>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Enter Value 0-255</label>
              <Input
                type="number"
                min="0"
                max="255"
                placeholder="Enter value (or empty to clear)"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full">
              <HiPlus className="w-5 h-5 mr-1" /> Set Value
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
