"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { GoogleCourse, listGoogleCourses, confirmGoogleCourse } from "@/lib/api/google_classroom";
import { getClasses } from "@/lib/api/class";
import { HiOutlineUserGroup, HiOutlineTemplate, HiCheck, HiOutlinePlus } from "react-icons/hi";
import { toast } from "sonner";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void; // Reload classes after successful import
}

type Step = "select" | "list-google" | "confirm";

export default function CreateClassModal({ open, onClose, onSuccess }: Props) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("select");
    const [loading, setLoading] = useState(false);
    const [googleCourses, setGoogleCourses] = useState<GoogleCourse[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<GoogleCourse | null>(null);
    const [importedGoogleIds, setImportedGoogleIds] = useState<Set<string>>(new Set());

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setStep("select");
            setGoogleCourses([]);
            setSelectedCourse(null);
            setLoading(false);
        }
    }, [open]);

    const handleSelectCustom = () => {
        onClose();
        router.push("/class/create");
    };

    const handleSelectGoogle = async () => {
        setStep("list-google");
        setLoading(true);
        try {
            // Fetch both Google Classroom courses and existing classes in parallel
            const [courses, existingClasses] = await Promise.all([
                listGoogleCourses(),
                getClasses()
            ]);

            // Extract Google Course IDs from existing classes
            const importedIds = new Set(
                existingClasses
                    .filter(c => c.google_course_id) // Only classes with Google Course ID
                    .map(c => c.google_course_id)
            );

            setImportedGoogleIds(importedIds);
            setGoogleCourses(courses || []);
        } catch (err: any) {
            toast.error("Failed to fetch Google Classroom courses", {
                description: err.message,
            });
            // Fallback or stay
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmGoogle = async () => {
        if (!selectedCourse) return;
        setLoading(true);
        try {
            await confirmGoogleCourse(selectedCourse.id);
            toast.success("Class Imported Successfully!");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error("Import Failed", {
                description: err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    // Render Step 1: Selection
    const renderSelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {/* Option 1: Google Classroom */}
            <button
                onClick={handleSelectGoogle}
                className="group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all duration-200 gap-3"
            >
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {/* Mock Google Icon or Template Icon */}
                    <HiOutlineUserGroup size={24} />
                </div>
                <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Google Classroom</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Import existing courses from your account
                    </p>
                </div>
            </button>

            {/* Option 2: Custom Platform */}
            <button
                onClick={handleSelectCustom}
                className="group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all duration-200 gap-3"
            >
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HiOutlinePlus size={24} />
                </div>
                <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Blylab Classroom</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Create a new class from scratch
                    </p>
                </div>
            </button>
        </div>
    );

    // Render Step 2: List Google Courses
    const renderGoogleList = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-gray-500">Loading courses...</p>
                </div>
            );
        }

        if (googleCourses.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">No Google Classroom courses found.</p>
                    <button
                        onClick={() => setStep("select")}
                        className="text-indigo-600 hover:underline"
                    >
                        Go Back
                    </button>
                </div>
            );
        }

        const availableCourses = googleCourses.filter(c => !importedGoogleIds.has(c.id));
        const importedCount = googleCourses.length - availableCourses.length;

        return (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Select a Course to Import
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {availableCourses.length} available • {importedCount} imported
                    </div>
                </div>

                {availableCourses.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-300 mb-2">All courses have been imported!</p>
                        <button
                            onClick={() => setStep("select")}
                            className="text-indigo-600 hover:underline text-sm"
                        >
                            Go Back
                        </button>
                    </div>
                )}

                {googleCourses.map((course) => {
                    const isImported = importedGoogleIds.has(course.id);
                    const isSelected = selectedCourse?.id === course.id;

                    return (
                        <div
                            key={course.id}
                            onClick={() => !isImported && setSelectedCourse(course)}
                            className={`rounded-lg border p-4 flex items-center justify-between transition-colors
                                ${isImported
                                    ? "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 opacity-60 cursor-not-allowed"
                                    : isSelected
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 cursor-pointer"
                                        : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                                }`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{course.name}</h4>
                                    {isImported && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full">
                                            Already Imported
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {course.section ? `${course.section} • ` : ""}
                                    {course.descriptionHeading || ""}
                                </p>
                            </div>
                            {isSelected && !isImported && (
                                <div className="text-green-600">
                                    <HiCheck size={20} />
                                </div>
                            )}
                        </div>
                    );
                })}
                <div className="flex justify-end pt-4 gap-3 sticky bottom-0 bg-white dark:bg-slate-900 border-t mt-4 py-2">
                    <button
                        onClick={() => setStep("select")}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleConfirmGoogle}
                        disabled={!selectedCourse || loading}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Importing..." : "Confirm Import"}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={step === "select" ? "Create New Class" : "Import from Google Classroom"}
        // Adjust width based on content if needed, but standard modal is fine
        >
            <div className="pt-2">
                {step === "select" && renderSelection()}
                {step === "list-google" && renderGoogleList()}
            </div>
        </Modal>
    );
}
