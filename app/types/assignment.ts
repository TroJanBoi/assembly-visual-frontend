// app/types/assignment.ts
export interface TestCondition {
  id: string;
  type: "Register" | "Memory" | "Flag" | "Output" | "Input";
  location: string;
  value: string;
}

export interface TestCase {
  id: string;
  name: string;
  isEnabled: boolean;
  hidden: boolean; // true = graded test (hidden from students), false = visible test
  initialState: TestCondition[];
  expectedState: TestCondition[];
}

export interface TestSuite {
  id: string;
  name: string;
  testCases: TestCase[];
}

export interface AssignmentFormData {
  // --- Step 1 ---
  assignmentName: string;
  description: string;
  hasDueDate: boolean;
  dueDate: string;
  hasLimitAttempts: boolean;
  limitAttempts: string;
  allowLateSubmissions: boolean;
  lockAfterFinal: boolean;

  // --- Step 2 ---
  registerCount: number;
  initialMemory: { address: number; value: number }[];
  disallowedInstructions: string[];
  testSuites: TestSuite[];

  // --- Step 3 ---
  maxScore: string;
  gradingMode: "auto" | "manual";
  efficiencyEnabled: boolean;
  maxNodes: string;
  efficiencyWeight: string;
}

// เพิ่ม: Export 'Step' type ที่นี่
export type Step = "detail" | "conditional" | "grading";
