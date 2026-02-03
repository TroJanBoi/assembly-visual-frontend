
import { apiFetch } from "@/lib/api/client";

export type User = {
    id: number;
    email: string;
    name: string;
    password_hash?: string;
    picture_path?: string;
};

export type CreateUserPayload = {
    email: string;
    name?: string;
    password?: string;
};

export type UpdateUserPayload = {
    name?: string;
    password?: string;
};

export type UserClassroom = {
    id: number;
    topic: string;
    description: string;
    owner_id: number;
};

/**
 * Get all users
 * Backend: GET /api/v2/user
 */
export async function getAllUsers(): Promise<User[]> {
    return apiFetch<User[]>("/api/v2/user", { method: "GET" });
}

/**
 * Create a new user
 * Backend: POST /api/v2/user
 */
export async function createUser(payload: CreateUserPayload): Promise<{ message?: string; id?: number }> {
    return apiFetch<{ message?: string; id?: number }>("/api/v2/user", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Get classrooms for the authenticated user
 * Backend: GET /api/v2/user/me/classroom
 */
export async function getUserClassrooms(): Promise<UserClassroom[]> {
    return apiFetch<UserClassroom[]>("/api/v2/user/me/classroom", { method: "GET" });
}

/**
 * Update a user by ID
 * Backend: PUT /api/v2/user/{id}
 */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>(`/api/v2/user/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

/**
 * Delete a user by ID
 * Backend: DELETE /api/v2/user/{id}
 */
export async function deleteUser(id: number): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>(`/api/v2/user/${id}`, { method: "DELETE" });
}
