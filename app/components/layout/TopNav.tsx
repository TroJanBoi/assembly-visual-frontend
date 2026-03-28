"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineBell, HiOutlineSearch, HiOutlineUser } from "react-icons/hi";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import NotificationDropdown from "@/components/layout/NotificationDropdown";

export default function TopNav() {
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname === "/signin" || pathname === "/signup";

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!isLanding) return;

    // Hide if scrolled past 80% of the viewport height (approx end of section 1)
    if (typeof window !== "undefined") {
      const threshold = window.innerHeight * 0.8;
      if (latest > threshold) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
    }
  });

  // Profile state for dashboard mode
  const [me, setMe] = useState<{ name?: string; picture_path?: string } | null>(null);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    if (isLanding) return;
    try {
      const now = new Date();
      setDateStr(now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" }));

      // Fetch profile
      // We import dynamically or just use the API function if available in scope
      // using require/import inside effect is tricky, better to import at top. 
      // But since we are replacing the whole component logic part, let's just use the top level imports.
      // Wait, I need to add imports first. 

      // Let's assume I will add imports in a separate `replace_file_content` or I can rewrite the whole file. 
      // Rewriting the whole file is cleaner to ensure imports are correct.
    } catch { }
  }, [isLanding]);

  // Fetch profile effect separate to avoid cluttering date logic
  useEffect(() => {
    if (isLanding) return;
    import("@/lib/api/profile").then(({ getProfile }) => {
      getProfile().then(data => setMe(data)).catch(() => { });
    });
  }, [isLanding]);

  if (isLanding) {
    return (
      <motion.header
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -100, opacity: 0 }
        }}
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none"
      >
        <nav className="pointer-events-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/50 shadow-xl rounded-full px-6 py-3 flex items-center gap-12 transition-all">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">BLYLAB</span>
            <span className="text-indigo-500 font-bold text-xl">.</span>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</Link>
            <Link href="#demo" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Demo</Link>
            <Link href="#team" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Team</Link>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700">
            <ThemeToggle />
            <Link href="/signin" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-semibold bg-slate-900 text-white hover:bg-indigo-600 px-4 py-2 rounded-full transition-all shadow-lg shadow-indigo-500/20">
              Get Started
            </Link>
          </div>
        </nav>
      </motion.header>
    );
  }

  // --- DASHBOARD MODE (Unchanged logic, just kept structure) ---
  return (
    <header
      className="fixed top-0 z-30 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-gray-100 dark:border-slate-800"
      style={{ left: "var(--sidebar-width, 240px)", right: 0, height: "64px" }}
    >
      <div className="px-4 h-full flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">{dateStr}</div>
        </div>
        <div className="flex-1">
          <div className="max-w-lg mx-auto relative hidden md:block">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><HiOutlineSearch /></span>
            <input className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Search..." />
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationDropdown />

          <Link href="/profile" className="flex items-center gap-2 pl-2">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {me?.picture_path ? (
                <img src={me.picture_path} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-xs">
                  {me?.name?.charAt(0).toUpperCase() || <HiOutlineUser size={16} />}
                </div>
              )}
            </div>
          </Link>
        </nav>
      </div>
    </header>
  );
}
