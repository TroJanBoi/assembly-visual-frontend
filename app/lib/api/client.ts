import { getToken, clearToken } from "../auth/token";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

/** generic fetch wrapper ที่จัดการ JSON/ข้อความ + error ให้ */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    // ถ้าหลังบ้านใช้ cookie ด้วย ให้เปิดบรรทัดนี้
    // credentials: "include",
    ...options,
  });

  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    // จัดการกรณี token หมดอายุ/ไม่ถูกต้อง
    if (res.status === 401) {
      clearToken();
      // เลือก redirect หรือปล่อยให้หน้าปัจจุบัน handle เองก็ได้
      if (typeof window !== "undefined") {
        // ป้องกันวนลูป ถ้าอยู่หน้า signin ก็ไม่ต้องเด้ง
        if (!window.location.pathname.startsWith("/signin")) {
          window.location.href = "/signin";
        }
      }
    }
    const detail = data?.detail || data?.error || text || `HTTP ${res.status}`;
    throw new Error(String(detail));
  }

  return data as T;
}
