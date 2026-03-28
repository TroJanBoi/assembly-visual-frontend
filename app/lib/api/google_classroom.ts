
import { apiFetch } from "@/lib/api/client";

export interface GoogleCourse {
    id: string;
    name: string;
    section?: string;
    descriptionHeading?: string;
    description?: string;
    room?: string;
    ownerId?: string;
    creationTime?: string;
    updateTime?: string;
    enrollmentCode?: string;
    courseState?: string;
    alternateLink?: string;
    teacherGroupEmail?: string;
    courseGroupEmail?: string;
    teacherFolder?: {
        id: string;
        title: string;
        alternateLink: string;
    };
    guardiansEnabled?: boolean;
}

/**
 * List Google Classroom courses for the authenticated user.
 * Backend: GET /api/v2/google/classroom/courses
 */
interface GoogleCoursesResponse {
    courses?: GoogleCourse[];
    nextPageToken?: string;
}

/**
 * List Google Classroom courses for the authenticated user.
 * Backend: GET /api/v2/google/classroom/courses
 * Note: Backend proxies Google API which returns { courses: [...] }
 */
export async function listGoogleCourses(): Promise<GoogleCourse[]> {
    const res = await apiFetch<GoogleCoursesResponse>("/api/v2/google/classroom/courses");
    return res.courses || [];
}

/**
 * Confirm import of a Google Classroom course.
 * Backend: POST /api/v2/google/classroom/courses/{course_id}/confirm
 */
export async function confirmGoogleCourse(courseId: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/v2/google/classroom/courses/${courseId}/confirm`, {
        method: "POST",
    });
}
