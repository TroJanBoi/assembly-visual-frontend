"use client";

import { useParams, usePathname } from "next/navigation";
import ClassNav from "@/components/class/ClassNav";
import { ClassProvider, useClass } from "./ClassContext";

// Routes where ClassNav should NOT appear (full-page forms / standalone views)
const NAV_EXCLUDED_PATTERNS = [
    /\/assignments\/new$/,
    /\/assignments\/\d+\/edit/,
    /\/edit$/,
];

function ClassNavWrapper() {
    const { id } = useParams() as { id: string };
    const pathname = usePathname();
    const { isOwner, loading } = useClass();

    const showNav = !NAV_EXCLUDED_PATTERNS.some((pattern) => pattern.test(pathname));

    if (loading || !showNav) return null;

    return <ClassNav classId={id} isOwner={isOwner} />;
}

export default function ClassLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClassProvider>
            <ClassNavWrapper />
            {children}
        </ClassProvider>
    );
}
