import { useState, useEffect } from "react";
import { X, ListTodo, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    TestSuite,
    TestCase,
    createEmptyTestSuite,
    createEmptyTestCase,
    TestSuiteResult,
    TestResult
} from "@/lib/playground/test_runner";
import TestSuiteList from "./TestSuiteList";
import TestCaseEditor from "./TestCaseEditor";
import TestReportDialog from "./TestReportDialog";

/* 
  Mock Data for Dev (Will replace with persistent props later)
*/
const DEFAULT_SUITES: TestSuite[] = [
    {
        id: "suite-1",
        name: "My Test Suite 1",
        cases: [
            {
                id: "case-1",
                name: "Test R0 Accumulator",
                initialState: [
                    { id: "c1", type: "Register", location: "R0", value: "0" }
                ],
                expectedState: [
                    { id: "e1", type: "Register", location: "R0", value: "10" }
                ]
            }
        ]
    }
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    // Execution Props
    onRunTestCase?: (testCase: TestCase) => Promise<TestResult>;
    onRunTestSuite?: (suite: TestSuite) => Promise<TestSuiteResult>;
    availableRegisters: string[];
}

export default function TestManagerModal({ isOpen, onClose, onRunTestCase, onRunTestSuite, availableRegisters }: Props) {
    const [suites, setSuites] = useState<TestSuite[]>(DEFAULT_SUITES);

    // Selection State
    const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>("suite-1");
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>("case-1");

    const activeSuite = suites.find(s => s.id === selectedSuiteId);
    const activeCase = activeSuite?.cases.find(c => c.id === selectedCaseId) ?? null;

    // Handlers
    const handleSelectCase = (sId: string, cId: string) => {
        setSelectedSuiteId(sId);
        setSelectedCaseId(cId);
    };

    const handleAddSuite = () => {
        const newSuite = createEmptyTestSuite();
        setSuites([...suites, newSuite]);
        // Auto select
        setSelectedSuiteId(newSuite.id);
    };

    const handleAddCase = (suiteId: string) => {
        const newCase = createEmptyTestCase();
        setSuites(prev => prev.map(s => {
            if (s.id === suiteId) {
                return { ...s, cases: [...s.cases, newCase] };
            }
            return s;
        }));
        // Auto select
        setSelectedSuiteId(suiteId);
        setSelectedCaseId(newCase.id);
    };

    const handleUpdateCase = (updated: TestCase) => {
        setSuites(prev => prev.map(s => {
            if (s.id === selectedSuiteId) {
                return {
                    ...s,
                    cases: s.cases.map(c => c.id === updated.id ? updated : c)
                };
            }
            return s;
        }));
    };

    const handleRun = async () => {
        if (activeCase && onRunTestCase) {
            await onRunTestCase(activeCase);
        }
    };

    // New Handlers for Edit/Delete actions
    const handleDeleteSuite = (suiteId: string) => {
        if (confirm("Are you sure you want to delete this test suite?")) {
            setSuites(prev => prev.filter(s => s.id !== suiteId));
            if (selectedSuiteId === suiteId) {
                setSelectedSuiteId(null);
                setSelectedCaseId(null);
            }
        }
    };

    const handleRenameSuite = (suiteId: string, newName: string) => {
        setSuites(prev => prev.map(s => s.id === suiteId ? { ...s, name: newName } : s));
    };

    const handleDeleteCase = (suiteId: string, caseId: string) => {
        if (confirm("Delete this test case?")) {
            setSuites(prev => prev.map(s => {
                if (s.id === suiteId) {
                    return { ...s, cases: s.cases.filter(c => c.id !== caseId) };
                }
                return s;
            }));
            if (selectedCaseId === caseId) {
                setSelectedCaseId(null);
            }
        }
    };

    const handleRenameCase = (suiteId: string, caseId: string, newName: string) => {
        setSuites(prev => prev.map(s => {
            if (s.id === suiteId) {
                return {
                    ...s,
                    cases: s.cases.map(c => c.id === caseId ? { ...c, name: newName } : c)
                };
            }
            return s;
        }));
    };

    // Report State
    const [reportResult, setReportResult] = useState<TestSuiteResult | null>(null);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null);

    // Selection State
    const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());

    const handleToggleSelect = (id: string, type: 'suite' | 'case', suiteId?: string) => {
        const newSelected = new Set(selectedTestIds);
        if (type === 'suite') {
            const suite = suites.find(s => s.id === id);
            if (!suite) return;
            const allCases = suite.cases;
            const allSelected = allCases.every(c => newSelected.has(c.id));

            if (allSelected) {
                // Deselect all
                allCases.forEach(c => newSelected.delete(c.id));
            } else {
                // Select all
                allCases.forEach(c => newSelected.add(c.id));
            }
        } else {
            // Toggle case
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
        }
        setSelectedTestIds(newSelected);
    };

    const handleRunSelected = async () => {
        if (selectedTestIds.size === 0) return;

        // Collect all selected cases across all suites
        const selectedCases: TestCase[] = [];
        suites.forEach(suite => {
            suite.cases.forEach(c => {
                if (selectedTestIds.has(c.id)) {
                    selectedCases.push(c);
                }
            });
        });

        // Create a temporary "Selected Tests" suite
        const tempSuite: TestSuite = {
            id: 'temp-selected',
            name: 'Selected Tests',
            cases: selectedCases
        };

        if (onRunTestSuite) {
            setRunningSuiteId('temp-selected');
            try {
                const result = await onRunTestSuite(tempSuite);
                setReportResult(result);
                setIsReportOpen(true);
            } finally {
                setRunningSuiteId(null);
            }
        }
    };

    // --- Actions ---

    const handleRunCase = async () => {
        if (activeCase && onRunTestCase) {
            // Wrap single case result in a suite result structure for consistent reporting
            const result = await onRunTestCase(activeCase);
            setReportResult({
                suiteId: selectedSuiteId || "",
                results: [result],
                timestamp: Date.now()
            });
            setIsReportOpen(true);
        }
    };

    const handleRunSuite = async (suite: TestSuite) => {
        if (onRunTestSuite) {
            setRunningSuiteId(suite.id);
            try {
                const result = await onRunTestSuite(suite);
                setReportResult(result);
                setIsReportOpen(true);
            } finally {
                setRunningSuiteId(null);
            }
        }
    };

    return (
        <>
            <div className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                <div className="w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 relative">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
                    >
                        <X size={18} className="text-gray-600" />
                    </button>

                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <ListTodo size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Test Manager</h2>
                                <p className="text-sm text-gray-500">Create, edit, and run test cases</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {selectedTestIds.size > 0 && (
                                <button
                                    onClick={handleRunSelected}
                                    disabled={!!runningSuiteId}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Play size={16} fill="currentColor" />
                                    Run Selected ({selectedTestIds.size})
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Sidebar: Test Suites & Cases */}
                        <div className="w-80 flex-shrink-0">
                            <TestSuiteList
                                suites={suites}
                                selectedCaseId={selectedCaseId}
                                onSelectCase={(sId, cId) => {
                                    setSelectedSuiteId(sId);
                                    setSelectedCaseId(cId);
                                }}
                                onAddSuite={handleAddSuite}
                                onAddCase={handleAddCase}
                                onDeleteSuite={handleDeleteSuite}
                                onRenameSuite={handleRenameSuite}
                                onDeleteCase={handleDeleteCase}
                                onRenameCase={handleRenameCase}
                                // Pass run capability
                                onRunSuite={handleRunSuite}
                                runningSuiteId={runningSuiteId}
                                selectedTestIds={selectedTestIds}
                                onToggleSelect={handleToggleSelect}
                            />
                        </div>

                        {/* Right: Case Editor */}
                        <div className="flex-1 bg-white relative">
                            <TestCaseEditor
                                testCase={activeCase}
                                onUpdate={handleUpdateCase}
                                onRun={handleRunCase}
                                availableRegisters={availableRegisters}
                                isRunning={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Result Report Dialog */}
            <TestReportDialog
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                result={reportResult}
                suiteName={suites.find(s => s.id === reportResult?.suiteId)?.name || "Test Execution"}
                onRerun={() => {
                    const suite = suites.find(s => s.id === reportResult?.suiteId);
                    if (suite && reportResult?.results.length && reportResult.results.length > 1) {
                        handleRunSuite(suite);
                    } else if (activeCase) {
                        handleRunCase();
                    }
                }}
            />
        </>
    );
}
