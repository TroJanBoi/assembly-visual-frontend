"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

import {
    getMyInvitations,
    acceptInvitation,
    declineInvitation,
    type Invitation,
} from "@/lib/api/invitation";
import { getClassById } from "@/lib/api/class";

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [classNames, setClassNames] = useState<Record<number, string>>({});
    const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
    const [fetched, setFetched] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchInvitations = useCallback(async () => {
        try {
            const data = await getMyInvitations();
            const pending = data.filter((inv) => inv.status === "pending");
            setInvitations(pending);

            // Fetch class names in parallel for all unique class IDs
            const uniqueClassIds = [...new Set(pending.map((inv) => inv.class_id))];
            const results = await Promise.allSettled(
                uniqueClassIds.map((id) => getClassById(id))
            );
            const names: Record<number, string> = {};
            results.forEach((result, i) => {
                if (result.status === "fulfilled") {
                    names[uniqueClassIds[i]] = result.value.topic;
                }
            });
            setClassNames(names);
        } catch {
            // Silently fail
        } finally {
            setFetched(true);
        }
    }, []);

    // Fetch on mount + poll every 30 seconds so badge is always up-to-date
    useEffect(() => {
        fetchInvitations();
        const interval = setInterval(fetchInvitations, 30_000);
        return () => clearInterval(interval);
    }, [fetchInvitations]);

    // Re-fetch when dropdown opens for freshness
    useEffect(() => {
        if (isOpen) fetchInvitations();
    }, [isOpen, fetchInvitations]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const setLoading = (id: number, state: boolean) => {
        setLoadingIds((prev) => {
            const next = new Set(prev);
            state ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleAccept = async (invitation: Invitation) => {
        setLoading(invitation.id, true);
        try {
            await acceptInvitation(invitation.id);
            setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
            toast.success("Invitation accepted!", {
                description: `You have joined the class.`,
                action: invitation.class_id
                    ? { label: "Go to Class", onClick: () => router.push(`/class/${invitation.class_id}`) }
                    : undefined,
            });
        } catch (err: any) {
            toast.error("Failed to accept invitation", {
                description: err?.message,
            });
        } finally {
            setLoading(invitation.id, false);
        }
    };

    const handleDecline = async (invitation: Invitation) => {
        setLoading(invitation.id, true);
        try {
            await declineInvitation(invitation.id);
            setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
            toast.success("Invitation declined.");
        } catch (err: any) {
            toast.error("Failed to decline invitation", {
                description: err?.message,
            });
        } finally {
            setLoading(invitation.id, false);
        }
    };

    const unreadCount = invitations.length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                aria-label="Notifications"
            >
                <HiOutlineBell className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                {unreadCount} New
                            </span>
                        )}
                    </div>

                    {/* Body */}
                    <div className="max-h-[400px] overflow-y-auto w-full">
                        {!fetched ? (
                            // Skeleton while loading
                            <div className="px-4 py-4 space-y-3">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : invitations.length === 0 ? (
                            <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                    <HiOutlineBell className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    No new notifications
                                </p>
                                <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invitations.map((invitation) => {
                                    const isLoading = loadingIds.has(invitation.id);
                                    const classTitle = classNames[invitation.class_id] || `Class #${invitation.class_id}`;
                                    return (
                                        <li
                                            key={invitation.id}
                                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                                        <HiOutlineBell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
                                                        You've been invited to join{" "}
                                                        <span className="font-semibold">{classTitle}</span>.
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {invitation.expired
                                                            ? `Expires ${formatDistanceToNow(new Date(invitation.expired), { addSuffix: true })}`
                                                            : ""}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() => handleAccept(invitation)}
                                                            disabled={isLoading}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
                                                        >
                                                            {isLoading ? (
                                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <HiOutlineCheckCircle className="w-4 h-4" />
                                                            )}
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecline(invitation)}
                                                            disabled={isLoading}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                                                        >
                                                            <HiOutlineXCircle className="w-4 h-4" />
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Footer - Refresh button */}
                    <div className="px-4 py-3 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <button
                            onClick={fetchInvitations}
                            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            Refresh notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
