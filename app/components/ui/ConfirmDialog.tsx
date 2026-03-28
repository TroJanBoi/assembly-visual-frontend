"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "destructive" | "warning";
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    variant = "destructive",
    loading = false,
}: ConfirmDialogProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                    />

                    {/* Dialog Card */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative w-full max-w-[400px] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-800"
                    >
                        {/* Top Pattern/Accent */}
                        <div
                            className={cn(
                                "h-1.5 w-full",
                                variant === "destructive" ? "bg-red-500" : "bg-amber-500"
                            )}
                        />

                        <div className="p-6">
                            <div className="flex gap-4">
                                {/* Icon Circle */}
                                <div
                                    className={cn(
                                        "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                                        variant === "destructive"
                                            ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                            : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                    )}
                                >
                                    {variant === "destructive" ? <Trash2 size={24} /> : <AlertCircle size={24} />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                        {title}
                                    </h3>
                                    {description && (
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex items-center justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onConfirm();
                                    }}
                                    disabled={loading}
                                    className={cn(
                                        "relative px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50",
                                        variant === "destructive"
                                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                            : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                                    )}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </div>
                                    ) : (
                                        confirmLabel
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Close Button (X) */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
