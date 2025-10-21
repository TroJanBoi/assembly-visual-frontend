"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { AssignmentFormData } from "@/types/assignment";
import { cn } from "@/lib/utils";

interface Step3GradingProps {
  formData: AssignmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AssignmentFormData>>;
}

export default function Step3Grading({
  formData,
  setFormData,
}: Step3GradingProps) {
  const handleChange = (
    field: keyof AssignmentFormData,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (
    field: "maxScore" | "maxNodes" | "efficiencyWeight",
    value: string,
    min: number = 0,
    max?: number,
  ) => {
    if (value === "") {
      handleChange(field, "");
      return;
    }

    if (/^\d+$/.test(value)) {
      const num = parseInt(value, 10);

      if (num >= min && (max === undefined || num <= max)) {
        handleChange(field, value);
      } else if (max !== undefined && num > max) {
        handleChange(field, max.toString());
      } else if (num < min) {
        handleChange(field, min.toString());
      }
    }
  };

  const selectStyle =
    "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-50 mt-1";

  const weightOptions = Array.from({ length: 11 }, (_, i) => `${i * 10}`);

  const calculateCorrectnessWeight = (): string => {
    if (formData.gradingMode === "manual" || !formData.efficiencyEnabled) {
      return "100";
    }
    const efficiencyW = parseInt(formData.efficiencyWeight, 10) || 0;
    const correctnessW = Math.max(0, 100 - efficiencyW);
    return correctnessW.toString();
  };

  const handleEfficiencyWeightChange = (value: string) => {
    const efficiencyW = parseInt(value, 10) || 0;

    if (100 - efficiencyW < 0) {
      console.warn(
        "Efficiency weight too high, correctness would be negative.",
      );
      return;
    }

    const validWeight = Math.min(100, Math.max(0, efficiencyW)).toString();
    handleChange("efficiencyWeight", validWeight);
  };

  const isManualMode = formData.gradingMode === "manual";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <label htmlFor="maxScore" className="text-sm font-medium">
          Max Score
        </label>
        <p className="text-xs text-gray-500 mb-1">
          Set the total points this assignment is worth. The final grade for
          each student will be calculated based on this value (e.g., 100).
        </p>
        <Input
          id="maxScore"
          type="text"
          inputMode="numeric"
          placeholder="Enter max score (0-100)"
          value={formData.maxScore}
          onChange={(e) =>
            handleNumberChange("maxScore", e.target.value, 0, 100)
          }
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="gradingMode" className="text-sm font-medium">
          Grading Mode
        </label>
        <p className="text-xs text-gray-500 mb-1">
          Choose the method for calculating the final grade. Weighted Score
          combines different criteria based on their importance, while Pass/Fail
          requires the student to meet all criteria perfectly to pass.
        </p>
        <select
          id="gradingMode"
          value={formData.gradingMode}
          onChange={(e) => {
            const mode = e.target.value as AssignmentFormData["gradingMode"];
            handleChange("gradingMode", mode);

            if (mode === "manual") {
              handleChange("efficiencyEnabled", false);
              handleChange("efficiencyWeight", "0");
              handleChange("maxNodes", "");
            }
          }}
          className={selectStyle}
        >
          <option value="auto">Auto</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div
        className={cn(
          "space-y-4 transition-opacity duration-300",
          isManualMode && "opacity-50 pointer-events-none",
        )}
      >
        <h3 className="text-lg font-semibold mb-2">Grading Weight</h3>

        <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
          <label className="text-sm font-medium text-blue-800">
            Test Case Correctness
          </label>
          <p className="text-xs text-blue-600 mb-1">
            This portion of the grade is based on the percentage of test cases
            (both visible and hidden) that the student's solution successfully
            passes. It measures the functional accuracy of their program.
          </p>
          <Input
            readOnly
            disabled
            value={`${calculateCorrectnessWeight()}%`}
            className="mt-1 bg-white cursor-not-allowed"
          />
        </div>

        <div className="p-4 border rounded-md space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="efficiencyEnabled"
              checked={formData.efficiencyEnabled}
              disabled={isManualMode}
              onCheckedChange={(checked) => {
                const isEnabled = !!checked;
                handleChange("efficiencyEnabled", isEnabled);
                if (!isEnabled) {
                  handleChange("efficiencyWeight", "0");
                  handleChange("maxNodes", "");
                }
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <label
                htmlFor="efficiencyEnabled"
                className={cn(
                  "text-sm font-medium",
                  !isManualMode && "cursor-pointer",
                )}
              >
                Efficiency (Node Budget)
              </label>
              <p className="text-xs text-gray-500">
                This portion of the grade measures the efficiency of the
                student's solution. The score is based on whether their program
                stays within the resource limits you've defined (e.g., maximum
                number of nodes allowed). This encourages students to find more
                optimal solutions.
              </p>
            </div>
          </div>

          {formData.efficiencyEnabled && (
            <div className="pl-7 space-y-3 pt-2 border-t mt-3">
              <div>
                <label
                  htmlFor="maxNodes"
                  className="text-xs font-medium text-gray-600"
                >
                  Enter max node
                </label>
                <Input
                  id="maxNodes"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter max nodes"
                  value={formData.maxNodes}
                  onChange={(e) =>
                    handleNumberChange("maxNodes", e.target.value)
                  }
                  className="mt-1"
                  disabled={isManualMode}
                />
              </div>
              <div>
                <label
                  htmlFor="efficiencyWeight"
                  className="text-xs font-medium text-gray-600"
                >
                  Selected weight %
                </label>
                <select
                  id="efficiencyWeight"
                  value={formData.efficiencyWeight}
                  onChange={(e) => handleEfficiencyWeightChange(e.target.value)}
                  className={selectStyle}
                  disabled={isManualMode}
                >
                  {weightOptions.map((w) => (
                    <option key={w} value={w}>
                      {w}%
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
