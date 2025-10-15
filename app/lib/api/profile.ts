// lib/api/profile.ts
import { apiFetch } from "@/lib/api/client";

export type Profile = {
  id?: number | string;
  email?: string;
  name?: string;
  tel?: string;
  // ไม่ส่ง/ไม่แสดง password ที่หน้าโปรไฟล์
};

export async function getProfile(): Promise<Profile> {
  return apiFetch<Profile>("/api/v2/profile/", { method: "GET" });
}

export async function updateProfile(payload: Partial<Profile>): Promise<Profile> {
  // ส่งเฉพาะฟิลด์ที่แก้จริง ๆ
  return apiFetch<Profile>("/api/v2/profile/", {
    method: "PUT", // หรือ PATCH ถ้าหลังบ้านรองรับ
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      tel: payload.tel,
    }),
  });
}

export async function deleteProfile(): Promise<{ message?: string }> {
  return apiFetch<{ message?: string }>("/api/v2/profile/", { method: "DELETE" });
}
