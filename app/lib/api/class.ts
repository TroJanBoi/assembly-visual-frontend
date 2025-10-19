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
  topic: string;
  description: string;
  google_course_id: string;
  google_course_link: string;
  google_synced_at: string;
  fav_score: number;
  owner: number;
  status: number;
}

export async function createClass(
  data: CreateClassInput,
): Promise<CreateClassResponse> {
  return apiFetch<CreateClassResponse>("/api/v2/classes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getClasses(): Promise<Class[]> {
  return apiFetch<Class[]>("/api/v2/classes/");
}
