import { useState, useEffect } from "react";
import { X, ListTodo, Play, Save, Loader2 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
    getTestSuitesForAssignment,
    createTestSuite,
    updateTestSuite,
    deleteTestSuite,
    createTestCase,
    updateTestCase,
    deleteTestCase
} from "@/lib/api/test_cases";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    // Execution Props
    onRunTestCase?: (testCase: TestCase) => Promise<TestResult>;
    onRunTestSuite?: (suite: TestSuite) => Promise<TestSuiteResult>;
    availableRegisters: string[];
    assignmentId?: number; // Added for persistence
    classId?: number; // Added for API paths
    isOwner?: boolean;
}

export default function TestManagerModal({ isOpen, onClose, onRunTestCase, onRunTestSuite, availableRegisters, assignmentId, classId, isOwner = false }: Props) {
    const [suites, setSuites] = useState<TestSuite[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dirtyCases, setDirtyCases] = useState<Set<string>>(new Set());

    // Selection State
    const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

    // Confirmation Dialog State
    const [confirmData, setConfirmData] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        loading?: boolean;
    }>({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => { }
    });

    const activeSuite = suites.find(s => s.id === selectedSuiteId);
    const activeCase = activeSuite?.cases.find(c => c.id === selectedCaseId) ?? null;

    // Load Data & User Profile
    useEffect(() => {
        if (isOpen && assignmentId) {
            loadData();
        }
    }, [isOpen, assignmentId]);

    const loadData = async () => {
        if (!assignmentId || !classId) return;
        setLoading(true);
        try {
            const data = await getTestSuitesForAssignment(classId, assignmentId);
            setSuites(data);
            if (data.length > 0 && !selectedSuiteId) {
                setSelectedSuiteId(data[0].id);
                if (data[0].cases.length > 0) {
                    setSelectedCaseId(data[0].cases[0].id);
                }
            }
        } catch (e) {
            toast.error("Failed to load test cases");
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleSelectCase = (sId: string, cId: string) => {
        setSelectedSuiteId(sId);
        setSelectedCaseId(cId);
    };

    // --- Persistence Handlers (Direct API) ---

    // 1. Suite Operations
    const handleAddSuite = async () => {
        if (!assignmentId || !classId) return;
        const tempName = "New Test Suite";
        try {
            // Optimistic UI updates are complex with ID generation, so we wait for API
            setSaving(true);
            const newId = await createTestSuite(classId, assignmentId, tempName);
            const newSuite: TestSuite = {
                id: newId.toString(),
                name: tempName,
                cases: []
            };
            setSuites([...suites, newSuite]);
            setSelectedSuiteId(newSuite.id);
            setSelectedCaseId(null);
            toast.success("Suite created");
        } catch (e) {
            toast.error("Failed to create suite");
        } finally {
            setSaving(false);
        }
    };

    const handleRenameSuite = async (suiteId: string, newName: string) => {
        if (!assignmentId || !classId) return;
        try {
            // Optimistic update
            setSuites(prev => prev.map(s => s.id === suiteId ? { ...s, name: newName } : s));
            await updateTestSuite(classId, assignmentId, parseInt(suiteId), newName);
        } catch (e) {
            toast.error("Failed to rename suite");
            // Revert? (Acceptable to skip for now or reload)
        }
    };

    const handleDeleteSuite = async (suiteId: string) => {
        // Check if suite has hidden test cases
        const suite = suites.find(s => s.id === suiteId);
        const hasHiddenCases = suite?.cases.some(c => c.isHidden);

        if (hasHiddenCases) {
            toast.error("Cannot delete suite containing hidden (graded) test cases");
            return;
        }

        if (!assignmentId || !classId) return;

        // Show beautiful confirmation dialog
        setConfirmData({
            isOpen: true,
            title: "Delete Test Suite?",
            description: `Are you sure you want to delete "${suite?.name || "this suite"}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    setConfirmData(prev => ({ ...prev, loading: true }));
                    await deleteTestSuite(classId, assignmentId, parseInt(suiteId));
                    setSuites(prev => prev.filter(s => s.id !== suiteId));
                    if (selectedSuiteId === suiteId) {
                        setSelectedSuiteId(null);
                        setSelectedCaseId(null);
                    }
                    toast.success("Suite deleted");
                    setConfirmData(prev => ({ ...prev, isOpen: false }));
                } catch (e) {
                    toast.error("Failed to delete suite");
                } finally {
                    setConfirmData(prev => ({ ...prev, loading: false }));
                }
            }
        });
    };

    // 2. Case Operations
    const handleAddCase = async (suiteId: string) => {
        if (!assignmentId || !classId) return;

        // 1. Create a temporary local test case (Draft)
        const tempId = `temp-${Date.now()}`;
        const tempCase: TestCase = {
            ...createEmptyTestCase(),
            id: tempId,
            name: "New Test Case"
        };

        // 2. Update Local State immediately (No API call yet)
        setSuites(prev => prev.map(s => {
            if (s.id === suiteId) {
                return { ...s, cases: [...s.cases, tempCase] };
            }
            return s;
        }));

        // 3. Select the new draft
        setSelectedSuiteId(suiteId);
        setSelectedCaseId(tempId);
    };

    const handleRenameCase = async (suiteId: string, caseId: string, newName: string) => {
        // Find case to get full object (needed for PUT)
        const suite = suites.find(s => s.id === suiteId);
        const testCase = suite?.cases.find(c => c.id === caseId);
        if (!testCase || testCase.isHidden) return;

        const updatedCase = { ...testCase, name: newName };

        try {
            // Optimistic
            setSuites(prev => prev.map(s => {
                if (s.id === suiteId) {
                    return {
                        ...s,
                        cases: s.cases.map(c => c.id === caseId ? { ...c, name: newName } : c)
                    };
                }
                return s;
            }));

            // API
            if (assignmentId && classId) {
                await updateTestCase(classId, assignmentId, parseInt(suiteId), parseInt(caseId), updatedCase);
            }
        } catch (e) {
            toast.error("Failed to rename case");
        }
    };

    const handleDeleteCase = async (suiteId: string, caseId: string) => {
        if (!assignmentId || !classId) return;

        // Check if it's a draft (temp-*)
        const isDraft = caseId.startsWith("temp-");

        // Get case name for confirmation
        const suite = suites.find(s => s.id === suiteId);
        const testCase = suite?.cases.find(c => c.id === caseId);

        if (testCase?.isHidden) {
            toast.error("Cannot delete hidden (graded) test cases from playground");
            return;
        }

        // Show beautiful confirmation dialog
        setConfirmData({
            isOpen: true,
            title: "Delete Test Case?",
            description: `Are you sure you want to delete "${testCase?.name || "this case"}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    setConfirmData(prev => ({ ...prev, loading: true }));

                    // Only call API if it's a persisted case
                    if (!isDraft) {
                        await deleteTestCase(classId, assignmentId, parseInt(suiteId), parseInt(caseId));
                    }

                    // Update UI
                    setSuites(prev => prev.map(s => {
                        if (s.id === suiteId) {
                            return { ...s, cases: s.cases.filter(c => c.id !== caseId) };
                        }
                        return s;
                    }));

                    if (selectedCaseId === caseId) {
                        setSelectedCaseId(null);
                    }
                    toast.success("Test case deleted");
                    setConfirmData(prev => ({ ...prev, isOpen: false }));
                } catch (e) {
                    toast.error("Failed to delete case");
                } finally {
                    setConfirmData(prev => ({ ...prev, loading: false }));
                }
            }
        });
    };

    // 3. Full Update (Content)

    const handleUpdateCaseLocal = (updated: TestCase) => {
        // Just update local state for UI responsiveness and mark as dirty
        setDirtyCases(prev => new Set(prev).add(updated.id));
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

    const handleSaveCurrentCase = async () => {
        if (!activeCase || !selectedSuiteId || !assignmentId || !classId) return;
        if (activeCase.isHidden && !isOwner) return; // Only block if not owner

        try {
            setSaving(true);
            const isDraft = activeCase.id.startsWith("temp-");

            if (isDraft) {
                // CREATE (POST)
                const newId = await createTestCase(classId, assignmentId, parseInt(selectedSuiteId), activeCase);

                // Replace temp ID with real ID in state
                const savedCase: TestCase = { ...activeCase, id: newId.toString() };
                setSuites(prev => prev.map(s => {
                    if (s.id === selectedSuiteId) {
                        return {
                            ...s,
                            cases: s.cases.map(c => c.id === activeCase.id ? savedCase : c)
                        };
                    }
                    return s;
                }));
                setSelectedCaseId(savedCase.id); // Update selection to real ID
                setDirtyCases(prev => {
                    const next = new Set(prev);
                    next.delete(activeCase.id);
                    next.delete(savedCase.id);
                    return next;
                });
                toast.success("Test case created");
            } else {
                // UPDATE (PUT)
                await updateTestCase(classId, assignmentId, parseInt(selectedSuiteId), parseInt(activeCase.id), activeCase);
                setDirtyCases(prev => {
                    const next = new Set(prev);
                    next.delete(activeCase.id);
                    return next;
                });
                toast.success("Saved changes");
            }
        } catch (e) {
            toast.error("Failed to save");
            console.error(e);
        } finally {
            setSaving(false);
        }
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
                <div className="w-full max-w-7xl h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-slate-800 relative">
                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <ListTodo size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Test Manager</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {loading ? "Loading..." : "Create, edit, and run test cases"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Save Button for Active Case */}
                            {activeCase && isOwner && (
                                <button
                                    onClick={handleSaveCurrentCase}
                                    disabled={saving || !(dirtyCases.has(activeCase.id) || activeCase.id.startsWith("temp-"))}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all border",
                                        (dirtyCases.has(activeCase.id) || activeCase.id.startsWith("temp-"))
                                            ? "text-white bg-indigo-600 hover:bg-indigo-700 border-indigo-600 hover:border-indigo-700 shadow-sm hover:translate-y-[-1px]"
                                            : "text-gray-400 bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 cursor-not-allowed",
                                        saving && "opacity-50"
                                    )}
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Changes
                                </button>
                            )}

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
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Sidebar: Test Suites & Cases */}
                        <div className="w-80 flex-shrink-0">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <Loader2 size={32} className="animate-spin" />
                                </div>
                            ) : (
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
                                    isOwner={isOwner}
                                />
                            )}
                        </div>

                        {/* Right: Case Editor */}
                        <div className="flex-1 bg-white dark:bg-slate-900 relative">
                            {activeCase ? (
                                <TestCaseEditor
                                    testCase={activeCase}
                                    onUpdate={handleUpdateCaseLocal}
                                    onRun={handleRunCase}
                                    availableRegisters={availableRegisters}
                                    isRunning={false}
                                    isOwner={isOwner}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50 dark:bg-slate-900/50">
                                    <ListTodo size={48} className="mb-4 opacity-20" />
                                    <p>Select a test case to edit</p>
                                </div>
                            )}
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

            <ConfirmDialog
                isOpen={confirmData.isOpen}
                onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmData.onConfirm}
                title={confirmData.title}
                description={confirmData.description}
                loading={confirmData.loading}
                variant="destructive"
            />
        </>
    );
}
