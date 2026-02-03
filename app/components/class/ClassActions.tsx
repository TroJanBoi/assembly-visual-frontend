"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Class } from "@/lib/api/class";

import {
    HiChevronLeft,
    HiOutlineHeart,
    HiHeart,
    HiOutlineDotsHorizontal,
} from "react-icons/hi";
import { RxEnter } from "react-icons/rx";
import { MdDashboardCustomize } from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import { HiPlus, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi2";

interface ClassActionsProps {
    classData: Class;
    isOwner: boolean;
    isMember: boolean;
    isJoining: boolean;
    onJoin: () => void;
    onBookmark: () => void;
    onDelete: () => Promise<void>;
}

export default function ClassActions({
    classData,
    isOwner,
    isMember,
    isJoining,
    onJoin,
    onBookmark,
    onDelete,
}: ClassActionsProps) {
    const router = useRouter();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await onDelete();
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <div className="flex items-center gap-2 py-4">
            {/* Back Button */}
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <HiChevronLeft className="h-5 w-5" />
            </Button>

            {/* Bookmark Button */}
            <Button
                variant="outline"
                size="icon"
                aria-label="Favorite class"
                onClick={onBookmark}
                className={classData.favorite ? "text-red-500 border-red-200 bg-red-50" : ""}
            >
                {classData.favorite ? (
                    <HiHeart className="h-5 w-5 fill-current" />
                ) : (
                    <HiOutlineHeart className="h-5 w-5" />
                )}
            </Button>

            <div className="flex-grow" />

            {/* Owner Actions */}
            {isOwner && (
                <>
                    <Button
                        onClick={() => router.push(`/class/${classData.id}/assignments/new`)}
                        className="hidden sm:flex items-center gap-2"
                    >
                        <HiPlus className="w-5 h-5" />
                        New Assignment
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/class/${classData.id}/members`)}
                        className="hidden sm:flex items-center gap-2 text-slate-600"
                    >
                        <FaUsers className="w-5 h-5" />
                        Members
                    </Button>
                </>
            )}

            {/* Primary Action (Dashboard or Join) */}
            {isOwner ? (
                <Button
                    variant="outline"
                    onClick={() => router.push(`/class/${classData.id}/dashboard`)}
                    className="flex items-center gap-2 text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                >
                    <MdDashboardCustomize className="w-5 h-5" />
                    Dashboard
                </Button>
            ) : !isMember ? (
                <Button
                    onClick={onJoin}
                    disabled={isJoining}
                    className="flex items-center gap-2"
                >
                    <RxEnter className="w-5 h-5" />
                    {isJoining ? "Joining..." : "Join Class"}
                </Button>
            ) : null}

            {/* More Options Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="More options">
                        <HiOutlineDotsHorizontal className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {/* Show mobile-only options here if needed, keeping it simple for now */}
                    {isOwner && (
                        <>
                            {/* Mobile Only: New Assignment & Members (if hidden on mobile) 
                  Actually I hid them on sm, so I should add them here for mobile?
                  Let's keep it simple. If I hide them on mobile they are inaccessible.
                  I will add them to dropdown for mobile visibility if screen is small.
               */}
                            <DropdownMenuItem onClick={() => router.push(`/class/${classData.id}/assignments/new`)} className="sm:hidden">
                                <HiPlus className="mr-2 h-4 w-4" />
                                <span>New Assignment</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/class/${classData.id}/members`)} className="sm:hidden">
                                <FaUsers className="mr-2 h-4 w-4" />
                                <span>Members</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => router.push(`/class/${classData.id}/edit`)}>
                                <HiOutlinePencil className="mr-2 h-4 w-4" />
                                <span>Edit Class</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <HiOutlineTrash className="mr-2 h-4 w-4" />
                                <span>Delete Class</span>
                            </DropdownMenuItem>
                        </>
                    )}
                    {!isOwner && (
                        <DropdownMenuItem onClick={() => router.push(`/class/${classData.id}/members`)}>
                            <FaUsers className="mr-2 h-4 w-4" />
                            <span>Class Members</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Class"
                description={`Are you sure you want to delete "${classData.topic}"? This action cannot be undone and all assignments will be lost.`}
                confirmLabel="Delete Class"
                loading={isDeleting}
            />
        </div>
    );
}
