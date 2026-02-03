import { Skeleton } from "@/components/ui/Skeleton";

export default function FormSkeleton() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col gap-4">
                <Skeleton className="h-4 w-48 rounded-md mx-auto" />
                <Skeleton className="h-8 w-64 rounded-md" />
            </div>

            {/* Form Area */}
            <div className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200">
                {/* Input Group 1 */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-11 w-full rounded-lg" />
                </div>

                {/* Input Group 2 */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                </div>

                {/* Input Group 3 (Row) */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="h-16 border-t bg-white flex items-center justify-end px-6 gap-4">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
        </div>
    );
}
