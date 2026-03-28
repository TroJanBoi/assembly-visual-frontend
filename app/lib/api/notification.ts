import { apiFetch } from "./client";

export interface Notification {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown>;
    is_read: boolean;
    created_at?: string;
}

/** GET /api/v2/notifications/ */
export async function getNotifications(): Promise<Notification[]> {
    const data = await apiFetch<Notification[]>("/api/v2/notifications/");
    return Array.isArray(data) ? data : [];
}

/** PUT /api/v2/notifications/:id/status */
export async function markNotificationRead(
    id: number,
    isRead: boolean = true
): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/v2/notifications/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ is_read: isRead }),
    });
}

/** DELETE /api/v2/notifications/:id */
export async function deleteNotification(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/v2/notifications/${id}`, {
        method: "DELETE",
    });
}
