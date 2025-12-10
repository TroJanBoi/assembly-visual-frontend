"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastAlert/ToastAlert";

// Import types from the central file
import {
  type AssignmentFormData,
  type TestSuite,
  type TestCase,
  type TestCondition,
  type Step,
} from "@/types/assignment";

// --- CORRECTED IMPORTS ---
// Import Class-related functions from class.ts
import { Class, getClassById } from "@/lib/api/class";
// Import Assignment-related functions from assignment.ts
import {
  createAssignment as createMainAssignment,
  addTestSuite,
  addTestCase,
} from "@/lib/api/assignment";
// --- END CORRECTED IMPORTS ---

// Import Step components
import Step1Detail from "@/components/assignment/steps/Step1Detail";
import Step2Conditional from "@/components/assignment/steps/Step2Conditional";
import Step3Grading from "@/components/assignment/steps/Step3Grading";

// Define the shape of the state payload expected by the backend for Test Cases
interface TestCaseStatePayload {
  flags?: { [key: string]: number };
  memory?: { address: number; value: number }[];
  register?: { [key: string]: number };
}

// List of all instructions grouped by category for conversion
const allInstructionsByCategory = {
  system: ["LABEL", "NOP"],
  data_movement: ["MOV", "LOAD", "STORE"],
  arithmetic: ["ADD", "SUB", "MUL", "DIV", "INC", "DEC"],
  comparison_and_conditional: ["CMP", "JMP", "JZ", "JNZ", "JC", "JNC", "JN"],
  stack: ["PUSH", "POP"],
};

