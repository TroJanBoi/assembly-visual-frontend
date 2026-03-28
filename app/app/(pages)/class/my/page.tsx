"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getMyClasses, Class } from "@/lib/api/class";
import ClassCard from "@/components/class/ClassCard";
import CreateClassModal from "@/components/class/CreateClassModal";
import CreateCard from "@/components/class/CreateCard";
import { HiPlus, HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function MyClassPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMyClasses();
            setClasses(data || []);
            setPage(1); // Reset to page 1 on fetch
        } catch (err: any) {
            setError(err.message || "Failed to fetch my classes.");
            toast.error("Error", {
                description: err.message || "Failed to fetch my classes.",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <p className="text-gray-500">Loading my classes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <p className="text-red-500">Error: {error}</p>
            </div>
        );
    }

    const totalClasses = classes.length;
    const totalPages = Math.ceil(totalClasses / ITEMS_PER_PAGE) || 1;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const displayedClasses = classes.slice(start, end);

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Classes</h1>
                </div>

                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {page === 1 && (
                        <CreateCard onOpen={() => setCreateModalOpen(true)} />
                    )}
                    {displayedClasses.map((item) => (
                        <ClassCard key={item.id} item={item} />
                    ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <HiChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="flex items-center px-4 text-sm font-medium">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <HiChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            <CreateClassModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => {
                    setCreateModalOpen(false);
                    fetchData();
                }}
            />
        </div>
    );
}
