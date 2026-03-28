"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    HiOutlineClipboardList,
    HiOutlineUserGroup,
    HiOutlineChartBar,
    HiOutlineCollection,
    HiOutlineCog,
    HiOutlineClipboardCheck,
} from "react-icons/hi";

interface ClassNavProps {
    classId: string | number;
    isOwner: boolean;
}

const tabs = [
    {
        label: "Assignments",
        href: (id: string | number) => `/class/${id}`,
        icon: HiOutlineClipboardList,
        ownerOnly: false,
        exact: true,
    },
    {
        label: "Members",
        href: (id: string | number) => `/class/${id}/members`,
        icon: HiOutlineUserGroup,
        ownerOnly: false,
        exact: false,
    },
    {
        label: "Submissions",
        href: (id: string | number) => `/class/${id}/submissions`,
        icon: HiOutlineClipboardCheck,
        ownerOnly: false,
        exact: false,
    },
    {
        label: "Dashboard",
        href: (id: string | number) => `/class/${id}/dashboard`,
        icon: HiOutlineCollection,
        ownerOnly: true,
        exact: false,
    },
    {
        label: "Analytics",
        href: (id: string | number) => `/class/${id}/analytics`,
        icon: HiOutlineChartBar,
        ownerOnly: true,
        exact: false,
    },
    {
        label: "Settings",
        href: (id: string | number) => `/class/${id}/settings`,
        icon: HiOutlineCog,
        ownerOnly: true,
        exact: false,
    },
];

export default function ClassNav({ classId, isOwner }: ClassNavProps) {
    const pathname = usePathname();

    const visibleTabs = tabs.filter((t) => !t.ownerOnly || isOwner);

    const isActive = (tab: (typeof tabs)[0]) => {
        const href = tab.href(classId);
        if (tab.exact) return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="max-w-screen-xl mx-auto px-4 md:px-6">
                <div className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
                    {visibleTabs.map((tab) => {
                        const active = isActive(tab);
                        const Icon = tab.icon;
                        const label = tab.label === "Submissions" && !isOwner ? "My Submissions" : tab.label;
                        return (
                            <Link
                                key={tab.label}
                                href={tab.href(classId)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                                    active
                                        ? "border-indigo-600 text-indigo-600"
                                        : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                                )}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
