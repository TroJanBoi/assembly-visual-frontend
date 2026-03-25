"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getMyTasks, TaskMeResponse } from "@/lib/api/user";
import { format, isPast, parseISO, isValid } from "date-fns";
import {
    HiOutlineSearch,
    HiOutlineAdjustments,
    HiOutlineSortAscending,
    HiOutlineClipboardList,
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineChevronDown,
    HiOutlinePlay,
} from "react-icons/hi";
import { cn } from "@/lib/utils";
import { CLASS_BANNERS } from "@/lib/constants/banners";
import { Loader2 } from "lucide-react";

/* ============================================================
   TYPES & HELPERS
   ============================================================ */
type StatusFilter = "all" | "in_progress" | "completed" | "overdue";
type SortKey = "due_date" | "title" | "status";

const STATUS_META: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
> = {
    in_progress: {
        label: "Pending",
        color:
            "bg-amber-100 text-amber-700 border border-amber-200",
        icon: <HiOutlineClock className="w-3.5 h-3.5" />,
    },
    completed: {
        label: "Submitted",
        color:
            "bg-green-100 text-green-700 border border-green-200",
        icon: <HiOutlineCheckCircle className="w-3.5 h-3.5" />,
    },
    overdue: {
        label: "Overdue",
        color: "bg-red-100 text-red-700 border border-red-200",
        icon: <HiOutlineExclamationCircle className="w-3.5 h-3.5" />,
    },
};

function formatDueDate(dateStr: string) {
    if (!dateStr) return "No due date";
    const d = parseISO(dateStr);
    if (!isValid(d)) return "No due date";
    return format(d, "PPP");
}

/* ============================================================
   TASK CARD
   ============================================================ */
