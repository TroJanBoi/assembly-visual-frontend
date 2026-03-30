"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicClasses, Class } from "@/lib/api/class";
import { getMyTasks, TaskMeResponse } from "@/lib/api/user";
import ClassCard from "@/components/class/ClassCard";
import { HiOutlineArrowRight, HiPlus, HiOutlineSparkles, HiOutlineBookOpen, HiOutlineClock } from "react-icons/hi";
import { HiGlobeAsiaAustralia } from "react-icons/hi2";
import { Loader2 } from "lucide-react";
import ClassCardSkeleton from "@/components/skeletons/ClassCardSkeleton";

export default function HomePage() {
  const [publicClasses, setPublicClasses] = useState<Class[]>([]);
  const [tasks, setTasks] = useState<TaskMeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check auth
    setIsLoggedIn(!!localStorage.getItem("authToken"));

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Always load public classes
        const classesPromise = getPublicClasses();
        
        let fetchedClasses: Class[] = [];
        let fetchedTasks: TaskMeResponse[] = [];

        if (isLoggedIn) {
          const [classesRes, tasksRes] = await Promise.all([
            classesPromise,
            getMyTasks().catch(() => []) // fail gracefully if tasks fail
          ]);
          fetchedClasses = classesRes || [];
          fetchedTasks = tasksRes || [];
        } else {
          fetchedClasses = await classesPromise || [];
        }

        setPublicClasses(fetchedClasses);
        setTasks(fetchedTasks);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [isLoggedIn]);


  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50/50 font-sans text-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto mb-16 pt-10">
            <div className="h-8 w-32 bg-indigo-50 rounded-full mx-auto mb-6 animate-pulse" />
            <div className="h-12 w-3/4 bg-slate-200 rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-1/2 bg-slate-100 rounded-lg mx-auto animate-pulse" />
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ClassCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-4">Error: {error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Retry</button>
        </div>
      </div>
    );
  }

  // --- GUEST VIEW ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50/50 font-sans text-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 pt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6">
              <HiOutlineSparkles className="w-4 h-4" />
              <span>Welcome Guest</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Explore Public Classes
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              Discover free assembly language courses and start your low-level programming journey today.
            </p>
          </div>

          {/* Public Classes Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {publicClasses.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
            {publicClasses.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                No public classes available at the moment.
              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  // --- USER VIEW ---
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50/50 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-16 pt-6">

        {/* SECTION 1: PUBLIC CLASSES */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Public Classes</h2>
              <p className="text-slate-500 mt-2 text-lg">Featured open courses.</p>
            </div>
            <Link
              href="/class/public"
              className="group flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              Show all classes
              <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {publicClasses.slice(0, 4).map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* SECTION 2: MY ASSIGNMENTS (User Only) */}
        <section className="relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">My Assignments</h2>
              <p className="text-slate-500 mt-2 text-lg">Your active tasks across all classes.</p>
            </div>
            <Link
              href="/assignment"
              className="group flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              More
              <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-1">
            {tasks.length > 0 ? (
              tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.assignment_id}
                  href={`/class/${task.class_id}/assignment/${task.assignment_id}/playground`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-indigo-300 transition-all group"
                >
                  <div className="flex items-start gap-4 mb-4 sm:mb-0">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 shrink-0">
                      <HiOutlineBookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {task.assignment_title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-xs">
                          Class {task.class_id}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[200px] sm:max-w-[400px]">
                          {task.description || "No description provided."}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto ml-14 sm:ml-0">
                    {/* Due Date Badge */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                      <HiOutlineClock className="w-3.5 h-3.5" />
                      <span>
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "No Due Date"}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <div className={`text-xs font-semibold capitalize px-3 py-1.5 rounded-full whitespace-nowrap border ${
                      task.status === "completed"
                        ? "text-green-700 bg-green-50 border-green-200"
                        : task.status === "overdue"
                        ? "text-red-600 bg-red-50 border-red-200"
                        : "text-slate-500 bg-slate-50 border-slate-200"
                    }`}>
                      {task.status.replace("_", " ")}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // Empty State
              <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.05),transparent)] opacity-100" />
                <div className="relative z-10 flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <HiPlus className="w-10 h-10" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">No Active Assignments</h3>
                    <p className="text-slate-500 leading-relaxed">
                      You are all caught up! There are no pending tasks across your classes right now.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
