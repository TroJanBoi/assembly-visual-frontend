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
    id?: string;
    email?: string;
    name?: string;
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

/** 🚪 Sign out */
export async function signout(): Promise<{ message?: string }> {
  // ถ้า backend มี endpoint logout:
  // const result = await apiFetch<{ message?: string }>("/api/v2/auth/logout", { method: "POST" });
  // clearToken();
  // return result;

  // ถ้า backend ไม่มี endpoint: เคลียร์ฝั่ง client พอ
  clearToken();
  return { message: "signed out" };
}

/** 👤 ดึงข้อมูลตัวเอง (ต้องแนบ token อัตโนมัติผ่าน apiFetch) */
export async function getMe(): Promise<{ id?: string; email?: string; name?: string }> {
  return apiFetch<{ id?: string; email?: string; name?: string }>("/api/v2/users/me", {
    method: "GET",
  });
}


export async function changePassword(new_password: string) {
  return apiFetch<{ message?: string }>("/api/v2/profile/change-password", {
    method: "PUT",
    body: JSON.stringify({ new_password }),
  });
}