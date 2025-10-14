// lib/api/client.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

/** generic fetch wrapper ที่จัดการ JSON/ข้อความ + error ให้ */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    const detail = data?.detail || data?.error || text || `HTTP ${res.status}`;
    throw new Error(String(detail));
  }
  return data as T;
}
