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
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineClock,
  HiClock,
  HiOutlineLogout,
} from "react-icons/hi";

import { getProfile, type Profile } from "@/lib/api/profile";
import { signout } from "@/lib/api/auth";
import { clearToken } from "@/lib/auth/token";

type NavItem = {
  href: string;
  label: string;
  iconOutline?: React.ComponentType<{ size?: number; className?: string }>;
  iconSolid?: React.ComponentType<{ size?: number; className?: string }>;
  children?: NavItem[];
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
    {
      href: "/class",
      label: "Classroom",
      iconOutline: HiOutlineAcademicCap,
      iconSolid: HiAcademicCap,
      children: [
        { href: "/class/public", label: "Public Class" },
        { href: "/class/my", label: "My Classes" },
        { href: "/class/join", label: "Joined Classes" },
      ]
    },
    { href: "/assignment", label: "Assignment", iconOutline: HiOutlineDocumentText, iconSolid: HiDocumentText },
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

    // 2. Clear clean client state
    clearToken();
    try {
      // Remove other auth-related keys if any
      localStorage.removeItem("refresh_token");
      sessionStorage.clear();
    } catch { }

    router.replace("/signin");
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
          <span
            className={`font-semibold text-xl transition-all duration-150 ease-out overflow-hidden whitespace-nowrap ${isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
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

            // Check if any child is active
            const isChildActive = item.children?.some(
              (child) => pathname === child.href || pathname?.startsWith(child.href + "/")
            );

            // If item has children, render as a group (simplified for 2 levels)
            if (item.children && item.children.length > 0) {
              const isOpen = isActive || isChildActive; // Expand if active or child active. Could add state for toggle but keeping simple for now or use state.
              // Let's use a local state for detailed control if needed, but for now let's try a simple approach:
              // actually, specific requirement for submenus implies we might want them collapsible. 
              // But since standard sidebar often just expands, let's make it expandable.
              // Since we are mapping, we can't easily add state for *each* item without extracting a component or using a map of states.
              // Given the constraints and simplicity, let's create a separate component or just handle it inline if simple.

              // Refactoring to a separate component for recursion is cleaner but let's stick to inline for minimal diff if possible, 
              // or better: extract `NavItemObj` render.

              return (
                <SidebarItem
                  key={`${item.href}__${idx}`}
                  item={item}
                  isCollapsed={isCollapsed}
                  pathname={pathname || ""}
                />
              );
            }

            return (
              <SidebarItem
                key={`${item.href}__${idx}`}
                item={item}
                isCollapsed={isCollapsed}
                pathname={pathname || ""}
              />
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

function SidebarItem({
  item,
  isCollapsed,
  pathname
}: {
  item: NavItem;
  isCollapsed: boolean;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname?.startsWith(item.href + "/"));

  // Auto-expand if child is active
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren && item.children!.some(
    (child) => pathname === child.href || pathname?.startsWith(child.href + "/")
  );

  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  const Icon = isActive
    ? item.iconSolid ?? item.iconOutline
    : item.iconOutline ?? item.iconSolid;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCollapsed) return;
    setIsOpen(!isOpen);
  };

  return (
    <li className="relative">
      {/* Main Item */}
      <div className="relative flex items-center">
        <Link
          href={item.href}
          className={`
              relative flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors duration-150
              ${isCollapsed ? "" : "justify-start"}
              ${isActive && !hasChildren // Highlight parent if active and no children 
              ? "bg-blue-50 text-blue-700 dark:bg-slate-800/60 dark:text-blue-300"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100"
            }
            `}
        >
          <div
            className={`
                flex-shrink-0 flex items-center justify-center
                ${isCollapsed ? "w-full" : "w-5"}
                ${(isActive || isChildActive) ? "text-blue-600 dark:text-blue-400" : ""}
              `}
          >
            {Icon && <Icon size={24} />}
          </div>

          <span
            className={`flex-1 transition-all duration-150 ease-out overflow-hidden whitespace-nowrap ${isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
              }`}
          >
            {item.label}
          </span>
        </Link>

        {/* Arrow for submenu - Separate button for toggle */}
        {!isCollapsed && hasChildren && (
          <button
            onClick={handleToggle}
            className="absolute right-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <HiOutlineChevronRight
              size={16}
              className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Submenu */}
      {!isCollapsed && hasChildren && isOpen && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="ml-9 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-slate-800 pl-2"
        >
          {item.children!.map((child, idx) => {
            const isChildItemActive = pathname === child.href;
            return (
              <li key={idx}>
                <Link
                  href={child.href}
                  className={`
                      block px-3 py-2 rounded-md text-sm transition-colors
                      ${isChildItemActive
                      ? "text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-slate-800/40 font-medium"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }
                   `}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </motion.ul>
      )}
    </li>
  );
}
