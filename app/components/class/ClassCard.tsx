"use client";

import Link from "next/link";
import { useState } from "react";
import { HiOutlineGlobeAlt, HiOutlineLockClosed, HiOutlineUserCircle, HiHeart, HiOutlineHeart, HiOutlineExternalLink, HiOutlineUsers, HiBookmark, HiOutlineBookmark } from "react-icons/hi";
import { cn } from "@/lib/utils";
import { Class, toggleBookmark } from "@/lib/api/class";
import { CLASS_BANNERS } from "@/lib/constants/banners";
import { toast } from "sonner";

interface ClassCardProps {
  item: Class;
}

export default function ClassCard({ item }: ClassCardProps) {
  const [isFavorite, setIsFavorite] = useState(item.favorite === 1);
  const [loading, setLoading] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    // Optimistic update
    const newStatus = !isFavorite;
    setIsFavorite(newStatus);
    setLoading(true);

    try {
      await toggleBookmark(item.id);
      // Success - state already updated
    } catch (err) {
      // Revert on error
      setIsFavorite(!newStatus);
      toast.error("Failed to update bookmark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      href={`/class/${item.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200 relative"
      aria-label={`View class: ${item.topic}`}
    >
      {/* --- Card Image (Banner) --- */}
      <div
        className="relative h-48 w-full overflow-hidden transition-all duration-300"
        style={CLASS_BANNERS[item.banner_id || 0]?.style || CLASS_BANNERS[0].style}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />

        {/* Status Badge - Left Top now */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm",
              item.status === 0
                ? "bg-emerald-500/90 text-white"
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

        {/* Favorite Button - Right Top */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all transform hover:scale-110 active:scale-95"
          title={isFavorite ? "Remove from bookmarks" : "Add to bookmarks"}
        >
          {isFavorite ? (
            <HiBookmark className="w-5 h-5 text-indigo-400 fill-indigo-400" />
          ) : (
            <HiOutlineBookmark className="w-5 h-5" />
          )}
        </button>

        {/* Hover Overlay with Open Icon */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
          <div className="bg-white/90 text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
            <HiOutlineExternalLink className="w-5 h-5" />
            <span>Open Class</span>
          </div>
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
            <HiOutlineUsers className="w-4 h-4" />
            <span>{item.member_amount || 0}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-rose-500 transition-colors pl-2 border-l border-slate-200 ml-2">
            <HiOutlineHeart className="w-4 h-4" />
            <span>{item.favorite || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
