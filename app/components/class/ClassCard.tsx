"use client";

import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
  HiOutlineUserCircle,
} from "react-icons/hi";
import { cn } from "@/lib/utils";
import { Class } from "@/lib/api/class";

interface ClassCardProps {
  item: Class;
}

export default function ClassCard({ item }: ClassCardProps) {
  return (
    <Link
      href={`/class/${item.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-indigo-200"
      aria-label={`View class: ${item.topic}`}
    >
      {/* --- Card Image --- */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <Image
          src={"/images/p1.png"} // Placeholder
          alt={item.topic}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm",
              item.status === 0
                ? "bg-green-500/90 text-white"
                : "bg-slate-800/90 text-slate-200",
            )}
          >
            {item.status === 0 ? (
              <HiOutlineGlobeAlt className="w-3.5 h-3.5" />
            ) : (
              <HiOutlineLockClosed className="w-3.5 h-3.5" />
            )}
            {item.status === 0 ? "Public" : "Private"}
          </span>
        </div>
      </div>

      {/* --- Card Content --- */}
      <div className="flex-1 p-5 flex flex-col">
        <h2
          className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors"
          title={item.topic}
        >
          {item.topic}
        </h2>

        <p
          className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1"
          title={item.description}
        >
          {item.description}
        </p>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <HiOutlineUserCircle className="w-4 h-4" />
            </div>
            <span className="truncate max-w-[100px]" title={item.owner_name || "Instructor"}>
              {item.owner_name || "Instructor"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
            <HiOutlineUserCircle className="w-4 h-4" />
            <span>{item.member_count || 0}</span>
          </div>

          <div className="text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
            View Class
          </div>
        </div>
      </div>
    </Link>
  );
}
