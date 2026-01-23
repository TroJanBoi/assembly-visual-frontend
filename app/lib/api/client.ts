// lib/api/client.ts
import { getToken, clearToken } from "../auth/token";
import type { Playground } from "@/lib/api/playground";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9090";

const DEBUG_API =
  process.env.NEXT_PUBLIC_DEBUG_API === "1" ||
  process.env.NODE_ENV !== "production";

function maskAuth(h: Record<string, any> = {}) {
  const c = { ...h };
  if (c.Authorization) {
    const t = String(c.Authorization);
    c.Authorization = t.length > 16 ? t.slice(0, 12) + "...(masked)" : "(set)";
  }
  return c;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const url = `${API_BASE}${path}`;
  const reqInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  };

  if (DEBUG_API) {
    let bodyPreview: any = undefined;
    try {
      bodyPreview =
        typeof reqInit.body === "string"
          ? JSON.parse(reqInit.body)
          : reqInit.body;
    } catch {
      bodyPreview = reqInit.body;
    }
    // Request log
    // eslint-disable-next-line no-console
    console.log("[API] ⇢", reqInit.method || "GET", url, {
      headers: maskAuth(headers),
      body: bodyPreview,
    });
  }

  const res = await fetch(url, reqInit);
  const text = await res.text();

  if (DEBUG_API) {
    // eslint-disable-next-line no-console
    console.log("[API] ⇠", res.status, url, text);
  }

  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/signin")
      ) {
        window.location.href = "/signin";
      }
    }
    const detail = data?.detail || data?.error || text || `HTTP ${res.status}`;
    const err: any = new Error(String(detail));
    err.status = res.status; // ให้ caller ตรวจจับ 500/404 ได้
    err.data = data; // ติด payload error กลับไปให้ debug
    err.url = url; // ไว้ตรวจ endpoint ที่ error
    throw err;
  }

  return data as T;
}

export function get<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" });
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function del<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" });
}

export const updatePlayground = async (
  playground: Playground,
): Promise<Playground> => {
  return await put<Playground>("/api/v2/playground/me", playground);
};
