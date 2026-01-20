import React from "react";
import {
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineLockClosed,
  HiOutlineRefresh
} from "react-icons/hi";

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
      {/* Basic Information Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <HiOutlineDocumentText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <p className="text-sm text-gray-500">Define the core details of your assignment</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Assignment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Introduction to Data Structures"
              value={formData.assignmentName}
              onChange={(e) => handleChange("assignmentName", e.target.value)}
              className="text-base"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Choose a clear, descriptive title that students will easily recognize
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              placeholder="Provide detailed instructions, learning objectives, or any additional context..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={5}
              className="text-base resize-none"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Help students understand what's expected and how to succeed
            </p>
          </div>
        </div>
      </div>

      {/* Deadline & Attempts Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <HiOutlineClock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Deadline & Attempts</h3>
              <p className="text-sm text-gray-500">Control submission timing and retry limits</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Due Date */}
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="hasDueDate" className="font-medium text-gray-900">
                  Set Due Date
                </label>
              </div>
              <p className="text-sm text-gray-600">
                Establish a submission deadline. Late submissions will be flagged for review.
              </p>
            </div>
            <Switch
              id="hasDueDate"
              checked={formData.hasDueDate}
              onCheckedChange={(checked) => handleChange("hasDueDate", checked)}
            />
          </div>

          {formData.hasDueDate && (
            <div className="ml-0 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2.5">
                Deadline
              </label>
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                {/* Date Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none z-10">
                    <HiOutlineCalendar className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="date"
                    value={formData.dueDate?.split('T')[0] || ''}
                    onChange={(e) => {
                      const time = formData.dueDate?.split('T')[1] || '23:59';
                      handleChange("dueDate", `${e.target.value}T${time}`);
                    }}
                    className="block w-full pl-11 pr-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg
                             hover:border-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                             transition-all duration-200 outline-none cursor-pointer
                             [&::-webkit-calendar-picker-indicator]:cursor-pointer 
                             [&::-webkit-calendar-picker-indicator]:opacity-0
                             [&::-webkit-calendar-picker-indicator]:absolute
                             [&::-webkit-calendar-picker-indicator]:inset-0
                             [&::-webkit-calendar-picker-indicator]:w-full
                             [&::-webkit-calendar-picker-indicator]:h-full"
                  />
                </div>

                {/* Time Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none z-10">
                    <HiOutlineClock className="w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type="time"
                    value={formData.dueDate?.split('T')[1] || '23:59'}
                    onChange={(e) => {
                      const date = formData.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0];
                      handleChange("dueDate", `${date}T${e.target.value}`);
                    }}
                    className="block w-full pl-11 pr-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg
                             hover:border-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 
                             transition-all duration-200 outline-none cursor-pointer
                             [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
              <p className="mt-2.5 text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                Students can submit until this date and time
              </p>
            </div>
          )}

          {/* Limit Attempts */}
          <div className="flex items-start justify-between gap-8 pt-4 border-t border-gray-100">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="hasLimitAttempts" className="font-medium text-gray-900">
                  Limit Submission Attempts
                </label>
              </div>
              <p className="text-sm text-gray-600">
                Cap the number of times students can submit. Unlimited attempts are allowed by default.
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
            <div className="ml-0 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2.5">
                Maximum Attempts
              </label>
              <div className="flex items-center gap-3 max-w-md">
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none z-10">
                    <HiOutlineRefresh className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="number"
                    placeholder="e.g., 3"
                    value={formData.limitAttempts}
                    onChange={(e) => handleChange("limitAttempts", e.target.value)}
                    min="1"
                    max="99"
                    className="block w-full pl-11 pr-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg
                             hover:border-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                             transition-all duration-200 outline-none
                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg shadow-sm">
                  <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Attempts</span>
                </div>
              </div>
              <p className="mt-2.5 text-xs text-gray-500">
                Set to 1 for exams, or higher (3-5) for practice assignments
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <HiOutlineCog className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
              <p className="text-sm text-gray-500">Fine-tune behavior and access control</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Allow Late Submissions */}
          <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <Checkbox
              id="allowLateSubmissions"
              checked={formData.allowLateSubmissions}
              onCheckedChange={(checked) =>
                handleChange("allowLateSubmissions", checked)
              }
              className="mt-0.5"
            />
            <div className="flex-1">
              <label htmlFor="allowLateSubmissions" className="font-medium text-gray-900 block mb-1 cursor-pointer">
                Allow Late Submissions
              </label>
              <p className="text-sm text-gray-600">
                Permit students to submit after the deadline. Late work will be clearly marked for grading review.
              </p>
            </div>
          </div>

          {/* Lock After Final */}
          <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <Checkbox
              id="lockAfterFinal"
              checked={formData.lockAfterFinal}
              onCheckedChange={(checked) =>
                handleChange("lockAfterFinal", checked)
              }
              className="mt-0.5"
            />
            <div className="flex-1">
              <label htmlFor="lockAfterFinal" className="font-medium text-gray-900 block mb-1 cursor-pointer">
                <span className="inline-flex items-center gap-2">
                  Lock After Final Submission
                  <HiOutlineLockClosed className="w-4 h-4 text-gray-400" />
                </span>
              </label>
              <p className="text-sm text-gray-600">
                Prevent edits once students use their final attempt or after the deadline. Ensures submission integrity during grading.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
