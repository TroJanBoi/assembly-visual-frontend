
import React, { useEffect, useState } from "react";
import { Assignment } from "@/lib/api/assignment";
import { TestSuite } from "@/lib/playground/test_runner";
import { ProgramItem } from "@/lib/api/playground";
import { CPUState } from "@/lib/playground/cpu";
import { runTestSuite, TestSuiteResult } from "@/lib/playground/test_runner";
import { submitAssignment, SubmissionPayload, getSubmissions, getMySubmissions } from "@/lib/api/submission";
import { getTestSuitesForAssignment } from "@/lib/api/test_cases";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface SubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment;
    testSuites: TestSuite[];
    program: ProgramItem[];
    defaultCpuState: CPUState;
    userId: number;
    playgroundId?: number;
    onSubmissionComplete: () => void;
}

type Step = "running" | "calculating" | "graded" | "submitting" | "completed" | "error";

export default function SubmissionModal({
    isOpen,
    onClose,
    assignment,
    testSuites,
    program,
    defaultCpuState,
    userId,
    playgroundId,
    onSubmissionComplete,
}: SubmissionModalProps) {
    const [step, setStep] = useState<Step>("running");
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<TestSuiteResult[]>([]);
    const [finalScore, setFinalScore] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loadedTestSuites, setLoadedTestSuites] = useState<TestSuite[]>([]);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep("running");
            setProgress(0);
            setResults([]);
            setFinalScore(0);
            setErrorMsg(null);
            setLoadedTestSuites([]);
            runGrading();
        }
    }, [isOpen]);

    const gradeConfigValue = (val: any) => typeof val === 'number' ? val : 0;

    const calculateScores = (currentResults: TestSuiteResult[]) => {
        const gradePolicy = assignment.settings?.grade_policy?.weight || { test_case: 0, number_of_node_used: 0 };

        // 1. Test Case Score
        let totalTests = 0;
        let passedTests = 0;
        currentResults.forEach(s => {
            s.results.forEach(r => {
                totalTests++;
                if (r.passed) passedTests++;
            });
        });
        const testScoreRaw = totalTests > 0 ? (passedTests / totalTests) : 0;
        const testScoreWeighted = testScoreRaw * gradeConfigValue(gradePolicy.test_case);

        // 2. Node Count Score
        const maxNodes = (assignment.condition as any)?.execution_constraints?.max_nodes || 999;
        const usedNodes = program.filter(n => n.instruction !== 'START').length;
        const nodeCountScoreRaw = usedNodes <= maxNodes ? 1 : 0;
        const nodeScoreWeighted = nodeCountScoreRaw * gradeConfigValue(gradePolicy.number_of_node_used);

        const final = Math.round(testScoreWeighted + nodeScoreWeighted);

        return {
            final,
            testScoreWeighted,
            nodeScoreWeighted,
            passedTests,
            totalTests
        };
    };

    const runGrading = async () => {
        try {
            // Fetch fresh test suites to avoid using cached data
            const freshTestSuites = await getTestSuitesForAssignment(assignment.class_id, assignment.id);
            setLoadedTestSuites(freshTestSuites); // Store for display

            const totalCases = freshTestSuites.reduce((acc, s) => acc + s.cases.length, 0);
            let executedCount = 0;
            const allResults: TestSuiteResult[] = [];

            for (const suite of freshTestSuites) {
                // Run suite
                const suiteRes = await runTestSuite(suite, program, defaultCpuState);
                allResults.push(suiteRes);

                executedCount += suite.cases.length;
                setProgress((executedCount / totalCases) * 80);

                // Small delay
                await new Promise(r => setTimeout(r, 400));
            }

            setResults(allResults);
            setStep("calculating");

            // Calculate Score
            const { final } = calculateScores(allResults);
            setFinalScore(final);
            setProgress(100);
            setStep("graded"); // Stop here for confirmation

        } catch (e: any) {
            console.error(e);
            setErrorMsg(e.message || "Grading failed");
            setStep("error");
        }
    };

    const handleConfirmSubmission = async () => {
        try {
            setStep("submitting");

            // Re-calculate details for payload
            const { final, testScoreWeighted, nodeScoreWeighted, passedTests, totalTests } = calculateScores(results);

            // Calculate attempt number
            let attemptNo = 1;
            try {
                const existing = await getMySubmissions(assignment.id);
                if (existing && existing.length > 0) {
                    const maxAttempt = Math.max(...existing.map(s => s.attempt_no || 0));
                    attemptNo = maxAttempt + 1;
                }
            } catch (err) {
                console.warn("Failed to fetch existing attempt count, defaulting to 1", err);
            }

            const payload: SubmissionPayload = {
                // user_id removed (handled by token)
                assignment_id: assignment.id,
                playground_id: playgroundId,
                attempt_no: attemptNo,
                item_snapshot: { items: program, cpu_state: defaultCpuState },
                client_result: {
                    test_results: results[0] || { suiteId: "none", results: [], timestamp: Date.now() },
                    passed_count: passedTests,
                    total_count: totalTests
                },
                server_result: {
                    is_pass: final >= (assignment.grade * 0.5),
                    verified_score: final,
                    score_breakdown: {
                        test_case_score: testScoreWeighted,
                        node_count_score: nodeScoreWeighted,
                        total_score: final
                    }
                },
                score: final,
                status: "submitted",
                is_verified: true,
                duration_ms: 0,
                // feedback removed
            };

            await submitAssignment(payload);

            setStep("completed");
            onSubmissionComplete();

        } catch (e: any) {
            console.error(e);
            setErrorMsg(e.message || "Submission failed");
            setStep("error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 space-y-6 border border-gray-200 dark:border-slate-800">

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {step === 'graded' ? 'Confirm Submission' : 'Grading Submission'}
                    </h2>
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                        <span className="capitalize">{step}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Results List */}
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {results.flatMap(s => s.results).map((r, idx) => {
                        // Determine name and hidden status
                        let testName = "Unknown Test";
                        let isHidden = false;

                        for (const s of loadedTestSuites) {
                            const c = s.cases.find(c => c.id === r.caseId);
                            if (c) {
                                testName = c.name;
                                isHidden = !!c.isHidden || (c as any).init?._meta?.is_hidden;
                                break;
                            }
                        }

                        // Only show hidden tests
                        if (!isHidden) return null;

                        return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 text-sm">
                                <div className="flex items-center gap-3">
                                    {r.passed ?
                                        <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    }
                                    <span className="font-medium italic text-gray-500 dark:text-gray-400">
                                        {testName} (Hidden)
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {results.length === 0 && step === 'running' && (
                        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing Test Suites...</span>
                        </div>
                    )}
                </div>

                {/* Final Status / Preview Phase */}
                {(step === 'completed' || step === 'graded') && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl text-center shadow-sm">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-400 uppercase tracking-wider">Final Score</h3>
                        <div className="text-4xl font-black text-green-600 dark:text-green-500 mt-1">{finalScore} <span className="text-lg text-green-400 dark:text-green-700 font-normal">/ {assignment.grade}</span></div>
                    </div>
                )}

                {step === 'error' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-center text-red-600 dark:text-red-400 text-sm">
                        {errorMsg}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-2 gap-2">
                    {step === 'graded' && (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSubmission}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                            >
                                Confirm Submit
                            </button>
                        </>
                    )}

                    {(step === 'completed' || step === 'error') && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Close
                        </button>
                    )}

                    {(step === 'running' || step === 'calculating' || step === 'submitting') && (
                        <button disabled className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 text-sm font-medium rounded-lg flex items-center gap-2 cursor-not-allowed">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {step === 'submitting' ? 'Submitting...' : 'Running Tests...'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
