import { Assignment } from "@/lib/api/assignment";

/**
 * Checks if an assignment is incomplete (missing conditions or settings).
 * This typically happens when an assignment is imported from Google Classroom
 * but hasn't been set up in our system yet.
 */
export function isAssignmentIncomplete(assignment: Assignment): boolean {
    if (!assignment) return true;

    // Check if critical fields are null or undefined
    // Based on the user's request, we need to ensure setting and condition exist
    const hasSettings = assignment.settings !== null && assignment.settings !== undefined;
    const hasCondition = assignment.condition !== null && assignment.condition !== undefined;

    return !hasSettings || !hasCondition;
}
