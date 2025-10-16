"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineBell, HiOutlineSearch, HiOutlineUser } from "react-icons/hi";

export default function TopNav() {
  // ปรับความสูง topbar ลงใน CSS variable
  useEffect(() => {
    const HEIGHT = 64;
    document.documentElement.style.setProperty("--topbar-height", `${HEIGHT}px`);
  }, []);

  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname === "/signin" || pathname === "/signup"; // หน้า Overview

  // วันที่ (ใช้เฉพาะโหมด dashboard)
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    if (isLanding) return;
    try {
      const now = new Date();
      const month = now.toLocaleString("en-US", { month: "long" });
      const day = now.getDate();
      const year = now.getFullYear();
      setDateStr(`${month}, ${day} ${year}`);
    } catch {}
  }, [isLanding]);

  return (
    <header
      role="banner"
      className="fixed top-0 z-30 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur
                 border-b border-gray-100 dark:border-slate-800"
      style={{
        // landing ไม่ต้องเลื่อนตาม sidebar, dashboard ให้ชิดขวาตาม sidebar
        left: isLanding ? 0 : "var(--sidebar-width, 240px)",
        right: 0,
        height: "var(--topbar-height, 64px)",
      }}
    >
      {/* Landing: ใช้ container กลาง, Dashboard: ใช้ flex เต็มความกว้าง */}
      <div
        className={
          isLanding
            ? "mx-auto max-w-7xl px-6 h-full flex items-center justify-between"
            : "px-4 h-full flex items-center gap-4"
        }
      >
        {/* LEFT */}
        {isLanding ? (
          // L A N D I N G  — โลโก้
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-[var(--color-primary)]"
          >
            BLYLAB.
          </Link>
        ) : (
          // D A S H B O A R D — วันที่
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">
              {dateStr}
            </div>
          </div>
        )}

        {/* CENTER (เฉพาะ dashboard) */}
        {!isLanding && (
          <div className="flex-1">
            <div className="max-w-lg mx-auto">
              <label className="sr-only">Search</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <HiOutlineSearch />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-100 dark:border-slate-700
                             bg-gray-50 dark:bg-slate-800 text-sm placeholder-gray-400 dark:placeholder-gray-500
                             text-gray-700 dark:text-gray-200"
                  placeholder="Search courses, assignments..."
                  aria-label="Search"
                />
              </div>
            </div>
          </div>
        )}

        {/* RIGHT */}
        {isLanding ? (
          // L A N D I N G — Sign in / up
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/signin"
              className="text-[var(--color-primary)] hover:underline"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-[var(--color-primary)] text-white rounded-md px-4 py-1.5 font-medium hover:opacity-90 transition"
            >
              Sign Up
            </Link>
          </div>
        ) : (
          // D A S H B O A R D — icons
          <nav className="flex items-center gap-3">
            <button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800">
              <HiOutlineBell size={20} />
            </button>
            <Link
              href="/profile"
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <HiOutlineUser size={20} />
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
