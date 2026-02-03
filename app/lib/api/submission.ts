import { apiFetch, post } from './client';
import { TestSuiteResult } from '../playground/test_runner';

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
