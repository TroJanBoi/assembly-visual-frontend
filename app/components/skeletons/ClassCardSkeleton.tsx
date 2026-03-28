import { Skeleton } from "@/components/ui/Skeleton";

export default function ClassCardSkeleton() {
    return (
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
            {/* Banner Skeleton */}
            <Skeleton className="h-48 w-full rounded-none" />

            {/* Content Skeleton */}
            <div className="flex-1 p-5 flex flex-col space-y-4">
                {/* Title */}
                <Skeleton className="h-6 w-3/4 rounded-md" />

                {/* Description (2 lines) */}
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>

                {/* Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="h-4 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-8 rounded-md" />
                </div>
            </div>
        </div>
    );
}
