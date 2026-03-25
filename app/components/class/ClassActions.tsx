"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Class } from "@/lib/api/class";
import { useBookmarks } from "@/lib/context/BookmarkContext";

import {
    HiChevronLeft,
    HiOutlineHeart,
    HiHeart,
} from "react-icons/hi";
import { RxEnter } from "react-icons/rx";
import { HiPlus } from "react-icons/hi2";

interface ClassActionsProps {
    classData: Class;
    isOwner: boolean;
    isMember: boolean;
    isJoining: boolean;
    onJoin: () => void;
    onBookmark: () => void;
}

export default function ClassActions({
    classData,
    isOwner,
    isMember,
    isJoining,
    onJoin,
    onBookmark,
}: ClassActionsProps) {
    const router = useRouter();
    const { bookmarkedIds } = useBookmarks();
    const isFavorite = bookmarkedIds.has(classData.id);

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
                className={isFavorite ? "text-red-500 border-red-200 bg-red-50" : ""}
            >
                {isFavorite ? (
                    <HiHeart className="h-5 w-5 fill-current" />
                ) : (
                    <HiOutlineHeart className="h-5 w-5" />
                )}
            </Button>

            <div className="flex-grow" />

            {/* Owner: New Assignment button */}
            {isOwner && (
                <Button
                    onClick={() => router.push(`/class/${classData.id}/assignments/new`)}
                    className="hidden sm:flex items-center gap-2"
                >
                    <HiPlus className="w-5 h-5" />
                    New Assignment
                </Button>
            )}

            {/* Join Action (Non-members only) */}
            {!isOwner && !isMember && (
                <Button
                    onClick={onJoin}
                    disabled={isJoining}
                    className="flex items-center gap-2"
                >
                    <RxEnter className="w-5 h-5" />
                    {isJoining ? "Joining..." : "Join Class"}
                </Button>
            )}
        </div>
    );
}
