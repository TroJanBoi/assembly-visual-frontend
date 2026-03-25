"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getPublicClasses, Class } from "@/lib/api/class";
import ClassCard from "@/components/class/ClassCard";

export default function PublicClassPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getPublicClasses();
            setClasses(data || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch public classes.");
            toast.error("Error", {
                description: err.message || "Failed to fetch public classes.",
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
                <p className="text-gray-500">Loading public classes...</p>
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

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Public Classes</h1>
                {classes.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No public classes found.</p>
                ) : (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {classes.map((item) => (
                            <ClassCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
