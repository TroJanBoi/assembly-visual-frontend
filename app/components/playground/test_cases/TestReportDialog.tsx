
import React, { useState } from "react";

import { TestSuiteResult, TestResult, TestCondition, TestSuite } from "@/lib/playground/test_runner";
import { CheckCircle2, XCircle, AlertCircle, ChevronRight, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    result: TestSuiteResult | null;
    suiteName: string;
    onRerun: () => void;
}

export default function TestReportDialog({ isOpen, onClose, result, suiteName, onRerun }: Props) {
    if (!result) return null;

    const totalTests = result.results.length;
    const passedTests = result.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    // Determine overall status color
    const isSuccess = passedTests === totalTests && totalTests > 0;
    const isPartial = passedTests > 0 && passedTests < totalTests;
    const isFailure = passedTests === 0 && totalTests > 0;

    return (
        <div className={cn(
            "fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header Section */}
                <div className={cn(
                    "px-6 py-6 border-b border-gray-100 dark:border-slate-800",
                    isSuccess ? "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30" :
                        isPartial ? "bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30" :
                            "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                )}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
                                {isSuccess ? "All Tests Passed!" :
                                    isPartial ? "Some Tests Failed" :
                                        "Tests Failed"}
                            </h2>
                            <p className="text-gray-500 font-medium">
                                Suggestion: {isSuccess ? "Great job! logic looks correct." : "Review the failed cases below."}
                            </p>
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm font-mono font-bold text-lg",
                            isSuccess ? "bg-white dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800" :
                                isPartial ? "bg-white dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800" :
                                    "bg-white dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                        )}>
                            <span>{passRate}%</span>
                            <span className="text-sm font-normal text-gray-400 ml-1">PASS RATE</span>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex gap-8 mt-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</span>
                            <span className="text-xl font-bold text-gray-700 dark:text-gray-200">{totalTests}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Passed</span>
                            <span className="text-xl font-bold text-green-600 dark:text-green-400">{passedTests}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Failed</span>
                            <span className="text-xl font-bold text-red-600 dark:text-red-400">{failedTests}</span>
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-black/20 p-6 space-y-3">
                    {result.results.map((r, idx) => (
                        <TestCaseResultItem key={r.caseId} result={r} index={idx} />
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 z-10">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={onRerun}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all hover:translate-y-[-1px]"
                    >
                        <RefreshCw size={16} />
                        Run Tests Again
                    </button>
                </div>

            </div>
        </div>
    );
}

function TestCaseResultItem({ result, index }: { result: TestResult, index: number }) {
    const [isExpanded, setIsExpanded] = useState(!result.passed); // Auto-expand failed tests

    return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border",
                        result.passed ? "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                    )}>
                        {result.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Test Case #{index + 1}</h4>
                        {result.error ? (
                            <span className="text-xs text-red-500 dark:text-red-400 font-medium">Runtime Error</span>
                        ) : (
                            <span className={cn("text-xs font-medium", result.passed ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
                                {result.passed ? "Passed" : `${result.failedConditions.length} Checks Failed`}
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-gray-400">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-black/20 p-4 animate-in slide-in-from-top-2 duration-200">
                    {result.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm border border-red-100 dark:border-red-800 mb-3 flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <div>
                                <span className="font-bold block mb-1">Runtime Error:</span>
                                {result.error}
                            </div>
                        </div>
                    )}

                    {!result.passed && result.failedConditions.length > 0 && (
                        <div className="space-y-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">Check</th>
                                        <th className="px-3 py-2 font-medium">Expected</th>
                                        <th className="px-3 py-2 font-medium">Actual</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                    {result.failedConditions.map((fail, i) => (
                                        <tr key={i} className="hover:bg-red-50/10 dark:hover:bg-red-900/10">
                                            <td className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300 border-l-4 border-red-400">
                                                {formatLocation(fail.condition)}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-gray-600 dark:text-gray-400 bg-green-50/30 dark:bg-green-900/10">
                                                {fail.condition.value}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-red-600 dark:text-red-400 font-bold bg-red-50/30 dark:bg-red-900/10">
                                                {fail.actualValue}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {result.passed && !result.error && (
                        <div className="text-center py-2 text-green-600 text-sm font-medium flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> All expectations met
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function formatLocation(cond: TestCondition): string {
    switch (cond.type) {
        case 'Register': return `Register ${cond.location}`;
        case 'Memory': return `Memory [${cond.location}]`;
        case 'Flag': return `Flag ${cond.location}`;
        case 'Output': return `Output Port ${cond.location}`;
        case 'Input': return `Input Port ${cond.location}`;
        default: return cond.location;
    }
}
