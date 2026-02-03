import React from "react";
import {
  HiOutlineDocumentText,
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineRefresh
} from "react-icons/hi";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/Label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";

import { AssignmentFormData } from "@/types/assignment";

interface Step1DetailProps {
  formData: AssignmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AssignmentFormData>>;
}

export default function Step1Detail({
  formData,
  setFormData,
}: Step1DetailProps) {
  const handleChange = (field: keyof AssignmentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <HiOutlineDocumentText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>Define the core details of your assignment</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="assignmentName">Assignment Title <span className="text-red-500">*</span></Label>
            <Input
              id="assignmentName"
              placeholder="e.g., Introduction to Data Structures"
              value={formData.assignmentName}
              onChange={(e) => handleChange("assignmentName", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Choose a clear, descriptive title that students will easily recognize
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed instructions, learning objectives, or any additional context..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Help students understand what's expected and how to succeed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Deadline & Attempts */}
      <Card>
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <HiOutlineClock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Deadline & Attempts</CardTitle>
              <CardDescription>Control submission timing and retry limits</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Due Date Switch */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="hasDueDate" className="text-base">Set Due Date</Label>
              <p className="text-sm text-muted-foreground">
                Establish a submission deadline. Late submissions will be flagged.
              </p>
            </div>
            <Switch
              id="hasDueDate"
              checked={formData.hasDueDate}
              onCheckedChange={(checked) => handleChange("hasDueDate", checked)}
            />
          </div>

          {formData.hasDueDate && (
            <div className="ml-1 pl-4 border-l-2 border-indigo-100 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Deadline Date</Label>
                <div className="relative max-w-sm ">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !formData.dueDate && "text-muted-foreground"
                        )}
                      >
                        {formData.dueDate ? (
                          /* Parse YYYY-MM-DD from the stored string to avoid TZ shifts */
                          format(new Date(formData.dueDate.split('T')[0] + "T00:00:00"), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.dueDate
                            ? new Date(formData.dueDate.split('T')[0] + "T00:00:00")
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            // Format as YYYY-MM-DD Local
                            const dateString = format(date, "yyyy-MM-dd");
                            // Append fixed UTC deadline time meant for the End of Day
                            handleChange("dueDate", `${dateString}T23:59:59Z`);
                          }
                        }}
                        disabled={(date) =>
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground">
                  Students can submit until 23:59 on this date.
                </p>
              </div>
            </div>
          )}

          {/* Attempts Switch */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="hasLimitAttempts" className="text-base">Limit Submission Attempts</Label>
              <p className="text-sm text-muted-foreground">
                Cap the number of times students can submit.
              </p>
            </div>
            <Switch
              id="hasLimitAttempts"
              checked={formData.hasLimitAttempts}
              onCheckedChange={(checked) => handleChange("hasLimitAttempts", checked)}
            />
          </div>

          {formData.hasLimitAttempts && (
            <div className="ml-1 pl-4 border-l-2 border-indigo-100 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="limitAttempts">Maximum Attempts</Label>
                <div className="flex items-center gap-3 max-w-sm">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <HiOutlineRefresh className="w-4 h-4 text-gray-500" />
                    </div>
                    <Input
                      id="limitAttempts"
                      type="number"
                      placeholder="e.g., 3"
                      value={formData.limitAttempts}
                      onChange={(e) => handleChange("limitAttempts", e.target.value)}
                      min={1}
                      max={99}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <HiOutlineCog className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Advanced Settings</CardTitle>
              <CardDescription>Fine-tune behavior and access control</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowLateSubmissions"
              checked={formData.allowLateSubmissions}
              onCheckedChange={(checked) => handleChange("allowLateSubmissions", checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="allowLateSubmissions"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow Late Submissions
              </Label>
              <p className="text-sm text-muted-foreground">
                Permit students to submit after the deadline.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="lockAfterFinal"
              checked={formData.lockAfterFinal}
              onCheckedChange={(checked) => handleChange("lockAfterFinal", checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="lockAfterFinal"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lock After Final Submission
              </Label>
              <p className="text-sm text-muted-foreground">
                Prevent edits once students use their final attempt or after the deadline.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
