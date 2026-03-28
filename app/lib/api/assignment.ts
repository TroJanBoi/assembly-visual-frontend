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
  settings: AssignmentSettings | null; // Nullable based on incompleteness
  condition: AssignmentCondition | null;
}

// --- Interfaces for API Payloads ---

export interface CreateMainAssignmentPayload {
  title: string;
  description: string | null;
  due_date: string | null;
  max_attempt: number;
  grade: number;
  condition: object;
  settings: object;
}

export interface UpdateAssignmentPayload {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  max_attempt?: number;
  grade?: number;
  condition?: object;
  setting?: object; // Note: Backend uses 'setting' (singular) for PUT
}

export interface AddTestSuitePayload {
  name: string;
}

interface TestCaseStatePayload {
  flags?: { [key: string]: number };
  memory?: { [address: string]: number };
  register?: { [key: string]: number };
  io_input?: { [key: string]: string };
  io_output?: { [key: string]: string };
  halted?: boolean;
  _meta?: any;
}

export interface AddTestCasePayload {
  name: string;
  init: TestCaseStatePayload;
  assert: TestCaseStatePayload;
}

export interface TestSuiteResponse {
  id: number;
  assignment_id: number;
  name: string;
}

export interface TestCaseResponse {
  id: number;
  name: string;
  test_suite_id: number;
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
  return apiFetch<Assignment[]>(`/api/v2/classroom/${pathClassId}/assignment`).then(
    (res) => res || [],
  );
}

/**
 * Fetches all test suites for a specific assignment.
 */
export async function getTestSuites(
  classId: string | number,
  assignmentId: string | number
): Promise<TestSuiteResponse[]> {
  const pathClassId = typeof classId === "number" ? classId.toString() : classId;
  const pathAssignmentId =
    typeof assignmentId === "number" ? assignmentId.toString() : assignmentId;
  return apiFetch<TestSuiteResponse[]>(
    `/api/v2/classroom/${pathClassId}/assignment/${pathAssignmentId}/test-suite`
  );
}

/**
 * Fetches all test cases for a specific test suite.
 */
export async function getTestCases(
  classId: string | number,
  assignmentId: string | number,
  suiteId: string | number
): Promise<TestCaseResponse[]> {
  const pathClassId = typeof classId === "number" ? classId.toString() : classId;
  const pathAssignmentId =
    typeof assignmentId === "number" ? assignmentId.toString() : assignmentId;
  const pathSuiteId = typeof suiteId === "number" ? suiteId.toString() : suiteId;
  return apiFetch<TestCaseResponse[]>(
    `/api/v2/classroom/${pathClassId}/assignment/${pathAssignmentId}/test-suite/${pathSuiteId}/test-case`
  );
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
    `/api/v2/classroom/${pathClassId}/assignment/${pathAssignmentId}`,
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
    `/api/v2/classroom/${pathClassId}/assignment`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  ).then((res: any) => ({
    ...res,
    id: res.id || res.assignment_id // Handle backend returning assignment_id
  }));
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
  return apiFetch<{ id: number; assignment_id: number; name: string }>(
    `/api/v2/classroom/${pathClassId}/assignment/${assignmentId}/test-suite`,
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
    `/api/v2/classroom/${pathClassId}/assignment/${assignmentId}/test-suite/${suiteId}/test-case/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Updates an assignment by ID.
 */
export async function updateAssignment(
  classId: string | number,
  assignmentId: string | number,
  data: UpdateAssignmentPayload
): Promise<{ message: string }> {
  const pathClassId = typeof classId === "number" ? classId.toString() : classId;
  const pathAssignmentId = typeof assignmentId === "number" ? assignmentId.toString() : assignmentId;

  return apiFetch<{ message: string }>(
    `/api/v2/classroom/${pathClassId}/assignment/${pathAssignmentId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}
