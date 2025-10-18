"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect } from "react";

export default function AuthSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    console.log("Search Params:", searchParams);
    const token = searchParams.get("token");

    useEffect(() => {
        if (token) {
            localStorage.setItem("authToken", token);
            router.push("/");
        } else {
            router.push("/signin");
        }
    }, [token, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-lg">Processing authentication...</p>
        </div>
    );
}
