"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { TOKEN_KEY, setToken } from "@/lib/auth/token";
import { apiFetch } from "@/lib/api/client";
import { UserProfile } from "@/lib/api/auth";

export default function AuthSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    useEffect(() => {
        const handleAuth = async () => {
            if (!token) {
                router.push("/signin");
                return;
            }

            try {
                // 1. Save token
                localStorage.setItem(TOKEN_KEY, token);

                // 2. Fetch User Profile

                const userProfile = await apiFetch<UserProfile>("/api/v2/profile/", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (userProfile) {
                    localStorage.setItem("me", JSON.stringify(userProfile));
                    router.push("/home");
                } else {
                    throw new Error("Failed to load profile");
                }

            } catch (err) {
                console.error("OAuth Success Error:", err);
                router.push("/signin");
            }
        };

        handleAuth();
    }, [token, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <h2 className="text-xl font-semibold text-slate-700">Completing sign in...</h2>
                <p className="text-slate-500">Please wait while we redirect you.</p>
            </div>
        </div>
    );
}
