"use client";
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { OwnerSubmission } from "@/lib/api/submission";
import { Assignment } from "@/lib/api/assignment";
import { TestSuite, runTestSuite, TestResult, TestSuiteResult } from "@/lib/playground/test_runner";
import { parseProgramItems } from "@/lib/playground/parser";
import { buildInitialCPUState } from "@/lib/playground/cpu-init";
import { toast } from "sonner";
import { HiOutlineCode, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from "react-icons/hi";
import { cn } from "@/lib/utils";

interface SubmissionRunModalProps {
    open: boolean;
    onClose: () => void;
    submission: OwnerSubmission | null;
    assignment: Assignment | null;
    testSuites: TestSuite[];
}

export default function SubmissionRunModal({
    open,
    onClose,
    submission,
    assignment,
    testSuites,
}: SubmissionRunModalProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<TestSuiteResult[]>([]);
    const [hasRun, setHasRun] = useState(false);

    useEffect(() => {
        if (open) {
            setResults([]);
            setHasRun(false);
        }
    }, [open, submission]);

    const handleRun = async () => {
        if (!submission || !assignment) return;
        setIsRunning(true);
        setResults([]);

        try {
            // 1. Parse the submitted visual code into executable items
            const itemSnapshot = submission.item_snapshot as any;
            if (!itemSnapshot || !itemSnapshot.nodes || !itemSnapshot.edges) {
                toast.error("Invalid submission snapshot. Missing nodes or edges.");
                setIsRunning(false);
                return;
            }

            const programItems = parseProgramItems(
                itemSnapshot.nodes,
                itemSnapshot.edges,
                itemSnapshot.variables || []
            );

            if (programItems.length === 0) {
                toast.error("No valid instructions found in the submission.");
                setIsRunning(false);
                return;
            }

            // 2. Prepare CPU initialState
            const initialState = buildInitialCPUState(assignment);

            // Integrate student's initial memory/variables into state
            const computedMemory = [...(initialState.memory || [])];
            (itemSnapshot.variables || []).forEach((v: any) => {
                const existingIdx = computedMemory.findIndex((m) => m.address === v.address);
                if (existingIdx !== -1) {
                    computedMemory[existingIdx].value = v.value;
                } else {
                    computedMemory.push({ address: v.address, value: v.value });
                }
            });
            computedMemory.sort((a, b) => a.address - b.address);
            initialState.memory = computedMemory;

            // 3. Run all test suites
            const newResults: TestSuiteResult[] = [];
            for (const suite of testSuites) {
                const suiteResult = await runTestSuite(suite, programItems, initialState);
                newResults.push(suiteResult);
            }

            setResults(newResults);
            setHasRun(true);
            toast.success("Execution completed.");
        } catch (error: any) {
            console.error("Failed to run submission:", error);
            toast.error(error.message || "Failed to execute the program.");
        } finally {
            setIsRunning(false);
        }
    };

    const totalTests = results.reduce((acc, suite) => acc + suite.results.length, 0);
    const passedTests = results.reduce(
        (acc, suite) => acc + suite.results.filter((r) => r.passed).length,
        0
    );

    return (
        <Modal open={open} onClose={onClose} title="Run Submission" maxWidth="3xl">
            <div className="py-4 space-y-6">
                {/* Header Info */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Evaluating Attempt {submission?.attempt_no}</p>
                        <p className="text-base font-semibold text-gray-900 mt-1 flex items-center gap-2">
                            <HiOutlineCode className="w-5 h-5 text-indigo-500" />
                            {testSuites.reduce((acc, ts) => acc + ts.cases.length, 0)} Total Test Cases Available
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            This will execute the student's program (snapshot) against the configured test suites.
                        </p>
                    </div>
                    <Button
                        onClick={handleRun}
                        disabled={isRunning || !submission}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm whitespace-nowrap"
                    >
                        {isRunning ? (
                            <>
                                <HiOutlineClock className="w-4 h-4 mr-2 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <HiOutlineCode className="w-4 h-4 mr-2" />
                                Execute Code
                            </>
                        )}
                    </Button>
                </div>

                {/* Results Section */}
                {hasRun && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">Execution Results</h3>
                            <div className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                                passedTests === totalTests ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {passedTests} / {totalTests} Passed
                            </div>
                        </div>

                        {results.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                                No test suites found for this assignment.
                            </div>
                        ) : (
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 rounded-lg">
                                {results.map((suiteResult, idx) => {
                                    const suite = testSuites.find((ts) => ts.id === suiteResult.suiteId);
                                    if (!suite) return null;

                                    return (
                                        <div key={idx} className="bg-white border text-sm border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                                <h4 className="font-semibold text-gray-800">{suite.name}</h4>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {suiteResult.results.filter((r) => r.passed).length} / {suiteResult.results.length} Passed
                                                </span>
                                            </div>

                                            <div className="divide-y divide-gray-100">
                                                {suiteResult.results.map((res, rIdx) => {
                                                    const testCase = suite.cases.find((tc) => tc.id === res.caseId);
                                                    return (
                                                        <div key={rIdx} className={cn(
                                                            "p-4 flex flex-col sm:flex-row gap-4 hover:bg-gray-50/50 transition-colors",
                                                            !res.passed && "bg-red-50/30 hover:bg-red-50/50"
                                                        )}>
                                                            <div className="flex-shrink-0 pt-0.5">
                                                                {res.passed ? (
                                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                                        <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                                                        <HiOutlineXCircle className="w-5 h-5 text-red-600" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <p className="font-medium text-gray-900">{testCase?.name || "Unknown Case"}</p>
                                                                    {testCase?.isHidden && (
                                                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ml-2">Hidden</span>
                                                                    )}
                                                                </div>

                                                                {res.error ? (
                                                                    <div className="mt-2 bg-red-100 text-red-700 p-2.5 rounded-md text-xs font-mono break-words border border-red-200">
                                                                        <strong>Runtime Error:</strong> {res.error}
                                                                    </div>
                                                                ) : !res.passed && res.failedConditions.length > 0 ? (
                                                                    <div className="mt-2 space-y-2">
                                                                        {res.failedConditions.map((fail, fIdx) => (
                                                                            <div key={fIdx} className="bg-red-50 border border-red-100 p-2.5 rounded-md text-xs font-mono grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                <div className="text-red-800">
                                                                                    <span className="font-semibold">{fail.condition.type} [{fail.condition.location}]</span>
                                                                                    <div className="text-gray-500 mt-1 flex items-center">
                                                                                        Expected <span className="mx-1 inline-block bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">{fail.condition.value}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-red-600 flex flex-col justify-end">
                                                                                    <span className="truncate" title={fail.actualValue}>Actual <span className="mx-1 inline-block bg-white border border-red-200 px-1.5 py-0.5 rounded text-red-700 font-bold">{fail.actualValue}</span></span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Modal>
    );
}
