"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth/token";

/**
 * AuthGuard — ใส่ใน layout/page ที่ต้องการป้องกันคนที่ login อยู่แล้ว
 * ถ้ามี authToken ใน localStorage จะ redirect ไปหน้า /home ทันที
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace("/home");
    }
  }, [router]);

  // ไม่ render children จนกว่าจะแน่ใจว่าไม่มี token
  // (ถ้ามี token effect ด้านบนจะ redirect ไปก่อน)
  const token = typeof window !== "undefined" ? getToken() : null;
  if (token) {
    // กำลัง redirect — ไม่ render อะไร เพื่อป้องกัน flash
    return null;
  }

  return <>{children}</>;
}
