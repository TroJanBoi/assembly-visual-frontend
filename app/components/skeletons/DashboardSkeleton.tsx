import { Skeleton } from "@/components/ui/Skeleton";
import ClassToolHeader from "@/components/class/ClassToolHeader";

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <ClassToolHeader
                title="Class Dashboard"
                subtitle="Overview of class activity and performance"
            />
            <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 space-y-8">
                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Cards Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-64 flex flex-col">
                            <Skeleton className="h-6 w-1/3 mb-6" />
                            <div className="space-y-4 flex-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-4/6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Links Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-28 space-y-3">
                            <Skeleton className="h-6 w-6 rounded-md" />
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-4/5" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
