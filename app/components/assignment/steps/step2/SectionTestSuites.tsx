"use client";

import React, { useState } from "react";
import TestCaseModal from "@/components/assignment/steps/step2/TestCaseModal";
import { AssignmentFormData, TestCase, TestSuite } from "@/types/assignment";
import {
  HiPlus,
  HiTrash,
  HiChevronRight,
  HiOutlineBeaker,
  HiEye,
  HiOutlineLockClosed,
  HiPencil
} from "react-icons/hi";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
// Badge import removed
// Actually I don't see Badge being created. I will stick to current spans for badges for now or use divs.

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
            hidden: false, // Default to visible test
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
            ...suite, // Typo fix: removed duplicate properties logic from original if any
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

  const totalTestCases = (formData.testSuites ?? []).reduce(
    (sum, suite) => sum + suite.testCases.length,
    0
  );

  const gradedTestCases = (formData.testSuites ?? []).reduce(
    (sum, suite) => sum + suite.testCases.filter(tc => tc.hidden).length,
    0
  );

  return (
    <Card>
      <CardHeader className="bg-gray-50/50 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <HiOutlineBeaker className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Test Suites & Cases</CardTitle>
              <CardDescription>
                {(formData.testSuites ?? []).length} suite{(formData.testSuites ?? []).length !== 1 ? 's' : ''} • {totalTestCases} test{totalTestCases !== 1 ? 's' : ''} ({gradedTestCases} graded)
              </CardDescription>
            </div>
          </div>
          <Button onClick={addTestSuite} className="bg-amber-600 hover:bg-amber-700">
            <HiPlus className="w-5 h-5 mr-1.5" /> New Suite
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-700">i</span>
            </div>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Test Case Types:</p>
              <ul className="space-y-1 ml-0">
                <li className="flex items-center gap-2">
                  <HiEye className="w-4 h-4 text-blue-600" />
                  <span><strong>Visible Tests</strong> - Students can see inputs/outputs to guide their work</span>
                </li>
                <li className="flex items-center gap-2">
                  <HiOutlineLockClosed className="w-4 h-4 text-amber-600" />
                  <span><strong>Graded Tests</strong> - Hidden from students, used for final grading</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {(formData.testSuites ?? []).length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <HiOutlineBeaker className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-700 mb-2">No test suites yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first test suite to start defining test cases
            </p>
            <Button onClick={addTestSuite} className="bg-amber-600 hover:bg-amber-700">
              <HiPlus className="w-5 h-5 mr-1.5" /> Create Test Suite
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        )}
      </CardContent>

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
    </Card>
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
  const gradedCount = suite.testCases.filter(tc => tc.hidden).length;
  const visibleCount = suite.testCases.length - gradedCount;

  return (
    <Card className="flex flex-col overflow-hidden h-full border-2 hover:border-gray-100 transition-colors">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-gray-">
        <div className="relative group flex items-center">
          <Input
            type="text"
            value={suite.name}
            onChange={(e) => onUpdateSuite(suite.id, "name", e.target.value)}
            placeholder="Click to edit suite name..."
            className="mb-2 text-base bg-transparent hover:bg-white/70 focus:bg-white border-transparent hover:border-gray-200 focus:border-indigo-300 focus-visible:ring-0 px-3 py-1 pr-9 transition-all cursor-text h-auto w-full"
          />
          <div className="absolute right-2 mb-2 text-gray-400 group-hover:text-indigo-500 transition-colors pointer-events-none">
            <HiPencil className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 px">
            <span className="flex items-center gap-1">
              <HiEye className="w-3 h-3" /> {visibleCount} Visible
            </span>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <span className="flex items-center gap-1">
              <HiOutlineLockClosed className="w-3 h-3" /> {gradedCount} Graded
            </span>
          </div>
        </div>
      </div>

      {/* Test Cases */}
      <div className="flex-grow p-4 space-y-2 bg-gray-50 min-h-[200px]">
        {suite.testCases.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-gray-400">
            No test cases
          </div>
        ) : (
          suite.testCases.map((tc) => (
            <TestCaseItem
              key={tc.id}
              testCase={tc}
              suiteId={suite.id}
              onDelete={onDeleteTestCase}
              onUpdate={onUpdateTestCase}
              onOpen={() => onOpenTestCase(suite.id, tc)}
            />
          ))
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t bg-white space-y-2">
        <Button
          variant="default"
          className="w-full"
          onClick={() => onAddTestCase(suite.id)}
        >
          <HiPlus className="w-4 h-4 mr-1.5" /> Add Test Case
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteSuite(suite.id)}
          className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <HiTrash className="w-4 h-4 mr-1.5" />
          Delete Suite
        </Button>
      </div>
    </Card>
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
    <div className="group bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all overflow-hidden">
      {/* Main Content */}
      <div className="flex items-center justify-between p-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Checkbox
            id={`enabled-${testCase.id}`}
            checked={testCase.isEnabled}
            onCheckedChange={(checked) =>
              onUpdate(suiteId, testCase.id, "isEnabled", checked as boolean)
            }
          />
          <label
            htmlFor={`enabled-${testCase.id}`}
            className={cn(
              "text-sm font-medium cursor-pointer truncate flex-1",
              testCase.isEnabled ? 'text-gray-900' : 'text-muted-foreground line-through'
            )}
            title={testCase.name}
          >
            {testCase.name}
          </label>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {testCase.hidden && (
            <div className="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-semibold text-amber-700">
              <HiOutlineLockClosed className="w-3 h-3" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 hover:bg-red-50 h-7 w-7 text-red-500"
            onClick={() => onDelete(suiteId, testCase.id)}
          >
            <HiTrash className="w-3.5 h-3.5" />
          </Button>
          <button
            type="button"
            onClick={onOpen}
            className="p-1 rounded-md hover:bg-indigo-50 transition-colors"
          >
            <HiChevronRight className="w-5 h-5 text-indigo-500" />
          </button>
        </div>
      </div>

      {/* Toggle Graded Status */}
      <div className="border-t border-gray-100 bg-gray-50 px-2.5 py-1.5 flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">Type</span>
        <button
          onClick={() => onUpdate(suiteId, testCase.id, "hidden", !testCase.hidden)}
          className={cn(
            "px-2 py-1 rounded text-xs font-semibold transition-colors",
            testCase.hidden
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          )}
        >
          {testCase.hidden ? (
            <span className="flex items-center gap-1">
              <HiOutlineLockClosed className="w-3 h-3" /> Graded
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <HiEye className="w-3 h-3" /> Visible
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
