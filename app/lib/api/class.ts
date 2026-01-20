import { apiFetch } from "./client";

export interface CreateClassInput {
  topic: string;
  description?: string;
  google_course_id?: string;
  google_course_link?: string;
  status?: number;
}

export interface CreateClassResponse {
  message: string;
}

export interface Class {
  id: number;
  code: string;
  topic: string;
  description: string;
  google_course_id: string;
  google_course_link: string;
  google_synced_at: string;
  fav_score: number;
  owner: number;
  owner_name?: string;
  member_count?: number;
  is_bookmarked?: boolean;
  status: number;
}

export interface Member {
  id: number;
  email: string;
  name: string;
  role: string;
}

/* --- API function --- */
export async function createClass(
  data: CreateClassInput,
): Promise<CreateClassResponse> {
  return apiFetch<CreateClassResponse>("/api/v2/class/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getClasses(): Promise<Class[]> {
  return apiFetch<Class[]>("/api/v2/class/");
}

/**
 * Fetches classes owned by the current user.
 */
export async function getMyClasses(): Promise<Class[]> {
  return apiFetch<Class[]>("/api/v2/class/my");
}

/**
 * Fetches classes joined by the current user (excluding owned classes).
 */
export async function getJoinedClasses(): Promise<Class[]> {
  return apiFetch<Class[]>("/api/v2/class/joined");
}

export async function getClassById(id: string | number): Promise<Class> {
  const pathId = typeof id === "number" ? id.toString() : id;
  return apiFetch<Class>(`/api/v2/class/${pathId}`);
}

/**
 * Fetches all public classes.
 */
export async function getPublicClasses(): Promise<Class[]> {
  return apiFetch<Class[]>("/api/v2/class/public");
}

/**
 * Fetches member in class.
 */
export async function getClassMembers(
  classId: string | number,
): Promise<Member[]> {
  const pathId = typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<Member[]>(`/api/v2/class/${pathId}/members`);
}

/**
 * Joins the current user to a class by its ID or code.
 */
export async function joinClass(
  classIdOrCode: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/v2/class/${classIdOrCode}/join`,
    {
      method: "POST",
    },
  );
}

export async function toggleBookmark(
  classId: string | number
): Promise<{ bookmarked: boolean; message: string }> {
  const pathId = typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<{ bookmarked: boolean; message: string }>(
    `/api/v2/class/${pathId}/bookmark`,
    { method: "POST" }
  );
}
