"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AppProgressBar } from "next-nprogress-bar";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        // Show overlay when route starts changing
        setIsNavigating(true);

        // Hide overlay after a short delay (route change complete)
        const timer = setTimeout(() => {
            setIsNavigating(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    return (
        <>
            {/* Top Progress Bar */}
            <AppProgressBar
                height="3px"
                color="#6366f1"
                options={{ showSpinner: false, speed: 300 }}
                shallowRouting
            />

            {/* Loading Overlay */}
            <AnimatePresence>
                {isNavigating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[200] bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center gap-3"
                        >
                            {/* Spinner */}
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-indigo-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
                            </div>

                            {/* Loading Text */}
                            <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-sm font-medium text-gray-600 dark:text-gray-400"
                            >
                                Loading...
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
