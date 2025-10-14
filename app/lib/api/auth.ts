// lib/api/auth.ts
import { apiFetch } from "./client";

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  tel?: string; // ใส่ถ้ามี
}

export interface SignupResponse {
  id?: string;
  email?: string;
  Name?: string;
  message?: string;
}

export async function signup(data: SignupInput): Promise<SignupResponse> {
console.log("📦 Signup data:", data); 
  return apiFetch<SignupResponse>("/api/v2/users/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
