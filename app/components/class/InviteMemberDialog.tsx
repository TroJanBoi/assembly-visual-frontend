"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Search, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllUsers, type User } from "@/lib/api/user";

interface InviteMemberDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string) => Promise<void> | void;
    loading?: boolean;
}

export function InviteMemberDialog({
    isOpen,
    onClose,
    onInvite,
    loading = false,
}: InviteMemberDialogProps) {
    const [query, setQuery] = useState("");
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchUsers = useCallback(async () => {
        setFetchingUsers(true);
        setFetchError(null);
        try {
            const users = await getAllUsers();
            setAllUsers(users);
        } catch {
            setFetchError("Could not load users. You can still type an email manually.");
            setAllUsers([]);
        } finally {
            setFetchingUsers(false);
        }
    }, []);

    // Fetch & reset on open
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setQuery("");
            setSelectedUser(null);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [isOpen, fetchUsers]);

    // Filter on type
    useEffect(() => {
        if (!query.trim() || selectedUser) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const q = query.toLowerCase();
        const filtered = allUsers
            .filter(
                (u) =>
                    u.name?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q)
            )
            .slice(0, 5);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
    }, [query, allUsers, selectedUser]);

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setQuery(user.email);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleClearSelection = () => {
        setSelectedUser(null);
        setQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = selectedUser?.email || query.trim();
        if (!email) return;
        await onInvite(email);
        setQuery("");
        setSelectedUser(null);
    };

    const handleClose = () => {
        setQuery("");
        setSelectedUser(null);
        setSuggestions([]);
        setShowSuggestions(false);
        setFetchError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                    />

                    {/* Dialog — overflow:hidden restores proper rounded corners */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative w-full max-w-[420px] rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-800"
                    >
                        {/* Blue accent bar — no border-radius needed; parent clips it */}
                        <div className="h-1.5 w-full bg-indigo-500" />

                        <div className="p-6">
                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>

                            {/* Header */}
                            <div className="flex gap-4 mb-5">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                    <Mail size={24} />
                                </div>
                                <div className="flex-1 pt-1 pr-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                        Invite Member
                                    </h3>
                                    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                                        Search by name or email to invite someone to this class.
                                    </p>
                                </div>
                            </div>

                            {/* Error banner */}
                            {fetchError && (
                                <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs">
                                    <AlertCircle size={14} className="flex-shrink-0" />
                                    {fetchError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Search Input */}
                                <div
                                    className={cn(
                                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all",
                                        "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800",
                                        "focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-900/40"
                                    )}
                                >
                                    <Search size={16} className="text-gray-400 flex-shrink-0" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder={fetchingUsers ? "Loading users…" : "Search name or email…"}
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value);
                                            if (selectedUser) setSelectedUser(null);
                                        }}
                                        className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder:text-gray-400"
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    {fetchingUsers && (
                                        <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
                                    )}
                                    {!fetchingUsers && (query || selectedUser) && (
                                        <button type="button" onClick={handleClearSelection} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Inline suggestions — in-flow so dialog expands naturally */}
                                <AnimatePresence>
                                    {showSuggestions && (
                                        <motion.ul
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md"
                                        >
                                            {suggestions.map((user) => (
                                                <li key={user.id}>
                                                    <button
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleSelectUser(user);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-colors"
                                                    >
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                                                            {user.name?.[0]?.toUpperCase() || "?"}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>

                                {/* Selected user chip */}
                                {selectedUser && (
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                                            {selectedUser.name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 truncate">
                                                {selectedUser.name}
                                            </p>
                                            <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate">
                                                {selectedUser.email}
                                            </p>
                                        </div>
                                        <Check size={16} className="text-indigo-500 flex-shrink-0" />
                                    </div>
                                )}

                                {/* No match hint */}
                                {!fetchingUsers && allUsers.length > 0 && query.length > 0 && suggestions.length === 0 && !selectedUser && (
                                    <p className="text-xs text-gray-400 px-1">
                                        No user matches "{query}". You can still send an invite by email.
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || (!selectedUser && !query.trim())}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 bg-indigo-500 hover:bg-indigo-600"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending…
                                            </div>
                                        ) : (
                                            "Send Invite"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
