"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getJoinedClasses, Class, joinClass } from "@/lib/api/class";
import ClassCard from "@/components/class/ClassCard";
import JoinPrivateCard from "@/components/class/JoinPrivateCard";
import { Modal } from "@/components/ui/Modal";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function JoinedClassPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [joinOpen, setJoinOpen] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [joinLoading, setJoinLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getJoinedClasses();
            setClasses(data || []);
            setPage(1);
        } catch (err: any) {
            setError(err.message || "Failed to fetch joined classes.");
            toast.error("Error", {
                description: err.message || "Failed to fetch joined classes.",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = joinCode.trim();
        if (!code) return;

        setJoinLoading(true);
        try {
            const res = await joinClass(code);
            setJoinOpen(false);
            setJoinCode("");

            toast.success("Joined Successfully!", {
                description: res.message,
            });

            await fetchData();
        } catch (err: any) {
            toast.error("Join Failed", {
                description: err.message || "Could not join the class. Please check the code.",
            });
        } finally {
            setJoinLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <p className="text-gray-500">Loading joined classes...</p>
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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Joined Classes</h1>
                </div>

                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {page === 1 && (
                        <JoinPrivateCard onOpen={() => setJoinOpen(true)} />
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

            <Modal
                open={joinOpen}
                onClose={() => setJoinOpen(false)}
                title="Join Private Class"
            >
                <form onSubmit={handleJoin} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter your class ID or code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="w-full h-12 rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white px-4 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!joinCode.trim() || joinLoading}
                        className="w-full h-12 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                        {joinLoading ? "Joining..." : "Join Class"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
