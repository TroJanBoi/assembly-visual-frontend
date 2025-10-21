"use client";

import React from "react";
import { AssignmentFormData } from "@/types/assignment";

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

  const selectStyle =
    "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div>
      <h3 className="text-lg font-semibold">Number of Registers</h3>
      <p className="text-sm text-gray-500 mb-4">
        Define the starting values for any registers (R0-R8) before the
        student's program begins. These values act as a baseline input for the
        problem.
      </p>
      <div>
        <label
          htmlFor="registerCount"
          className="block text-sm font-medium text-gray-700"
        >
          Select Register Count
        </label>
        <select
          id="registerCount"
          value={formData.registerCount}
          onChange={(e) =>
            handleChange("registerCount", Number(e.target.value))
          }
          className={`${selectStyle} mt-1`}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
            <option key={count} value={count}>
              {count} Register{count > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
