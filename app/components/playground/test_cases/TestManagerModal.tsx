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
import toast from "react-hot-toast";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    // Execution Props
    onRunTestCase?: (testCase: TestCase) => Promise<TestResult>;
    onRunTestSuite?: (suite: TestSuite) => Promise<TestSuiteResult>;
    availableRegisters: string[];
    assignmentId?: number; // Added for persistence
}

export default function TestManagerModal({ isOpen, onClose, onRunTestCase, onRunTestSuite, availableRegisters, assignmentId }: Props) {
    const [suites, setSuites] = useState<TestSuite[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isOwner, setIsOwner] = useState(false); // True if user is teacher/owner

    // Selection State
    const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

    const activeSuite = suites.find(s => s.id === selectedSuiteId);
    const activeCase = activeSuite?.cases.find(c => c.id === selectedCaseId) ?? null;

    // Load Data & User Profile
    useEffect(() => {
        if (isOpen && assignmentId) {
            loadData();
            loadUserProfile();
        }
    }, [isOpen, assignmentId]);

    const loadUserProfile = async () => {
        try {
            const profile = await apiFetch<{ role: string }>(`/api/v2/profile/`);
            setIsOwner(profile.role === 'teacher');
        } catch (e) {
            console.error('[TestManager] Failed to load user profile', e);
            setIsOwner(false); // Default to student
        }
    };

    const loadData = async () => {
        if (!assignmentId) return;
        setLoading(true);
        try {
            const data = await getTestSuitesForAssignment(assignmentId);
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
        if (!assignmentId) return;
        const tempName = "New Test Suite";
        try {
            // Optimistic UI updates are complex with ID generation, so we wait for API
            setSaving(true);
            const newId = await createTestSuite(assignmentId, tempName);
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
        try {
            // Optimistic update
            setSuites(prev => prev.map(s => s.id === suiteId ? { ...s, name: newName } : s));
            await updateTestSuite(parseInt(suiteId), newName);
        } catch (e) {
            toast.error("Failed to rename suite");
            // Revert? (Acceptable to skip for now or reload)
        }
    };

    const handleDeleteSuite = async (suiteId: string) => {
        if (!confirm("Are you sure you want to delete this test suite?")) return;
        try {
            setSaving(true);
            await deleteTestSuite(parseInt(suiteId));
            setSuites(prev => prev.filter(s => s.id !== suiteId));
            if (selectedSuiteId === suiteId) {
                setSelectedSuiteId(null);
                setSelectedCaseId(null);
            }
            toast.success("Suite deleted");
        } catch (e) {
            toast.error("Failed to delete suite");
        } finally {
            setSaving(false);
        }
    };

    // 2. Case Operations
    const handleAddCase = async (suiteId: string) => {
        const tempCase = createEmptyTestCase();
        // Remove UUID, let DB generate? 
        // Actually createEmptyTestCase generates a UUID. 
        // We can treat it as temp ID until saved, but to be consistent with DB numeric IDs, 
        // we should create via API first.

        try {
            setSaving(true);
            const newId = await createTestCase(parseInt(suiteId), tempCase);
            const backendCase: TestCase = { ...tempCase, id: newId.toString() };

            setSuites(prev => prev.map(s => {
                if (s.id === suiteId) {
                    return { ...s, cases: [...s.cases, backendCase] };
                }
                return s;
            }));

            setSelectedSuiteId(suiteId);
            setSelectedCaseId(backendCase.id);
            toast.success("Test case created");
        } catch (e) {
            toast.error("Failed to create test case");
        } finally {
            setSaving(false);
        }
    };

    const handleRenameCase = async (suiteId: string, caseId: string, newName: string) => {
        // Find case to get full object (needed for PUT)
        const suite = suites.find(s => s.id === suiteId);
        const testCase = suite?.cases.find(c => c.id === caseId);
        if (!testCase) return;

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
            await updateTestCase(parseInt(caseId), updatedCase, parseInt(suiteId));
        } catch (e) {
            toast.error("Failed to rename case");
        }
    };

    const handleDeleteCase = async (suiteId: string, caseId: string) => {
        if (!confirm("Delete this test case?")) return;
        try {
            await deleteTestCase(parseInt(caseId));
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
        } catch (e) {
            toast.error("Failed to delete case");
        }
    };

    // 3. Full Update (Content)
    // The editor calls onUpdate when fields change. 
    // We should probably Debounce this or add a explicit Save button in the Editor? 
    // For now, let's keep the existing onUpdate (state only) and add a visual "Syncing..." 
    // OR we change onUpdate to NOT auto-save, but we add a "Save" button to the editor header?
    // User Requirement: "น่าจะต้องเพิ่มปุ่ม save" (Should add a save button). 
    // Let's add an explicit save button for the Active Case content.

    const handleUpdateCaseLocal = (updated: TestCase) => {
        // Just update local state for UI responsiveness
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
        if (!activeCase || !selectedSuiteId) return;
        try {
            setSaving(true);
            await updateTestCase(parseInt(activeCase.id), activeCase, parseInt(selectedSuiteId));
            toast.success("Saved changes");
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
                                <p className="text-sm text-gray-500">
                                    {loading ? "Loading..." : "Create, edit, and run test cases"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Save Button for Active Case */}
                            {activeCase && (
                                <button
                                    onClick={handleSaveCurrentCase}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-all disabled:opacity-50"
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
                        <div className="flex-1 bg-white relative">
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
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50">
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
        </>
    );
}
