
import React, { useEffect, useState } from "react";
import { Assignment } from "@/lib/api/assignment";
import { TestSuite } from "@/lib/playground/test_runner";
import { ProgramItem } from "@/lib/api/playground";
import { CPUState } from "@/lib/playground/cpu";
import { runTestSuite, TestSuiteResult } from "@/lib/playground/test_runner";
import { submitAssignment, SubmissionPayload } from "@/lib/api/submission";
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

type Step = "running" | "calculating" | "submitting" | "completed" | "error";

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

    const runGrading = async () => {
        try {
            // Fetch fresh test suites to avoid using cached data
            const freshTestSuites = await getTestSuitesForAssignment(assignment.id);
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
            const gradePolicy = assignment.settings.grade_policy.weight;

            // 1. Test Case Score
            let totalTests = 0;
            let passedTests = 0;
            allResults.forEach(s => {
                s.results.forEach(r => {
                    totalTests++;
                    if (r.passed) passedTests++;
                });
            });
            const testScoreRaw = totalTests > 0 ? (passedTests / totalTests) : 0;
            const testScoreWeighted = testScoreRaw * gradeConfigValue(gradePolicy.test_case);

            // 2. Node Count Score
            const maxNodes = assignment.condition.execution_constraints?.max_nodes || 999;
            const usedNodes = program.filter(n => n.instruction !== 'START').length;
            const nodeCountScoreRaw = usedNodes <= maxNodes ? 1 : 0;
            const nodeScoreWeighted = nodeCountScoreRaw * gradeConfigValue(gradePolicy.number_of_node_used);

            const final = Math.round(testScoreWeighted + nodeScoreWeighted);
            setFinalScore(final);
            setProgress(90);

            // Submit
            setStep("submitting");

            const payload: SubmissionPayload = {
                user_id: userId,
                assignment_id: assignment.id,
                playground_id: playgroundId,
                item_snapshot: { items: program, cpu_state: defaultCpuState },
                client_result: {
                    test_results: allResults[0] || { suiteId: "none", results: [], timestamp: Date.now() },
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
                feedback: null
            };

            await submitAssignment(payload);

            setProgress(100);
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
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 space-y-6 border border-gray-200">

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Grading Submission</h2>
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span className="capitalize">{step}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
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
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                <div className="flex items-center gap-3">
                                    {r.passed ?
                                        <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    }
                                    <span className="font-medium italic text-gray-500">
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

                {/* Final Status */}
                {step === 'completed' && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center shadow-sm">
                        <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider">Final Score</h3>
                        <div className="text-4xl font-black text-green-600 mt-1">{finalScore} <span className="text-lg text-green-400 font-normal">/ {assignment.grade}</span></div>
                    </div>
                )}

                {step === 'error' && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center text-red-600 text-sm">
                        {errorMsg}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-2">
                    {(step === 'completed' || step === 'error') ? (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Close
                        </button>
                    ) : (
                        <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg flex items-center gap-2 cursor-not-allowed">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Running Tests...
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
