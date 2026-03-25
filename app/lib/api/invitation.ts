import { apiFetch } from "./client";

export interface Invitation {
    id: number;
    class_id: number;
    invited_email: string;
    invited_user_id?: number;
    status: "pending" | "accepted" | "declined";
    expired: string;
    classroom?: {
        topic: string;
        description: string;
    };
}

/** GET /api/v2/invitation/me  - My pending invitations */
export async function getMyInvitations(): Promise<Invitation[]> {
    const data = await apiFetch<Invitation[]>("/api/v2/invitation/me");
    return Array.isArray(data) ? data : [];
}

/** POST /api/v2/invitation/:id/accept */
export async function acceptInvitation(invitationId: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/v2/invitation/${invitationId}/accept`, {
        method: "POST",
    });
}

/** POST /api/v2/invitation/:id/decline */
export async function declineInvitation(invitationId: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/v2/invitation/${invitationId}/decline`, {
        method: "POST",
    });
}

/** POST /api/v2/classroom/:classId/invitation/send?email=... */
export async function sendInvitation(
    classId: number | string,
    email: string
): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(
        `/api/v2/classroom/${classId}/invitation/send?email=${encodeURIComponent(email)}`,
        { method: "POST" }
    );
}
