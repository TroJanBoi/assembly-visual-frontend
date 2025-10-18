"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HiOutlineChevronRight,
  HiOutlineHome,
  HiHome,
  HiOutlineAcademicCap,
  HiAcademicCap,
  HiOutlineDocumentText,
  HiDocumentText,
  HiOutlineCalendar,
  HiCalendar,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineClock,
  HiClock,
  HiOutlineLogout,
} from "react-icons/hi";

import { getProfile, type Profile } from "@/lib/api/profile";
import { signout } from "@/lib/api/auth";

type NavItem = {
  href: string;
  label: string;
  iconOutline?: React.ComponentType<{ size?: number; className?: string }>;
  iconSolid?: React.ComponentType<{ size?: number; className?: string }>;
};

export default function SideBar({
  collapsed = false,
  className = "",
  items,
}: {
  collapsed?: boolean;
  className?: string;
  items?: NavItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [me, setMe] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");

  // ให้ server/initial render เท่ากับ prop ก่อน แล้วค่อย sync localStorage ตอน mount
  const [isCollapsed, setIsCollapsed] = useState<boolean>(collapsed);

  useEffect(() => {
    let cancelled = false;

    // sync ค่า collapse จาก localStorage
    try {
      const v = localStorage.getItem("sidebar-collapsed");
      if (v !== null) {
        const stored = v === "1";
        if (!cancelled && stored !== isCollapsed) setIsCollapsed(stored);
      }
    } catch { }

    // โหลดโปรไฟล์
    (async () => {
      try {
        const data = await getProfile();
        if (!cancelled && data) {
          setMe(data);
          setEmail(data.email ?? "");
        }
      } catch {
        // เงียบไว้ให้ UI ใช้ได้ต่อ
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เก็บสถานะ collapsed ลง localStorage
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", isCollapsed ? "1" : "0");
    } catch { }
  }, [isCollapsed]);

  // toggle ปุ่มยุบ/ขยาย
  const onToggle = () => setIsCollapsed((prev) => !prev);

  // อัปเดตความกว้าง sidebar ผ่าน CSS var
  useEffect(() => {
    try {
      const COLLAPSED_WIDTH = 72;
      const EXPANDED_WIDTH = 240;
      const width = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
      document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
    } catch { }
  }, [isCollapsed]);

  const navItemsRaw: NavItem[] = items ?? [
    { href: "/home", label: "Home", iconOutline: HiOutlineHome, iconSolid: HiHome },
    { href: "/class", label: "Class", iconOutline: HiOutlineAcademicCap, iconSolid: HiAcademicCap },
    { href: "/assignment", label: "Assignment", iconOutline: HiOutlineDocumentText, iconSolid: HiDocumentText },
    { href: "/calendar", label: "Calendar", iconOutline: HiOutlineCalendar, iconSolid: HiCalendar },
    { href: "/bookmark", label: "Bookmark", iconOutline: HiOutlineBookmark, iconSolid: HiBookmark },
    { href: "/recent", label: "Recent", iconOutline: HiOutlineClock, iconSolid: HiClock },
  ];

  const initials =
    (email?.trim()?.[0]?.toUpperCase() ||
      me?.name?.trim()?.[0]?.toUpperCase() ||
      "U");

  const navItems = normalizeNavItems(navItemsRaw);

  // ออกจากระบบ (รองรับทั้งเรียก backend และ fallback เคลียร์ token ฝั่ง client)
  const handleLockout = async () => {
    try {
      if (typeof signout === "function") {
        await signout(); // ถ้ามี endpoint backend
      }
    } catch {
      // fallback ต่อด้านล่าง
    }

    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      localStorage.removeItem("sidebar-collapsed");
    } catch { }

    router.replace("/"); // แก้ path ตามโปรเจกต์ของคุณ
  };
  // 1) เพิ่ม helper สำหรับ normalize/dedupe
  function normalizeNavItems(list: NavItem[]): NavItem[] {
    const seen = new Set<string>();
    const out: NavItem[] = [];
    for (const it of list) {
      // ใช้คู่ (href|label) เป็น signature
      const sig = `${it.href}|${it.label}`;
      if (seen.has(sig)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[SideBar] duplicated nav item:", sig);
        }
        continue; // ตัดของซ้ำทิ้ง
      }
      seen.add(sig);
      out.push(it);
    }
    return out;
  }


  return (
    <motion.aside
      aria-label="Sidebar"
      className={`fixed left-0 top-0 z-40 h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-sm ${className}`}
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="relative flex items-center h-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-3 text-gray-900 dark:text-gray-100 hover:text-blue-600 transition-colors duration-150"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white grid place-items-center font-bold text-sm">
            BL
          </div>

          <span
            className={`font-semibold text-lg transition-all duration-150 ease-out overflow-hidden whitespace-nowrap ${isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
              }`}
          >
            BLYLAB.
          </span>
        </Link>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-md grid place-items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:shadow-lg transition-all duration-150"
        >
          <HiOutlineChevronRight
            size={16}
            className={`transition-transform duration-150 ${isCollapsed ? "rotate-0" : "rotate-180"
              }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item, idx) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href + "/"));

            const Icon = isActive
              ? item.iconSolid ?? item.iconOutline
              : item.iconOutline ?? item.iconSolid;

            // ใช้ href+label+index ป้องกันซ้ำ แม้ input จะซ้ำมา
            const key = `${item.href}__${item.label}__${idx}`;

            return (
              <li key={key} className="relative">
                <Link
                  href={item.href}
                  className={`
            relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors duration-150
            ${isCollapsed ? "" : "justify-start"}
            ${isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-slate-800/60 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100"
                    }
          `}
                >
                  <div
                    className={`
              flex-shrink-0 flex items-center justify-center
              ${isCollapsed ? "w-full" : "w-5"}
              ${isActive ? "text-blue-600 dark:text-blue-400" : ""}
            `}
                  >
                    {Icon && <Icon size={24} />}
                  </div>
                  <span
                    className={`transition-all duration-150 ease-out overflow-hidden whitespace-nowrap ${isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
                      }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-slate-800">
        <div
          className={`text-gray-500 dark:text-gray-300 text-sm ${isCollapsed ? "text-center" : "text-left"
            } mb-2`}
        >
          {!isCollapsed ? (
            <div className="transition-opacity duration-150 truncate">
              Signed in as{" "}
              <strong className="text-gray-700 dark:text-gray-200">
                {email || "—"}
              </strong>
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 grid place-items-center text-xs font-semibold text-gray-600 dark:text-gray-200 mx-auto transition-opacity duration-150"
              title={email || ""}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Lockout / Logout button */}
        <button
          onClick={handleLockout}
          className={`
            w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"}
            gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700
            text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800
            transition-colors duration-150
          `}
          aria-label="Lockout / Sign out"
        >
          <span className="flex items-center gap-2">
            <HiOutlineLogout size={18} />
            {!isCollapsed && <span>Lockout</span>}
          </span>
          {!isCollapsed && (
            <span className="text-xs text-gray-400">Sign out</span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
