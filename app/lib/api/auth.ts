import { apiFetch } from "./client";
import { setToken, clearToken } from "../auth/token";

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  tel?: string;
}

export interface SignupResponse {
  id?: string;
  email?: string;
  name?: string;
  message?: string;
}

export interface SigninInput {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SigninResponse {
  user?: {
    id?: string | number;
    email?: string;
    name?: string;
    role?: string;
    tel?: string;
    picture_path?: string | null;
  };
  token?: string;
  message?: string;
}

export async function signup(data: SignupInput): Promise<SignupResponse> {
  console.log("📦 Signup data:", data);
  return apiFetch<SignupResponse>("/api/v2/auth/sign-up", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** 🔐 Sign in (email/password) */
export async function signin(data: SigninInput): Promise<SigninResponse> {
  const payload = {
    email: data.email,
    password: data.password,
    ...(typeof data.remember === "boolean" ? { remember: data.remember } : {}),
  };

  const res = await apiFetch<SigninResponse>("/api/v2/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (res && typeof window !== "undefined" && res.token) {
    console.log("🔑 Token received:", res.token);   // ✅
    localStorage.setItem("authToken", res.token);

  }

  if (res?.token) setToken(res.token);
  // ถ้าต้องการเก็บข้อมูล user ไว้โชว์ชื่อมุมขวาบน:
  // if (res?.user) localStorage.setItem("me", JSON.stringify(res.user));

  return res;
}

export async function signout(): Promise<void> {
  try {
    localStorage.removeItem("authToken")
    window.location.href = "/signin";
  } catch {
    // ถ้า backend ไม่มี endpoint นี้ก็ไม่เป็นไร
  } finally {
    clearToken();
  }
}


export async function changePassword(new_password: string) {
  return apiFetch<{ message?: string }>("/api/v2/profile/change-password", {
    method: "PUT",
    body: JSON.stringify({ new_password }),
  });
}

export async function oauthLogin(provider: string, code: string) {
  return apiFetch<SigninResponse>(`/api/v2/auth/oauth/${provider}/login?code=${encodeURIComponent(code)}`, {
    method: "GET",
  });
}