"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useClass } from "../ClassContext";
import { format } from "date-fns";
import {
    HiOutlineChartBar,
    HiOutlineUserGroup,
    HiOutlineInformationCircle,
} from "react-icons/hi";
import ClassToolHeader from "@/components/class/ClassToolHeader";
import AnalyticsSkeleton from "@/components/skeletons/AnalyticsSkeleton";
import { cn } from "@/lib/utils";
import { useClassStats } from "@/hooks/useClassStats";

const SCORE_BUCKETS = [
    { label: "0–20", min: 0, max: 20, color: "bg-red-400" },
    { label: "21–40", min: 21, max: 40, color: "bg-orange-400" },
    { label: "41–60", min: 41, max: 60, color: "bg-yellow-400" },
    { label: "61–80", min: 61, max: 80, color: "bg-blue-400" },
    { label: "81–100", min: 81, max: 100, color: "bg-green-500" },
];

export default function ClassAnalyticsPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { isOwner: contextIsOwner, loading: contextLoading } = useClass();

    const [sortConfig, setSortConfig] = useState<{ key: "name" | "submitted" | "rate" | "avg"; direction: "asc" | "desc" } | null>(null);
    const [selectedIdx, setSelectedIdx] = useState(0);

    const { members, stats: data, loading: statsLoading, error } = useClassStats(id, contextIsOwner, { skip: contextLoading });

    const handleSort = (key: "name" | "submitted" | "rate" | "avg") => {
        setSortConfig((current) => {
            if (current?.key === key && current.direction === "asc") {
                return { key, direction: "desc" };
            }
            return { key, direction: "asc" };
        });
    };

    useEffect(() => {
        if (!contextLoading && !contextIsOwner) {
            toast.error("Access denied");
            router.push(`/class/${id}`);
        }
    }, [contextLoading, contextIsOwner, id, router]);

    useEffect(() => {
        if (error) {
            toast.error(error.message || "Failed to load analytics");
        }
    }, [error]);

    const loading = contextLoading || statsLoading;

    const current = data[selectedIdx];

    const distribution = useMemo(() => {
        if (!current) return SCORE_BUCKETS.map((b) => ({ ...b, count: 0 }));
        const latest = Array.from(current.latestPerUser.values()).filter((s) => s.score !== null);
        return SCORE_BUCKETS.map((b) => ({
            ...b,
            count: latest.filter((s) => (s.score ?? 0) >= b.min && (s.score ?? 0) <= b.max).length,
        }));
    }, [current]);

    const maxCount = useMemo(() => Math.max(...distribution.map((b) => b.count), 1), [distribution]);

    const studentProgress = useMemo(() => {
        const base = members.map((m) => {
            const userSubs = data.map((d) => {
                const sub = d.latestPerUser.get(m.id);
                return { assignmentTitle: d.assignment.title, sub };
            });
            const submitted = userSubs.filter((s) => s.sub).length;
            const scores = userSubs.filter((s) => s.sub?.score !== null && s.sub?.score !== undefined).map((s) => s.sub!.score as number);
            const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
            const rate = data.length > 0 ? Math.round((submitted / data.length) * 100) : 0;
            return { member: m, submitted, total: data.length, avg, rate };
        });

        if (sortConfig) {
            base.sort((a, b) => {
                let valA: any = a[sortConfig.key as keyof typeof a];
                let valB: any = b[sortConfig.key as keyof typeof b];

                if (sortConfig.key === "name") {
                    valA = a.member.name;
                    valB = b.member.name;
                }

                if (valA === valB) return 0;
                if (valA === null) return 1;
                if (valB === null) return -1;

                const comparison = valA > valB ? 1 : -1;
                return sortConfig.direction === "asc" ? comparison : -comparison;
            });
        }

        return base;
    }, [members, data, sortConfig]);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <ClassToolHeader
                title="Analytics"
                subtitle="Score distribution and student progress"
            />

            <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 space-y-8">

                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white rounded-2xl border">
                        <HiOutlineInformationCircle className="w-10 h-10 mb-2" />
                        <p>No assignments in this class yet.</p>
                    </div>
                ) : (
                    <>
                        {/* Assignment selector and header */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="font-semibold text-gray-800">Score Distribution</h2>
                                <div className="relative min-w-[200px] max-w-full sm:max-w-xs">
                                    <select
                                        value={selectedIdx}
                                        onChange={(e) => setSelectedIdx(Number(e.target.value))}
                                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm font-medium"
                                    >
                                        {data.map((d, i) => (
                                            <option key={d.assignment.id} value={i}>
                                                {d.assignment.title}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Stats summary for selected */}
                            {current && (() => {
                                const latest = Array.from(current.latestPerUser.values());
                                const scores = latest.filter((s) => s.score !== null).map((s) => s.score as number);
                                const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "-";
                                const max = scores.length ? Math.max(...scores) : "-";
                                const min = scores.length ? Math.min(...scores) : "-";
                                return (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { label: "Submitted", value: `${latest.length}/${members.length}` },
                                            { label: "Avg Score", value: avg },
                                            { label: "Highest", value: max },
                                            { label: "Lowest", value: min },
                                        ].map((s) => (
                                            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                                                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                                                <div className="text-xs text-gray-500">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* Bar chart */}
                            <div className="flex items-end gap-3 h-40 pt-2">
                                {distribution.map((bucket) => {
                                    const pct = Math.round((bucket.count / maxCount) * 100);
                                    return (
                                        <div key={bucket.label} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-xs font-medium text-gray-600">{bucket.count}</span>
                                            <div className="w-full rounded-t-lg overflow-hidden bg-gray-100 flex items-end" style={{ height: "100px" }}>
                                                <div
                                                    className={cn("w-full rounded-t-lg transition-all duration-500", bucket.color)}
                                                    style={{ height: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-gray-500">{bucket.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submission rate per assignment */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="font-semibold text-gray-800 mb-4">Submission Rate per Assignment</h2>
                            <div className="space-y-4">
                                {data.map((d) => {
                                    const submitted = d.latestPerUser.size;
                                    const rate = members.length > 0 ? Math.round((submitted / members.length) * 100) : 0;
                                    const latest = Array.from(d.latestPerUser.values());
                                    const scores = latest.filter((s) => s.score !== null).map((s) => s.score as number);
                                    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "–";
                                    return (
                                        <div key={d.assignment.id} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-gray-700">{d.assignment.title}</span>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>Avg: <span className="font-semibold text-gray-700">{avg}</span></span>
                                                    <span>{submitted}/{members.length}</span>
                                                    <span className={cn("font-bold", rate >= 80 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-red-500")}>
                                                        {rate}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-400" : "bg-red-400"
                                                    )}
                                                    style={{ width: `${rate}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Student progress table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <HiOutlineUserGroup className="w-5 h-5 text-indigo-500" />
                                    Student Progress
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th
                                                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                                onClick={() => handleSort("name")}
                                            >
                                                Student {sortConfig?.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th
                                                className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                                onClick={() => handleSort("submitted")}
                                            >
                                                Submitted {sortConfig?.key === "submitted" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th
                                                className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                                onClick={() => handleSort("rate")}
                                            >
                                                Completion {sortConfig?.key === "rate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th
                                                className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                                onClick={() => handleSort("avg")}
                                            >
                                                Avg Score {sortConfig?.key === "avg" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {studentProgress.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                                    No students enrolled yet
                                                </td>
                                            </tr>
                                        ) : (
                                            studentProgress.map(({ member, submitted, total, avg, rate }) => {
                                                return (
                                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                                    {member.name?.[0]?.toUpperCase() || "?"}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-800">{member.name}</div>
                                                                    <div className="text-xs text-gray-400">{member.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-600">
                                                            {submitted}/{total}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full",
                                                                            rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-400" : "bg-red-400"
                                                                        )}
                                                                        style={{ width: `${rate}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-500 w-8 text-right">{rate}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {avg !== null ? (
                                                                <span className={cn("font-bold", avg >= 80 ? "text-green-600" : avg >= 60 ? "text-amber-600" : "text-red-500")}>
                                                                    {avg}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300">–</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
