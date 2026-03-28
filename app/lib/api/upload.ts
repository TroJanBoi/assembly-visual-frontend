// lib/api/upload.ts
import { apiFetch } from "@/lib/api/client"; // ถ้ามี client ช่วยแนบ token/BASE_URL

export async function uploadAvatarFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  // ตัวอย่าง endpoint อัปโหลดไฟล์ (ปรับตามจริง)
  const res = await fetch("/api/v2/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload file failed");
  const data = await res.json();
  return data.url as string; // URL ที่ backend คืนมา
}

export async function uploadAvatarSvg(svg: string): Promise<string> {
  // ตัวอย่าง endpoint รับ SVG (ปรับตามจริง)
  const res = await fetch("/api/v2/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ svg }),
  });
  if (!res.ok) throw new Error("Upload SVG failed");
  const data = await res.json();
  return data.url as string;
}
