"use client";

import React, { useState, forwardRef } from "react";
import TestCaseModal from "@/components/assignment/steps/step2/TestCaseModal";
import { AssignmentFormData, TestCase, TestSuite } from "@/types/assignment";

const HiPlus = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const HiTrash = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const HiChevronRight = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      className={`border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border rounded-md ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "outline" | "ghost";
    size?: "icon";
  }
>(({ className, variant, size, ...props }, ref) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variantClasses = {
    default: "bg-gray-900 text-white hover:bg-gray-700",
    outline:
      "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizeClasses = {
    default: "h-10 py-2 px-4",
    icon: "h-10 w-10",
  };
  const appliedVariant =
    variant === "outline"
      ? variantClasses.outline
      : variant === "ghost"
        ? variantClasses.ghost
        : variantClasses.default;
  const appliedSize = size === "icon" ? sizeClasses.icon : sizeClasses.default;

  return (
    <button
      className={`${baseClasses} ${appliedVariant} ${appliedSize} ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

const Checkbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, onCheckedChange, ...props }, ref) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(event.target.checked);
    }
  };
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${className}`}
      ref={ref}
      onChange={handleChange}
      {...props}
    />
  );
});
Checkbox.displayName = "Checkbox";

interface SectionTestSuitesProps {
  formData: AssignmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AssignmentFormData>>;
}

export default function SectionTestSuites({
  formData,
  setFormData,
}: SectionTestSuitesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<{
    suiteId: string;
    testCase: TestCase;
  } | null>(null);

  const handleOpenModal = (suiteId: string, testCase: TestCase) => {
    setEditingTestCase({ suiteId, testCase });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTestCase(null);
  };

  const addTestSuite = () => {
    const newSuite: TestSuite = {
      id: `suite-${Date.now()}`,
      name: "Enter test suite name",
      isGrading: true,
      isHidden: false,
      testCases: [],
    };
    setFormData((prev) => ({
      ...prev,
      testSuites: [...(prev.testSuites ?? []), newSuite],
    }));
  };

  const deleteTestSuite = (suiteId: string) => {
    setFormData((prev) => ({
      ...prev,
      testSuites:
        prev.testSuites?.filter((suite) => suite.id !== suiteId) ?? [],
    }));
  };

  const updateTestSuite = (
    suiteId: string,
    field: keyof TestSuite,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      testSuites:
        prev.testSuites?.map((suite) =>
          suite.id === suiteId ? { ...suite, [field]: value } : suite,
        ) ?? [],
    }));
  };

  const addTestCase = (suiteId: string) => {
    setFormData((prev) => ({
      ...prev,
      testSuites:
        prev.testSuites?.map((suite) => {
          if (suite.id !== suiteId) return suite;
          const newCase: TestCase = {
            id: `case-${Date.now()}`,
            name: `Test case ${suite.testCases.length + 1}`,
            isEnabled: true,
            initialState: [],
            expectedState: [],
          };
          return { ...suite, testCases: [...suite.testCases, newCase] };
        }) ?? [],
    }));
  };

  const deleteTestCase = (suiteId: string, caseId: string) => {
    setFormData((prev) => ({
      ...prev,
      testSuites:
        prev.testSuites?.map((suite) => {
          if (suite.id !== suiteId) return suite;
          return {
            ...suite,
            testCases: suite.testCases.filter((c) => c.id !== caseId),
          };
        }) ?? [],
    }));
  };

  const updateTestCase = (
    suiteId: string,
    caseId: string,
    field: keyof TestCase,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      testSuites:
        prev.testSuites?.map((suite) => {
          if (suite.id !== suiteId) return suite;
          return {
            ...suite,
            testCases: suite.testCases.map((c) =>
              c.id === caseId ? { ...c, [field]: value } : c,
            ),
          };
        }) ?? [],
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="w-2/3">
          <h3 className="text-lg font-semibold">Test Suites & Cases</h3>
          <p className=" text-sm text-gray-500">
            Build the set of automated tests to verify the correctness of the
            student's solution. For each test case, define the initial state
            (inputs) and the expected final state (outputs). Use "Visible" cases
            to guide students, and "Hidden" cases for final, private grading to
            prevent hardcoding.
          </p>
        </div>
        <Button onClick={addTestSuite}>
          <HiPlus className=" h-5 mr-1" /> New test suite
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {(formData.testSuites ?? []).map((suite) => (
          <TestSuiteCard
            key={suite.id}
            suite={suite}
            onUpdateSuite={updateTestSuite}
            onDeleteSuite={deleteTestSuite}
            onAddTestCase={addTestCase}
            onDeleteTestCase={deleteTestCase}
            onUpdateTestCase={updateTestCase}
            onOpenTestCase={handleOpenModal}
          />
        ))}
      </div>

      {editingTestCase && (
        <TestCaseModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          suiteId={editingTestCase.suiteId}
          testCase={editingTestCase.testCase}
          setFormData={setFormData}
          registerCount={formData.registerCount}
        />
      )}
    </div>
  );
}

function TestSuiteCard({
  suite,
  onUpdateSuite,
  onDeleteSuite,
  onAddTestCase,
  onDeleteTestCase,
  onUpdateTestCase,
  onOpenTestCase,
}: {
  suite: TestSuite;
  onUpdateSuite: (suiteId: string, field: keyof TestSuite, value: any) => void;
  onDeleteSuite: (suiteId: string) => void;
  onAddTestCase: (suiteId: string) => void;
  onDeleteTestCase: (suiteId: string, caseId: string) => void;
  onUpdateTestCase: (
    suiteId: string,
    caseId: string,
    field: keyof TestCase,
    value: any,
  ) => void;
  onOpenTestCase: (suiteId: string, testCase: TestCase) => void;
}) {
  return (
    <div className="flex flex-col bg-white border rounded-lg shadow-sm overflow-hidden h-full">
      <div className="p-4 border-b">
        <Input
          type="text"
          value={suite.name}
          onChange={(e) => onUpdateSuite(suite.id, "name", e.target.value)}
          placeholder="Enter test suite name"
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 p-0 placeholder:text-gray-400"
        />
      </div>

      <div className="flex-grow p-4 space-y-3">
        {suite.testCases.map((tc) => (
          <TestCaseItem
            key={tc.id}
            testCase={tc}
            suiteId={suite.id}
            onDelete={onDeleteTestCase}
            onUpdate={onUpdateTestCase}
            onOpen={() => onOpenTestCase(suite.id, tc)}
          />
        ))}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onAddTestCase(suite.id)}
        >
          <HiPlus className="w-5 h-5 mr-1" /> Add test case
        </Button>
      </div>

      <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`grading-${suite.id}`}
              checked={suite.isGrading}
              onCheckedChange={(checked) =>
                onUpdateSuite(suite.id, "isGrading", checked as boolean)
              }
            />
            <label
              htmlFor={`grading-${suite.id}`}
              className="text-sm font-medium"
            >
              Grading
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`hidden-${suite.id}`}
              checked={suite.isHidden}
              onCheckedChange={(checked) =>
                onUpdateSuite(suite.id, "isHidden", checked as boolean)
              }
            />
            <label
              htmlFor={`hidden-${suite.id}`}
              className="text-sm font-medium"
            >
              Hidden
            </label>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDeleteSuite(suite.id)}
        >
          <HiTrash className="w-5 h-5 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

function TestCaseItem({
  testCase,
  suiteId,
  onDelete,
  onUpdate,
  onOpen,
}: {
  testCase: TestCase;
  suiteId: string;
  onDelete: (suiteId: string, caseId: string) => void;
  onUpdate: (
    suiteId: string,
    caseId: string,
    field: keyof TestCase,
    value: any,
  ) => void;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`enabled-${testCase.id}`}
          checked={testCase.isEnabled}
          onCheckedChange={(checked) =>
            onUpdate(suiteId, testCase.id, "isEnabled", checked as boolean)
          }
        />
        <label htmlFor={`enabled-${testCase.id}`} className="text-sm">
          {testCase.name}
        </label>
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100"
          onClick={() => onDelete(suiteId, testCase.id)}
        >
          <HiTrash className="w-4 h-4 text-red-400" />
        </Button>
        <button
          type="button"
          onClick={onOpen}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          <HiChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
