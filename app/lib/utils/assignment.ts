import { Assignment } from "@/lib/api/assignment";

/**
 * Checks if an assignment is incomplete (missing conditions or settings).
 * This typically happens when an assignment is imported from Google Classroom
 * but hasn't been set up in our system yet.
 */
export function isAssignmentIncomplete(assignment: Assignment): boolean {
    if (!assignment) return true;

    // Check if critical fields are null, undefined, or empty objects
    const hasSettings = assignment.settings !== null
        && assignment.settings !== undefined
        && Object.keys(assignment.settings).length > 0;

    const hasCondition = assignment.condition !== null
        && assignment.condition !== undefined
        && Object.keys(assignment.condition).length > 0;

    return !hasSettings || !hasCondition;
}
