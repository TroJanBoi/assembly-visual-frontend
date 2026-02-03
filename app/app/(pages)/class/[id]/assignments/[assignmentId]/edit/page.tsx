"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

// Import types
import {
    type AssignmentFormData,
    type TestCondition,
    type Step,
} from "@/types/assignment";

// Import APIs
import { getClassById, Class } from "@/lib/api/class";
import {
    getAssignmentById,
    updateAssignment,
    type UpdateAssignmentPayload,
} from "@/lib/api/assignment";
import {
    getTestSuitesForAssignment,
    createTestSuite,
    updateTestSuite,
    createTestCase,
    updateTestCase,
} from "@/lib/api/test_cases";

// Import Step components
import Step1Detail from "@/components/assignment/steps/Step1Detail";
import Step2Conditional from "@/components/assignment/steps/Step2Conditional";
import Step3Grading from "@/components/assignment/steps/Step3Grading";
import { Divide } from "lucide-react";

// --- Types & Helper Functions ---

// List of all instructions grouped by category for conversion
const allInstructionsByCategory = {
    system: ["START", "HLT", "LABEL", "NOP"],
    io: ["IN", "OUT"],
    data_movement: ["MOV", "LOAD", "STORE", "PUSH", "POP"],
    arithmetic: ["ADD", "SUB", "MUL", "DIV", "INC", "DEC"],
    control_flow: ["CMP", "JMP", "JZ", "JNZ", "JC", "JNC", "JN", "CALL", "RET"],
    bitwise: ["AND", "OR", "XOR", "NAND", "NOR", "XNOR", "NOT", "SHL", "SHR"],
};

interface TestCaseStatePayload {
    flags?: { [key: string]: number };
    memory?: { [address: string]: number };
    register?: { [key: string]: number };
    _meta?: any;
}



