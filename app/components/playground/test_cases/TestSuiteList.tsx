
import { useState } from "react";
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Lock,
    MoreVertical,
    FileText,
    Folder,
    Edit2,
    Trash2,
    Play
} from "lucide-react";
import { TestSuite, TestCase } from "@/lib/playground/test_runner";
import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/Checkbox";

interface Props {
    suites: TestSuite[];
    selectedCaseId: string | null;
    onSelectCase: (suiteId: string, caseId: string) => void;
    onAddSuite: () => void;
    onAddCase: (suiteId: string) => void;
    onDeleteSuite: (id: string) => void;
    onRenameSuite: (id: string, name: string) => void;
    onDeleteCase: (sId: string, cId: string) => void;
    onRenameCase: (sId: string, cId: string, name: string) => void;

    // Run Props
    onRunSuite?: (suite: TestSuite) => void;
    runningSuiteId?: string | null;

    // Selection Props
    selectedTestIds?: Set<string>;
    onToggleSelect?: (id: string, type: 'suite' | 'case', suiteId?: string) => void; // Suite toggle / Case toggle

    // Permission Props
    isOwner?: boolean; // True if user is teacher/owner
}

export default function TestSuiteList({
    suites,
    selectedCaseId,
    onSelectCase,
    onAddSuite,
    onAddCase,
    onDeleteSuite,
    onRenameSuite,
    onDeleteCase,
    onRenameCase,
    onRunSuite,
    runningSuiteId,
    selectedTestIds,
    onToggleSelect,
    isOwner = true
}: Props) {

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800">
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">Test Cases</h2>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {suites.map((suite) => (
                    <SuiteItem
                        key={suite.id}
                        suite={suite}
                        selectedCaseId={selectedCaseId}
                        onSelectCase={onSelectCase}
                        onAddCase={() => onAddCase(suite.id)}
                        onDeleteSuite={onDeleteSuite}
                        onRenameSuite={onRenameSuite}
                        onDeleteCase={onDeleteCase}
                        onRenameCase={onRenameCase}
                        onRunSuite={onRunSuite}
                        runningSuiteId={runningSuiteId}
                        selectedTestIds={selectedTestIds}
                        onToggleSelect={onToggleSelect}
                        isOwner={isOwner}
                    />
                ))}

                {isOwner && (
                    <button
                        onClick={onAddSuite}
                        className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800 rounded-lg dashed border-2 transition-colors"
                    >
                        <Plus size={16} /> Add Test Suite
                    </button>
                )}
            </div>
        </div>
    );
}

