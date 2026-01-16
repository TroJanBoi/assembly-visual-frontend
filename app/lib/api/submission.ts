import { apiFetch, post } from './client';
import { TestSuiteResult } from '../playground/test_runner';

export interface SubmissionPayload {
    user_id: number;
    assignment_id: number;
    playground_id?: number;
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
    submission_uuid: string;
    attempt_number: number;
    created_at: string;
}

export async function submitAssignment(payload: SubmissionPayload): Promise<Submission> {
    return post<Submission>('/api/v2/submissions', payload);
}

export async function getSubmissions(
    assignmentId: number,
    userId: number
): Promise<Submission[]> {
    return apiFetch<Submission[]>(
        `/api/v2/submissions?assignment_id=${assignmentId}&user_id=${userId}`
    );
}

export async function getSubmissionByUuid(uuid: string): Promise<Submission> {
    return apiFetch<Submission>(`/api/v2/submissions/${uuid}`);
}