export default function EditAssignmentPage() {
    const router = useRouter();
    const params = useParams();
    const classId = params.id as string;
    const assignmentId = params.assignmentId as string;

    const [currentStep, setCurrentStep] = useState<Step>("detail");
    const [classData, setClassData] = useState<Class | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [formData, setFormData] = useState<AssignmentFormData>({
        assignmentName: "",
        description: "",
        hasDueDate: false,
        dueDate: "",
        hasLimitAttempts: false,
        limitAttempts: "",
        allowLateSubmissions: false,
        lockAfterFinal: false,
        registerCount: 8,
        initialMemory: [],
        disallowedInstructions: [],
        testSuites: [],
        maxScore: "100",
        gradingMode: "auto",
        efficiencyEnabled: false,
        maxNodes: "",
        efficiencyWeight: "0",
    });

    const getStepTitle = (step: Step): string => {
        switch (step) {
            case "detail":
                return "Assignment Detail";
            case "conditional":
                return "Assignment Conditions";
            case "grading":
                return "Grading Policy";
            default:
                return "Edit Assignment";
        }
    };

    useEffect(() => {
        if (!classId || !assignmentId) return;

        const fetchData = async () => {
            try {
                setIsFetching(true);
                const [cls, assignment, suites] = await Promise.all([
                    getClassById(classId),
                    getAssignmentById(classId, assignmentId),
                    getTestSuitesForAssignment(parseInt(classId), parseInt(assignmentId)),
                ]);
                setClassData(cls);

                // Map existing assignment data to form data
                // NOTE: This mapping logic needs to be robust to handle potentially null/missing fields 
                // from incomplete assignments.

                // Initial mapping attempt - defaulting where necessary
                const settings = assignment.settings;
                const condition = assignment.condition;
                const gradePolicy = settings?.grade_policy;
                const feBehavior = settings?.fe_behavior;

                const mappedData: AssignmentFormData = {
                    assignmentName: assignment.title || "",
                    description: assignment.description || "",
                    hasDueDate: !!assignment.due_date,
                    dueDate: assignment.due_date || "",
                    hasLimitAttempts: (assignment.max_attempt || 0) > 0,
                    limitAttempts: assignment.max_attempt?.toString() || "",
                    allowLateSubmissions: feBehavior?.allow_resubmit_after_due || false,
                    lockAfterFinal: feBehavior?.lock_after_submit || false,

                    // Conditions
                    registerCount: condition?.execution_constraints?.register_count || 8,
                    initialMemory: condition?.initial_state?.memory || [],

                    // Disallowed Instructions (calculated from allowed_instructions)
                    disallowedInstructions: (() => {
                        const allowedMap = condition?.allowed_instructions || {};
                        // If allowedMap is empty, it might mean ALL allowed (default) or NONE. 
                        // Assuming if key exists but empty, implementation might vary. 
                        // But usually if condition is present, we check what is missing.

                        // If condition is null, we assume all allowed (empty disallowed).
                        if (!condition || !condition.allowed_instructions) return [];

                        const disallowed: string[] = [];
                        Object.values(allInstructionsByCategory).flat().forEach(inst => {
                            if (!allowedMap[inst]) {
                                disallowed.push(inst);
                            }
                        });
                        return disallowed;
                    })(),

                    // Test Suites
                    testSuites: suites.map(s => ({
                        id: s.id,
                        name: s.name,
                        testCases: s.cases.map(c => ({
                            id: c.id,
                            name: c.name,
                            isEnabled: true,
                            hidden: c.isHidden || false,
                            initialState: c.initialState as any, // Cast/Map if needed
                            expectedState: c.expectedState as any
                        }))
                    })),

                    // Grading
                    maxScore: assignment.grade?.toString() || "100",
                    gradingMode: gradePolicy?.mode || "auto",
                    efficiencyEnabled: (gradePolicy?.weight?.number_of_node_used || 0) > 0,
                    maxNodes: condition?.execution_constraints?.max_nodes?.toString() || "",
                    efficiencyWeight: gradePolicy?.weight?.number_of_node_used?.toString() || "0",
                };

                // Fetch Test Suites & Cases
                // Deleted old fetch block

                // If condition/settings were missing (incomplete import), mappedData uses defaults

                // If condition/settings were missing (incomplete import), mappedData uses defaults 
                // which is exactly what we want for "Setup".

                setFormData(mappedData);

            } catch (error: any) {
                console.error("Fetch Data Error:", error);
                toast.error("Failed to load assignment data.");
                router.back();
            } finally {
                setIsFetching(false);
            }
        };

        fetchData();
    }, [classId, assignmentId, router]);



    // Helper to map backend state (TestInit/Assert) back to frontend TestConditions
    const mapBackendStateToConditions = (state: TestCaseStatePayload): TestCondition[] => {
        const conditions: TestCondition[] = [];
        if (state.register) {
            Object.entries(state.register).forEach(([reg, val]) => {
                conditions.push({ id: crypto.randomUUID(), type: "Register", location: reg, value: val.toString() });
            });
        }
        // Handle "register" (singular) alias if backend sends it
        const anyState = state as any;
        if (anyState.registers) {
            Object.entries(anyState.registers).forEach(([reg, val]) => {
                conditions.push({ id: crypto.randomUUID(), type: "Register", location: reg, value: (val as number).toString() });
            });
        }

        if (state.memory) {
            // Handle if memory is Object (map) or Array (legacy frontend assumption check, but backend is map)
            if (Array.isArray(state.memory)) {
                state.memory.forEach((item: any) => {
                    conditions.push({ id: crypto.randomUUID(), type: "Memory", location: item.address.toString(), value: item.value.toString() });
                });
            } else {
                Object.entries(state.memory).forEach(([addr, val]) => {
                    conditions.push({ id: crypto.randomUUID(), type: "Memory", location: addr, value: val.toString() });
                });
            }
        }

        if (state.flags) {
            Object.entries(state.flags).forEach(([flag, val]) => {
                conditions.push({ id: crypto.randomUUID(), type: "Flag", location: flag, value: val.toString() });
            });
        }
        return conditions;
    };

    const transformConditionsToState = (
        conditions: TestCondition[],
        isHidden: boolean = false
    ): TestCaseStatePayload => {
        const state: TestCaseStatePayload = {
            flags: {},
            memory: {},
            register: {},
            _meta: { hidden: !!isHidden }
        };
        // Safety check
        if (!Array.isArray(conditions)) {
            console.warn("transformConditionsToState received non-array:", conditions);
            return state;
        }
        conditions.forEach((cond) => {
            const value = parseInt(cond.value, 10);
            if (isNaN(value)) return;
            switch (cond.type) {
                case "Register":
                    if (!state.register) state.register = {};
                    state.register[cond.location] = value;
                    break;
                case "Memory":
                    const addr = parseInt(cond.location, 10);
                    if (!isNaN(addr) && state.memory)
                        state.memory[addr.toString()] = value;
                    break;
                case "Flag":
                    if (state.flags && (value === 0 || value === 1))
                        state.flags[cond.location] = value;
                    break;
            }
        });
        if (Object.keys(state.flags || {}).length === 0) delete state.flags;
        if (Object.keys(state.memory || {}).length === 0) delete state.memory;
        if (Object.keys(state.register || {}).length === 0) delete state.register;
        return state;
    };

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            const score = parseInt(formData.maxScore, 10);
            if (isNaN(score) || score < 0 || score > 100)
                throw new Error("Max Score must be between 0 and 100.");
            if (formData.gradingMode === "auto" && formData.efficiencyEnabled) {
                const nodes = parseInt(formData.maxNodes, 10);
                if (isNaN(nodes) || nodes <= 0)
                    throw new Error("Max Nodes must be a positive number.");
            }

            // Build flat allowed_instructions (not grouped by category)
            const allowedInstructionsFlat: { [key: string]: 1 } = {};
            Object.values(allInstructionsByCategory).forEach((instructions) => {
                instructions.forEach((inst) => {
                    if (!formData.disallowedInstructions.includes(inst)) {
                        allowedInstructionsFlat[inst] = 1; // Keep uppercase
                    }
                });
            });

            const conditionData = {
                allowed_instructions: allowedInstructionsFlat,
                execution_constraints: {
                    register_count: formData.registerCount,
                    max_nodes:
                        formData.gradingMode === "auto" && formData.efficiencyEnabled
                            ? Number(formData.maxNodes) || null
                            : null,
                    max_steps: null, // Add if needed
                },
                initial_state: {
                    registers: {}, // Can be populated from formData if needed
                    memory: formData.initialMemory,
                },
            };

            const settingsData = {
                fe_behavior: {
                    allow_resubmit_after_due: formData.allowLateSubmissions,
                    lock_after_submit: formData.lockAfterFinal,
                    show_register_view: true, // Add missing fields
                    show_memory_view: true,
                },
                grade_policy: {
                    mode: formData.gradingMode,
                    weight: {
                        // Use 0-100 scale, not 0-1
                        test_case:
                            formData.gradingMode === "auto"
                                ? 100 - (Number(formData.efficiencyWeight) || 0)
                                : 100,
                        number_of_node_used:
                            formData.gradingMode === "auto" && formData.efficiencyEnabled
                                ? Number(formData.efficiencyWeight) || 0
                                : 0,
                    },
                },
                test_case_policy: { visible_to_student: true },
            };

            const updatePayload: UpdateAssignmentPayload = {
                title: formData.assignmentName,
                description: formData.description || null,
                due_date: formData.hasDueDate ? formData.dueDate : null,
                max_attempt: formData.hasLimitAttempts // Note: API expects max_attempt (singular) or max_attempts? Checking types
                    ? Number(formData.limitAttempts) || 0
                    : 0,
                grade: score,
                condition: conditionData,
                setting: settingsData, // Use 'setting' (singular) for PUT request
            };

            // 1. Update Main Assignment
            await updateAssignment(classId, assignmentId, updatePayload);

            // 2. Create Test Suites & Cases (if any new ones defined)
            // NOTE: Logic for updating/deleting existing test suites is complex. 
            // For this task ("Setup Incomplete Assignment"), we assume we are ADDING them 
            // because they didn't exist properly before.
            // 2. Create/Update Test Suites & Cases
            if (formData.testSuites && formData.testSuites.length > 0) {
                for (const suite of formData.testSuites) {
                    let suiteIdNumeric: number;
                    const isNewSuite = suite.id.startsWith('suite-');

                    if (isNewSuite) {
                        suiteIdNumeric = await createTestSuite(parseInt(classId), parseInt(assignmentId), suite.name);
                    } else {
                        suiteIdNumeric = parseInt(suite.id);
                        await updateTestSuite(parseInt(classId), parseInt(assignmentId), suiteIdNumeric, suite.name);
                    }

                    if (suite.testCases && suite.testCases.length > 0) {
                        for (const testCase of suite.testCases) {
                            const isNewCase = testCase.id.startsWith('case-');
                            const apiTestCase = { ...testCase, isHidden: testCase.hidden };
                            try {
                                if (isNewCase) {
                                    await createTestCase(parseInt(classId), parseInt(assignmentId), suiteIdNumeric, {
                                        id: testCase.id,
                                        name: testCase.name,
                                        initialState: testCase.initialState || [],
                                        expectedState: testCase.expectedState || [],
                                        isHidden: testCase.hidden || false
                                    });
                                } else {
                                    await updateTestCase(parseInt(classId), parseInt(assignmentId), suiteIdNumeric, parseInt(testCase.id), {
                                        id: testCase.id,
                                        name: testCase.name,
                                        initialState: testCase.initialState || [],
                                        expectedState: testCase.expectedState || [],
                                        isHidden: testCase.hidden || false
                                    });
                                }
                            } catch (e) {
                                console.error("Failed to save test case:", testCase.name, e);
                            }
                        }
                    }
                }
            }

            toast.success("Assignment setup completed!");
            setTimeout(() => {
                router.push(`/class/${classId}`);
            }, 1500);

        } catch (error: any) {
            console.error("Update Error:", error);
            toast.error(error.message || "Failed to update assignment.");
        } finally {
            setIsLoading(false);
        }
    };


    const Breadcrumbs = () => (
        <div className="flex justify-center items-center gap-2 text-sm text-gray-500 mb-4">
            <span
                className={
                    currentStep === "detail" ? "font-semibold text-indigo-600" : ""
                }
            >
                Detail
            </span>
            <HiChevronRight className="w-4 h-4 text-gray-400" />
            <span
                className={
                    currentStep === "conditional" ? "font-semibold text-indigo-600" : ""
                }
            >
                Conditional
            </span>
            <HiChevronRight className="w-4 h-4 text-gray-400" />
            <span
                className={
                    currentStep === "grading" ? "font-semibold text-indigo-600" : ""
                }
            >
                Grading policy
            </span>
        </div>
    );

    if (isFetching) {
        return <div className="p-6 text-center">Loading assignment data...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 mb-24">
            <div className="mb-4">
                <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-1 pl-0 hover:bg-transparent hover:text-indigo-600">
                    <HiChevronLeft className="w-5 h-5" /> Back
                </Button>
            </div>

            <Breadcrumbs />
            <h1 className="text-3xl font-bold mb-6">{getStepTitle(currentStep)}</h1>

            <div className="space-y-6">
                {currentStep === "detail" && (
                    <Step1Detail formData={formData} setFormData={setFormData} />
                )}
                {currentStep === "conditional" && (
                    <Step2Conditional formData={formData} setFormData={setFormData} />
                )}
                {currentStep === "grading" && (
                    <Step3Grading formData={formData} setFormData={setFormData} />
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                <div className="max-w-6xl mx-auto flex justify-end gap-6 items-center px-4 md:px-6 py-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (currentStep === "detail") router.back();
                            else if (currentStep === "grading") setCurrentStep("conditional");
                            else if (currentStep === "conditional") setCurrentStep("detail");
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        {currentStep === "detail" ? "Cancel" : <><HiChevronLeft className="w-5 h-5" /> Back</>}
                    </Button>
                    {currentStep !== "grading" ? (
                        <Button
                            onClick={() => {
                                if (currentStep === "detail") setCurrentStep("conditional");
                                else if (currentStep === "conditional")
                                    setCurrentStep("grading");
                            }}
                            disabled={isLoading}
                            className="flex items-center gap-2"
                        >
                            Next <HiChevronRight className="w-5 h-5" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? "Saving..." : "Save Assignment"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
