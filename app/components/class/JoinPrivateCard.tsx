"use client";

import { useState } from "react";
import { HiOutlineArrowRight } from "react-icons/hi";
import { joinClassWithCode } from "@/lib/api/class";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JoinPrivateCardProps {
    onJoinSuccess?: () => Promise<void> | void;
    onOpen?: () => void;
}

export default function JoinPrivateCard({ onJoinSuccess, onOpen }: JoinPrivateCardProps) {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setIsLoading(true);
        try {
            await joinClassWithCode(code.trim());
            toast.success("Joined successfully!", {
                description: `You have joined the class.`,
            });
            setCode("");
            // Trigger parent to refresh the joined classes list
            if (onJoinSuccess) await onJoinSuccess();
        } catch (error: any) {
            toast.error("Failed to join", {
                description: error.message || "Please check the code and try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (onOpen) {
        return (
            <div
                onClick={onOpen}
                className="group h-full w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer hover:border-teal-500 hover:ring-4 hover:ring-teal-50"
            >
                <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-600 grid place-items-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white">
                    <HiOutlineArrowRight className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Join Private Class</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 px-2">
                    Click to join with a class code.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleJoin}
            className="group h-full w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 flex flex-col items-center justify-center text-center transition-all duration-300 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-50"
        >
            <div
                className={cn(
                    "w-14 h-14 rounded-full bg-teal-100 text-teal-600 grid place-items-center mb-4 transition-all duration-300",
                    "group-focus-within:scale-110 group-focus-within:bg-teal-500 group-focus-within:text-white",
                    isLoading && "animate-spin bg-teal-500 text-white"
                )}
            >
                <HiOutlineArrowRight className="w-6 h-6" />
            </div>
            <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Join Private Class</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 px-2">
                Enter the class code from your instructor.
            </p>

            <div className="flex w-full flex-col gap-2 mt-auto">
                <input
                    type="text"
                    placeholder="Enter Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-center font-mono tracking-widest focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    disabled={isLoading}
                    maxLength={10}
                />
                <button
                    type="submit"
                    disabled={isLoading || !code.trim()}
                    className={cn(
                        "w-full rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed",
                        isLoading && "animate-pulse"
                    )}
                >
                    {isLoading ? "Joining..." : "Join"}
                </button>
            </div>
        </form>
    );
}
