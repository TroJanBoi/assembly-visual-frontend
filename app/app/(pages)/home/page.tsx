"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicClasses, Class } from "@/lib/api/class";
import ClassCard from "@/components/class/ClassCard";
import { HiOutlineArrowRight, HiPlus, HiOutlineSparkles } from "react-icons/hi";
import { HiGlobeAsiaAustralia } from "react-icons/hi2";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [publicClasses, setPublicClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check auth
    setIsLoggedIn(!!localStorage.getItem("authToken"));

    const fetchPublicClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedClasses = await getPublicClasses();
        setPublicClasses(fetchedClasses || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch public classes.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicClasses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
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
              href="#"
              // Placeholder link as requested
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
              <p className="text-slate-500 mt-2 text-lg">Your active tasks.</p>
            </div>
          </div>

          {/* Placeholder Content */}
          <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.05),transparent)] opacity-100" />

            <div className="relative z-10 flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                <HiPlus className="w-10 h-10" />
              </div>
              <div className="max-w-md">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Assignments Coming Soon</h3>
                <p className="text-slate-500 leading-relaxed">
                  We are building a comprehensive dashboard for you to track your progress, grades, and upcoming deadlines.
                </p>
              </div>
              <button disabled className="mt-4 px-8 py-3 rounded-xl bg-slate-100 text-slate-400 font-semibold cursor-not-allowed">
                Dashboard In Progress
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
