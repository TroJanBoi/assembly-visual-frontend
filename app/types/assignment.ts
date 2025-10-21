// app/types/assignment.ts
export interface TestCondition {
  id: string;
  type: "Register" | "Memory" | "Flag";
  location: string;
  value: string;
}

export interface TestCase {
  id: string;
  name: string;
  isEnabled: boolean;
  initialState: TestCondition[]; // แก้ไข: any[] -> TestCondition[]
  expectedState: TestCondition[]; // แก้ไข: any[] -> TestCondition[]
}

export interface TestSuite {
  id: string;
  name: string;
  isGrading: boolean;
  isHidden: boolean;
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
