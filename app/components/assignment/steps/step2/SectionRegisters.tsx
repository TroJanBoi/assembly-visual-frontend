"use client";

import React from "react";
import { HiOutlineChip } from "react-icons/hi";
import { AssignmentFormData } from "@/types/assignment";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionRegistersProps {
  formData: AssignmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AssignmentFormData>>;
}

export default function SectionRegisters({
  formData,
  setFormData,
}: SectionRegistersProps) {
  const handleChange = (
    field: keyof AssignmentFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const registerOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <Card>
      <CardHeader className="bg-gray-50/50 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <HiOutlineChip className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Register Configuration</CardTitle>
            <CardDescription>Define available CPU registers</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-6">
          Set the number of general-purpose registers (R0-R7) available.
        </p>

        <div className="grid grid-cols-4 gap-3">
          {registerOptions.map((count) => {
            const isSelected = formData.registerCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => handleChange("registerCount", count)}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-muted bg-white hover:border-muted-foreground/50 hover:shadow-sm"
                )}
              >
                <div className="text-center">
                  <div className={cn("text-2xl font-bold mb-1", isSelected ? "text-primary" : "text-gray-700")}>
                    {count}
                  </div>
                  <div className={cn("text-xs", isSelected ? "text-primary" : "text-muted-foreground")}>
                    Register{count > 1 ? 's' : ''}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
