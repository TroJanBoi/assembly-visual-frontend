import { apiFetch } from "./client";

export interface CreateClassInput {
  topic: string;
  description: string;
  google_course_id?: string;
  google_course_link?: string;
  banner_id?: number;
  status?: number;
}

export interface UpdateClassInput {
  topic?: string;
  description?: string;
  banner_id?: number;
  status?: number;
}

export interface CreateClassResponse {
  message: string;
}

export interface Class {
  id: number;
  banner_id: number;
  code: string;
  topic: string;
  description: string;
  google_course_id: string;
  google_course_link: string;
  google_synced_at: string;
  favorite: number;
  owner_id: number;
  owner_name: string;
  member_amount: number;
  status: number;
}

export interface Member {
  id: number;
  email: string;
  name: string;
  picture_path: string;
  role: string;
  join_at: string;
}

/* --- API function --- */
export async function createClass(
  data: CreateClassInput,
): Promise<CreateClassResponse> {
  return apiFetch<CreateClassResponse>("/api/v2/classroom/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getClasses(): Promise<Class[]> {
  return apiFetch<Class[]>("/api/v2/classroom/");
}

/**
 * Fetches classes owned by the current user.
 */
export async function getMyClasses(): Promise<Class[]> {
  try {
    return await apiFetch<Class[]>("/api/v2/user/owner/classroom");
  } catch (error: any) {
    if (
      error?.message?.includes("Failed to retrieve classes") ||
      error?.message?.includes("failed to retrieve classes")
    ) {
      return [];
    }
    throw error;
  }
}

/**
 * Fetches classes joined by the current user (excluding owned classes).
 */
export async function getJoinedClasses(): Promise<Class[]> {
  try {
    return await apiFetch<Class[]>("/api/v2/user/me/classroom");
  } catch (error: any) {
    if (
      error?.message?.includes("Failed to retrieve classes") ||
      error?.message?.includes("failed to retrieve classes")
    ) {
      return [];
    }
    throw error;
  }
}

export async function getClassById(id: string | number): Promise<Class> {
  const pathId = typeof id === "number" ? id.toString() : id;
  return apiFetch<Class>(`/api/v2/classroom/${pathId}`);
}

/**
 * Fetches all public classes.
 */
export async function getPublicClasses(): Promise<Class[]> {
  return apiFetch<Class[]>("/api/v2/classroom/public");
}

/**
 * Fetches member in class.
 */
export async function getClassMembers(
  classId: string | number,
): Promise<Member[]> {
  const pathId = typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<Member[]>(`/api/v2/classroom/${pathId}/members`);
}

/**
 * Joins the current user to a class by its ID or code.
 */
export async function joinClass(
  classIdOrCode: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/v2/classroom/${classIdOrCode}/join`,
    {
      method: "POST",
    },
  );
}

export async function joinClassWithCode(
  code: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/v2/classroom/join-with-code/${code}`,
    {
      method: "POST",
    },
  );
}

export async function toggleBookmark(
  classId: string | number,
  isRemoving: boolean = false
): Promise<{ bookmarked: boolean; message: string }> {
  const pathId = typeof classId === "number" ? classId : Number(classId);

  return apiFetch<{ bookmarked: boolean; message: string }>("/api/v2/bookmark/", {
    method: isRemoving ? "DELETE" : "POST",
    body: JSON.stringify({ class_id: pathId }),
  });
}

export async function getBookmarks(): Promise<Class[]> {
  const data = await apiFetch<{ bookmarks: Class[] }>("/api/v2/bookmark/");
  return data.bookmarks || [];
}
export async function updateClass(
  classId: string | number,
  data: UpdateClassInput
): Promise<{ message: string }> {
  const pathId = typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<{ message: string }>(`/api/v2/classroom/${pathId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteClass(
  classId: string | number
): Promise<{ message: string }> {
  const pathId = typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<{ message: string }>(`/api/v2/classroom/${pathId}`, {
    method: "DELETE",
  });
}

export async function changeMemberRole(
  classId: string | number,
  userId: number,
  newRole: string
): Promise<{ message: string }> {
  const pathId = typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<{ message: string }>(
    `/api/v2/classroom/${pathId}/member/permission`,
    {
      method: "PUT",
      body: JSON.stringify({
        class_id: Number(pathId),
        user_id: userId,
        new_role: newRole,
      }),
    }
  );
}

export async function removeMember(
  classId: string | number,
  userId: number
): Promise<{ message: string }> {
  const pathId = typeof classId === "number" ? classId.toString() : classId;
  return apiFetch<{ message: string }>("/api/v2/classroom/member", {
    method: "DELETE",
    body: JSON.stringify({
      class_id: Number(pathId),
      user_id: userId,
    }),
  });
}

export async function inviteMember(
  classId: string | number,
  email: string
): Promise<{ message: string }> {
  const pathId = typeof classId === "number" ? classId.toString() : classId;
  // Endpoint expects email as a query parameter
  return apiFetch<{ message: string }>(
    `/api/v2/classroom/${pathId}/invitation/send?email=${encodeURIComponent(
      email
    )}`,
    {
      method: "POST",
    }
  );
}
