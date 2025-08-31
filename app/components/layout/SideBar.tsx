"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "react-icons/hi";
import { Icon } from "lucide-react";

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

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return collapsed;
    try {
      const v = localStorage.getItem("sidebar-collapsed");
      return v === null ? collapsed : v === "1";
    } catch {
      return collapsed;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", isCollapsed ? "1" : "0");
    } catch {}
  }, [isCollapsed]);

  const onToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  useEffect(() => {
    try {
      const COLLAPSED_WIDTH = 72;
      const EXPANDED_WIDTH = 240;
      const width = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${width}px`
      );
    } catch {}
  }, [isCollapsed]);

  const navItems: NavItem[] = items ?? [
    { href: "/", label: "Home", iconOutline: HiOutlineHome, iconSolid: HiHome },
    {
      href: "/class",
      label: "Class",
      iconOutline: HiOutlineAcademicCap,
      iconSolid: HiAcademicCap,
    },
    {
      href: "/assignment",
      label: "Assignment",
      iconOutline: HiOutlineDocumentText,
      iconSolid: HiDocumentText,
    },
    {
      href: "/calendar",
      label: "Calendar",
      iconOutline: HiOutlineCalendar,
      iconSolid: HiCalendar,
    },
    {
      href: "/bookmark",
      label: "Bookmark",
      iconOutline: HiOutlineBookmark,
      iconSolid: HiBookmark,
    },
    {
      href: "/recent",
      label: "Recent",
      iconOutline: HiOutlineClock,
      iconSolid: HiClock,
    },
  ];

  return (
    <motion.aside
      aria-label="Sidebar"
  className={`fixed left-0 top-0 z-40 h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-sm ${className}`}
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="relative flex items-center h-16 px-4 border-b border-gray-100">
        <Link
          href="/"
          className="flex items-center gap-3 text-gray-900 hover:text-blue-600 transition-colors duration-150"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white grid place-items-center font-bold text-sm">
            BL
          </div>

          <span
            className={`font-semibold text-lg transition-all duration-150 ease-out overflow-hidden whitespace-nowrap ${
              isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
            }`}
          >
            BLYLAB.
          </span>
        </Link>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white border border-gray-200 shadow-md grid place-items-center text-gray-500 hover:text-gray-700 hover:shadow-lg transition-all duration-150"
        >
          <HiOutlineChevronRight size={16}
            className={`text-sm transition-transform duration-150 ${
              isCollapsed ? "rotate-0" : "rotate-180"
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href + "/"));
            const Icon = isActive
              ? item.iconSolid ?? item.iconOutline
              : item.iconOutline ?? item.iconSolid;

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors duration-150
                    ${isCollapsed ? "" : "justify-start"}
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`
                    flex-shrink-0 flex items-center justify-center
                    ${isCollapsed ? "w-full" : "w-5"}
                    ${isActive ? "text-blue-600" : ""}
                  `}
                  >
                    {Icon && <Icon size={24} />}
                  </div>

                  {/* Label */}
                  <span
                    className={`transition-all duration-150 ease-out overflow-hidden whitespace-nowrap ${
                      isCollapsed
                        ? "opacity-0 max-w-0"
                        : "opacity-100 max-w-[200px]"
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
      <div className="p-3 border-t border-gray-100">
        <div
          className={`text-gray-500 text-sm ${
            isCollapsed ? "text-center" : "text-left"
          }`}
        >
          {!isCollapsed ? (
            <div className="transition-opacity duration-150">
              Signed in as{" "}
              <strong className="text-gray-700">user@example.com</strong>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 grid place-items-center text-xs font-semibold text-gray-600 mx-auto transition-opacity duration-150">
              U
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
