"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getBookmarks, toggleBookmark } from "@/lib/api/class";
import { toast } from "sonner";
import { getToken } from "@/lib/auth/token";

interface BookmarkContextType {
    bookmarkedIds: Set<number>;
    isLoading: boolean;
    toggleFavorite: (classId: number | string) => Promise<void>;
    refreshBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const fetchBookmarks = async () => {
        const token = getToken();
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const data = await getBookmarks();
            const ids = new Set((data || []).map((c) => c.id));
            setBookmarkedIds(ids);
        } catch (error) {
            console.error("Failed to fetch initial bookmarks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookmarks();
    }, []);

    const toggleFavorite = async (classIdStr: number | string) => {
        const classId = typeof classIdStr === "string" ? parseInt(classIdStr, 10) : classIdStr;
        const isCurrentlyBookmarked = bookmarkedIds.has(classId);

        // Optimistic UI update
        setBookmarkedIds((prev) => {
            const newSet = new Set(prev);
            if (isCurrentlyBookmarked) {
                newSet.delete(classId);
            } else {
                newSet.add(classId);
            }
            return newSet;
        });

        try {
            await toggleBookmark(classId, isCurrentlyBookmarked);
            // Success, state already matches
        } catch (error) {
            // Revert on error
            setBookmarkedIds((prev) => {
                const revertedSet = new Set(prev);
                if (isCurrentlyBookmarked) {
                    revertedSet.add(classId);
                } else {
                    revertedSet.delete(classId);
                }
                return revertedSet;
            });
            toast.error("Failed to update bookmark.");
            throw error;
        }
    };

    return (
        <BookmarkContext.Provider value={{ bookmarkedIds, isLoading, toggleFavorite, refreshBookmarks: fetchBookmarks }}>
            {children}
        </BookmarkContext.Provider>
    );
}

export function useBookmarks() {
    const context = useContext(BookmarkContext);
    if (context === undefined) {
        throw new Error("useBookmarks must be used within a BookmarkProvider");
    }
    return context;
}
