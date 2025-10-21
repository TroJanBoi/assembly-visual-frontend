"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
  HiOutlineUserCircle,
  HiOutlineArrowRight,
} from "react-icons/hi";
import { cn } from "@/lib/utils";
import { Class } from "@/lib/api/class";

interface ClassCardProps {
  item: Class;
}

export default function ClassCard({ item }: ClassCardProps) {
  // We can add state for things like 'liked' later if needed
  // const [liked, setLiked] = useState(Boolean(item.fav_score > 0));

  return (
    <Link
      href={`/class/${item.id}`}
      className="relative group block bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
      aria-label={`View class: ${item.topic}`}
    >
      {/* --- Hover Overlay --- */}
      <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <HiOutlineArrowRight className="w-8 h-8 text-white" />
        <span className="mt-2 text-white text-lg font-bold tracking-wider">
          OPEN
        </span>
      </div>

      {/* --- Card Content --- */}
      <div className="relative h-40 w-full">
        <Image
          src={"/images/p1.png"} // Placeholder, consider making this dynamic if available
          alt={item.topic}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="p-5">
        <h2
          className="text-lg font-bold text-gray-900 truncate"
          title={item.topic}
        >
          {item.topic}
        </h2>

        <p
          className="text-sm text-gray-600 mt-1 h-10 line-clamp-2"
          title={item.description}
        >
          {item.description}
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <HiOutlineUserCircle className="w-5 h-5 text-gray-400" />
            <span>{item.owner}</span>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
              item.status === 0 // 0 = public
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800",
            )}
          >
            {item.status === 0 ? (
              <HiOutlineGlobeAlt className="w-4 h-4" />
            ) : (
              <HiOutlineLockClosed className="w-4 h-4" />
            )}
            {item.status === 0 ? "Public" : "Private"}
          </span>
        </div>
      </div>
    </Link>
  );
}
