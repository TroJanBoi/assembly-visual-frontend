"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HiOutlineBell, HiOutlineSearch, HiOutlineUser } from "react-icons/hi";

export default function TopNav() {
  useEffect(() => {
    try {
      const HEIGHT = 64; 
      document.documentElement.style.setProperty("--topbar-height", `${HEIGHT}px`);
    } catch {}
  }, []);
  // compute date on the client to avoid server/client mismatch during hydration
  const [dateStr, setDateStr] = useState<string>("");
  useEffect(() => {
    try {
      const now = new Date();
      const month = now.toLocaleString("en-US", { month: "long" });
      const day = now.getDate();
      const year = now.getFullYear();
      setDateStr(`${month},${day} ${year}`);
    } catch {
      setDateStr("");
    }
  }, []);

  return (
    <header
      role="banner"
      className="fixed top-0 z-30 flex items-center gap-4 px-4 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-gray-100 dark:border-slate-800"
      style={{
        left: "var(--sidebar-width, 240px)",
        right: 0,
        height: "var(--topbar-height, 64px)",
      }}
    >
      {/* Left: show date instead of site name */}
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">{dateStr || ""}</div>
      </div>
      <div className="flex-1">
        <div className="max-w-lg mx-auto">
          <label className="sr-only">Search</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <HiOutlineSearch />
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-700 dark:text-gray-200"
              placeholder="Search courses, assignments..."
              aria-label="Search"
            />
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-3">
        <button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800">
          <HiOutlineBell size={20} />
        </button>
        <button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800">
          <HiOutlineUser size={20}/>
        </button>
      </nav>
    </header>
  );
}