function TaskCard({ task }: { task: TaskMeResponse }) {
    const meta = STATUS_META[task.status] ?? STATUS_META["in_progress"];
    const dueText = formatDueDate(task.due_date);
    const dueParsed = task.due_date ? parseISO(task.due_date) : null;
    const isOverdueDate = dueParsed && isValid(dueParsed) && isPast(dueParsed);

    const bannerStyle =
        CLASS_BANNERS[task.banner_id ?? 0]?.style ?? CLASS_BANNERS[0].style;

    return (
        <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
            {/* Thin color stripe at top based on banner */}
            <div className="h-2 w-full" style={bannerStyle} />

            <div className="flex-1 p-5 flex flex-col gap-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                    {/* Icon + Title */}
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <HiOutlineClipboardList className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {task.assignment_title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {task.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <span
                        className={cn(
                            "flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                            meta.color
                        )}
                    >
                        {meta.icon}
                        {meta.label}
                    </span>
                </div>

                {/* Footer Row */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div
                        className={cn(
                            "flex items-center gap-1.5 text-xs font-medium",
                            isOverdueDate && task.status !== "completed"
                                ? "text-red-500"
                                : "text-slate-500"
                        )}
                    >
                        <HiOutlineCalendar className="w-4 h-4" />
                        <span>{dueText}</span>
                    </div>

                    <Link
                        href={`/class/${task.class_id}/assignment/${task.assignment_id}/playground`}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                            task.status === "overdue"
                                ? "bg-slate-100 text-slate-400 cursor-default pointer-events-none"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                        )}
                        aria-disabled={task.status === "overdue"}
                        tabIndex={task.status === "overdue" ? -1 : 0}
                    >
                        <HiOutlinePlay className="w-3.5 h-3.5" />
                        {task.status === "completed" ? "Review" : "Start"}
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function MyTasksPage() {
    const [tasks, setTasks] = useState<TaskMeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter / Sort / Search
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortKey, setSortKey] = useState<SortKey>("due_date");
    const [sortAsc, setSortAsc] = useState(true);
    const [search, setSearch] = useState("");
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await getMyTasks();
                setTasks(data ?? []);
            } catch (err: any) {
                setError(err.message ?? "Failed to load tasks.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ---------- computed ---------- */
    const filtered = useMemo(() => {
        let list = [...tasks];

        // Status filter
        if (statusFilter !== "all") {
            list = list.filter((t) => t.status === statusFilter);
        }

        // Search
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (t) =>
                    t.assignment_title.toLowerCase().includes(q) ||
                    (t.description ?? "").toLowerCase().includes(q)
            );
        }

        // Sort
        list.sort((a, b) => {
            let cmp = 0;
            if (sortKey === "due_date") {
                cmp =
                    new Date(a.due_date ?? 0).getTime() -
                    new Date(b.due_date ?? 0).getTime();
            } else if (sortKey === "title") {
                cmp = a.assignment_title.localeCompare(b.assignment_title);
            } else if (sortKey === "status") {
                const order = { in_progress: 0, overdue: 1, completed: 2 };
                cmp =
                    (order[a.status as keyof typeof order] ?? 99) -
                    (order[b.status as keyof typeof order] ?? 99);
            }
            return sortAsc ? cmp : -cmp;
        });

        return list;
    }, [tasks, statusFilter, search, sortKey, sortAsc]);

    /* ---------- counts ---------- */
    const counts = useMemo(
        () => ({
            all: tasks.length,
            in_progress: tasks.filter((t) => t.status === "in_progress").length,
            completed: tasks.filter((t) => t.status === "completed").length,
            overdue: tasks.filter((t) => t.status === "overdue").length,
        }),
        [tasks]
    );

    const sortOptions: { key: SortKey; label: string }[] = [
        { key: "due_date", label: "Due Date" },
        { key: "title", label: "Title" },
        { key: "status", label: "Status" },
    ];

    /* ---------- loading / error ---------- */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-screen gap-4">
                <p className="text-red-500 font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                    Retry
                </button>
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    return (
        <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ── Page Header ─────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            My Tasks
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {counts.all} total assignment{counts.all !== 1 ? "s" : ""} across all your classes
                        </p>
                    </div>

                    {/* Stats chips */}
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <HiOutlineClock className="w-3.5 h-3.5" />
                            {counts.in_progress} Pending
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                            {counts.completed} Submitted
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                            {counts.overdue} Overdue
                        </span>
                    </div>
                </div>

                {/* ── Filter Toolbar ──────────────────────────── */}
                <div className="space-y-3">
                    {/* Row 1: Search for + Sort controls + Search box */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
                        {/* Search descriptor */}
                        <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                            Search for:{" "}
                            <span className="font-semibold text-slate-700">
                                &quot;{statusFilter === "all" ? "ALL" : STATUS_META[statusFilter]?.label}&quot;
                            </span>
                        </span>

                        <div className="flex-1" />

                        {/* Sort direction toggle */}
                        <button
                            onClick={() => setSortAsc((v) => !v)}
                            title={sortAsc ? "Sort ascending" : "Sort descending"}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <HiOutlineSortAscending
                                className={cn("w-4 h-4 transition-transform", !sortAsc && "rotate-180")}
                            />
                        </button>

                        {/* Filter icon (decorative – status chips below handle filter) */}
                        <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors">
                            <HiOutlineAdjustments className="w-4 h-4" />
                        </button>

                        {/* Sort by dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setSortDropdownOpen((v) => !v)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <span className="text-slate-500">Sort by:</span>
                                <span className="font-semibold">
                                    {sortOptions.find((o) => o.key === sortKey)?.label}
                                </span>
                                <HiOutlineChevronDown
                                    className={cn(
                                        "w-4 h-4 text-slate-400 transition-transform",
                                        sortDropdownOpen && "rotate-180"
                                    )}
                                />
                            </button>

                            {sortDropdownOpen && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setSortDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 z-20 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                                        {sortOptions.map((opt) => (
                                            <button
                                                key={opt.key}
                                                onClick={() => {
                                                    setSortKey(opt.key);
                                                    setSortDropdownOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2.5 text-sm transition-colors",
                                                    sortKey === opt.key
                                                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                                                        : "text-slate-700 hover:bg-slate-50"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Search box */}
                        <div className="relative">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 w-44 bg-slate-50"
                            />
                        </div>
                    </div>

                    {/* Row 2: Status filter chips */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-slate-500 font-medium mr-1">
                                Status:
                            </span>

                            {/* All */}
                            <button
                                onClick={() => setStatusFilter("all")}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                                    statusFilter === "all"
                                        ? "bg-slate-700 text-white border-slate-700"
                                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                )}
                            >
                                All{" "}
                                <span className="opacity-70">({counts.all})</span>
                            </button>

                            {/* Pending */}
                            <button
                                onClick={() => setStatusFilter("in_progress")}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                                    statusFilter === "in_progress"
                                        ? "bg-amber-500 text-white border-amber-500"
                                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                )}
                            >
                                <HiOutlineClock className="w-3.5 h-3.5" />
                                Pending{" "}
                                <span className="opacity-70">({counts.in_progress})</span>
                            </button>

                            {/* Submitted */}
                            <button
                                onClick={() => setStatusFilter("completed")}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                                    statusFilter === "completed"
                                        ? "bg-green-500 text-white border-green-500"
                                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                )}
                            >
                                <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                Submitted{" "}
                                <span className="opacity-70">({counts.completed})</span>
                            </button>

                            {/* Overdue */}
                            <button
                                onClick={() => setStatusFilter("overdue")}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                                    statusFilter === "overdue"
                                        ? "bg-red-500 text-white border-red-500"
                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                )}
                            >
                                <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                                Overdue{" "}
                                <span className="opacity-70">({counts.overdue})</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Task Grid ───────────────────────────────── */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
                        <HiOutlineClipboardList className="w-14 h-14 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">
                            No tasks found
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            {search
                                ? `No results for "${search}".`
                                : "You have no tasks matching the selected filter."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((task) => (
                            <TaskCard key={task.assignment_id} task={task} />
                        ))}
                    </div>
                )}

                {/* Footer count */}
                {filtered.length > 0 && (
                    <p className="text-center text-xs text-slate-400 pb-2">
                        Showing {filtered.length} of {tasks.length} tasks
                    </p>
                )}
            </div>
        </div>
    );
}
