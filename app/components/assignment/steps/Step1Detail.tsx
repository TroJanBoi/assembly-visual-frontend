import React from "react";
import { HiOutlineCalendar } from "react-icons/hi";

import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Checkbox } from "@/components/ui/Checkbox";

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
      {/* Assignment Name */}
      <div>
        <label className="text-sm font-medium">Assignment Name</label>
        <Input
          placeholder="Enter your assignment name"
          value={formData.assignmentName}
          onChange={(e) => handleChange("assignmentName", e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Enter your description..."
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="mt-1"
          rows={6}
        />
      </div>

      {/* Settings */}
      <h2 className="text-xl font-semibold pt-4 border-t">Settings</h2>
      <div className="space-y-5">
        {/* Due Date */}
        <div className="flex items-start justify-between">
          <div>
            <label htmlFor="hasDueDate" className="font-medium">
              Due date
            </label>
            <p className="text-sm text-gray-500">
              Enable this to set a submission deadline. Any submissions after
              this date and time will be marked as "Late".
            </p>
          </div>
          <Switch
            id="hasDueDate"
            checked={formData.hasDueDate}
            onCheckedChange={(checked) => handleChange("hasDueDate", checked)}
          />
        </div>
        {formData.hasDueDate && (
          <div className="relative">
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="pl-10"
            />
            <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        )}

        {/* Limit Submission Attempts */}
        <div className="flex items-start justify-between">
          <div>
            <label htmlFor="hasLimitAttempts" className="font-medium">
              Limit Submission Attempts
            </label>
            <p className="text-sm text-gray-500">
              Enable this to set the maximum number of times a student can
              submit their solution. Once the limit is reached, no further
              submissions will be accepted. Leave unchecked for unlimited
              attempts.
            </p>
          </div>
          <Switch
            id="hasLimitAttempts"
            checked={formData.hasLimitAttempts}
            onCheckedChange={(checked) =>
              handleChange("hasLimitAttempts", checked)
            }
          />
        </div>
        {formData.hasLimitAttempts && (
          <Input
            type="number"
            placeholder="Enter number of max attempt"
            value={formData.limitAttempts}
            onChange={(e) => handleChange("limitAttempts", e.target.value)}
            min="1"
          />
        )}

        {/* Allow Late Submissions */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="allowLateSubmissions"
            checked={formData.allowLateSubmissions}
            onCheckedChange={(checked) =>
              handleChange("allowLateSubmissions", checked)
            }
          />
          <div>
            <label htmlFor="allowLateSubmissions" className="font-medium">
              Allow Late Submissions
            </label>
            <p className="text-sm text-gray-500">
              If a due date is set, enable this to allow students to submit
              their work after the deadline has passed. Late submissions will be
              clearly marked for your review.
            </p>
          </div>
        </div>

        {/* Lock Solution After Final Submission */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="lockAfterFinal"
            checked={formData.lockAfterFinal}
            onCheckedChange={(checked) =>
              handleChange("lockAfterFinal", checked)
            }
          />
          <div>
            <label htmlFor="lockAfterFinal" className="font-medium">
              Lock Solution After Final Submission
            </label>
            <p className="text-sm text-gray-500">
              Enable this to prevent students from editing their solution after
              they use their final submission attempt or after the due date has
              passed. This is useful for ensuring the submitted work remains
              unchanged during grading.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
