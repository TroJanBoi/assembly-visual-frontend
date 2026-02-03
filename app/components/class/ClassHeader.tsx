"use client";

import { Class } from "@/lib/api/class";
import { CLASS_BANNERS } from "@/lib/constants/banners";
import { HiOutlineGlobeAlt, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi";
import { FaUsers } from "react-icons/fa";

interface ClassHeaderProps {
    classData: Class;
}

export default function ClassHeader({ classData }: ClassHeaderProps) {
    return (
        <header
            className="relative h-56 md:h-64 rounded-2xl overflow-hidden shadow-lg transition-all duration-500"
            style={CLASS_BANNERS[classData.banner_id || 0]?.style || CLASS_BANNERS[0].style}
        >
            <div
                className="absolute inset-0 flex items-end"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(2,0,36,0.15) 0%, rgba(9,9,121,0.55) 40%, rgba(2,0,36,0.9) 95%)"
                }}
            >
                <div className="w-full p-5 md:p-6 flex flex-col md:flex-row items-start md:items-end gap-4">
                    <div className="w-full md:w-2/3">

                        <div className="flex items-center gap-3 md:gap-5">
                            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                {classData.topic}
                            </h1>
                            <div>
                                <span
                                    className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium ${classData.status === 0
                                        ? "bg-blue-50/10 text-blue-200"
                                        : "bg-white/8 text-amber-200"
                                        }`}
                                >
                                    {classData.status === 0 ? (
                                        <>
                                            <HiOutlineGlobeAlt className="w-4 h-4" />
                                            <span>Public</span>
                                        </>
                                    ) : (
                                        <>
                                            <HiOutlineLockClosed className="w-4 h-4" />
                                            <span>Private</span>
                                        </>
                                    )}
                                </span>

                            </div>
                        </div>

                        <div className="mt-2 max-w-full">
                            <p
                                className="text-sm text-white/90 leading-relaxed line-clamp-2 break-words"
                                style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }}
                            >
                                {classData.description}
                            </p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/80">
                            <div className="inline-flex items-center gap-2 bg-white/6 px-2 py-1 rounded-md">
                                <span>
                                    <FaUsers className="w-4 h-4 fill-blue-500" />
                                </span>
                                <span>{classData.member_amount || 0} members</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/3 flex items-center justify-between md:justify-end gap-4">
                        <div className="flex items-center gap-3">

                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/90">
                                <HiOutlineUser className="w-6 h-6" />
                            </div>

                            <div className="hidden md:block text-right">
                                <div className="text-sm font-medium text-white max-w-[150px] truncate">
                                    {classData.owner_name}
                                </div>

                                <div className="text-xs text-white/80">Owner</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
