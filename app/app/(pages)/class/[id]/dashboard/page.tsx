"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useClass } from "../ClassContext";
import { format, isAfter } from "date-fns";
import {
    HiOutlineUserGroup,
    HiOutlineClipboardList,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineCalendar,
    HiOutlineChevronRight,
    HiOutlineInformationCircle,
    HiOutlineChartPie,
} from "react-icons/hi";
import ClassToolHeader from "@/components/class/ClassToolHeader";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { cn } from "@/lib/utils";
import { useClassStats, AssignmentStats } from "@/hooks/useClassStats";

export default function ClassDashboardPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { classData, isOwner: contextIsOwner, loading: contextLoading } = useClass();

    const { members, assignments, stats: allStats, loading: statsLoading, error } = useClassStats(id, contextIsOwner, { skip: contextLoading });

    useEffect(() => {
        if (!contextLoading && !contextIsOwner) {
            toast.error("Access denied");
            router.push(`/class/${id}`);
        }
    }, [contextLoading, contextIsOwner, id, router]);

    useEffect(() => {
        if (error) {
            toast.error(error.message || "Failed to load dashboard");
        }
    }, [error]);

    const loading = contextLoading || statsLoading;

    const totalPending = useMemo(() => allStats.reduce((s, a) => s + Math.max(0, a.pendingCount), 0), [allStats]);
    const totalSubmissions = useMemo(() => allStats.reduce((s, a) => s + a.totalSubmissions, 0), [allStats]);
    const submissionRate = useMemo(() => {
        const possible = assignments.length * members.length;
        return possible > 0 ? Math.round((totalSubmissions / possible) * 100) : 0;
    }, [assignments, members, totalSubmissions]);

    const upcomingAssignments = useMemo(
        () =>
            assignments
                .filter((a) => a.due_date && isAfter(new Date(a.due_date), new Date()))
                .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                .slice(0, 5),
        [assignments]
    );

    const recentStats = useMemo(() => [...allStats].sort((a, b) => b.totalSubmissions - a.totalSubmissions).slice(0, 5), [allStats]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    const StatCard = ({
        icon: Icon,
        label,
        value,
        sub,
        color,
    }: {
        icon: any;
        label: string;
        value: string | number;
        sub?: string;
        color: string;
    }) => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", color)}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500 font-medium">{label}</div>
                {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <ClassToolHeader
                title="Class Dashboard"
                subtitle={classData?.topic || "Overview of class activity and performance"}
            />

            <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={HiOutlineUserGroup}
                        label="Total Members"
                        value={members.length}
                        color="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        icon={HiOutlineClipboardList}
                        label="Assignments"
                        value={assignments.length}
                        color="bg-indigo-50 text-indigo-600"
                    />
                    <StatCard
                        icon={HiOutlineCheckCircle}
                        label="Submission Rate"
                        value={`${submissionRate}%`}
                        sub={`${totalSubmissions} total submissions`}
                        color="bg-green-50 text-green-600"
                    />
                    <StatCard
                        icon={HiOutlineClock}
                        label="Missing Submissions"
                        value={totalPending}
                        sub="unsubmitted by students"
                        color="bg-amber-50 text-amber-600"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Assignment submission status */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <HiOutlineClipboardList className="w-5 h-5 text-indigo-500" />
                                Assignment Overview
                            </h2>
                            <Link href={`/class/${id}/analytics`} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                Full analytics <HiOutlineChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                        {recentStats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <HiOutlineInformationCircle className="w-8 h-8 mb-2" />
                                <p className="text-sm mb-4">No assignments yet</p>
                                <Link
                                    href={`/class/${id}/assignments/new`}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    <HiOutlineClipboardList className="w-4 h-4" />
                                    Create Assignment
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentStats.map(({ assignment, totalSubmissions, pendingCount }) => {
                                    const rate = members.length > 0 ? Math.round((totalSubmissions / members.length) * 100) : 0;
                                    return (
                                        <div key={assignment.id} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-gray-700 truncate max-w-[60%]">{assignment.title}</span>
                                                <span className="text-gray-500 text-xs">
                                                    {totalSubmissions}/{members.length} submitted
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${rate}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Upcoming due dates */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <HiOutlineCalendar className="w-5 h-5 text-indigo-500" />
                            Upcoming Due Dates
                        </h2>
                        {upcomingAssignments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <HiOutlineCheckCircle className="w-8 h-8 mb-2" />
                                <p className="text-sm mb-4">No upcoming deadlines</p>
                                {assignments.length === 0 && (
                                    <Link
                                        href={`/class/${id}/assignments/new`}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
                                    >
                                        Create One
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingAssignments.map((a) => {
                                    const msLeft = new Date(a.due_date!).getTime() - Date.now();
                                    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
                                    const daysLabel = daysLeft <= 0 ? "Today" : `${daysLeft}d`;
                                    return (
                                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                                                    daysLeft <= 1
                                                        ? "bg-red-100 text-red-600"
                                                        : daysLeft <= 5
                                                            ? "bg-amber-100 text-amber-600"
                                                            : "bg-green-100 text-green-700"
                                                )}
                                            >
                                                {daysLabel}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm text-gray-800 truncate">{a.title}</p>
                                                <p className="text-xs text-gray-400">
                                                    {format(new Date(a.due_date!), "MMM d, yyyy · h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick links */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "Manage Members", href: `/class/${id}/members`, icon: HiOutlineUserGroup, desc: "Invite, remove, change roles" },
                        { label: "View Analytics", href: `/class/${id}/analytics`, icon: HiOutlineExclamationCircle, desc: "Score distribution & progress" },
                        { label: "Class Settings", href: `/class/${id}/settings`, icon: HiOutlineClipboardList, desc: "Edit class info & danger zone" },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-indigo-400 hover:shadow-md transition-all group"
                        >
                            <item.icon className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
