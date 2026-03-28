import { Skeleton } from "@/components/ui/Skeleton";
import ClassToolHeader from "@/components/class/ClassToolHeader";

export default function AnalyticsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <ClassToolHeader
                title="Analytics"
                subtitle="Score distribution and student progress"
            />
            <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 space-y-8">
                {/* Score Distribution Skeleton */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <Skeleton className="h-6 w-40" />
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                    </div>
                    <div className="h-40 flex items-end gap-3 pt-4">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-full rounded-t-lg" style={{ height: `${20 * i}%` }} />)}
                    </div>
                </div>

                {/* Submission Rate Skeleton */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <Skeleton className="h-6 w-60 mb-4" />
                    {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                            <Skeleton className="h-2.5 w-full rounded-full" />
                        </div>
                    ))}
                </div>

                {/* Student Progress Skeleton */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <Skeleton className="h-6 w-48" />
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