function SuiteItem({
    suite,
    selectedCaseId,
    onSelectCase,
    onAddCase,
    onDeleteSuite,
    onRenameSuite,
    onDeleteCase,
    onRenameCase,
    onRunSuite,
    runningSuiteId,
    selectedTestIds,
    onToggleSelect,
    isOwner = true
}: {
    suite: TestSuite;
    selectedCaseId: string | null;
    onSelectCase: (sId: string, cId: string) => void;
    onAddCase: () => void;
    onDeleteSuite: (id: string) => void;
    onRenameSuite: (id: string, name: string) => void;
    onDeleteCase: (sId: string, cId: string) => void;
    onRenameCase: (sId: string, cId: string, name: string) => void;
    onRunSuite?: (suite: TestSuite) => void;
    runningSuiteId?: string | null;
    selectedTestIds?: Set<string>;
    onToggleSelect?: (id: string, type: 'suite' | 'case', suiteId?: string) => void;
    isOwner?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(suite.name);

    const handleSaveRename = () => {
        if (editName.trim()) {
            onRenameSuite(suite.id, editName.trim());
        } else {
            setEditName(suite.name); // Revert
        }
        setIsEditing(false);
    };

    // Calculate selection state for suite checkbox
    const allCasesSelected = suite.cases.length > 0 && suite.cases.every(c => selectedTestIds?.has(c.id));
    const someCasesSelected = suite.cases.some(c => selectedTestIds?.has(c.id));
    const isIndeterminate = someCasesSelected && !allCasesSelected;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden group/suite">
            {/* Suite Header */}
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                onClick={() => !isEditing && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {/* Checkbox for Suite */}
                    {onToggleSelect && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                checked={allCasesSelected || isIndeterminate} // Visual check if some or all
                                // Note: Checkbox component usually takes boolean, might need custom indeterminate visual
                                // If simple checkbox, allSelected is simpler.
                                onCheckedChange={() => onToggleSelect(suite.id, 'suite')}
                                id={`suite-${suite.id}`}
                            />
                        </div>
                    )}

                    {suite.locked ? (
                        <div className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-gray-400">
                            <Lock size={12} />
                        </div>
                    ) : (
                        <div className={`w-5 h-5 flex items-center justify-center rounded ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Folder size={12} />
                        </div>
                    )}

                    {isEditing ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleSaveRename}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                            autoFocus
                            className="text-sm font-medium border border-indigo-300 dark:border-indigo-500 rounded px-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{suite.name}</span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {!suite.locked && !isEditing && isOwner && (
                        <div className="hidden group-hover/suite:flex items-center gap-1 mr-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
                            >
                                <Edit2 size={12} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSuite(suite.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                title={suite.cases.some(c => c.isHidden) ? "Cannot delete suite with hidden test cases" : "Delete suite"}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center text-gray-400">
                        {isOpen ? <ChevronDown size={16} /> : <div className="-rotate-90"><ChevronDown size={16} /></div>}
                    </div>
                </div>
            </div>

            {/* Test Cases List */}
            {isOpen && (
                <div className="px-2 pb-2 space-y-1">
                    {suite.cases
                        .map(t => (
                            <CaseItem
                                key={t.id}
                                testCase={t}
                                suiteId={suite.id}
                                isSelected={selectedCaseId === t.id}
                                isChecked={selectedTestIds?.has(t.id) || false}
                                isLocked={!!suite.locked}
                                onSelect={() => onSelectCase(suite.id, t.id)}
                                onToggleSelect={(cid) => onToggleSelect?.(cid, 'case', suite.id)}
                                onDelete={() => onDeleteCase(suite.id, t.id)}
                                onRename={(name) => onRenameCase(suite.id, t.id, name)}
                                isOwner={isOwner}
                            />
                        ))}

                    {!suite.locked && isOwner && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddCase();
                            }}
                            className="w-full mt-1 py-1.5 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors border border-transparent hover:border-green-200 dark:hover:border-green-800 border-dashed"
                        >
                            <Plus size={12} /> Add Case
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function CaseItem({
    testCase,
    suiteId,
    isSelected,
    isChecked,
    isLocked,
    onSelect,
    onToggleSelect,
    onDelete,
    onRename,
    isOwner = true
}: {
    testCase: TestCase,
    suiteId: string,
    isSelected: boolean,
    isChecked: boolean,
    isLocked: boolean,
    onSelect: () => void,
    onToggleSelect?: (id: string) => void,
    onDelete: () => void,
    onRename: (n: string) => void,
    isOwner?: boolean
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(testCase.name);

    const handleSave = () => {
        if (editName.trim()) {
            onRename(editName.trim());
        } else {
            setEditName(testCase.name);
        }
        setIsEditing(false);
    }

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                if (!isEditing) onSelect();
            }}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all text-sm group/case relative border-l-2",
                isSelected
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border-indigo-600 dark:border-indigo-500 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 bg-transparent border-transparent"
            )}
        >
            {/* Checkbox for Case */}
            {onToggleSelect && (
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onToggleSelect(testCase.id)}
                        id={`case-${testCase.id}`}
                    />
                </div>
            )}

            {testCase.isHidden && !isOwner ? (
                <Lock size={14} className="text-amber-500" />
            ) : (
                <FileText size={14} className={isSelected ? "text-indigo-500" : "text-gray-400"} />
            )}

            {isEditing ? (
                <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                    className="text-xs font-medium border border-indigo-300 dark:border-indigo-500 rounded px-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span className={cn(
                    "truncate flex-1",
                    testCase.isHidden && !isOwner && "text-gray-400 italic",
                    testCase.isHidden && isOwner && "text-amber-600"
                )}>
                    {testCase.name}
                    {testCase.isHidden && " (Hidden)"}
                </span>
            )}

            {!isLocked && !isEditing && isOwner && !testCase.isHidden && (
                <div className="hidden group-hover/case:flex items-center absolute right-2 bg-white/50 backdrop-blur-sm rounded shadow-sm border border-gray-100">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
                    >
                        <Edit2 size={10} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
            )}
        </div>
    );
}

