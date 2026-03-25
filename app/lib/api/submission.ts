import { apiFetch, post, put } from './client';
import { TestSuiteResult } from '../playground/test_runner';

/** Submission as seen by an owner (all students, single assignment) */
export interface OwnerSubmission {
    id: number;
    user_id: number;
    assignment_id: number;
    playground_id: number;
    attempt_no: number;
    score: number | null;
    feed_back: string | null;
    status: string;
    is_verified: boolean;
    duration_ms: number;
    item_snapshot?: any;
    created_at: string;
    updated_at: string;
}

export interface SubmissionPayload {
    assignment_id: number;
    playground_id?: number;
    attempt_no: number;
    item_snapshot: any;
    client_result: {
        test_results: TestSuiteResult;
        passed_count: number;
        total_count: number;
    };
    server_result: {
        is_pass: boolean;
        verified_score: number;
        score_breakdown: any;
    };
    score: number;
    status: string;
    is_verified: boolean;
    duration_ms: number;
}

export interface Submission extends SubmissionPayload {
    id: number;
    attempt_no: number; // Changed from attempt_number to match backend
    created_at: string;
}

export interface UpdateGradePayload {
    score: number;
    is_verified: boolean;
    feed_back?: string;
}

export async function submitAssignment(payload: SubmissionPayload): Promise<Submission> {
    return post<Submission>('/api/v2/submission/', payload);
}

export async function getSubmissions(
    assignmentId: number,
    _userId?: number
): Promise<Submission | null> {
    try {
        return await apiFetch<Submission>(
            `/api/v2/submission/assignment/${assignmentId}`
        );
    } catch (error: any) {
        if (error.status === 404) {
            return null;
        }
        // Handle GORM/Backend returning 500 for "record not found"
        if (error.status === 500 && error.data?.error?.includes("record not found")) {
            return null;
        }
        throw error;
    }
}

/**
 * Fetches all submissions for the current user and assignment.
 */
export async function getMySubmissions(assignmentId: number): Promise<Submission[]> {
    try {
        const res = await apiFetch<Submission[] | null>(`/api/v2/submission/assignment/${assignmentId}/user`);
        return res || [];
    } catch (error: any) {
        if (error.status === 404 || (error.status === 500 && error.data?.error?.includes("record not found"))) {
            return [];
        }
        throw error;
    }
}

export async function getSubmissionById(id: number | string): Promise<Submission> {
    return apiFetch<Submission>(`/api/v2/submission/${id}`);
}

/** Owner: get ALL submissions (from all students) for a given assignment */
export async function getAllSubmissionsForAssignment(assignmentId: number): Promise<OwnerSubmission[]> {
    try {
        const res = await apiFetch<OwnerSubmission[] | null>(`/api/v2/submission/assignment/${assignmentId}`);
        return res || [];
    } catch (error: any) {
        if (error.status === 404 || (error.status === 500 && error.data?.error?.includes('record not found'))) {
            return [];
        }
        throw error;
    }
}

/** API to update a submission's grade and feedback */
export async function updateGrade(submissionId: number | string, payload: UpdateGradePayload): Promise<{ message: string }> {
    return put<{ message: string }>(`/api/v2/submission/${submissionId}/grade`, payload);
}

