import { Skeleton } from "@/components/ui/Skeleton";

export default function ClassPageSkeleton() {
    return (
        <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-8">
            {/* Actions Bar */}
            <div className="flex justify-end gap-3">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-lg" />
            </div>

            {/* Class Header Skeleton */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                {/* Banner Area */}
                <Skeleton className="h-48 sm:h-64 w-full rounded-none" />

                {/* Header Content */}
                <div className="p-6 sm:p-8 space-y-4">
                    <Skeleton className="h-8 sm:h-10 w-1/3 rounded-md" />
                    <Skeleton className="h-4 w-2/3 rounded-md" />

                    <div className="flex gap-4 pt-4">
                        <Skeleton className="h-12 w-32 rounded-xl" />
                        <Skeleton className="h-12 w-32 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* Assignments List Skeleton */}
            <main className="space-y-4">
                <Skeleton className="h-8 w-40 rounded-md mb-6" /> {/* Section Title */}

                {/* Fake List Items */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center p-4 bg-white border border-slate-200 rounded-xl gap-4">
                        <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-1/3 rounded-md" />
                            <Skeleton className="h-4 w-1/4 rounded-md" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                ))}
            </main>
        </div>
    );
}
