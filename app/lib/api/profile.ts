
import { apiFetch } from "@/lib/api/client";

export type Profile = {
  id?: number;
  email?: string;
  name?: string;
  picture_path?: string;
  password_hash?: string; // Never display or send this
};

export type EditProfilePayload = {
  name?: string;
  username?: string;
  picture_path?: string;
};

export type ChangePasswordPayload = {
  new_password: string;
};

/**
 * Get the authenticated user's profile
 * Backend: GET /api/v2/profile
 */
export async function getProfile(): Promise<Profile> {
  return apiFetch<Profile>("/api/v2/profile/", { method: "GET" });
}

/**
 * Update the authenticated user's profile
 * Backend: PUT /api/v2/profile
 */
export async function updateProfile(payload: EditProfilePayload): Promise<{ message?: string }> {
  return apiFetch<{ message?: string }>("/api/v2/profile/", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Get the avatar URL for the authenticated user
 * Backend: GET /api/v2/profile/avatar
 */
export async function getAvatarUrl(): Promise<{ url?: string }> {
  return apiFetch<{ url?: string }>("/api/v2/profile/avatar", { method: "GET" });
}

/**
 * Upload a new avatar for the authenticated user
 * Backend: PUT /api/v2/profile/avatar
 */
export async function uploadAvatar(file: File): Promise<{ message?: string; url?: string }> {
  const formData = new FormData();
  formData.append("file", file);

  // For multipart/form-data, we need to use fetch directly without JSON content-type
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const token = localStorage.getItem("token");

  const response = await fetch(`${baseUrl}/api/v2/profile/avatar`, {
    method: "PUT",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get the avatar file by filename
 * Backend: GET /api/v2/profile/avatar/{filename}
 */
export async function getAvatarFile(filename: string): Promise<Blob> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const token = localStorage.getItem("token");

  const response = await fetch(`${baseUrl}/api/v2/profile/avatar/${filename}`, {
    method: "GET",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch avatar: HTTP ${response.status}`);
  }

  return response.blob();
}

/**
 * Change the password for the authenticated user
 * Backend: PUT /api/v2/profile/change-password
 */
export async function changePassword(newPassword: string): Promise<{ message?: string }> {
  return apiFetch<{ message?: string }>("/api/v2/profile/change-password", {
    method: "PUT",
    body: JSON.stringify({ new_password: newPassword }),
  });
}

/**
 * Delete the authenticated user's profile
 * Backend: DELETE /api/v2/profile/delete
 */
export async function deleteProfile(): Promise<{ message?: string }> {
  return apiFetch<{ message?: string }>("/api/v2/profile/delete", { method: "DELETE" });
}
