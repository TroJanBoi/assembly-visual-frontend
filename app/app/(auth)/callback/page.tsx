// app/(auth)/auth/callback/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";
      const query = window.location.search; // ?code=...&scope=...

      // ไม่มี code → กลับหน้า signin
      if (!new URLSearchParams(query).get("code")) {
        router.replace("/signin");
        return;
      }

      try {
        // ไปขอ token จาก backend callback
        const res = await fetch(`${api}/api/v2/oauth/google/callback${query}`);
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        if (data?.token) {
          // <<<<===== "เก็บยังไง" = เก็บไว้ใน localStorage
          localStorage.setItem("access_token", data.token);
          router.replace("/");
          return;
        }
        throw new Error("No token in response");
      } catch (e) {
        console.error("OAuth callback error:", e);
        router.replace("/signin");
      }
    };
    run();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500 text-sm">
      Connecting to Google…
    </div>
  );
}
