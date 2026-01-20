"use client";

import React from "react";
import { HiOutlineChip } from "react-icons/hi";
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

  const registerOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <HiOutlineChip className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Register Configuration</h3>
            <p className="text-sm text-gray-600">Define available CPU registers</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-gray-600 mb-6">
          Set the number of general-purpose registers (R0-R7) available for student programs.
          Choose based on assignment complexity.
        </p>

        <div>
          <label htmlFor="registerCount" className="block text-sm font-medium text-gray-700 mb-3">
            Number of Registers
          </label>

          <div className="grid grid-cols-4 gap-3">
            {registerOptions.map((count) => {
              const isSelected = formData.registerCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleChange("registerCount", count)}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
                  `}
                >
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${isSelected ? 'text-indigo-600' : 'text-gray-700'}`}>
                      {count}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                      Register{count > 1 ? 's' : ''}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Registers are named R0, R1, R2, ... up to R{formData.registerCount - 1}
          </p>
        </div>
      </div>
    </div>
  );
}