export default function CreateAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState<Step>("detail");
  const [classData, setClassData] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingClass, setIsFetchingClass] = useState(true);

  const [formData, setFormData] = useState<AssignmentFormData>({
    assignmentName: "",
    description: "",
    hasDueDate: false,
    dueDate: "",
    hasLimitAttempts: false,
    limitAttempts: "",
    allowLateSubmissions: false,
    lockAfterFinal: false,
    registerCount: 8,
    initialMemory: [],
    disallowedInstructions: [],
    testSuites: [],
    maxScore: "100",
    gradingMode: "auto",
    efficiencyEnabled: false,
    maxNodes: "",
    efficiencyWeight: "0",
  });

  const getStepTitle = (step: Step): string => {
    switch (step) {
      case "detail":
        return "Assignment Detail";
      case "conditional":
        return "Assignment Conditions";
      case "grading":
        return "Grading Policy";
      default:
        return "New Assignment";
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchClassData = async () => {
      try {
        setIsFetchingClass(true);
        const data = await getClassById(id);
        setClassData(data);
      } catch (error: any) {
        console.error("fetchClassData error:", error);
        addToast(error.message || "Failed to load class data.", "error");
        router.back();
      } finally {
        setIsFetchingClass(false);
      }
    };
    fetchClassData();
  }, [id, addToast, router]);

  const transformConditionsToState = (
    conditions: TestCondition[],
  ): TestCaseStatePayload => {
    const state: TestCaseStatePayload = { flags: {}, memory: [], register: {} };
    conditions.forEach((cond) => {
      const value = parseInt(cond.value, 10);
      if (isNaN(value)) return;
      switch (cond.type) {
        case "Register":
          if (state.register) state.register[cond.location] = value;
          break;
        case "Memory":
          const addr = parseInt(cond.location, 10);
          if (!isNaN(addr) && state.memory)
            state.memory.push({ address: addr, value: value });
          break;
        case "Flag":
          if (state.flags && (value === 0 || value === 1))
            state.flags[cond.location] = value;
          break;
      }
    });
    if (Object.keys(state.flags || {}).length === 0) delete state.flags;
    if ((state.memory || []).length === 0) delete state.memory;
    if (Object.keys(state.register || {}).length === 0) delete state.register;
    return state;
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const score = parseInt(formData.maxScore, 10);
      if (isNaN(score) || score < 0 || score > 100)
        throw new Error("Max Score must be between 0 and 100.");
      if (formData.gradingMode === "auto" && formData.efficiencyEnabled) {
        const nodes = parseInt(formData.maxNodes, 10);
        if (isNaN(nodes) || nodes <= 0)
          throw new Error("Max Nodes must be a positive number.");
      }

      const allowedInstructionsMap: { [key: string]: { [key: string]: 1 } } =
        {};
      Object.entries(allInstructionsByCategory).forEach(
        ([category, instructions]) => {
          const allowedInCategory: { [key: string]: 1 } = {};
          instructions.forEach((inst) => {
            if (!formData.disallowedInstructions.includes(inst)) {
              allowedInCategory[inst.toLowerCase()] = 1;
            }
          });
          if (Object.keys(allowedInCategory).length > 0) {
            allowedInstructionsMap[category] = allowedInCategory;
          }
        },
      );

      const conditionData = {
        allowed_instructions: allowedInstructionsMap,
        execution_constraints: {
          register_count: formData.registerCount,
          max_nodes:
            formData.gradingMode === "auto" && formData.efficiencyEnabled
              ? Number(formData.maxNodes) || null
              : null,
        },
        initial_state: { memory: formData.initialMemory },
      };

      const settingsData = {
        fe_behavior: {
          allow_resubmit_after_due: formData.allowLateSubmissions,
          lock_after_submit: formData.lockAfterFinal,
        },
        grade_policy: {
          mode: formData.gradingMode,
          weight: {
            test_case:
              formData.gradingMode === "auto"
                ? (100 - (Number(formData.efficiencyWeight) || 0)) / 100
                : 0,
            number_of_node_used:
              formData.gradingMode === "auto" && formData.efficiencyEnabled
                ? (Number(formData.efficiencyWeight) || 0) / 100
                : 0,
          },
        },
        test_case_policy: { visible_to_student: true },
      };

      const mainAssignmentPayload = {
        title: formData.assignmentName,
        description: formData.description || null,
        due_date: formData.hasDueDate ? formData.dueDate : null,
        max_attempts: formData.hasLimitAttempts
          ? Number(formData.limitAttempts) || 0
          : 0,
        grade: score,
        condition: conditionData,
        settings: settingsData,
      };

      console.log(
        "Submitting Payload:",
        JSON.stringify(mainAssignmentPayload, null, 2),
      );

      // 1. Create Main Assignment
      const createdAssignment = await createMainAssignment(
        id,
        mainAssignmentPayload,
      );
      const newAssignmentId = createdAssignment?.id;

      if (!newAssignmentId) {
        throw new Error("API did not return an ID for the new assignment.");
      }

      // 2. Create Test Suites & Cases (if any)
      if (formData.testSuites && formData.testSuites.length > 0) {
        for (const suite of formData.testSuites) {
          // Create Test Suite
          const createdSuite = await addTestSuite(id, newAssignmentId, {
            name: suite.name,
          });
          const suiteId = createdSuite?.id;

          if (suiteId && suite.testCases && suite.testCases.length > 0) {
            // Create Test Cases under this suite
            for (const testCase of suite.testCases) {
              const testCasePayload = {
                name: testCase.name || "Untitled Case",
                init: transformConditionsToState(testCase.initialState || []),
                assert: transformConditionsToState(testCase.expectedState || []),
              };
              await addTestCase(id, newAssignmentId, suiteId, testCasePayload);
            }
          }
        }
      }

      addToast("Assignment created successfully!", "success");

      setTimeout(() => {
        router.push(`/class/${id}`);
      }, 1500);
    } catch (error: any) {
      console.error("Submit Error:", error);
      addToast(error.message || "An unexpected error occurred.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const Breadcrumbs = () => (
    <div className="flex justify-center items-center gap-2 text-sm text-gray-500 mb-4">
      <span
        className={
          currentStep === "detail" ? "font-semibold text-indigo-600" : ""
        }
      >
        Detail
      </span>
      <HiChevronRight className="w-4 h-4 text-gray-400" />
      <span
        className={
          currentStep === "conditional" ? "font-semibold text-indigo-600" : ""
        }
      >
        Conditional
      </span>
      <HiChevronRight className="w-4 h-4 text-gray-400" />
      <span
        className={
          currentStep === "grading" ? "font-semibold text-indigo-600" : ""
        }
      >
        Grading policy
      </span>
    </div>
  );

  if (isFetchingClass) {
    return <div className="p-6 text-center">Loading class data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 mb-24">
      <Breadcrumbs />
      <h1 className="text-3xl font-bold mb-6">{getStepTitle(currentStep)}</h1>

      <div className="space-y-6">
        {currentStep === "detail" && (
          <Step1Detail formData={formData} setFormData={setFormData} />
        )}
        {currentStep === "conditional" && (
          <Step2Conditional formData={formData} setFormData={setFormData} />
        )}
        {currentStep === "grading" && (
          <Step3Grading formData={formData} setFormData={setFormData} />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 md:px-6 py-3">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === "detail") router.back();
              else if (currentStep === "grading") setCurrentStep("conditional");
              else if (currentStep === "conditional") setCurrentStep("detail");
            }}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {currentStep === "detail" ? (
              "Cancel"
            ) : (
              <>
                <HiChevronLeft className="w-5 h-5" /> Back
              </>
            )}
          </Button>
          {currentStep !== "grading" ? (
            <Button
              onClick={() => {
                if (currentStep === "detail") setCurrentStep("conditional");
                else if (currentStep === "conditional")
                  setCurrentStep("grading");
              }}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              Next <HiChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Creating..." : "Create Assignment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
