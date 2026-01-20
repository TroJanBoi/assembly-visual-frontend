"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { AssignmentFormData } from "@/types/assignment";
import { cn } from "@/lib/utils";
import {
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineLightningBolt,
  HiOutlineCheck,
  HiOutlineHand
} from "react-icons/hi";

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
    // Allow empty string
    if (value === "") {
      handleChange(field, "");
      return;
    }

    // Allow only digits
    if (/^\d+$/.test(value)) {
      handleChange(field, value);
    }
    // If not valid digits, ignore the input
  };

  const validateAndClampNumber = (
    field: "maxScore" | "maxNodes" | "efficiencyWeight",
    value: string,
    min: number = 0,
    max?: number,
  ) => {
    if (value === "") {
      handleChange(field, min.toString());
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num)) {
      handleChange(field, min.toString());
      return;
    }

    if (num < min) {
      handleChange(field, min.toString());
    } else if (max !== undefined && num > max) {
      handleChange(field, max.toString());
    }
  };

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
    <div className="space-y-6">
      {/* Max Score Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <HiOutlineAcademicCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Maximum Score</h3>
              <p className="text-sm text-gray-600">Total points for this assignment</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-2">
            Max Score
          </label>
          <div className="flex items-center gap-3">
            <Input
              id="maxScore"
              type="text"
              inputMode="numeric"
              placeholder="Enter max score"
              value={formData.maxScore}
              onChange={(e) =>
                handleNumberChange("maxScore", e.target.value, 0, 100)
              }
              onBlur={(e) =>
                validateAndClampNumber("maxScore", e.target.value, 0, 100)
              }
              className="flex-1"
            />
            <div className="px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold text-sm rounded-lg">
              / 100 pts
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The final grade will be calculated proportionally based on this maximum score.
          </p>
        </div>
      </div>

      {/* Grading Mode Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <HiOutlineChartBar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Grading Mode</h3>
              <p className="text-sm text-gray-600">Choose how to calculate student grades</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <label htmlFor="gradingMode" className="block text-sm font-medium text-gray-700 mb-2">
            Mode
          </label>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              type="button"
              onClick={() => {
                handleChange("gradingMode", "auto");
              }}
              className={cn(
                "px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2",
                formData.gradingMode === "auto"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              )}
            >
              <HiOutlineCheck className="w-5 h-5" /> Auto
            </button>
            <button
              type="button"
              onClick={() => {
                handleChange("gradingMode", "manual");
                handleChange("efficiencyEnabled", false);
                handleChange("efficiencyWeight", "0");
                handleChange("maxNodes", "");
              }}
              className={cn(
                "px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2",
                formData.gradingMode === "manual"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              )}
            >
              <HiOutlineHand className="w-5 h-5" /> Manual
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {formData.gradingMode === "auto"
              ? "System will automatically grade based on test results and weights."
              : "You will manually review and grade each submission."}
          </p>
        </div>
      </div>

      {/* Grading Weight Card */}
      <div
        className={cn(
          "bg-white rounded-xl border border-gray-200 overflow-hidden transition-opacity",
          isManualMode && "opacity-50 pointer-events-none"
        )}
      >
        <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <HiOutlineLightningBolt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Grading Criteria</h3>
              <p className="text-sm text-gray-600">Configure test and efficiency weights</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Test Case Correctness */}
          <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-blue-900">
                Test Case Correctness
              </label>
              <div className="px-3 py-1 bg-blue-200 text-blue-900 font-bold text-sm rounded-md">
                {calculateCorrectnessWeight()}%
              </div>
            </div>
            <p className="text-xs text-blue-700">
              Grade based on percentage of test cases passed (visible + hidden).
            </p>
          </div>

          {/* Efficiency */}
          <div className="p-4 border-2 border-gray-200 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
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
                    "text-sm font-semibold text-gray-900",
                    !isManualMode && "cursor-pointer"
                  )}
                >
                  Efficiency (Node Budget)
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Grade based on whether solution meets resource constraints (max nodes).
                </p>
              </div>
              {formData.efficiencyEnabled && (
                <div className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-sm rounded-md">
                  {formData.efficiencyWeight}%
                </div>
              )}
            </div>

            {formData.efficiencyEnabled && (
              <div className="pl-7 space-y-3 pt-3 border-t border-gray-200">
                <div>
                  <label
                    htmlFor="maxNodes"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Maximum Nodes Allowed
                  </label>
                  <Input
                    id="maxNodes"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g., 10"
                    value={formData.maxNodes}
                    onChange={(e) =>
                      handleNumberChange("maxNodes", e.target.value)
                    }
                    onBlur={(e) =>
                      validateAndClampNumber("maxNodes", e.target.value, 1)
                    }
                    disabled={isManualMode}
                  />
                </div>
                <div>
                  <label
                    htmlFor="efficiencyWeight"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Efficiency Weight
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {weightOptions.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleEfficiencyWeightChange(w)}
                        disabled={isManualMode}
                        className={cn(
                          "px-3 py-2 rounded-md text-xs font-semibold transition-all border-2",
                          formData.efficiencyWeight === w
                            ? "border-amber-500 bg-amber-100 text-amber-900"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        )}
                      >
                        {w}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {formData.gradingMode === "auto" && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Test Case Weight:</span>
                  <span className="font-semibold">{calculateCorrectnessWeight()}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Efficiency Weight:</span>
                  <span className="font-semibold">{formData.efficiencyEnabled ? formData.efficiencyWeight : 0}%</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-300 font-semibold text-gray-900">
                  <span>Total:</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
