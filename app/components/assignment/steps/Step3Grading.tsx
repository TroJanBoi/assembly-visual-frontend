import React from "react";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Slider } from "@/components/ui/slider";

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
  ) => {
    if (value === "" || /^\d+$/.test(value)) {
      handleChange(field, value);
    }
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

  const calculateCorrectnessWeight = (): string => {
    if (formData.gradingMode === "manual" || !formData.efficiencyEnabled) {
      return "100";
    }
    const efficiencyW = parseInt(formData.efficiencyWeight, 10) || 0;
    const correctnessW = Math.max(0, 100 - efficiencyW);
    return correctnessW.toString();
  };

  const isManualMode = formData.gradingMode === "manual";

  return (
    <div className="space-y-6">
      {/* Max Score */}
      <Card>
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <HiOutlineAcademicCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Maximum Score</CardTitle>
              <CardDescription>Total points for this assignment</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 max-w-sm">
            <div className="grid gap-2 w-full">
              <Label htmlFor="maxScore">Max Score</Label>
              <div className="relative">
                <Input
                  id="maxScore"
                  inputMode="numeric"
                  placeholder="100"
                  value={formData.maxScore}
                  onChange={(e) => handleNumberChange("maxScore", e.target.value)}
                  onBlur={(e) => validateAndClampNumber("maxScore", e.target.value, 0, 100)}
                  className="pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                  pts
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grading Mode */}
      <Card>
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <HiOutlineChartBar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Grading Mode</CardTitle>
              <CardDescription>Choose how to calculate student grades</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup
            value={formData.gradingMode}
            onValueChange={(val) => {
              handleChange("gradingMode", val);
              if (val === "manual") {
                handleChange("efficiencyEnabled", false);
                handleChange("efficiencyWeight", "0");
                handleChange("maxNodes", "");
              }
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="auto" id="mode-auto" className="peer sr-only" />
              <Label
                htmlFor="mode-auto"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary/50 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full"
              >
                <HiOutlineCheck className="mb-3 h-6 w-6" />
                <span className="text-sm font-semibold">Auto Grading</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="manual" id="mode-manual" className="peer sr-only" />
              <Label
                htmlFor="mode-manual"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary/50 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full"
              >
                <HiOutlineHand className="mb-3 h-6 w-6" />
                <span className="text-sm font-semibold">Manual Review</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Grading Criteria */}
      <Card className={cn("transition-opacity duration-200", isManualMode && "opacity-50 pointer-events-none")}>
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <HiOutlineLightningBolt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Grading Criteria</CardTitle>
              <CardDescription>Configure auto-grading weights</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Test Case Weight Display */}
          <div className="rounded-lg border bg-blue-50/50 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-blue-900">Test Case Correctness</div>
                <div className="text-xs text-blue-700">Percentage of passed test cases</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {calculateCorrectnessWeight()}%
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
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
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="efficiencyEnabled" className="text-base font-medium">
                  Enable Efficiency Grading
                </Label>
                <p className="text-sm text-muted-foreground">
                  Deduct points if solution uses too many nodes.
                </p>
              </div>
            </div>

            {formData.efficiencyEnabled && (
              <div className="ml-6 space-y-6 pt-2">
                <div className="grid gap-2 max-w-sm">
                  <Label htmlFor="maxNodes">Maximum Nodes Allowed</Label>
                  <Input
                    id="maxNodes"
                    inputMode="numeric"
                    placeholder="e.g., 10"
                    value={formData.maxNodes}
                    onChange={(e) => handleNumberChange("maxNodes", e.target.value)}
                    onBlur={(e) => validateAndClampNumber("maxNodes", e.target.value, 1)}
                  />
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="efficiencyWeight">Efficiency Weight</Label>
                    <span className="text-sm font-bold text-amber-600">{formData.efficiencyWeight}%</span>
                  </div>
                  <Slider
                    defaultValue={[parseInt(formData.efficiencyWeight) || 0]}
                    max={100}
                    step={10}
                    className="w-full"
                    onValueChange={(vals) => {
                      handleChange("efficiencyWeight", vals[0].toString());
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust the impact of efficiency on the final grade. Correctness will account for the remaining {calculateCorrectnessWeight()}%.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
