import { apiFetch } from "./client";
import { TestCondition } from "@/types/assignment";

// --- Interfaces based on Backend JSON Response ---

interface GradePolicyWeight {
  test_case: number;
  number_of_node_used: number;
}

interface GradePolicy {
  mode: "auto" | "manual";
  weight: GradePolicyWeight;
}

interface TestCasePolicy {
  visible_to_student: boolean;
}

interface FEBehavior {
  lock_after_submit: boolean;
  allow_resubmit_after_due: boolean;
}

interface AssignmentSettings {
  grade_policy: GradePolicy;
  test_case_policy: TestCasePolicy;
  fe_behavior: FEBehavior;
}

interface AssignmentCondition {
  [category: string]: { [instruction: string]: 1 } | any;
}

export interface Assignment {
  id: number;
  class_id: number;
  title: string;
  description: string;
  due_date: string | null;
  max_attempt: number;
  grade: number;
  settings: AssignmentSettings;
  condition: AssignmentCondition;
}

// --- Interfaces for API Payloads ---

export interface CreateMainAssignmentPayload {
  title: string;
  description: string | null;
  due_date: string | null;
  max_attempts: number;
  grade: number;
  condition: object;
  settings: object;
}

export interface AddTestSuitePayload {
  name: string;
}

interface TestCaseStatePayload {
  flags?: { [key: string]: number };
  memory?: { address: number; value: number }[];
  register?: { [key: string]: number };
}

export interface AddTestCasePayload {
  name: string;
  init: TestCaseStatePayload;
  assert: TestCaseStatePayload;
}

// --- API Functions ---

/**
 * Fetches all assignments for a specific class.
 */
export async function getAssignmentsForClass(
  classId: string | number,
): Promise<Assignment[]> {
  const pathClassId =
    typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<Assignment[]>(`/api/v2/classes/${pathClassId}/assignments`);
}

export async function getAssignmentById(
  classId: string | number,
  assignmentId: string | number,
): Promise<Assignment> {
  const pathClassId =
    typeof classId === "number" ? classId.toString() : classId;
  const pathAssignmentId =
    typeof assignmentId === "number" ? assignmentId.toString() : assignmentId;
  return apiFetch<Assignment>(
    `/api/v2/classes/${pathClassId}/assignments/${pathAssignmentId}`,
  );
}

/**
 * Creates the main assignment record.
 */
export async function createAssignment(
  classId: string | number,
  data: CreateMainAssignmentPayload,
): Promise<{ id: number }> {
  const pathClassId =
    typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<{ id: number }>(
    `/api/v2/classes/${pathClassId}/assignments`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Adds a test suite to an existing assignment.
 */
/**
 * Adds a test suite to an existing assignment.
 */
export async function addTestSuite(
  classId: string | number,
  assignmentId: number,
  data: AddTestSuitePayload,
): Promise<{ id: number }> {
  const pathClassId =
    typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<{ id: number }>(
    `/api/v2/classes/${pathClassId}/assignments/${assignmentId}/test-suites`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Adds a test case to an existing test suite.
 */
export async function addTestCase(
  classId: string | number,
  assignmentId: number,
  suiteId: number,
  data: AddTestCasePayload,
): Promise<any> {
  const pathClassId =
    typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<any>(
    `/api/v2/classes/${pathClassId}/assignments/${assignmentId}/test-suites/${suiteId}/test-cases`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}
