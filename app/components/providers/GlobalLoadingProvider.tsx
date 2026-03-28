"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface GlobalLoadingContextType {
    isLoading: boolean;
    show: () => void;
    hide: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const show = () => setIsLoading(true);
    const hide = () => setIsLoading(false);

    // Auto-hide when route changes
    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    return (
        <GlobalLoadingContext.Provider value={{ isLoading, show, hide }}>
            {children}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)]" />
                        <p className="text-sm font-medium text-neutral-600 animate-pulse">Processing...</p>
                    </div>
                </div>
            )}
        </GlobalLoadingContext.Provider>
    );
}

export function useGlobalLoading() {
    const context = useContext(GlobalLoadingContext);
    if (context === undefined) {
        throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
    }
    return context;
}
