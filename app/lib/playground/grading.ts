import { TestSuiteResult, TestResult } from './test_runner';
import { Assignment } from '@/lib/api/assignment';

export interface GradeBreakdown {
    test_case_score: number;
    node_count_score: number;
    total_score: number;
}

/**
 * Calculate grade based on test results and node count
 * 
 * @param testResults - Results from running all test cases
 * @param nodeCount - Number of nodes used in the solution
 * @param assignment - Assignment configuration with grading policy
 * @returns Grade breakdown with individual scores
 */
export function calculateGrade(
    testResults: TestSuiteResult,
    nodeCount: number,
    assignment: Assignment
): GradeBreakdown {
    // Get grading policy from assignment (default: 80% test, 20% efficiency)
    const policy = assignment.settings?.grade_policy?.weight || {
        test_case: 80,
        number_of_node_used: 20
    };

    // 1. Calculate Test Case Score
    const passedTests = testResults.results.filter(r => r.passed).length;
    const totalTests = testResults.results.length;
    const testPercentage = totalTests > 0 ? (passedTests / totalTests) : 0;
    const testScore = testPercentage * policy.test_case;

    // 2. Calculate Node Count Score (Efficiency)
    const maxNodes = assignment.condition?.execution_constraints?.max_nodes;
    let nodeScore = 0;

    if (maxNodes && maxNodes > 0) {
        if (nodeCount <= maxNodes) {
            // Linear scaling: fewer nodes = higher score
            // Formula: (1 - (nodes-1)/max) * weight
            // Example: 5 nodes with max 10 → (1 - 4/10) * 20 = 12 points
            const efficiency = 1 - ((nodeCount - 1) / maxNodes);
            nodeScore = Math.max(0, efficiency * policy.number_of_node_used);
        }
        // If exceeds max nodes, score = 0
    } else {
        // No constraint specified, give full efficiency score
        nodeScore = policy.number_of_node_used;
    }

    return {
        test_case_score: Math.round(testScore * 10) / 10,
        node_count_score: Math.round(nodeScore * 10) / 10,
        total_score: Math.round((testScore + nodeScore) * 10) / 10
    };
}
