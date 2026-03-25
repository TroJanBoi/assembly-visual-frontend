"use client";

import { useRouter } from "next/navigation";
import { HiChevronLeft } from "react-icons/hi";
import { Button } from "@/components/ui/Button";

interface ClassToolHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    showBackButton?: boolean;
}

export default function ClassToolHeader({
    title,
    subtitle,
    children,
    showBackButton = false,
}: ClassToolHeaderProps) {
    const router = useRouter();

    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                            {subtitle && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {children && (
                        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
