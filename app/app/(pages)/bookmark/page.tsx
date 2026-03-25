"use client";

import { useState, useMemo, useEffect } from "react";
import {
  HiOutlineSearch,
  HiOutlineAdjustments,
  HiOutlineSortAscending,
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
  HiOutlineChevronDown,
  HiOutlineAcademicCap,
  HiOutlineBookmark,
} from "react-icons/hi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ClassCard from "@/components/class/ClassCard";
import { Class, getBookmarks } from "@/lib/api/class";
import ClassPageSkeleton from "@/components/skeletons/ClassPageSkeleton";

/* ============================================================
   TYPES & HELPERS
   ============================================================ */
type StatusFilter = "all" | "public" | "private";
type SortKey = "topic" | "members" | "newest";

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  public: {
    label: "Public",
    color:
      "bg-emerald-100 text-emerald-700 border border-emerald-200",
    icon: <HiOutlineGlobeAlt className="w-3.5 h-3.5" />,
  },
  private: {
    label: "Private",
    color:
      "bg-slate-100 text-slate-700 border border-slate-200",
    icon: <HiOutlineLockClosed className="w-3.5 h-3.5" />,
  },
};

/* ============================================================
   PAGE
   ============================================================ */
export default function BookmarkPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const data = await getBookmarks();
      setClasses(data || []);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      toast.error("Failed to load bookmarks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Filter / Sort / Search
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState("");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  /* ---------- computed ---------- */
  const filtered = useMemo(() => {
    let list = [...classes];

    // Status filter
    if (statusFilter !== "all") {
      const targetStatus = statusFilter === "public" ? 0 : 1;
      list = list.filter((t) => t.status === targetStatus);
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.topic.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "newest") {
        cmp = b.id - a.id;
      } else if (sortKey === "topic") {
        cmp = a.topic.localeCompare(b.topic);
      } else if (sortKey === "members") {
        cmp = a.member_amount - b.member_amount;
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [classes, statusFilter, search, sortKey, sortAsc]);

  /* ---------- counts ---------- */
  const counts = useMemo(
    () => ({
      all: classes.length,
      public: classes.filter((t) => t.status === 0).length,
      private: classes.filter((t) => t.status === 1).length,
    }),
    [classes]
  );

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "newest", label: "Newest" },
    { key: "topic", label: "Topic" },
    { key: "members", label: "Members" },
  ];

  /* ------------------------------------------------------------------ */
  if (isLoading) {
    return <ClassPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Page Header ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Bookmarked Classes
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              {counts.all} saved class{counts.all !== 1 ? "es" : ""}
            </p>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              <HiOutlineGlobeAlt className="w-3.5 h-3.5" />
              {counts.public} Public
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              <HiOutlineLockClosed className="w-3.5 h-3.5" />
              {counts.private} Private
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
                Visibility:
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

              {/* Public */}
              <button
                onClick={() => setStatusFilter("public")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  statusFilter === "public"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                )}
              >
                <HiOutlineGlobeAlt className="w-3.5 h-3.5" />
                Public{" "}
                <span className="opacity-70">({counts.public})</span>
              </button>

              {/* Private */}
              <button
                onClick={() => setStatusFilter("private")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  statusFilter === "private"
                    ? "bg-slate-600 text-white border-slate-600"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                )}
              >
                <HiOutlineLockClosed className="w-3.5 h-3.5" />
                Private{" "}
                <span className="opacity-70">({counts.private})</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Class Grid ───────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <HiOutlineAcademicCap className="w-14 h-14 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">
              No bookmarked classes found
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {search
                ? `No results for "${search}".`
                : "You have no classes matching the selected filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <p className="text-center text-xs text-slate-400 pb-2">
            Showing {filtered.length} of {classes.length} classes
          </p>
        )}
      </div>
    </div>
  );
}
