"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { HiPlus, HiSearch, HiOutlineChip } from "react-icons/hi";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/Label";

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
    <Card>
      <CardHeader className="bg-gray-50/50 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <HiOutlineChip className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Memory Initialization</CardTitle>
            <CardDescription>Set initial values for memory addresses</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-6">
          Define initial memory values data inputs.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Memory Grid */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Memory Map</span>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                  <span className="text-muted-foreground">Set</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                  <span className="text-muted-foreground">Stack</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-16 border rounded-xl overflow-hidden shadow-sm">
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
                      "w-full aspect-square text-[9px] font-medium border-r border-b transition-all duration-150",
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
            <div className="bg-muted/30 rounded-xl border p-5 space-y-4 sticky top-4">
              <div className="text-center pb-3 border-b">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Selected Address</div>
                <div className="text-3xl font-bold text-primary">0x{hexAddress}</div>
                {selectedAddress >= MEMORY_CONFIG.STACK_START && (
                  <span className="inline-block mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">
                    Stack Reserved
                  </span>
                )}
              </div>

              <form onSubmit={handleSetValue} className="space-y-4">
                <div className="space-y-2">
                  <Label>Jump to Address</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="223"
                      placeholder="0-223"
                      value={searchValue}
                      onChange={handleSearchChange}
                      className="pl-10"
                    />
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2 py-3 px-3 bg-white rounded-lg border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Current Value (DEC):</span>
                    <span className="font-bold text-foreground">
                      {currentMemoryEntry ? currentMemoryEntry.value : "Empty"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Set Value (0-255)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    placeholder="Enter value"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <HiPlus className="w-4 h-4 mr-2" />
                  Set Value
                </Button>
              </form>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
