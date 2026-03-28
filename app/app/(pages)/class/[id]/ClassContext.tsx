
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClassById, Class } from "@/lib/api/class";
import { getProfile, Profile } from "@/lib/api/profile";

interface ClassContextType {
    classData: Class | null;
    isOwner: boolean;
    loading: boolean;
    error: Error | null;
    refreshClass: () => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export function ClassProvider({ children }: { children: React.ReactNode }) {
    const { id } = useParams() as { id: string };
    const [classData, setClassData] = useState<Class | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        if (!id) return;
        try {
            // setLoading(true); // Don't reset loading to true on refresh to avoid flicker if desired, but for initial load consistent
            // Actually, for refreshClass, we might want a separate loading state or just let it update in bg. 
            // But here let's keep it simple.
            const [cls, profile] = await Promise.all([getClassById(id), getProfile()]);
            setClassData(cls);
            // Profile might fail if not logged in -> layout handles protection usually
            // but let's assume valid session
            setIsOwner(cls.owner_id === profile.id);
            setError(null);
        } catch (e: any) {
            console.error("Failed to fetch class data", e);
            setError(e);
            setClassData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    return (
        <ClassContext.Provider value={{ classData, isOwner, loading, error, refreshClass: fetchData }}>
            {children}
        </ClassContext.Provider>
    );
}

export function useClass() {
    const context = useContext(ClassContext);
    if (context === undefined) {
        throw new Error("useClass must be used within a ClassProvider");
    }
    return context;
}
