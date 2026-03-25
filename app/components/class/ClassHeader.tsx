"use client";

import { useState } from "react";
import { Class } from "@/lib/api/class";
import { CLASS_BANNERS } from "@/lib/constants/banners";
import { HiOutlineGlobeAlt, HiOutlineLockClosed, HiOutlineUser, HiCheck, HiOutlineClipboardCopy } from "react-icons/hi";
import { FaUsers } from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClassHeaderProps {
    classData: Class;
    isOwner: boolean;
}

export default function ClassHeader({ classData, isOwner }: ClassHeaderProps) {
    const [copiedCode, setCopiedCode] = useState(false);

    const handleCopyCode = () => {
        if (!classData.code) return;
        navigator.clipboard.writeText(classData.code);
        setCopiedCode(true);
        toast.success("Class code copied to clipboard");
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const banner = CLASS_BANNERS[classData.banner_id || 0] || CLASS_BANNERS[0];

    return (
        <header
            className="relative h-48 md:h-64 rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm transition-all duration-500"
            style={{
                backgroundImage: `url(${banner.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Minimal overlay for text readability without being too heavy */}
            <div className="absolute inset-0  " />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

            <div className="relative w-full h-full p-6 md:p-8 flex flex-col justify-end">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="w-full md:w-2/3 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                {classData.topic}
                            </h1>
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm",
                                    classData.status === 0
                                        ? "bg-white text-blue-600 border border-blue-100"
                                        : "bg-white text-amber-600 border border-amber-100"
                                )}
                            >
                                {classData.status === 0 ? (
                                    <>
                                        <HiOutlineGlobeAlt className="w-3.5 h-3.5" />
                                        <span>Public</span>
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineLockClosed className="w-3.5 h-3.5" />
                                        <span>Private</span>
                                    </>
                                )}
                            </span>
                        </div>

                        {classData.description && (
                            <p className="text-sm md:text-base text-white leading-relaxed max-w-2xl line-clamp-2">
                                {classData.description}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-2 text-sm font-medium text-blue-600">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">
                                <FaUsers className="w-4 h-4 text-blue-500" />
                                <span>{classData.member_amount || 0} members</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">
                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                    <HiOutlineUser className="w-3 h-3" />
                                </div>
                                <span className="text-slate-700">{classData.owner_name}</span>
                                <span className="text-blue-600 text-xs px-1.5 py-0.5 bg-blue-100 rounded-md">Owner</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex justify-start md:justify-end">
                        {isOwner && classData.code && (
                            <Button
                                variant="outline"
                                onClick={handleCopyCode}
                                className={cn(
                                    "flex items-center gap-2.5 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm transition-all",
                                    copiedCode && "bg-green-50 hover:bg-green-50 border-green-200 text-green-700"
                                )}
                            >
                                {copiedCode ? (
                                    <HiCheck className="w-4 h-4 text-green-600" />
                                ) : (
                                    <HiOutlineClipboardCopy className="w-4 h-4 text-slate-400" />
                                )}
                                <span className="font-mono font-bold tracking-wider">{classData.code}</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
